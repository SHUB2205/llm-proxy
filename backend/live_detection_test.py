"""
Live Test Script for Advanced Hallucination Detection
Sends various prompts to test the detection system
"""

import asyncio
import httpx
from dotenv import load_dotenv
import os

load_dotenv()

API_URL = "http://localhost:8000"
PROXY_KEY = os.getenv("PROXY_KEY", "llm_obs_BJfOcwgECDNBGfZNYjl8_0pqh1f8j_EYURLVYOkNZ0M")

# Test prompts - mix of safe and potentially problematic
TEST_PROMPTS = [
    # Safe prompts
    "What is the capital of France?",
    "Explain photosynthesis in simple terms.",
    "What is 2+2?",
    "Who wrote Romeo and Juliet?",
    
    # Potentially problematic prompts (may trigger hallucinations)
    "What is the population of Mars?",
    "How many moons does Earth have?",
    "What is the capital of Atlantis?",
    "Tell me about the president of Antarctica.",
    "What year did humans land on Jupiter?",
    "Describe the color of invisible light.",
]

async def send_request(prompt: str, session: httpx.AsyncClient):
    """Send a single request and return results"""
    try:
        response = await session.post(
            f"{API_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {PROXY_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            },
            timeout=30.0
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return None


async def main():
    print("\n" + "="*80)
    print("🧪 LIVE HALLUCINATION DETECTION TEST")
    print("="*80)
    print(f"\n📡 Testing {len(TEST_PROMPTS)} prompts...")
    print(f"🔗 API: {API_URL}")
    print("="*80 + "\n")
    
    results = []
    
    async with httpx.AsyncClient() as session:
        for i, prompt in enumerate(TEST_PROMPTS, 1):
            print(f"\n{'='*80}")
            print(f"TEST {i}/{len(TEST_PROMPTS)}")
            print(f"{'='*80}")
            print(f"❓ Prompt: {prompt}")
            
            result = await send_request(prompt, session)
            
            if result:
                # Extract response
                answer = result["choices"][0]["message"]["content"]
                print(f"\n💬 Answer: {answer[:150]}{'...' if len(answer) > 150 else ''}")
                
                # Check observability
                obs = result.get("observability", {})
                adv = obs.get("advanced_detection")
                
                if adv:
                    risk_level = adv["risk_level"]
                    risk_prob = adv["risk_probability"]
                    
                    # Color code based on risk
                    risk_emoji = {
                        "safe": "✅",
                        "low": "🟢",
                        "medium": "⚠️",
                        "high": "🚨"
                    }.get(risk_level, "❓")
                    
                    print(f"\n{risk_emoji} DETECTION RESULT:")
                    print(f"   Risk Level: {risk_level.upper()}")
                    print(f"   Probability: {risk_prob:.1%}")
                    print(f"   Explanation: {adv['explanation']}")
                    
                    # Show issues if any
                    if adv.get("issues_found"):
                        print(f"   ⚠️  Issues: {', '.join(adv['issues_found'])}")
                    
                    # Show claim analysis
                    if adv.get("claims"):
                        claims = adv["claims"]
                        print(f"\n   📋 Claims: {claims['num_claims']} total")
                        print(f"      ✅ Supported: {claims['num_supported']}")
                        print(f"      ❌ Contradicted: {claims['num_contradicted']}")
                        print(f"      ❔ Unverifiable: {claims['num_unverifiable']}")
                        print(f"      📊 Support Rate: {claims['support_rate']:.0%}")
                    
                    results.append({
                        "prompt": prompt,
                        "risk_level": risk_level,
                        "risk_prob": risk_prob
                    })
                else:
                    print(f"\n⚠️  No advanced detection results")
                    results.append({
                        "prompt": prompt,
                        "risk_level": "unknown",
                        "risk_prob": 0
                    })
            
            # Small delay between requests
            await asyncio.sleep(0.5)
    
    # Summary
    print("\n" + "="*80)
    print("📊 SUMMARY")
    print("="*80)
    
    risk_counts = {"safe": 0, "low": 0, "medium": 0, "high": 0, "unknown": 0}
    for r in results:
        risk_counts[r["risk_level"]] += 1
    
    print(f"\n✅ Safe: {risk_counts['safe']}")
    print(f"🟢 Low Risk: {risk_counts['low']}")
    print(f"⚠️  Medium Risk: {risk_counts['medium']}")
    print(f"🚨 High Risk: {risk_counts['high']}")
    print(f"❓ Unknown: {risk_counts['unknown']}")
    
    print(f"\n📈 Total Requests: {len(results)}")
    print(f"🎯 Detection Rate: {((len(results) - risk_counts['unknown']) / len(results) * 100):.0f}%")
    
    # High risk prompts
    high_risk = [r for r in results if r["risk_level"] in ["medium", "high"]]
    if high_risk:
        print(f"\n🚨 HIGH RISK PROMPTS DETECTED:")
        for r in high_risk:
            print(f"   • {r['prompt'][:60]}... ({r['risk_level'].upper()}, {r['risk_prob']:.0%})")
    
    print("\n" + "="*80)
    print("✅ TEST COMPLETE!")
    print("="*80)
    print("\n💡 Next steps:")
    print("   1. Check the UI at http://localhost:3000/runs")
    print("   2. Click on any request to see detailed detection results")
    print("   3. Go to Settings → Detection Settings to change modes")
    print("\n")


if __name__ == "__main__":
    print("\n🚀 Starting live detection test...")
    print("⚠️  Make sure backend is running: python main.py")
    print("⚠️  Make sure PROXY_KEY is set in .env\n")
    
    asyncio.run(main())
