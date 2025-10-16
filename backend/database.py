# backend/database.py
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
from cryptography.fernet import Fernet
import base64
import hashlib

load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Encryption key for API keys (in production, use a secure key management service)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

async def log_request(run_id: str, request_body: dict, response_body: dict, latency_ms: int):
    """Log request to Supabase"""
    
    model = request_body.get("model")
    usage = response_body.get("usage", {})
    
    # Calculate cost
    cost_per_1k = {
        "gpt-4o": {"input": 0.0025, "output": 0.01},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    }
    model_costs = cost_per_1k.get(model, {"input": 0.001, "output": 0.002})
    cost_usd = (
        (usage.get("prompt_tokens", 0) / 1000 * model_costs["input"]) +
        (usage.get("completion_tokens", 0) / 1000 * model_costs["output"])
    )
    
    # Extract response text
    response_text = ""
    if "choices" in response_body and len(response_body["choices"]) > 0:
        response_text = response_body["choices"][0]["message"]["content"]
    
    # Insert run
    supabase.table("runs").insert({
        "id": run_id,
        "model": model,
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "completion_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
        "cost_usd": cost_usd,
        "latency_ms": latency_ms
    }).execute()
    
    # Insert payload
    supabase.table("payloads").insert({
        "run_id": run_id,
        "messages": request_body.get("messages"),
        "response": response_text,
        "full_request": request_body,
        "full_response": response_body
    }).execute()

async def get_runs(limit: int = 50, offset: int = 0, model: str = None):
    """Get list of runs"""
    query = supabase.table("runs").select("*")
    
    if model:
        query = query.eq("model", model)
    
    query = query.order("created_at", desc=True).limit(limit).offset(offset)
    
    result = query.execute()
    return result.data

async def get_run(run_id: str):
    """Get single run with payload"""
    run = supabase.table("runs").select("*, payloads(*)").eq("id", run_id).single().execute()
    return run.data


# ============================================
# User & API Key Management
# ============================================

def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for secure storage"""
    return cipher_suite.encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key"""
    return cipher_suite.decrypt(encrypted_key.encode()).decode()


def hash_proxy_key(key: str) -> str:
    """Hash a proxy key for lookup"""
    return hashlib.sha256(key.encode()).hexdigest()


async def create_user(email: str, company_name: str, openai_api_key: str) -> Dict:
    """Create a new user with their OpenAI API key"""
    encrypted_key = encrypt_api_key(openai_api_key)
    
    result = supabase.table("users").insert({
        "email": email,
        "company_name": company_name,
        "encrypted_api_key": encrypted_key
    }).execute()
    
    return result.data[0] if result.data else None


async def create_proxy_key(user_id: str, key_name: str) -> Dict:
    """Generate a new proxy API key for a user"""
    import secrets
    
    # Generate a secure random key
    proxy_key = f"llm_obs_{secrets.token_urlsafe(32)}"
    
    result = supabase.table("proxy_keys").insert({
        "user_id": user_id,
        "key_name": key_name,
        "api_key": proxy_key
    }).execute()
    
    return {"proxy_key": proxy_key, **result.data[0]} if result.data else None


async def get_user_by_proxy_key(proxy_key: str) -> Optional[Dict]:
    """Get user information from proxy key"""
    # Find the proxy key
    key_result = supabase.table("proxy_keys").select("*, users(*)").eq("api_key", proxy_key).eq("is_active", True).single().execute()
    
    if not key_result.data:
        return None
    
    # Update last_used_at
    supabase.table("proxy_keys").update({"last_used_at": "now()"}).eq("api_key", proxy_key).execute()
    
    return key_result.data


async def get_user_openai_key(user_id: str) -> Optional[str]:
    """Get decrypted OpenAI API key for a user"""
    result = supabase.table("users").select("encrypted_api_key").eq("id", user_id).single().execute()
    
    if result.data:
        return decrypt_api_key(result.data["encrypted_api_key"])
    return None


# ============================================
# Enhanced Logging with User Context
# ============================================

async def log_request_with_flags(
    run_id: str,
    user_id: str,
    proxy_key_id: str,
    request_body: dict,
    response_body: dict,
    latency_ms: int,
    flags: List[Dict] = None
):
    """Log request with hallucination detection flags"""
    
    model = request_body.get("model")
    usage = response_body.get("usage", {})
    
    # Calculate cost
    cost_per_1k = {
        "gpt-4o": {"input": 0.0025, "output": 0.01},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    }
    model_costs = cost_per_1k.get(model, {"input": 0.001, "output": 0.002})
    cost_usd = (
        (usage.get("prompt_tokens", 0) / 1000 * model_costs["input"]) +
        (usage.get("completion_tokens", 0) / 1000 * model_costs["output"])
    )
    
    # Extract response text
    response_text = ""
    if "choices" in response_body and len(response_body["choices"]) > 0:
        response_text = response_body["choices"][0]["message"]["content"]
    
    # Determine status based on flags
    status = "success"
    if flags:
        high_severity_flags = [f for f in flags if f["severity"] in ["high", "critical"]]
        if high_severity_flags:
            status = "flagged"
    
    # Insert run
    supabase.table("runs").insert({
        "id": run_id,
        "user_id": user_id,
        "proxy_key_id": proxy_key_id,
        "model": model,
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "completion_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
        "cost_usd": cost_usd,
        "latency_ms": latency_ms,
        "status": status
    }).execute()
    
    # Insert payload
    supabase.table("payloads").insert({
        "run_id": run_id,
        "messages": request_body.get("messages"),
        "response": response_text,
        "full_request": request_body,
        "full_response": response_body
    }).execute()
    
    # Insert flags if any
    if flags:
        for flag in flags:
            supabase.table("flags").insert({
                "run_id": run_id,
                "flag_type": flag["flag_type"],
                "severity": flag["severity"],
                "confidence_score": flag["confidence_score"],
                "description": flag["description"],
                "details": flag.get("details", {})
            }).execute()


# ============================================
# Flag Management
# ============================================

async def get_flags_for_user(user_id: str, is_resolved: bool = None, severity: str = None, limit: int = 50):
    """Get flags for a user's runs"""
    query = supabase.table("flags").select("*, runs!inner(user_id)").eq("runs.user_id", user_id)
    
    if is_resolved is not None:
        query = query.eq("is_resolved", is_resolved)
    
    if severity:
        query = query.eq("severity", severity)
    
    query = query.order("created_at", desc=True).limit(limit)
    result = query.execute()
    
    return result.data


async def resolve_flag(flag_id: str, user_id: str):
    """Mark a flag as resolved"""
    result = supabase.table("flags").update({
        "is_resolved": True,
        "resolved_by": user_id,
        "resolved_at": "now()"
    }).eq("id", flag_id).execute()
    
    return result.data


async def get_flag_stats(user_id: str) -> Dict:
    """Get flag statistics for a user"""
    # Get all flags for user
    flags = await get_flags_for_user(user_id, limit=1000)
    
    total_flags = len(flags)
    unresolved = len([f for f in flags if not f["is_resolved"]])
    by_severity = {}
    by_type = {}
    
    for flag in flags:
        severity = flag["severity"]
        flag_type = flag["flag_type"]
        
        by_severity[severity] = by_severity.get(severity, 0) + 1
        by_type[flag_type] = by_type.get(flag_type, 0) + 1
    
    return {
        "total_flags": total_flags,
        "unresolved_flags": unresolved,
        "by_severity": by_severity,
        "by_type": by_type
    }