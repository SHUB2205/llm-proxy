"""
Quick Integration Test for Advanced Detection in Proxy
Tests the full flow: API request → Detection → Response
"""

import asyncio
import httpx
from dotenv import load_dotenv
import os

load_dotenv()

API_URL = "http://localhost:8000"
PROXY_KEY = os.getenv("PROXY_KEY", "your-proxy-key-here")

async def test_proxy_with_detection():
    """Test the proxy endpoint with advanced detection"""
    
    print("\n" + "="*80)
    print("🧪 TESTING ADVANCED DETECTION INTEGRATION")
    print("="*80)
    
    # Test cases
    test_cases = [
        {
            "name": "Safe Answer",
            "messages": [{"role": "user", "content": "What is the capital of France?"}],
            "expected_risk": "safe"
        },
        {
            "name": "Hallucination",
            "messages": [{"role": "user", "content": "What is the population of Mars?"}],
            "expected_risk": "high"
        }
    ]
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        for i, test in enumerate(test_cases, 1):
            print(f"\n{'='*80}")
            print(f"TEST {i}: {test['name']}")
            print(f"{'='*80}")
            print(f"📝 Prompt: {test['messages'][0]['content']}")
            
            try:
                # Make request to proxy
                response = await client.post(
                    f"{API_URL}/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {PROXY_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": test["messages"],
                        "temperature": 0.7
                    }
                )
                
                if response.status_code != 200:
                    print(f"❌ Request failed: {response.status_code}")
                    print(f"   Response: {response.text}")
                    continue
                
                result = response.json()
                
                # Extract response
                answer = result["choices"][0]["message"]["content"]
                print(f"\n💬 Answer: {answer[:100]}...")
                
                # Check observability data
                obs = result.get("observability", {})
                print(f"\n📊 Basic Detection:")
                print(f"   Risk Score: {obs.get('risk_score', 'N/A')}")
                print(f"   Risk Level: {obs.get('risk_level', 'N/A')}")
                print(f"   Flags: {obs.get('flags_detected', 0)}")
                
                # Check advanced detection
                adv = obs.get("advanced_detection")
                if adv:
                    print(f"\n🔬 Advanced Detection:")
                    print(f"   Risk Level: {adv['risk_level']}")
                    print(f"   Risk Probability: {adv['risk_probability']:.2%}")
                    print(f"   Action: {adv['action']}")
                    print(f"   Explanation: {adv['explanation']}")
                    print(f"   Checks Run: {', '.join(adv.get('checks_run', []))}")
                    
                    if adv.get('issues_found'):
                        print(f"   ⚠️  Issues: {', '.join(adv['issues_found'])}")
                    
                    # Show detailed results
                    if adv.get('semantic_entropy'):
                        entropy = adv['semantic_entropy']
                        print(f"\n   🔬 Semantic Entropy: {entropy.get('semantic_entropy', 0):.4f}")
                        print(f"      Suspicious: {entropy.get('suspicious', False)}")
                    
                    if adv.get('claims'):
                        claims = adv['claims']
                        print(f"\n   📋 Claims Analysis:")
                        print(f"      Total: {claims.get('num_claims', 0)}")
                        print(f"      Supported: {claims.get('num_supported', 0)}")
                        print(f"      Contradicted: {claims.get('num_contradicted', 0)}")
                        print(f"      Support Rate: {claims.get('support_rate', 0):.0%}")
                    
                    if adv.get('llm_judge'):
                        judge = adv['llm_judge']
                        print(f"\n   ⚖️  LLM Judge Score: {judge.get('factuality_score', 'N/A')}/10")
                    
                    # Verify expectation
                    detected_risk = adv['risk_level']
                    if test['expected_risk'] == 'safe' and detected_risk in ['safe', 'low']:
                        print(f"\n✅ PASS - Correctly identified as safe")
                    elif test['expected_risk'] == 'high' and detected_risk in ['medium', 'high']:
                        print(f"\n✅ PASS - Correctly identified as risky")
                    else:
                        print(f"\n⚠️  PARTIAL - Expected {test['expected_risk']}, got {detected_risk}")
                else:
                    print(f"\n❌ No advanced detection results found")
                
            except Exception as e:
                print(f"\n❌ ERROR: {e}")
                import traceback
                traceback.print_exc()
    
    print("\n" + "="*80)
    print("✅ INTEGRATION TEST COMPLETE")
    print("="*80)


async def test_detection_config():
    """Test the detection configuration endpoints"""
    
    print("\n" + "="*80)
    print("🔧 TESTING DETECTION CONFIGURATION API")
    print("="*80)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get current config
        print("\n📥 Getting current configuration...")
        try:
            response = await client.get(
                f"{API_URL}/v1/detection/config",
                headers={"Authorization": f"Bearer {PROXY_KEY}"}
            )
            
            if response.status_code == 200:
                config = response.json()
                print(f"✅ Current Mode: {config.get('mode', 'unknown')}")
                print(f"   Available Modes: {', '.join(config.get('available_modes', []))}")
                print(f"   Semantic Entropy: {'✅' if config.get('current_config', {}).get('use_semantic_entropy') else '❌'}")
                print(f"   Claim NLI: {'✅' if config.get('current_config', {}).get('use_claim_nli') else '❌'}")
                print(f"   LLM Judge: {'✅' if config.get('current_config', {}).get('use_llm_judge') else '❌'}")
            else:
                print(f"❌ Failed to get config: {response.status_code}")
        except Exception as e:
            print(f"❌ ERROR: {e}")
    
    print("\n" + "="*80)


if __name__ == "__main__":
    print("\n🚀 Starting Integration Tests...")
    print("="*80)
    print("⚠️  Make sure:")
    print("   1. Backend is running (python main.py)")
    print("   2. PROXY_KEY is set in .env")
    print("   3. OPENAI_API_KEY is set in .env")
    print("="*80)
    
    asyncio.run(test_detection_config())
    asyncio.run(test_proxy_with_detection())
    
    print("\n🎉 All tests complete!")
    print("\n📚 Next steps:")
    print("   1. Check the UI at http://localhost:3000")
    print("   2. Go to Settings → Detection Settings to change modes")
    print("   3. View request details to see advanced detection panel")
