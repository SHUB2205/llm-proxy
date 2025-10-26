"""
AI FinOps API Endpoints
Complete visibility into AI spend, agents, chains, and workflows
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from ai_finops import tracker, AgentCall, WorkflowExecution
import uuid

router = APIRouter(prefix="/v1/finops", tags=["AI FinOps"])


# ============================================
# Request/Response Models
# ============================================

class StartWorkflowRequest(BaseModel):
    workflow_name: str
    user_id: str
    session_id: str
    organization_id: str


class TrackAgentCallRequest(BaseModel):
    agent_name: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    workflow_id: str
    organization_id: str
    parent_call_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class EndWorkflowRequest(BaseModel):
    workflow_id: str
    success: bool = True
    error: Optional[str] = None


# ============================================
# TRACKING ENDPOINTS
# ============================================

@router.post("/workflows/start")
async def start_workflow(request: StartWorkflowRequest):
    """
    Start tracking a workflow
    
    Use this when a user initiates a workflow (e.g., "Generate report", "Analyze data")
    """
    workflow_id = str(uuid.uuid4())
    
    workflow = await tracker.start_workflow(
        workflow_id=workflow_id,
        workflow_name=request.workflow_name,
        user_id=request.user_id,
        session_id=request.session_id
    )
    
    return {
        "workflow_id": workflow_id,
        "status": "started",
        "message": f"Workflow '{request.workflow_name}' started"
    }


@router.post("/workflows/end")
async def end_workflow(request: EndWorkflowRequest):
    """
    End workflow tracking
    
    Call this when workflow completes (success or failure)
    """
    workflow = await tracker.end_workflow(
        workflow_id=request.workflow_id,
        success=request.success,
        error=request.error
    )
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return {
        "workflow_id": workflow.workflow_id,
        "status": "completed",
        "total_cost_usd": workflow.total_cost_usd,
        "total_tokens": workflow.total_tokens,
        "total_calls": workflow.total_calls,
        "duration_seconds": (workflow.end_time - workflow.start_time).total_seconds(),
        "agent_breakdown": workflow.agent_breakdown,
        "model_breakdown": workflow.model_breakdown
    }


@router.post("/calls/track")
async def track_agent_call(request: TrackAgentCallRequest):
    """
    Track an individual agent/model call
    
    Call this for every LLM or agent invocation
    """
    call_id = str(uuid.uuid4())
    
    agent_call = await tracker.track_agent_call(
        call_id=call_id,
        agent_name=request.agent_name,
        model=request.model,
        input_tokens=request.input_tokens,
        output_tokens=request.output_tokens,
        latency_ms=request.latency_ms,
        workflow_id=request.workflow_id,
        parent_call_id=request.parent_call_id,
        metadata=request.metadata
    )
    
    return {
        "call_id": call_id,
        "cost_usd": agent_call.cost_usd,
        "total_tokens": agent_call.input_tokens + agent_call.output_tokens,
        "status": "tracked"
    }


@router.post("/sessions/start")
async def start_session(user_id: str, organization_id: str):
    """Start a user session"""
    session_id = str(uuid.uuid4())
    
    session = await tracker.start_session(session_id, user_id)
    
    return {
        "session_id": session_id,
        "status": "started"
    }


@router.post("/sessions/{session_id}/end")
async def end_session(session_id: str):
    """End a user session"""
    session = await tracker.end_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "status": "completed",
        "total_cost_usd": session.total_cost_usd,
        "total_tokens": session.total_tokens,
        "workflow_count": len(session.workflows),
        "duration_seconds": (session.end_time - session.start_time).total_seconds()
    }


# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@router.get("/analytics/agents")
async def get_agent_spend_breakdown(
    organization_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Which agents drive the most spend?
    
    Returns cost breakdown by agent with:
    - Total calls
    - Total tokens
    - Total cost
    - Models used
    """
    start = datetime.fromisoformat(start_date) if start_date else datetime.utcnow() - timedelta(days=30)
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    
    breakdown = await tracker.get_agent_spend_breakdown(
        organization_id, start, end
    )
    
    return {
        "organization_id": organization_id,
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat()
        },
        "agents": breakdown,
        "total_agents": len(breakdown),
        "total_cost": sum(agent["cost"] for agent in breakdown.values())
    }


@router.get("/analytics/models")
async def get_model_spend_breakdown(
    organization_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Which models drive the most spend?
    
    Returns cost breakdown by model with token usage
    """
    start = datetime.fromisoformat(start_date) if start_date else datetime.utcnow() - timedelta(days=30)
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    
    breakdown = await tracker.get_model_spend_breakdown(
        organization_id, start, end
    )
    
    return {
        "organization_id": organization_id,
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat()
        },
        "models": breakdown,
        "total_models": len(breakdown),
        "total_cost": sum(model["cost"] for model in breakdown.values())
    }


@router.get("/analytics/sessions")
async def get_user_session_costs(
    organization_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100, le=1000)
):
    """
    What does each user session cost?
    
    Returns top sessions by cost
    """
    start = datetime.fromisoformat(start_date) if start_date else datetime.utcnow() - timedelta(days=30)
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    
    sessions = await tracker.get_user_session_costs(
        organization_id, start, end, limit
    )
    
    return {
        "organization_id": organization_id,
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat()
        },
        "sessions": sessions,
        "total_sessions": len(sessions)
    }


@router.get("/analytics/workflows/{workflow_name}")
async def get_workflow_performance(
    workflow_name: str,
    organization_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Analyze workflow performance and costs
    
    Returns:
    - Execution count
    - Success rate
    - Average cost
    - Average duration
    - Token usage
    """
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    performance = await tracker.get_workflow_performance(
        organization_id, workflow_name, start, end
    )
    
    return performance


@router.get("/analytics/chains/{workflow_id}")
async def get_call_chain_analysis(workflow_id: str):
    """
    Analyze the call chain for a workflow
    
    Returns:
    - Call tree (nested structure)
    - Chain depth
    - Critical path (most expensive)
    - Total cost breakdown
    """
    analysis = await tracker.get_call_chain_analysis(workflow_id)
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return analysis


@router.get("/analytics/attribution")
async def get_cost_attribution(
    organization_id: str,
    group_by: str = Query("user", regex="^(user|workflow|agent|model|session)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Attribute costs to different dimensions
    
    Group by:
    - user: Cost per user
    - workflow: Cost per workflow type
    - agent: Cost per agent
    - model: Cost per model
    - session: Cost per session
    """
    start = datetime.fromisoformat(start_date) if start_date else datetime.utcnow() - timedelta(days=30)
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    
    attribution = await tracker.get_cost_attribution(
        organization_id, start, end, group_by
    )
    
    return {
        "organization_id": organization_id,
        "group_by": group_by,
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat()
        },
        "attribution": attribution,
        "total_items": len(attribution),
        "total_cost": sum(
            item.get("cost", 0) for item in attribution.values()
        )
    }


# ============================================
# OPTIMIZATION ENDPOINTS
# ============================================

@router.get("/optimization/opportunities")
async def get_optimization_opportunities(
    organization_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Find opportunities to optimize costs
    
    Returns:
    - Expensive agents to optimize
    - Expensive models to replace
    - Caching opportunities
    - Failed workflows wasting money
    """
    start = datetime.fromisoformat(start_date) if start_date else datetime.utcnow() - timedelta(days=30)
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    
    opportunities = await tracker.get_optimization_opportunities(
        organization_id, start, end
    )
    
    total_savings = sum(opp.get("potential_savings", 0) for opp in opportunities)
    
    return {
        "organization_id": organization_id,
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat()
        },
        "opportunities": opportunities,
        "total_opportunities": len(opportunities),
        "total_potential_savings": total_savings
    }


# ============================================
# DASHBOARD ENDPOINTS
# ============================================

@router.get("/dashboard/overview")
async def get_dashboard_overview(
    organization_id: str,
    period: str = Query("30d", regex="^(24h|7d|30d|90d)$")
):
    """
    Get overview dashboard data
    
    Returns key metrics:
    - Total spend
    - Total tokens
    - Total calls
    - Top agents
    - Top models
    - Top users
    - Optimization opportunities
    """
    # Calculate date range
    period_map = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "90d": timedelta(days=90)
    }
    
    end = datetime.utcnow()
    start = end - period_map[period]
    
    # Get all data in parallel
    agent_breakdown = await tracker.get_agent_spend_breakdown(organization_id, start, end)
    model_breakdown = await tracker.get_model_spend_breakdown(organization_id, start, end)
    opportunities = await tracker.get_optimization_opportunities(organization_id, start, end)
    
    # Calculate totals
    total_cost = sum(agent["cost"] for agent in agent_breakdown.values())
    total_tokens = sum(agent["tokens"] for agent in agent_breakdown.values())
    total_calls = sum(agent["calls"] for agent in agent_breakdown.values())
    
    # Top 5 agents
    top_agents = dict(list(agent_breakdown.items())[:5])
    
    # Top 5 models
    top_models = dict(list(model_breakdown.items())[:5])
    
    # Total potential savings
    total_savings = sum(opp.get("potential_savings", 0) for opp in opportunities)
    
    return {
        "organization_id": organization_id,
        "period": period,
        "date_range": {
            "start": start.isoformat(),
            "end": end.isoformat()
        },
        "summary": {
            "total_cost_usd": total_cost,
            "total_tokens": total_tokens,
            "total_calls": total_calls,
            "avg_cost_per_call": total_cost / total_calls if total_calls > 0 else 0
        },
        "top_agents": top_agents,
        "top_models": top_models,
        "optimization": {
            "opportunities_count": len(opportunities),
            "potential_savings_usd": total_savings
        },
        "opportunities": opportunities[:5]  # Top 5 opportunities
    }


@router.get("/dashboard/trends")
async def get_spending_trends(
    organization_id: str,
    period: str = Query("30d", regex="^(7d|30d|90d)$"),
    granularity: str = Query("day", regex="^(hour|day|week)$")
):
    """
    Get spending trends over time
    
    Returns time-series data for:
    - Cost
    - Tokens
    - Calls
    """
    # This would query the cost_attribution table
    # For now, return placeholder
    return {
        "organization_id": organization_id,
        "period": period,
        "granularity": granularity,
        "message": "Trends endpoint - query cost_attribution table for time-series data"
    }


# ============================================
# EXPORT ENDPOINTS
# ============================================

@router.get("/export/report")
async def export_cost_report(
    organization_id: str,
    start_date: str,
    end_date: str,
    format: str = Query("json", regex="^(json|csv)$")
):
    """
    Export comprehensive cost report
    
    Includes:
    - Agent breakdown
    - Model breakdown
    - User attribution
    - Workflow performance
    - Optimization recommendations
    """
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    # Gather all data
    agent_breakdown = await tracker.get_agent_spend_breakdown(organization_id, start, end)
    model_breakdown = await tracker.get_model_spend_breakdown(organization_id, start, end)
    user_attribution = await tracker.get_cost_attribution(organization_id, start, end, "user")
    opportunities = await tracker.get_optimization_opportunities(organization_id, start, end)
    
    report = {
        "organization_id": organization_id,
        "report_period": {
            "start": start.isoformat(),
            "end": end.isoformat()
        },
        "generated_at": datetime.utcnow().isoformat(),
        "summary": {
            "total_cost": sum(agent["cost"] for agent in agent_breakdown.values()),
            "total_tokens": sum(agent["tokens"] for agent in agent_breakdown.values()),
            "total_calls": sum(agent["calls"] for agent in agent_breakdown.values())
        },
        "agent_breakdown": agent_breakdown,
        "model_breakdown": model_breakdown,
        "user_attribution": user_attribution,
        "optimization_opportunities": opportunities
    }
    
    if format == "csv":
        # Convert to CSV format
        # TODO: Implement CSV conversion
        return {"message": "CSV export not yet implemented", "data": report}
    
    return report
