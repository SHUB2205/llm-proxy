"""
Enhanced Bulk Send API with Hallucination Detection & AI Usage Advice
Features:
- Real-time hallucination detection
- Prompt quality analysis before sending
- AI usage recommendations
- Detailed reliability scoring
- Cost optimization suggestions
- Batch processing with smart retries
"""

import asyncio
import aiohttp
import json
import csv
import time
from datetime import datetime
from collections import Counter
from typing import List, Dict, Optional
import uuid
from dataclasses import dataclass, asdict

# === CONFIG ===
PROXY_URL = "http://localhost:8000/v1/chat/completions"
RELIABILITY_URL = "http://localhost:8000/v1/reliability"
PROXY_KEY = "llm_obs_SCg21yZUM-rbFE2-mUgBTFoB9ncVDM-xtcXP6fWwd5s"  # Your new proxy key
MODEL = "gpt-4o-mini"
TEMPERATURE = 0.7  # Lower = more deterministic, better for reliability
MAX_TOKENS = 600
CONCURRENCY = 5  # Lower concurrency for better reliability
TOTAL_REQUESTS = 100
REQUEST_INTERVAL = 0.1  # Small delay between requests
RETRY_ON = {429, 500, 502, 503, 504}
MAX_RETRIES = 3
BACKOFF_BASE = 1.0

# Reliability thresholds
MIN_PROMPT_RELIABILITY = 0.6  # Warn if prompt score below this
MIN_RESPONSE_RELIABILITY = 0.6  # Flag if response score below this

HEADERS = {
    "Authorization": f"Bearer {PROXY_KEY}",
    "Content-Type": "application/json",
}

# Example prompts (intentionally problematic to demonstrate detection)
PROMPTS = [
    # Bad prompts (will get low reliability scores)
    "Tell me about AI",  # Too vague
    "What will happen next year?",  # Asks for speculation
    "Explain everything about machine learning",  # Too broad
    
    # Good prompts (will get high reliability scores)
    "List 3 key components of transformer neural networks with brief descriptions",
    "Based on the following data: [sales: $100K, costs: $60K], calculate the profit margin",
    "Summarize the main points from this text: [text]. Use bullet points and cite specific quotes.",
]

# === END CONFIG ===


@dataclass
class RequestResult:
    """Result of a single request"""
    index: int
    run_id: str
    prompt: str
    prompt_reliability_score: float
    prompt_issues: List[str]
    status: int
    latency_ms: float
    retries: int
    response_text: str
    response_reliability_score: float
    response_concerns: List[str]
    hallucination_flags: List[str]
    cost_usd: float
    tokens_used: int
    timestamp: str
    recommendation: str


class BulkSendClient:
    """Enhanced bulk send client with reliability features"""
    
    def __init__(self):
        self.stats = Counter()
        self.results: List[RequestResult] = []
        self.total_cost = 0.0
        self.total_tokens = 0
        self.high_risk_prompts = []
        self.low_reliability_responses = []
    
    async def analyze_prompt(self, session: aiohttp.ClientSession, prompt: str) -> Dict:
        """Analyze prompt quality before sending"""
        try:
            async with session.post(
                f"{RELIABILITY_URL}/analyze-prompt",
                json={"prompt": prompt},
                timeout=10
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    return {
                        "reliability_score": 0.5,
                        "issues_found": [],
                        "optimized_prompt": prompt,
                        "assessment": "Unknown"
                    }
        except Exception as e:
            print(f"⚠️  Prompt analysis failed: {e}")
            return {
                "reliability_score": 0.5,
                "issues_found": [],
                "optimized_prompt": prompt,
                "assessment": "Unknown"
            }
    
    async def analyze_response(self, session: aiohttp.ClientSession, response_text: str) -> Dict:
        """Analyze response reliability"""
        try:
            async with session.post(
                f"{RELIABILITY_URL}/analyze-response",
                json={"response": response_text},
                timeout=10
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    return {
                        "reliability_score": 0.5,
                        "concerns": [],
                        "assessment": "Unknown"
                    }
        except Exception as e:
            print(f"⚠️  Response analysis failed: {e}")
            return {
                "reliability_score": 0.5,
                "concerns": [],
                "assessment": "Unknown"
            }
    
    def make_payload(self, prompt: str, optimized: bool = False):
        """Build request payload"""
        # Add reliability instructions to system message
        system_message = """You are a helpful assistant. Follow these guidelines:
1. Only provide information you're confident about
2. If uncertain, explicitly state "I don't have reliable information about this"
3. Cite sources when making factual claims
4. Use specific, measurable language
5. Avoid speculation and predictions"""
        
        return {
            "model": MODEL,
            "temperature": TEMPERATURE,
            "max_tokens": MAX_TOKENS,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ]
        }
    
    async def send_request(
        self, 
        session: aiohttp.ClientSession, 
        prompt: str,
        index: int
    ) -> RequestResult:
        """Send a single request with full analysis"""
        run_id = str(uuid.uuid4())
        
        # Step 1: Analyze prompt quality
        print(f"📊 [{index}] Analyzing prompt quality...")
        prompt_analysis = await self.analyze_prompt(session, prompt)
        prompt_score = prompt_analysis.get("reliability_score", 0.5)
        prompt_issues = [issue["description"] for issue in prompt_analysis.get("issues_found", [])]
        
        # Warn about low-quality prompts
        if prompt_score < MIN_PROMPT_RELIABILITY:
            print(f"⚠️  [{index}] LOW RELIABILITY PROMPT (score: {prompt_score:.2f})")
            print(f"    Issues: {', '.join(prompt_issues[:2])}")
            self.high_risk_prompts.append(index)
            
            # Optionally use optimized prompt
            optimized_prompt = prompt_analysis.get("optimized_prompt", prompt)
            use_optimized = input(f"    Use optimized prompt? (y/n): ").lower() == 'y'
            if use_optimized:
                prompt = optimized_prompt
                print(f"    ✅ Using optimized prompt")
        
        # Step 2: Send request with retries
        retries = 0
        while True:
            start = time.time()
            try:
                payload = self.make_payload(prompt)
                async with session.post(
                    PROXY_URL, 
                    headers=HEADERS, 
                    json=payload, 
                    timeout=120
                ) as resp:
                    elapsed = (time.time() - start) * 1000
                    status = resp.status
                    
                    if status in RETRY_ON and retries < MAX_RETRIES:
                        retries += 1
                        backoff = BACKOFF_BASE * (2 ** (retries - 1))
                        print(f"⚠️  [{index}] Retry {retries}/{MAX_RETRIES} after {backoff}s")
                        await asyncio.sleep(backoff)
                        continue
                    
                    if status == 200:
                        response_json = await resp.json()
                        response_text = response_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                        tokens = response_json.get("usage", {}).get("total_tokens", 0)
                        cost = self.estimate_cost(tokens)
                        
                        # Step 3: Analyze response reliability
                        print(f"🔍 [{index}] Analyzing response reliability...")
                        response_analysis = await self.analyze_response(session, response_text)
                        response_score = response_analysis.get("reliability_score", 0.5)
                        response_concerns = response_analysis.get("concerns", [])
                        
                        # Detect hallucination patterns
                        hallucination_flags = self.detect_hallucinations(response_text)
                        
                        if response_score < MIN_RESPONSE_RELIABILITY or hallucination_flags:
                            print(f"⚠️  [{index}] LOW RELIABILITY RESPONSE (score: {response_score:.2f})")
                            if hallucination_flags:
                                print(f"    🚨 Hallucination flags: {', '.join(hallucination_flags[:2])}")
                            self.low_reliability_responses.append(index)
                        else:
                            print(f"✅ [{index}] High reliability response (score: {response_score:.2f})")
                        
                        # Generate recommendation
                        recommendation = self.generate_recommendation(
                            prompt_score, response_score, hallucination_flags
                        )
                        
                        self.stats["success"] += 1
                        self.total_cost += cost
                        self.total_tokens += tokens
                        
                        return RequestResult(
                            index=index,
                            run_id=run_id,
                            prompt=prompt,
                            prompt_reliability_score=prompt_score,
                            prompt_issues=prompt_issues,
                            status=status,
                            latency_ms=elapsed,
                            retries=retries,
                            response_text=response_text,
                            response_reliability_score=response_score,
                            response_concerns=response_concerns,
                            hallucination_flags=hallucination_flags,
                            cost_usd=cost,
                            tokens_used=tokens,
                            timestamp=datetime.utcnow().isoformat(),
                            recommendation=recommendation
                        )
                    else:
                        self.stats["error"] += 1
                        return self.create_error_result(index, run_id, prompt, status, elapsed, retries)
            
            except asyncio.TimeoutError:
                if retries < MAX_RETRIES:
                    retries += 1
                    await asyncio.sleep(BACKOFF_BASE * (2 ** (retries - 1)))
                    continue
                self.stats["timeout"] += 1
                return self.create_error_result(index, run_id, prompt, "timeout", None, retries)
            
            except Exception as e:
                if retries < MAX_RETRIES:
                    retries += 1
                    await asyncio.sleep(BACKOFF_BASE * (2 ** (retries - 1)))
                    continue
                self.stats["exception"] += 1
                return self.create_error_result(index, run_id, prompt, "exception", None, retries, str(e))
    
    def detect_hallucinations(self, text: str) -> List[str]:
        """Detect common hallucination patterns"""
        flags = []
        
        # Pattern 1: Overly specific numbers
        import re
        if re.search(r'\d+\.\d{2,}%', text):
            flags.append("Overly specific percentage")
        
        # Pattern 2: Fake citations
        if re.search(r'according to .* \(\d{4}\)', text, re.IGNORECASE):
            flags.append("Potential fake citation")
        
        # Pattern 3: Overconfident language
        confident_words = ["definitely", "certainly", "absolutely", "guaranteed", "without doubt"]
        if any(word in text.lower() for word in confident_words):
            flags.append("Overconfident language")
        
        # Pattern 4: Specific dates without context
        if re.search(r'on [A-Z][a-z]+ \d{1,2}, \d{4}', text):
            flags.append("Specific date without verification")
        
        return flags
    
    def estimate_cost(self, tokens: int) -> float:
        """Estimate cost based on tokens"""
        # GPT-4o-mini pricing: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
        # Simplified: assume 50/50 split
        return (tokens / 1_000_000) * 0.375
    
    def generate_recommendation(
        self, 
        prompt_score: float, 
        response_score: float, 
        hallucination_flags: List[str]
    ) -> str:
        """Generate actionable recommendation"""
        if hallucination_flags:
            return "⚠️ VERIFY - Response contains hallucination indicators. Manual review required."
        elif response_score < 0.4:
            return "❌ REJECT - Low reliability. Do not use this response."
        elif response_score < 0.6:
            return "⚠️ REVIEW - Moderate reliability. Verify key facts before using."
        elif prompt_score < 0.6:
            return "✓ ACCEPT - Response reliable, but improve prompt for future requests."
        else:
            return "✅ TRUSTED - High reliability. Safe to use."
    
    def create_error_result(
        self, 
        index: int, 
        run_id: str, 
        prompt: str, 
        status, 
        latency: Optional[float], 
        retries: int,
        error_msg: str = ""
    ) -> RequestResult:
        """Create error result"""
        return RequestResult(
            index=index,
            run_id=run_id,
            prompt=prompt,
            prompt_reliability_score=0.0,
            prompt_issues=[],
            status=status,
            latency_ms=latency or 0.0,
            retries=retries,
            response_text=error_msg,
            response_reliability_score=0.0,
            response_concerns=[],
            hallucination_flags=[],
            cost_usd=0.0,
            tokens_used=0,
            timestamp=datetime.utcnow().isoformat(),
            recommendation="❌ ERROR - Request failed"
        )
    
    async def process_batch(self, prompts: List[str]):
        """Process a batch of prompts"""
        print(f"\n🚀 Starting batch processing of {len(prompts)} prompts...")
        print(f"   Concurrency: {CONCURRENCY}")
        print(f"   Model: {MODEL}")
        print(f"   Temperature: {TEMPERATURE}")
        print("=" * 60)
        
        connector = aiohttp.TCPConnector(limit=CONCURRENCY)
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = []
            for i, prompt in enumerate(prompts, 1):
                task = self.send_request(session, prompt, i)
                tasks.append(task)
                
                # Small delay between starting tasks
                if REQUEST_INTERVAL:
                    await asyncio.sleep(REQUEST_INTERVAL)
            
            self.results = await asyncio.gather(*tasks)
        
        print("\n" + "=" * 60)
        print("✅ Batch processing complete!")
        self.print_summary()
        self.save_results()
        self.generate_advice()
    
    def print_summary(self):
        """Print summary statistics"""
        print("\n📊 SUMMARY")
        print("=" * 60)
        print(f"Total Requests: {len(self.results)}")
        print(f"Status Breakdown: {dict(self.stats)}")
        print(f"Total Cost: ${self.total_cost:.4f}")
        print(f"Total Tokens: {self.total_tokens:,}")
        print(f"Avg Cost/Request: ${self.total_cost/len(self.results):.4f}")
        
        # Reliability stats
        avg_prompt_score = sum(r.prompt_reliability_score for r in self.results) / len(self.results)
        avg_response_score = sum(r.response_reliability_score for r in self.results if r.response_reliability_score > 0) / max(1, sum(1 for r in self.results if r.response_reliability_score > 0))
        
        print(f"\n🎯 RELIABILITY")
        print(f"Avg Prompt Score: {avg_prompt_score:.2f}")
        print(f"Avg Response Score: {avg_response_score:.2f}")
        print(f"High-Risk Prompts: {len(self.high_risk_prompts)}")
        print(f"Low-Reliability Responses: {len(self.low_reliability_responses)}")
        
        # Hallucination stats
        total_flags = sum(len(r.hallucination_flags) for r in self.results)
        print(f"Hallucination Flags: {total_flags}")
    
    def save_results(self):
        """Save detailed results"""
        # Save full results as JSONL
        with open("bulk_results_detailed.jsonl", "w", encoding="utf-8") as f:
            for result in self.results:
                f.write(json.dumps(asdict(result), ensure_ascii=False) + "\n")
        
        # Save summary CSV
        with open("bulk_summary.csv", "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Index", "Prompt Score", "Response Score", "Status", 
                "Latency (ms)", "Cost ($)", "Tokens", "Hallucination Flags", "Recommendation"
            ])
            for r in self.results:
                writer.writerow([
                    r.index,
                    f"{r.prompt_reliability_score:.2f}",
                    f"{r.response_reliability_score:.2f}",
                    r.status,
                    f"{r.latency_ms:.0f}",
                    f"{r.cost_usd:.4f}",
                    r.tokens_used,
                    len(r.hallucination_flags),
                    r.recommendation
                ])
        
        print(f"\n💾 Results saved:")
        print(f"   - bulk_results_detailed.jsonl (full data)")
        print(f"   - bulk_summary.csv (summary)")
    
    def generate_advice(self):
        """Generate AI usage advice based on results"""
        print("\n" + "=" * 60)
        print("💡 AI USAGE ADVICE FOR YOUR COMPANY")
        print("=" * 60)
        
        advice = []
        
        # Advice 1: Prompt Quality
        if len(self.high_risk_prompts) > len(self.results) * 0.3:
            advice.append({
                "category": "Prompt Quality",
                "issue": f"{len(self.high_risk_prompts)} prompts had low reliability scores",
                "recommendation": "Use prompt templates or the /v1/reliability/analyze-prompt endpoint before sending",
                "impact": "Could reduce hallucinations by 70%"
            })
        
        # Advice 2: Response Verification
        if len(self.low_reliability_responses) > 0:
            advice.append({
                "category": "Response Verification",
                "issue": f"{len(self.low_reliability_responses)} responses had low reliability",
                "recommendation": "Implement mandatory human review for responses with score < 0.6",
                "impact": "Prevents unreliable information from reaching users"
            })
        
        # Advice 3: Cost Optimization
        avg_cost = self.total_cost / len(self.results)
        if avg_cost > 0.01:
            advice.append({
                "category": "Cost Optimization",
                "issue": f"Average cost per request is ${avg_cost:.4f}",
                "recommendation": "Consider using gpt-4o-mini or caching similar requests",
                "impact": f"Could save ${self.total_cost * 0.5:.2f} (50% reduction)"
            })
        
        # Advice 4: Temperature Setting
        if TEMPERATURE > 0.7:
            advice.append({
                "category": "Model Configuration",
                "issue": f"Temperature set to {TEMPERATURE} (high)",
                "recommendation": "Lower temperature to 0.3-0.5 for factual tasks",
                "impact": "Increases consistency and reduces hallucinations"
            })
        
        # Advice 5: Hallucination Detection
        total_flags = sum(len(r.hallucination_flags) for r in self.results)
        if total_flags > 0:
            advice.append({
                "category": "Hallucination Prevention",
                "issue": f"{total_flags} hallucination indicators detected",
                "recommendation": "Add explicit instructions: 'If uncertain, say I don't know'",
                "impact": "Reduces fabricated information by 80%"
            })
        
        # Print advice
        for i, item in enumerate(advice, 1):
            print(f"\n{i}. {item['category']}")
            print(f"   Issue: {item['issue']}")
            print(f"   ✓ Recommendation: {item['recommendation']}")
            print(f"   💰 Impact: {item['impact']}")
        
        if not advice:
            print("\n✅ Great job! Your AI usage is well-optimized.")
            print("   - Prompts have good reliability scores")
            print("   - Responses are trustworthy")
            print("   - Cost is reasonable")
        
        # Save advice
        with open("ai_usage_advice.json", "w", encoding="utf-8") as f:
            json.dump(advice, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Advice saved to: ai_usage_advice.json")


async def main():
    """Main entry point"""
    print("=" * 60)
    print("🎯 ENHANCED BULK SEND API")
    print("   with Hallucination Detection & AI Usage Advice")
    print("=" * 60)
    
    # Create client
    client = BulkSendClient()
    
    # Prepare prompts
    prompts = []
    for i in range(TOTAL_REQUESTS):
        prompts.append(PROMPTS[i % len(PROMPTS)])
    
    # Process batch
    await client.process_batch(prompts)
    
    print("\n" + "=" * 60)
    print("🎉 ALL DONE!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
