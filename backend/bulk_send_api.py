# bulk_send_api.py
# Python 3.8+
import asyncio
import aiohttp
import json
import csv
import time
from datetime import datetime
from collections import Counter
import uuid

# === CONFIG ===
# IMPORTANT: Update these values before running
PROXY_URL = "http://localhost:8000/v1/chat/completions"  # Fixed endpoint URL
PROXY_KEY = "llm_obs_your_key_here"  # Replace with your actual proxy key from registration
MODEL = "gpt-4o-mini"  # Recommended: gpt-4o-mini for cost efficiency
TEMPERATURE = 0.7  # Lower temperature (0.3-0.7) for more reliable, factual responses
MAX_TOKENS = 600
CONCURRENCY = 5  # Reduced for better reliability and rate limit handling
TOTAL_REQUESTS = 50
REQUEST_INTERVAL = 0.1  # Small delay to avoid rate limits
RETRY_ON = {429, 500, 502, 503, 504}
MAX_RETRIES = 3  # Reduced for faster failure detection
BACKOFF_BASE = 1.0  # Increased for better retry spacing

HEADERS = {
    "Authorization": f"Bearer {PROXY_KEY}",
    "Content-Type": "application/json",
}

# WARNING: These prompts are intentionally problematic to demonstrate hallucination detection
# They ask for specific information that doesn't exist or can't be verified
PROMPTS = [
    # These will likely produce hallucinations - use for testing detection
    "List five major tech acquisitions that happened on March 1, 2025, including buyer, target, and acquisition price.",
    "Who won the Nobel Prize in Computer Science in 2025? Provide the winner, citation, and one-sentence rationale.",
    "Summarize the final match of the 2025 World Chess Championship with move-by-move highlights and exact timestamps.",
    "Describe the key outcomes and main sponsors of the 2025 Global Climate Summit held in Lagos, including exact quotes from the opening speech.",
    "Name three authors of the 1979 Kerala municipal water policy review and quote a one-sentence excerpt.",
    
    # Better prompts (add these for comparison):
    # "List 3 key components of transformer neural networks with brief descriptions.",
    # "Explain the concept of attention mechanism in AI in 3 sentences.",
    # "What are the main differences between supervised and unsupervised learning?",
]
# === END CONFIG ===


def make_payload(prompt: str):
    """Build the request body for the proxy endpoint"""
    # Enhanced system message for better reliability
    system_message = """You are a helpful assistant. Important guidelines:
1. Only provide information you're confident about
2. If uncertain, explicitly state "I don't have reliable information about this"
3. Do not fabricate specific dates, numbers, or citations
4. Avoid speculation about future events or unverified information"""
    
    return {
        "model": MODEL,
        "temperature": TEMPERATURE,
        "max_tokens": MAX_TOKENS,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]
    }


async def call_proxy(session: aiohttp.ClientSession, prompt: str):
    """Send request to your proxy endpoint with retries"""
    payload = make_payload(prompt)
    retries = 0
    while True:
        start = time.time()
        try:
            async with session.post(PROXY_URL, headers=HEADERS, json=payload, timeout=120) as resp:
                elapsed = (time.time() - start) * 1000  # ms
                status = resp.status
                text = await resp.text()

                try:
                    response_json = json.loads(text)
                except Exception as e:
                    response_json = {"error": text, "parse_error": str(e)}

                # Retry logic
                if status in RETRY_ON and retries < MAX_RETRIES:
                    retries += 1
                    backoff = BACKOFF_BASE * (2 ** (retries - 1))
                    await asyncio.sleep(backoff)
                    continue

                return {
                    "status": status,
                    "latency_ms": elapsed,
                    "response": response_json,
                    "raw": text,
                    "retries": retries,
                    "prompt": prompt
                }

        except asyncio.TimeoutError:
            if retries < MAX_RETRIES:
                retries += 1
                await asyncio.sleep(BACKOFF_BASE * (2 ** (retries - 1)))
                continue
            return {"status": "timeout", "latency_ms": None, "response": None, "raw": "timeout", "retries": retries, "prompt": prompt}

        except Exception as e:
            if retries < MAX_RETRIES:
                retries += 1
                await asyncio.sleep(BACKOFF_BASE * (2 ** (retries - 1)))
                continue
            return {"status": "exception", "latency_ms": None, "response": None, "raw": str(e), "retries": retries, "prompt": prompt}


async def worker(worker_id: int, queue: asyncio.Queue, session: aiohttp.ClientSession, results_file, summary_rows, stats: Counter):
    """Worker to process multiple prompts concurrently"""
    while not queue.empty():
        prompt_idx, prompt = await queue.get()
        run_id = str(uuid.uuid4())
        res = await call_proxy(session, prompt)
        stats[res["status"]] += 1

        # Log locally
        record = {
            "index": prompt_idx,
            "run_id": run_id,
            "prompt": prompt,
            "status": res["status"],
            "latency_ms": res["latency_ms"],
            "retries": res["retries"],
            "timestamp": datetime.utcnow().isoformat()
        }
        results_file.write(json.dumps(record, ensure_ascii=False) + "\n")
        results_file.flush()

        summary_rows.append([
            prompt_idx, res["status"], res["latency_ms"], res["retries"]
        ])

        # Small delay if configured
        if REQUEST_INTERVAL:
            await asyncio.sleep(REQUEST_INTERVAL)

        queue.task_done()


async def main():
    """Main async loop"""
    q = asyncio.Queue()
    for i in range(TOTAL_REQUESTS):
        q.put_nowait((i + 1, PROMPTS[i % len(PROMPTS)]))

    stats = Counter()
    summary_rows = []

    with open("responses.jsonl", "w", encoding="utf-8") as results_file, \
         open("summary.csv", "w", encoding="utf-8", newline="") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["index", "status", "latency_ms", "retries"])

        connector = aiohttp.TCPConnector(limit=CONCURRENCY)
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = []
            for i in range(CONCURRENCY):
                t = asyncio.create_task(worker(i + 1, q, session, results_file, summary_rows, stats))
                tasks.append(t)

            await q.join()
            for t in tasks:
                t.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)

        for row in summary_rows:
            writer.writerow(row)

    print("\n" + "="*60)
    print("✅ Finished.")
    print("="*60)
    print(f"Total Requests: {TOTAL_REQUESTS}")
    print(f"Status Counts: {dict(stats)}")
    print(f"\nResults saved to:")
    print(f"  - responses.jsonl (detailed responses)")
    print(f"  - summary.csv (summary table)")
    print(f"\n💡 Tip: Use bulk_send_api_enhanced.py for hallucination detection and AI usage advice!")
    print(f"\n📊 All requests logged in Supabase database")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
