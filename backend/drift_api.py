"""
Drift Detection API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from drift_detection.drift_monitor import drift_monitor
from database import get_user_by_proxy_key

router = APIRouter(prefix="/v1/drift", tags=["drift"])


async def verify_api_key(authorization: str = Header(None)):
    """Verify API key from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    proxy_key = authorization.replace("Bearer ", "")
    user = await get_user_by_proxy_key(proxy_key)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return user


@router.get("/check")
async def check_drift(
    model: str = "gpt-4o-mini",
    user = Depends(verify_api_key)
):
    """
    Check for drift in recent requests
    
    Returns:
    - has_drift: bool
    - drift_count: int
    - drifts: list of detected drifts
    - current_metrics: current metric values
    - baseline_metrics: baseline metric values
    """
    try:
        result = await drift_monitor.check_drift(model=model)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking drift: {str(e)}")


@router.get("/history")
async def get_drift_history(
    model: Optional[str] = None,
    limit: int = 50,
    user = Depends(verify_api_key)
):
    """
    Get drift detection history
    
    Query params:
    - model: Filter by model (optional)
    - limit: Number of results (default: 50)
    """
    try:
        history = await drift_monitor.get_drift_history(model=model, limit=limit)
        return {"history": history, "count": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting drift history: {str(e)}")


@router.get("/stats")
async def get_drift_stats(
    model: Optional[str] = None,
    user = Depends(verify_api_key)
):
    """
    Get drift statistics
    
    Returns:
    - total_drifts: Total number of drifts detected
    - critical_drifts: Number of critical drifts
    - high_drifts: Number of high severity drifts
    - medium_drifts: Number of medium severity drifts
    - recent_drifts_24h: Drifts in last 24 hours
    - drift_by_metric: Breakdown by metric type
    """
    try:
        stats = await drift_monitor.get_drift_stats(model=model)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting drift stats: {str(e)}")


@router.post("/baseline/reset")
async def reset_baseline(
    model: str,
    user = Depends(verify_api_key)
):
    """
    Reset baseline for a specific model
    This will recalculate baseline from recent data
    """
    try:
        # Get recent requests
        from drift_detection.drift_monitor import supabase
        
        result = supabase.table("runs")\
            .select("*")\
            .eq("model", model)\
            .order("created_at", desc=True)\
            .limit(100)\
            .execute()
        
        requests = result.data if result.data else []
        
        if len(requests) < 50:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data to create baseline. Need at least 50 requests, found {len(requests)}"
            )
        
        # Create new baseline
        baseline = await drift_monitor._create_baseline(model, requests)
        
        return {
            "success": True,
            "model": model,
            "baseline": {k: v["value"] for k, v in baseline.items()},
            "sample_size": len(requests)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting baseline: {str(e)}")
