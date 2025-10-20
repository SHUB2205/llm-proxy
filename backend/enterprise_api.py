"""
Enterprise API Endpoints
Additional endpoints for business features
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, List
from datetime import datetime, timedelta
from database import supabase
from enterprise_features import (
    generate_cost_recommendations,
    invite_team_member,
    check_permission,
    apply_custom_rules,
    send_webhook,
    check_rate_limit
)

router = APIRouter(prefix="/v1/enterprise", tags=["enterprise"])


# ============================================
# Analytics & Reporting
# ============================================

@router.get("/analytics/usage")
async def get_usage_analytics(
    organization_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    group_by: str = "day"  # day, week, month
):
    """Get detailed usage analytics"""
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).date().isoformat()
    if not end_date:
        end_date = datetime.utcnow().date().isoformat()
    
    usage = supabase.table("daily_usage").select("*").eq("organization_id", organization_id).gte("date", start_date).lte("date", end_date).order("date").execute()
    
    return {
        "data": usage.data or [],
        "summary": {
            "total_requests": sum(d.get("total_requests", 0) for d in usage.data or []),
            "total_cost": sum(float(d.get("total_cost", 0)) for d in usage.data or []),
            "total_tokens": sum(d.get("total_tokens", 0) for d in usage.data or []),
            "avg_latency": sum(d.get("avg_latency_ms", 0) for d in usage.data or []) / len(usage.data or [1]),
        }
    }


@router.get("/analytics/model-performance")
async def get_model_performance(organization_id: str, days: int = 30):
    """Get performance metrics by model"""
    start_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    
    performance = supabase.table("model_performance").select("*").eq("organization_id", organization_id).gte("date", start_date).execute()
    
    return {"models": performance.data or []}


@router.get("/analytics/cost-breakdown")
async def get_cost_breakdown(organization_id: str, period: str = "month"):
    """Get detailed cost breakdown"""
    if period == "month":
        start_date = datetime.utcnow().replace(day=1).date().isoformat()
    else:
        start_date = (datetime.utcnow() - timedelta(days=7)).date().isoformat()
    
    usage = supabase.table("daily_usage").select("*").eq("organization_id", organization_id).gte("date", start_date).execute()
    
    # Aggregate by model
    model_costs = {}
    for day in usage.data or []:
        model_usage = day.get("model_usage", {})
        for model, count in model_usage.items():
            if model not in model_costs:
                model_costs[model] = {"requests": 0, "cost": 0}
            model_costs[model]["requests"] += count
    
    return {
        "period": period,
        "total_cost": sum(float(d.get("total_cost", 0)) for d in usage.data or []),
        "by_model": model_costs,
        "daily_breakdown": usage.data or []
    }


# ============================================
# Cost Optimization
# ============================================

@router.get("/recommendations")
async def get_recommendations(organization_id: str):
    """Get cost optimization recommendations"""
    recommendations = await generate_cost_recommendations(organization_id)
    
    # Save to database
    for rec in recommendations:
        supabase.table("recommendations").insert({
            "organization_id": organization_id,
            "recommendation_type": rec["type"],
            "title": rec["title"],
            "description": rec["description"],
            "estimated_monthly_savings": rec["estimated_monthly_savings"],
            "confidence_score": rec["confidence_score"]
        }).execute()
    
    return {"recommendations": recommendations}


@router.post("/recommendations/{recommendation_id}/accept")
async def accept_recommendation(recommendation_id: str):
    """Mark recommendation as accepted"""
    supabase.table("recommendations").update({
        "status": "accepted",
        "implemented_at": datetime.utcnow().isoformat()
    }).eq("id", recommendation_id).execute()
    
    return {"success": True}


# ============================================
# Team Management
# ============================================

@router.get("/team/members")
async def get_team_members(organization_id: str):
    """Get all team members"""
    members = supabase.table("team_members").select("*").eq("organization_id", organization_id).execute()
    
    return {"members": members.data or []}


@router.post("/team/invite")
async def invite_member(request: Request):
    """Invite a new team member"""
    body = await request.json()
    
    member = await invite_team_member(
        organization_id=body["organization_id"],
        email=body["email"],
        role=body.get("role", "member"),
        invited_by=body["invited_by"]
    )
    
    return {"success": True, "member": member}


@router.put("/team/members/{member_id}")
async def update_member(member_id: str, request: Request):
    """Update team member permissions"""
    body = await request.json()
    
    supabase.table("team_members").update(body).eq("id", member_id).execute()
    
    return {"success": True}


@router.delete("/team/members/{member_id}")
async def remove_member(member_id: str):
    """Remove team member"""
    supabase.table("team_members").update({"is_active": False}).eq("id", member_id).execute()
    
    return {"success": True}


# ============================================
# Custom Detection Rules
# ============================================

@router.get("/rules")
async def get_custom_rules(organization_id: str):
    """Get all custom detection rules"""
    rules = supabase.table("custom_rules").select("*").eq("organization_id", organization_id).execute()
    
    return {"rules": rules.data or []}


@router.post("/rules")
async def create_custom_rule(request: Request):
    """Create a new custom detection rule"""
    body = await request.json()
    
    rule = supabase.table("custom_rules").insert({
        "organization_id": body["organization_id"],
        "created_by": body.get("created_by"),
        "rule_name": body["rule_name"],
        "description": body.get("description"),
        "rule_type": body["rule_type"],
        "config": body["config"],
        "severity": body.get("severity", "medium"),
        "action": body.get("action", "flag")
    }).execute()
    
    return {"success": True, "rule": rule.data[0] if rule.data else None}


@router.put("/rules/{rule_id}")
async def update_custom_rule(rule_id: str, request: Request):
    """Update custom detection rule"""
    body = await request.json()
    
    supabase.table("custom_rules").update(body).eq("id", rule_id).execute()
    
    return {"success": True}


@router.delete("/rules/{rule_id}")
async def delete_custom_rule(rule_id: str):
    """Delete custom detection rule"""
    supabase.table("custom_rules").update({"is_active": False}).eq("id", rule_id).execute()
    
    return {"success": True}


# ============================================
# API Key Management
# ============================================

@router.get("/keys")
async def get_api_keys(organization_id: str):
    """Get all API keys for organization"""
    keys = supabase.table("api_keys").select("id, key_name, key_prefix, total_requests, total_cost, last_used_at, created_at, is_active").eq("organization_id", organization_id).execute()
    
    return {"keys": keys.data or []}


@router.post("/keys")
async def create_api_key(request: Request):
    """Create a new API key"""
    import secrets
    body = await request.json()
    
    api_key = f"llm_obs_{secrets.token_urlsafe(32)}"
    key_prefix = api_key[:20]
    
    key = supabase.table("api_keys").insert({
        "organization_id": body["organization_id"],
        "created_by": body.get("created_by"),
        "key_name": body["key_name"],
        "api_key": api_key,
        "key_prefix": key_prefix,
        "allowed_models": body.get("allowed_models"),
        "rate_limit_per_minute": body.get("rate_limit_per_minute"),
        "expires_at": body.get("expires_at")
    }).execute()
    
    return {
        "success": True,
        "api_key": api_key,  # Only shown once
        "key_data": key.data[0] if key.data else None
    }


@router.post("/keys/{key_id}/rotate")
async def rotate_api_key(key_id: str):
    """Rotate an API key"""
    import secrets
    
    # Get old key
    old_key = supabase.table("api_keys").select("*").eq("id", key_id).single().execute()
    
    if not old_key.data:
        raise HTTPException(status_code=404, detail="Key not found")
    
    # Create new key
    new_api_key = f"llm_obs_{secrets.token_urlsafe(32)}"
    key_prefix = new_api_key[:20]
    
    new_key = supabase.table("api_keys").insert({
        "organization_id": old_key.data["organization_id"],
        "created_by": old_key.data["created_by"],
        "key_name": old_key.data["key_name"] + " (rotated)",
        "api_key": new_api_key,
        "key_prefix": key_prefix,
        "rotated_from": key_id,
        "allowed_models": old_key.data.get("allowed_models"),
        "rate_limit_per_minute": old_key.data.get("rate_limit_per_minute")
    }).execute()
    
    # Deactivate old key
    supabase.table("api_keys").update({"is_active": False}).eq("id", key_id).execute()
    
    return {
        "success": True,
        "new_api_key": new_api_key,
        "key_data": new_key.data[0] if new_key.data else None
    }


@router.delete("/keys/{key_id}")
async def revoke_api_key(key_id: str):
    """Revoke an API key"""
    supabase.table("api_keys").update({"is_active": False}).eq("id", key_id).execute()
    
    return {"success": True}


# ============================================
# Webhooks
# ============================================

@router.get("/webhooks/deliveries")
async def get_webhook_deliveries(organization_id: str, limit: int = 50):
    """Get webhook delivery history"""
    deliveries = supabase.table("webhook_deliveries").select("*").eq("organization_id", organization_id).order("created_at", desc=True).limit(limit).execute()
    
    return {"deliveries": deliveries.data or []}


@router.post("/webhooks/test")
async def test_webhook(request: Request):
    """Test webhook configuration"""
    body = await request.json()
    
    await send_webhook(
        organization_id=body["organization_id"],
        event_type="test",
        payload={"message": "This is a test webhook", "timestamp": datetime.utcnow().isoformat()}
    )
    
    return {"success": True, "message": "Test webhook sent"}


# ============================================
# Alerts
# ============================================

@router.get("/alerts/rules")
async def get_alert_rules(organization_id: str):
    """Get all alert rules"""
    rules = supabase.table("alert_rules").select("*").eq("organization_id", organization_id).execute()
    
    return {"rules": rules.data or []}


@router.post("/alerts/rules")
async def create_alert_rule(request: Request):
    """Create a new alert rule"""
    body = await request.json()
    
    rule = supabase.table("alert_rules").insert({
        "organization_id": body["organization_id"],
        "rule_name": body["rule_name"],
        "alert_type": body["alert_type"],
        "threshold_value": body["threshold_value"],
        "threshold_type": body.get("threshold_type", "percentage"),
        "time_window_minutes": body.get("time_window_minutes", 60),
        "notify_webhook": body.get("notify_webhook", True),
        "notify_email": body.get("notify_email", True),
        "cooldown_minutes": body.get("cooldown_minutes", 60)
    }).execute()
    
    return {"success": True, "rule": rule.data[0] if rule.data else None}


# ============================================
# Billing & Invoices
# ============================================

@router.get("/billing/current")
async def get_current_billing(organization_id: str):
    """Get current month's billing information"""
    org = supabase.table("organizations").select("current_month_spend, current_month_requests, monthly_budget, monthly_request_limit, plan").eq("id", organization_id).single().execute()
    
    if not org.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return {
        "current_spend": float(org.data.get("current_month_spend", 0)),
        "current_requests": org.data.get("current_month_requests", 0),
        "monthly_budget": float(org.data.get("monthly_budget", 0)) if org.data.get("monthly_budget") else None,
        "monthly_request_limit": org.data.get("monthly_request_limit"),
        "plan": org.data.get("plan"),
        "budget_percentage": (float(org.data.get("current_month_spend", 0)) / float(org.data.get("monthly_budget", 1))) * 100 if org.data.get("monthly_budget") else 0,
        "quota_percentage": (org.data.get("current_month_requests", 0) / org.data.get("monthly_request_limit", 1)) * 100 if org.data.get("monthly_request_limit") else 0
    }


@router.get("/billing/invoices")
async def get_invoices(organization_id: str):
    """Get all invoices"""
    invoices = supabase.table("invoices").select("*").eq("organization_id", organization_id).order("created_at", desc=True).execute()
    
    return {"invoices": invoices.data or []}


@router.put("/billing/settings")
async def update_billing_settings(request: Request):
    """Update billing settings"""
    body = await request.json()
    
    supabase.table("organizations").update({
        "monthly_budget": body.get("monthly_budget"),
        "monthly_request_limit": body.get("monthly_request_limit"),
        "alert_email": body.get("alert_email"),
        "webhook_url": body.get("webhook_url"),
        "webhook_secret": body.get("webhook_secret")
    }).eq("id", body["organization_id"]).execute()
    
    return {"success": True}
