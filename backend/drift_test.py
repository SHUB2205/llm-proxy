"""
Test Drift Detection by Creating Artificial Drift
"""

import asyncio
import aiohttp
import json

PROXY_URL = "http://localhost:8000/v1/chat/completions"
DRIFT_CHECK_URL = "http://localhost:8000/v1/drift/check"
PROXY_KEY = "llm_obs_SCg21yZUM-rbFE2-mUgBTFoB9ncVDM-xtcXP6fWwd5s"
MODEL = "gpt-4o-mini"


async def send_request(session, max_tokens, temperature=0.7):
    """Send a single request"""
    headers = {
        "Authorization": f"Bearer {PROXY_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": "Explain quantum computing in simple terms."}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    async with session.post(PROXY_URL, headers=headers, json=payload) as resp:
        if resp.status == 200:
            data = await resp.json()
            tokens = data.get("usage", {}).get("completion_tokens", 0)
            print(f"✓ Request sent (max_tokens={max_tokens}, actual={tokens})")
            return True
        else:
            print(f"✗ Error: {resp.status}")
            return False


async def check_drift(session):
    """Check for drift"""
    headers = {
        "Authorization": f"Bearer {PROXY_KEY}",
    }
    
    async with session.get(f"{DRIFT_CHECK_URL}?model={MODEL}", headers=headers) as resp:
        if resp.status == 200:
            data = await resp.json()
            return data
        else:
            print(f"Error checking drift: {resp.status}")
            return None


async def main():
    """
    Test drift detection by:
    1. Sending 100 requests with max_tokens=600 (baseline)
    2. Sending 100 requests with max_tokens=200 (drift)
    3. Checking for drift
    """
    
    print("=" * 60)
    print("DRIFT DETECTION TEST")
    print("=" * 60)
    
    async with aiohttp.ClientSession() as session:
        # Phase 1: Establish baseline
        print("\n📊 PHASE 1: Establishing Baseline (100 requests, max_tokens=600)")
        print("-" * 60)
        
        for i in range(100):
            await send_request(session, max_tokens=600)
            if (i + 1) % 10 == 0:
                print(f"Progress: {i + 1}/100")
            await asyncio.sleep(0.1)
        
        print("\n✅ Baseline established!")
        
        # Check current state
        print("\n🔍 Checking baseline metrics...")
        drift_result = await check_drift(session)
        if drift_result:
            print(f"Sample size: {drift_result.get('sample_size', 0)}")
            print(f"Has drift: {drift_result.get('has_drift', False)}")
            if drift_result.get('baseline_metrics'):
                print(f"Baseline avg_response_length: {drift_result['baseline_metrics'].get('avg_response_length', 0):.2f}")
        
        # Phase 2: Create drift
        print("\n" + "=" * 60)
        print("📉 PHASE 2: Creating Drift (100 requests, max_tokens=200)")
        print("-" * 60)
        
        for i in range(100):
            await send_request(session, max_tokens=200)
            if (i + 1) % 10 == 0:
                print(f"Progress: {i + 1}/100")
            await asyncio.sleep(0.1)
        
        print("\n✅ Drift requests sent!")
        
        # Phase 3: Check for drift
        print("\n" + "=" * 60)
        print("🚨 PHASE 3: Checking for Drift")
        print("-" * 60)
        
        drift_result = await check_drift(session)
        
        if drift_result:
            print(f"\n{'🔴 DRIFT DETECTED!' if drift_result.get('has_drift') else '✅ No drift detected'}")
            print(f"Sample size: {drift_result.get('sample_size', 0)}")
            
            if drift_result.get('has_drift'):
                print(f"\nDrift count: {drift_result.get('drift_count', 0)}")
                
                for drift in drift_result.get('drifts', []):
                    print(f"\n  Metric: {drift['metric_name']}")
                    print(f"  Severity: {drift['severity'].upper()}")
                    print(f"  Baseline: {drift['baseline_value']:.4f}")
                    print(f"  Current: {drift['current_value']:.4f}")
                    print(f"  Change: {drift['change_percent']:.1f}%")
            
            # Show all metrics
            print("\n📊 Current Metrics:")
            for metric, value in drift_result.get('current_metrics', {}).items():
                baseline = drift_result.get('baseline_metrics', {}).get(metric, 0)
                print(f"  {metric}: {value:.4f} (baseline: {baseline:.4f})")
        
        print("\n" + "=" * 60)
        print("✅ Drift test complete!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
