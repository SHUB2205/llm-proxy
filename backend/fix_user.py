"""
Quick script to re-register user with current encryption key
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000"
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_KEY:
    print("❌ OPENAI_API_KEY not found in .env")
    print("Please add: OPENAI_API_KEY=sk-...")
    exit(1)

# Register new user
print("🔄 Re-registering user with current encryption key...")
response = requests.post(
    f"{API_URL}/v1/users/register",
    json={
        "email": "test@example.com",
        "company_name": "Test Company",
        "openai_api_key": OPENAI_KEY
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"\n✅ User registered successfully!")
    print(f"\n📋 Your new proxy key:")
    print(f"   {data['proxy_key']}")
    print(f"\n💾 Add this to your .env file:")
    print(f"   PROXY_KEY={data['proxy_key']}")
    print(f"\n🎯 Now you can run: python test_live_detection.py")
else:
    print(f"❌ Registration failed: {response.status_code}")
    print(f"   {response.text}")
