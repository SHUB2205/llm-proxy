import httpx

API_URL = "http://localhost:8000/v1/chat/completions"
PROXY_KEY = "llm_obs_kNGfSbGJrVLFyUm4GyKPaC2RrFRklmJ7XAYhN9zHOOk"

print("🚀 Sending request to proxy...")
print(f"URL: {API_URL}")
print(f"Key: {PROXY_KEY[:20]}...")

response = httpx.post(
    API_URL,
    headers={
        "Authorization": f"Bearer {PROXY_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "What is the capital of France?"}
        ]
    },
    timeout=30.0
)

print(f"\n📡 Response Status: {response.status_code}")
print(f"📄 Response Headers: {dict(response.headers)}")
print(f"\n📝 Raw Response Content:")
print(response.text)
print("\n" + "="*60)

if response.status_code != 200:
    print(f"❌ Error: {response.status_code}")
    print(f"Response: {response.text}")
    exit(1)

try:
    result = response.json()
    
    print("✅ Response received!")
    print(f"Run ID: {result['run_id']}")
    print(f"\nObservability Data:")
    print(f"  Flags Detected: {result['observability']['flags_detected']}")
    print(f"  Risk Score: {result['observability']['risk_score']}")
    print(f"  Risk Level: {result['observability']['risk_level']}")

    if result['observability']['flags']:
        print(f"\n🚨 Flags:")
        for flag in result['observability']['flags']:
            print(f"  - {flag['flag_type']}: {flag['description']}")

    print(f"\n💬 AI Response: {result['choices'][0]['message']['content']}")
    
except Exception as e:
    print(f"❌ Error parsing response: {e}")
    print(f"Raw content: {response.text}")



