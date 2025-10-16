"""
LLM Observability Platform - Main API
Multi-tenant proxy with hallucination detection and safety monitoring
"""

import os
import time
import uuid
import httpx
from fastapi import FastAPI, Request, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import Optional
from datetime import datetime, timedelta

from database import (
    supabase,
    create_user,
    create_proxy_key,
    get_user_by_proxy_key,
    get_user_openai_key,
    log_request_with_flags,
    get_flags_for_user,
    resolve_flag,
    get_flag_stats
)
from hallucination_detector import HallucinationDetector, calculate_overall_risk_score

load_dotenv()

app = FastAPI(
    title="LLM Observability Platform",
    description="AI Safety Monitoring with Hallucination Detection",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector
detector = HallucinationDetector()


# ============================================
# Authentication Dependency
# ============================================

async def verify_proxy_key(authorization: Optional[str] = Header(None)) -> dict:
    """Verify proxy API key and return user context"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    # Extract key from "Bearer <key>" format
    if authorization.startswith("Bearer "):
        proxy_key = authorization[7:]
    else:
        proxy_key = authorization
    
    user_data = await get_user_by_proxy_key(proxy_key)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    
    return user_data


# ============================================
# Health & Info
# ============================================

@app.get("/")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "LLM Observability Platform",
        "version": "2.0.0",
        "features": [
            "Multi-tenant API key management",
            "Hallucination detection",
            "Real-time safety monitoring",
            "Comprehensive audit logs"
        ]
    }


@app.get("/health")
def health():
    """Simple health check"""
    return {"status": "healthy"}


@app.get("/v1/public/stats")
async def get_public_stats():
    """Get public stats without authentication (for testing)"""
    # This is a temporary endpoint for testing
    # In production, you should remove this or add rate limiting
    
    now = datetime.utcnow()
    since = (now - timedelta(hours=24)).isoformat()
    
    result = (
        supabase.table("runs")
        .select("*")
        .gte("created_at", since)
        .execute()
    )
    
    runs = result.data or []
    total_requests = len(runs)
    total_tokens = sum(r.get("total_tokens", 0) for r in runs)
    total_cost = sum(float(r.get("cost_usd", 0) or 0) for r in runs)
    avg_latency = round(sum(r.get("latency_ms", 0) for r in runs) / total_requests, 2) if total_requests else 0
    flagged_requests = len([r for r in runs if r.get("status") == "flagged"])
    
    return {
        "last_24h": {
            "total_requests": total_requests,
            "flagged_requests": flagged_requests,
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 6),
            "avg_latency": avg_latency
        }
    }


@app.get("/v1/public/runs")
async def get_public_runs(limit: int = 5):
    """Get recent runs without authentication (for testing)"""
    result = supabase.table("runs").select("*").order("created_at", desc=True).limit(limit).execute()
    
    return {
        "runs": result.data or [],
        "total": len(result.data) if result.data else 0
    }


# ============================================
# User Onboarding
# ============================================

@app.post("/v1/users/register")
async def register_user(request: Request):
    """
    Register a new user with their OpenAI API key
    
    Body:
    {
        "email": "user@company.com",
        "company_name": "Company Inc",
        "openai_api_key": "sk-..."
    }
    """
    body = await request.json()
    
    email = body.get("email")
    company_name = body.get("company_name")
    openai_api_key = body.get("openai_api_key")
    
    if not email or not openai_api_key:
        raise HTTPException(status_code=400, detail="Email and OpenAI API key are required")
    
    try:
        # Create user
        user = await create_user(email, company_name, openai_api_key)
        
        # Generate initial proxy key
        proxy_key_data = await create_proxy_key(user["id"], "Default Key")
        
        return {
            "success": True,
            "user_id": user["id"],
            "email": user["email"],
            "proxy_key": proxy_key_data["proxy_key"],
            "message": "User registered successfully. Use this proxy key in your requests."
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/v1/keys/create")
async def create_new_proxy_key(
    request: Request,
    user_context: dict = Depends(verify_proxy_key)
):
    """Create a new proxy API key for the authenticated user"""
    body = await request.json()
    key_name = body.get("key_name", "Unnamed Key")
    
    user_id = user_context["users"]["id"]
    
    try:
        proxy_key_data = await create_proxy_key(user_id, key_name)
        return {
            "success": True,
            "proxy_key": proxy_key_data["proxy_key"],
            "key_name": key_name,
            "created_at": proxy_key_data["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create key: {str(e)}")


# ============================================
# Main Proxy Endpoint with Detection
# ============================================

@app.post("/v1/chat/completions")
async def proxy_chat_completions(
    request: Request,
    user_context: dict = Depends(verify_proxy_key)
):
    """
    Proxy endpoint for OpenAI chat completions with hallucination detection
    
    Usage: Same as OpenAI API, but use your proxy key in Authorization header
    """
    body = await request.json()
    start_time = time.time()
    run_id = str(uuid.uuid4())
    
    # Extract user info
    user_id = user_context["users"]["id"]
    proxy_key_id = user_context["id"]
    
    # Get user's OpenAI API key
    openai_key = await get_user_openai_key(user_id)
    
    if not openai_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not found for user")
    
    try:
        # Forward request to OpenAI
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json",
                },
                timeout=60.0,
            )
        
        result = response.json()
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Extract prompt and response for analysis
        messages = body.get("messages", [])
        prompt_text = " ".join([m.get("content", "") for m in messages if m.get("role") == "user"])
        
        response_text = ""
        if "choices" in result and len(result["choices"]) > 0:
            response_text = result["choices"][0]["message"]["content"]
        
        # Run hallucination detection
        flags = []
        if response_text:
            flags = detector.analyze(prompt_text, response_text, body.get("model", "unknown"))
        
        # Calculate risk score
        risk_score, risk_level = calculate_overall_risk_score(flags)
        
        # Log to database with flags
        await log_request_with_flags(
            run_id=run_id,
            user_id=user_id,
            proxy_key_id=proxy_key_id,
            request_body=body,
            response_body=result,
            latency_ms=latency_ms,
            flags=flags
        )
        
        # Add observability metadata to response
        return {
            "run_id": run_id,
            "observability": {
                "flags_detected": len(flags),
                "risk_score": risk_score,
                "risk_level": risk_level,
                "flags": flags if flags else []
            },
            **result
        }
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


# ============================================
# Monitoring & Analytics Endpoints
# ============================================

@app.get("/v1/runs")
async def get_runs(
    limit: int = 50,
    offset: int = 0,
    model: Optional[str] = None,
    status: Optional[str] = None,
    user_context: dict = Depends(verify_proxy_key)
):
    """Get list of runs for authenticated user"""
    user_id = user_context["users"]["id"]
    
    query = supabase.table("runs").select("*").eq("user_id", user_id)
    
    if model:
        query = query.eq("model", model)
    
    if status:
        query = query.eq("status", status)
    
    query = query.order("created_at", desc=True).limit(limit).offset(offset)
    result = query.execute()
    
    return {
        "runs": result.data,
        "total": len(result.data) if result.data else 0
    }


@app.get("/v1/runs/{run_id}")
async def get_run_detail(
    run_id: str,
    user_context: dict = Depends(verify_proxy_key)
):
    """Get detailed view of a single run with flags"""
    user_id = user_context["users"]["id"]
    
    # Get run with payload
    run = supabase.table("runs").select("*, payloads(*)").eq("id", run_id).eq("user_id", user_id).single().execute()
    
    if not run.data:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Get flags for this run
    flags = supabase.table("flags").select("*").eq("run_id", run_id).execute()
    
    return {
        **run.data,
        "flags": flags.data if flags.data else []
    }


@app.get("/v1/flags")
async def get_flags(
    is_resolved: Optional[bool] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    user_context: dict = Depends(verify_proxy_key)
):
    """Get flags for authenticated user"""
    user_id = user_context["users"]["id"]
    
    flags = await get_flags_for_user(user_id, is_resolved, severity, limit)
    
    return {
        "flags": flags,
        "total": len(flags)
    }


@app.post("/v1/flags/{flag_id}/resolve")
async def resolve_flag_endpoint(
    flag_id: str,
    user_context: dict = Depends(verify_proxy_key)
):
    """Mark a flag as resolved"""
    user_id = user_context["users"]["id"]
    
    result = await resolve_flag(flag_id, user_id)
    
    return {
        "success": True,
        "flag_id": flag_id,
        "resolved_at": datetime.utcnow().isoformat()
    }


@app.get("/v1/stats")
async def get_stats(
    user_context: dict = Depends(verify_proxy_key)
):
    """Get aggregate statistics for authenticated user"""
    user_id = user_context["users"]["id"]
    
    now = datetime.utcnow()
    since = (now - timedelta(hours=24)).isoformat()
    
    # Fetch runs created in last 24 hours
    result = (
        supabase.table("runs")
        .select("*")
        .eq("user_id", user_id)
        .gte("created_at", since)
        .execute()
    )
    
    runs = result.data or []
    total_requests = len(runs)
    total_tokens = sum(r.get("total_tokens", 0) for r in runs)
    total_cost = sum(float(r.get("cost_usd", 0) or 0) for r in runs)
    avg_latency = round(sum(r.get("latency_ms", 0) for r in runs) / total_requests, 2) if total_requests else 0
    
    flagged_requests = len([r for r in runs if r.get("status") == "flagged"])
    
    # Get flag statistics
    flag_stats = await get_flag_stats(user_id)
    
    # Group by model
    model_stats = {}
    for r in runs:
        model = r.get("model", "unknown")
        if model not in model_stats:
            model_stats[model] = {"model": model, "count": 0, "tokens": 0, "cost": 0}
        model_stats[model]["count"] += 1
        model_stats[model]["tokens"] += r.get("total_tokens", 0)
        model_stats[model]["cost"] += float(r.get("cost_usd", 0) or 0)
    
    return {
        "last_24h": {
            "total_requests": total_requests,
            "flagged_requests": flagged_requests,
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 6),
            "avg_latency": avg_latency
        },
        "flags": flag_stats,
        "by_model": list(model_stats.values())
    }


@app.get("/v1/dashboard")
async def get_dashboard(
    user_context: dict = Depends(verify_proxy_key)
):
    """Get comprehensive dashboard data"""
    user_id = user_context["users"]["id"]
    
    # Get stats
    stats = await get_stats(user_context)
    
    # Get recent flagged runs
    flagged_runs = (
        supabase.table("runs")
        .select("*, flags(*)")
        .eq("user_id", user_id)
        .eq("status", "flagged")
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    
    # Get unresolved flags
    unresolved_flags = await get_flags_for_user(user_id, is_resolved=False, limit=20)
    
    return {
        "stats": stats,
        "recent_flagged_runs": flagged_runs.data if flagged_runs.data else [],
        "unresolved_flags": unresolved_flags
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
