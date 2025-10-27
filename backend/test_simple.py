import httpx
import json

# Your proxy key
PROXY_KEY = "llm_obs_BJfOcwgECDNBGfZNYjl8_0pqh1f8j_EYURLVYOkNZ0M"

print("="*60)
print("🧪 SIMPLE PROXY TEST")
print("="*60)

# Test 1: Check if backend is running
print("\n1️⃣ Testing backend health...")
try:
    response = httpx.get("http://localhost:8000/health", timeout=5.0)
    print(f"   ✅ Backend is running: {response.json()}")
except Exception as e:
    print(f"   ❌ Backend not running: {e}")
    exit(1)

# Test 2: Check if proxy key is valid
print("\n2️⃣ Testing proxy key authentication...")
try:
    response = httpx.get(
        "http://localhost:8000/v1/stats",
        headers={"Authorization": f"Bearer {PROXY_KEY}"},
        timeout=5.0
    )
    if response.status_code == 200:
        print(f"   ✅ Proxy key is valid")
        print(f"   Stats: {response.json()}")
    else:
        print(f"   ❌ Proxy key invalid: {response.status_code}")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Make a simple chat request
print("\n3️⃣ Testing chat completion...")
try:
    response = httpx.post(
        "http://localhost:8000/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {PROXY_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "user", "content": "Say 'Hello World' and nothing else."}
            ],
            "user_id": "test_user",
            "agent_name": "TestAgent"
        },
        timeout=30.0
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Request successful!")
        print(f"   Run ID: {result.get('run_id')}")
        print(f"   Response: {result['choices'][0]['message']['content']}")
        print(f"   Cost: ${result['observability']['cost_usd']}")
        print(f"   Tokens: {result['usage']['total_tokens']}")
        print(f"   Flags: {len(result['observability']['flags'])} detected")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
        print(f"   Response: {response.text}")
        
        # Try to get more details
        if response.status_code == 500:
            print("\n   🔍 This is an Internal Server Error.")
            print("   Possible causes:")
            print("   1. Invalid OpenAI API key in database")
            print("   2. OpenAI API is down")
            print("   3. Database connection issue")
            print("   4. Missing environment variables")
            
except Exception as e:
    print(f"   ❌ Exception: {e}")

print("\n" + "="*60)
print("🎯 NEXT STEPS:")
print("="*60)

print("""
If you see 500 errors, check:

1. Is your OpenAI API key valid?
   - Go to: https://platform.openai.com/api-keys
   - Make sure it's not expired
   - Check it has credits

2. Check backend logs:
   - Look at the terminal where you ran 'python main.py'
   - See what error is printed

3. Check environment variables:
   - Make sure .env file has SUPABASE_URL and SUPABASE_KEY
   - Make sure database is accessible

4. Re-register with a valid OpenAI key:
   - Go to: http://localhost:3000/onboard
   - Use a fresh OpenAI API key
""")
