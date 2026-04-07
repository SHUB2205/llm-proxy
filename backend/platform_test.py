"""
Quick test script to verify platform is working
Run this after starting the server
"""

import httpx
import json

BASE_URL = "http://localhost:8000"

def test_server_running():
    """Test if server is running"""
    print("🧪 Testing server connection...")
    try:
        response = httpx.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Server is running!")
            return True
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server not running: {e}")
        print("   Start server with: python main.py")
        return False


def test_prompt_optimization():
    """Test the CORE feature - prompt optimization"""
    print("\n🧪 Testing Prompt Optimization (CORE FEATURE)...")
    
    bad_prompt = "Tell me about AI"
    
    try:
        response = httpx.post(
            f"{BASE_URL}/v1/reliability/analyze-prompt",
            json={"prompt": bad_prompt},
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prompt Optimization working!")
            print(f"   Original: {bad_prompt}")
            print(f"   Reliability Score: {result['reliability_score']:.2f}")
            print(f"   Assessment: {result['assessment']}")
            print(f"   Issues Found: {len(result['issues_found'])}")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"   {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_templates():
    """Test pre-built templates"""
    print("\n🧪 Testing Templates...")
    
    try:
        response = httpx.get(f"{BASE_URL}/v1/reliability/templates", timeout=10.0)
        
        if response.status_code == 200:
            result = response.json()
            templates = result.get('templates', [])
            print(f"✅ Templates working! Found {len(templates)} templates:")
            for template in templates:
                print(f"   - {template['name']}")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_best_practices():
    """Test best practices endpoint"""
    print("\n🧪 Testing Best Practices...")
    
    try:
        response = httpx.get(f"{BASE_URL}/v1/reliability/best-practices", timeout=10.0)
        
        if response.status_code == 200:
            result = response.json()
            practices = result.get('best_practices', [])
            print(f"✅ Best Practices working! Found {len(practices)} principles")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_hallucination_patterns():
    """Test hallucination patterns endpoint"""
    print("\n🧪 Testing Hallucination Patterns...")
    
    try:
        response = httpx.get(f"{BASE_URL}/v1/reliability/hallucination-patterns", timeout=10.0)
        
        if response.status_code == 200:
            result = response.json()
            patterns = result.get('patterns', [])
            print(f"✅ Hallucination Patterns working! Found {len(patterns)} patterns:")
            for pattern in patterns[:3]:  # Show first 3
                print(f"   - {pattern['pattern']}")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_response_analysis():
    """Test response reliability analysis"""
    print("\n🧪 Testing Response Analysis...")
    
    test_response = "Based on the data, revenue increased by 23.7% in Q4. This is supported by the sales report."
    
    try:
        response = httpx.post(
            f"{BASE_URL}/v1/reliability/analyze-response",
            json={"response": test_response},
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Response Analysis working!")
            print(f"   Reliability Score: {result['reliability_score']:.2f}")
            print(f"   Assessment: {result['assessment']}")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_prompt_comparison():
    """Test prompt A/B comparison"""
    print("\n🧪 Testing Prompt Comparison...")
    
    prompt_a = "Tell me about sales"
    prompt_b = "Based on Q4 sales data, list the top 3 performing products with revenue figures"
    
    try:
        response = httpx.post(
            f"{BASE_URL}/v1/reliability/compare-prompts",
            json={"prompt_a": prompt_a, "prompt_b": prompt_b},
            timeout=10.0
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prompt Comparison working!")
            print(f"   Winner: Prompt {result['winner']}")
            print(f"   Prompt A Score: {result['prompt_a']['reliability_score']:.2f}")
            print(f"   Prompt B Score: {result['prompt_b']['reliability_score']:.2f}")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("🚀 LLM Observability Platform - Test Suite")
    print("=" * 60)
    
    tests = [
        ("Server Running", test_server_running),
        ("Prompt Optimization", test_prompt_optimization),
        ("Templates", test_templates),
        ("Best Practices", test_best_practices),
        ("Hallucination Patterns", test_hallucination_patterns),
        ("Response Analysis", test_response_analysis),
        ("Prompt Comparison", test_prompt_comparison),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your platform is working perfectly!")
        print("\n📚 Next steps:")
        print("   1. Register a user: POST /v1/users/register")
        print("   2. Make AI requests: POST /v1/chat/completions")
        print("   3. View API docs: http://localhost:8000/docs")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
        print("   Make sure:")
        print("   - Server is running (python main.py)")
        print("   - All dependencies installed (pip install -r requirements.txt)")
        print("   - .env file configured correctly")


if __name__ == "__main__":
    run_all_tests()
