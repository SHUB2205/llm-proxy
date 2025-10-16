"""


# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import time
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv() 

app = FastAPI(title="LLM Proxy")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/proxy/openai/chat/completions")
async def proxy_openai(request: Request):
    """"Forward request to OpenAI and log it""""
    
    # Parse request
    body = await request.json()
    start_time = time.time()
    
    # Forward to OpenAI
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            json=body,
            headers={
                "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                "Content-Type": "application/json"
            },
            timeout=60.0
        )
        result = response.json()
    
    # Calculate metrics
    latency_ms = int((time.time() - start_time) * 1000)
    run_id = str(uuid.uuid4())
    
    # Log to database (we'll add this next)
    # await log_request(run_id, body, result, latency_ms)
    
    return {
        "run_id": run_id,
        **result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""    

# backend/main.py
import os
import time
import uuid
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import Optional
from datetime import datetime, timedelta
from database import supabase  
from database import log_request  # ✅ only import log_request (get_pool not defined in your db.py)

load_dotenv()

app = FastAPI()

# Allow CORS (optional but useful for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # update with your frontend URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/proxy/openai/chat/completions")
async def proxy_openai(request: Request):
    """Forward request to OpenAI and log it."""
    body = await request.json()
    start_time = time.time()
    run_id = str(uuid.uuid4())

    try:
        # Forward request to OpenAI
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                    "Content-Type": "application/json",
                },
                timeout=60.0,
            )

        result = response.json()
        latency_ms = int((time.time() - start_time) * 1000)

        # Log to Supabase
        await log_request(run_id, body, result, latency_ms)

        return {"run_id": run_id, **result}

    except Exception as e:
        print(f"❌ Error in proxy_openai: {e}")
        return {"run_id": run_id, "error": str(e)}, 500


@app.get("/")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "LLM Proxy is running!"}

@app.get("/v1/runs")
async def get_runs(
    limit: int = 50,
    offset: int = 0,
    model: Optional[str] = None,
    status: Optional[str] = None
):
    """Get list of runs with optional filters (via Supabase)"""

    query = supabase.table("runs").select("*")

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
async def get_run(run_id: str):
    """Get detailed view of a single run (with payloads via join)"""

    # Try to use the view `run_details` if available
    try:
        result = supabase.table("run_details").select("*").eq("id", run_id).single().execute()
        if result.data:
            return result.data
    except Exception:
        pass  # fallback if view doesn’t exist

    # Fallback: fetch manually from runs + payloads
    run = supabase.table("runs").select("*").eq("id", run_id).single().execute()
    payload = supabase.table("payloads").select("*").eq("run_id", run_id).single().execute()

    if not run.data:
        return {"error": "Run not found"}, 404

    return {**run.data, "payload": payload.data}


@app.get("/v1/stats")
async def get_stats():
    """Get aggregate statistics for the last 24 hours"""

    now = datetime.utcnow()
    since = (now - timedelta(hours=24)).isoformat()

    # Fetch runs created in last 24 hours
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
    unique_models = len(set(r.get("model") for r in runs if r.get("model")))

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
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "avg_latency": avg_latency,
            "unique_models": unique_models
        },
        "by_model": list(model_stats.values())
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
