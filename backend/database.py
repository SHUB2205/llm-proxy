# backend/database.py
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

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