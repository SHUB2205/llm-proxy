"""
Enterprise Features Module
- Usage analytics and billing
- Team management
- Custom detection rules
- Webhook notifications
- Rate limiting
- Cost optimization
"""

import httpx
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from database import supabase


# ============================================
# Usage Analytics & Billing
# ============================================

async def track_daily_usage(organization_id: str, run_data: Dict):
    """Aggregate usage data daily for analytics"""
    today = datetime.utcnow().date()
    
    # Get or create daily usage record
    result = supabase.table("daily_usage").select("*").eq("organization_id", organization_id).eq("date", str(today)).execute()
    
    if result.data:
        # Update existing
        current = result.data[0]
        supabase.table("daily_usage").update({
            "total_requests": current["total_requests"] + 1,
            "successful_requests": current["successful_requests"] + (1 if run_data.get("status") == "success" else 0),
            "failed_requests": current["failed_requests"] + (1 if run_data.get("status") == "error" else 0),
            "flagged_requests": current["flagged_requests"] + (1 if run_data.get("status") == "flagged" else 0),
            "total_tokens": current["total_tokens"] + run_data.get("total_tokens", 0),
            "prompt_tokens": current["prompt_tokens"] + run_data.get("prompt_tokens", 0),
            "completion_tokens": current["completion_tokens"] + run_data.get("completion_tokens", 0),
            "total_cost": float(current["total_cost"]) + run_data.get("cost_usd", 0),
        }).eq("id", current["id"]).execute()
    else:
        # Create new
        supabase.table("daily_usage").insert({
            "organization_id": organization_id,
            "date": str(today),
            "total_requests": 1,
            "successful_requests": 1 if run_data.get("status") == "success" else 0,
            "failed_requests": 1 if run_data.get("status") == "error" else 0,
            "flagged_requests": 1 if run_data.get("status") == "flagged" else 0,
            "total_tokens": run_data.get("total_tokens", 0),
            "prompt_tokens": run_data.get("prompt_tokens", 0),
            "completion_tokens": run_data.get("completion_tokens", 0),
            "total_cost": run_data.get("cost_usd", 0),
        }).execute()


async def check_quota_and_budget(organization_id: str) -> Dict:
    """Check if organization is within quota and budget limits"""
    org = supabase.table("organizations").select("*").eq("id", organization_id).single().execute()
    
    if not org.data:
        return {"allowed": False, "reason": "Organization not found"}
    
    org_data = org.data
    
    # Check request quota
    if org_data.get("monthly_request_limit"):
        if org_data.get("current_month_requests", 0) >= org_data["monthly_request_limit"]:
            return {
                "allowed": False,
                "reason": "Monthly request quota exceeded",
                "current": org_data["current_month_requests"],
                "limit": org_data["monthly_request_limit"]
            }
    
    # Check budget
    if org_data.get("monthly_budget"):
        if org_data.get("current_month_spend", 0) >= org_data["monthly_budget"]:
            return {
                "allowed": False,
                "reason": "Monthly budget exceeded",
                "current": org_data["current_month_spend"],
                "limit": org_data["monthly_budget"]
            }
    
    return {
        "allowed": True,
        "remaining_requests": org_data.get("monthly_request_limit", float('inf')) - org_data.get("current_month_requests", 0),
        "remaining_budget": org_data.get("monthly_budget", float('inf')) - org_data.get("current_month_spend", 0)
    }


async def generate_cost_recommendations(organization_id: str) -> List[Dict]:
    """Generate cost optimization recommendations"""
    recommendations = []
    
    # Get last 30 days usage
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).date()
    usage = supabase.table("daily_usage").select("*").eq("organization_id", organization_id).gte("date", str(thirty_days_ago)).execute()
    
    if not usage.data:
        return recommendations
    
    # Calculate totals
    total_cost = sum(float(day.get("total_cost", 0)) for day in usage.data)
    total_requests = sum(day.get("total_requests", 0) for day in usage.data)
    avg_cost_per_request = total_cost / total_requests if total_requests > 0 else 0
    
    # Recommendation 1: Model downgrade if using expensive models
    if avg_cost_per_request > 0.01:  # More than 1 cent per request
        recommendations.append({
            "type": "model_downgrade",
            "title": "Consider using GPT-4o-mini instead of GPT-4",
            "description": f"Your average cost per request is ${avg_cost_per_request:.4f}. Switching to GPT-4o-mini could reduce costs by up to 90%.",
            "estimated_monthly_savings": total_cost * 0.9,
            "confidence_score": 0.85
        })
    
    # Recommendation 2: High flag rate
    total_flagged = sum(day.get("flagged_requests", 0) for day in usage.data)
    flag_rate = total_flagged / total_requests if total_requests > 0 else 0
    
    if flag_rate > 0.1:  # More than 10% flagged
        recommendations.append({
            "type": "prompt_optimization",
            "title": "Optimize prompts to reduce hallucinations",
            "description": f"{flag_rate*100:.1f}% of your requests are flagged. Better prompts could reduce retries and costs.",
            "estimated_monthly_savings": total_cost * flag_rate * 0.5,  # Assume 50% of flagged requests are retried
            "confidence_score": 0.75
        })
    
    # Recommendation 3: Caching opportunities
    if total_requests > 1000:
        recommendations.append({
            "type": "caching",
            "title": "Implement response caching",
            "description": "With high request volume, caching similar requests could save 20-30% on costs.",
            "estimated_monthly_savings": total_cost * 0.25,
            "confidence_score": 0.70
        })
    
    return recommendations


# ============================================
# Team Management
# ============================================

async def invite_team_member(organization_id: str, email: str, role: str, invited_by: str) -> Dict:
    """Invite a new team member"""
    member = supabase.table("team_members").insert({
        "organization_id": organization_id,
        "email": email,
        "role": role,
        "invited_by": invited_by,
        "is_active": False  # Becomes active when they accept
    }).execute()
    
    # TODO: Send invitation email
    
    return member.data[0] if member.data else None


async def check_permission(member_id: str, permission: str) -> bool:
    """Check if team member has specific permission"""
    member = supabase.table("team_members").select("*").eq("id", member_id).single().execute()
    
    if not member.data:
        return False
    
    permission_map = {
        "view_analytics": "can_view_analytics",
        "manage_keys": "can_manage_keys",
        "manage_team": "can_manage_team",
        "manage_billing": "can_manage_billing",
        "resolve_flags": "can_resolve_flags"
    }
    
    return member.data.get(permission_map.get(permission), False)


# ============================================
# Custom Detection Rules
# ============================================

async def apply_custom_rules(organization_id: str, response_text: str) -> List[Dict]:
    """Apply organization's custom detection rules"""
    rules = supabase.table("custom_rules").select("*").eq("organization_id", organization_id).eq("is_active", True).execute()
    
    if not rules.data:
        return []
    
    detected_flags = []
    
    for rule in rules.data:
        rule_type = rule["rule_type"]
        config = rule["config"]
        
        if rule_type == "keyword":
            # Check for keywords
            keywords = config.get("keywords", [])
            for keyword in keywords:
                if keyword.lower() in response_text.lower():
                    detected_flags.append({
                        "rule_id": rule["id"],
                        "rule_name": rule["rule_name"],
                        "flag_type": "custom_keyword",
                        "severity": rule["severity"],
                        "description": f"Detected keyword: {keyword}",
                        "matched_text": keyword
                    })
                    
                    # Update rule stats
                    supabase.table("custom_rules").update({
                        "times_triggered": rule["times_triggered"] + 1,
                        "last_triggered_at": datetime.utcnow().isoformat()
                    }).eq("id", rule["id"]).execute()
        
        elif rule_type == "regex":
            # Check regex pattern
            import re
            pattern = config.get("regex")
            if pattern and re.search(pattern, response_text):
                detected_flags.append({
                    "rule_id": rule["id"],
                    "rule_name": rule["rule_name"],
                    "flag_type": "custom_regex",
                    "severity": rule["severity"],
                    "description": rule.get("description", "Custom regex pattern matched")
                })
                
                supabase.table("custom_rules").update({
                    "times_triggered": rule["times_triggered"] + 1,
                    "last_triggered_at": datetime.utcnow().isoformat()
                }).eq("id", rule["id"]).execute()
    
    return detected_flags


# ============================================
# Webhook Notifications
# ============================================

async def send_webhook(organization_id: str, event_type: str, payload: Dict):
    """Send webhook notification"""
    org = supabase.table("organizations").select("webhook_url, webhook_secret").eq("id", organization_id).single().execute()
    
    if not org.data or not org.data.get("webhook_url"):
        return
    
    webhook_url = org.data["webhook_url"]
    webhook_secret = org.data.get("webhook_secret")
    
    headers = {
        "Content-Type": "application/json",
        "X-LLM-Obs-Event": event_type,
        "X-LLM-Obs-Timestamp": datetime.utcnow().isoformat()
    }
    
    if webhook_secret:
        import hmac
        import hashlib
        signature = hmac.new(
            webhook_secret.encode(),
            json.dumps(payload).encode(),
            hashlib.sha256
        ).hexdigest()
        headers["X-LLM-Obs-Signature"] = signature
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json=payload,
                headers=headers,
                timeout=10.0
            )
            
            # Log delivery
            supabase.table("webhook_deliveries").insert({
                "organization_id": organization_id,
                "event_type": event_type,
                "payload": payload,
                "webhook_url": webhook_url,
                "status_code": response.status_code,
                "response_body": response.text[:1000],  # Limit size
                "delivered_at": datetime.utcnow().isoformat()
            }).execute()
            
    except Exception as e:
        # Log failed delivery
        supabase.table("webhook_deliveries").insert({
            "organization_id": organization_id,
            "event_type": event_type,
            "payload": payload,
            "webhook_url": webhook_url,
            "status_code": 0,
            "response_body": str(e),
        }).execute()


# ============================================
# Alert System
# ============================================

async def check_alert_rules(organization_id: str, run_data: Dict):
    """Check if any alert rules are triggered"""
    rules = supabase.table("alert_rules").select("*").eq("organization_id", organization_id).eq("is_active", True).execute()
    
    if not rules.data:
        return
    
    for rule in rules.data:
        alert_type = rule["alert_type"]
        should_alert = False
        alert_message = ""
        
        if alert_type == "budget_threshold":
            org = supabase.table("organizations").select("current_month_spend, monthly_budget").eq("id", organization_id).single().execute()
            if org.data:
                spend_percentage = (org.data["current_month_spend"] / org.data["monthly_budget"]) * 100
                if spend_percentage >= rule["threshold_value"]:
                    should_alert = True
                    alert_message = f"Budget threshold reached: {spend_percentage:.1f}% of monthly budget used"
        
        elif alert_type == "quota_threshold":
            org = supabase.table("organizations").select("current_month_requests, monthly_request_limit").eq("id", organization_id).single().execute()
            if org.data:
                quota_percentage = (org.data["current_month_requests"] / org.data["monthly_request_limit"]) * 100
                if quota_percentage >= rule["threshold_value"]:
                    should_alert = True
                    alert_message = f"Quota threshold reached: {quota_percentage:.1f}% of monthly requests used"
        
        elif alert_type == "high_flag_rate":
            # Check flag rate in last hour
            one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
            recent_runs = supabase.table("runs").select("status").eq("user_id", organization_id).gte("created_at", one_hour_ago).execute()
            if recent_runs.data:
                flagged = len([r for r in recent_runs.data if r.get("status") == "flagged"])
                flag_rate = (flagged / len(recent_runs.data)) * 100
                if flag_rate >= rule["threshold_value"]:
                    should_alert = True
                    alert_message = f"High flag rate detected: {flag_rate:.1f}% in last hour"
        
        if should_alert:
            # Check cooldown
            if rule.get("last_triggered_at"):
                last_triggered = datetime.fromisoformat(rule["last_triggered_at"])
                if datetime.utcnow() - last_triggered < timedelta(minutes=rule.get("cooldown_minutes", 60)):
                    continue  # Still in cooldown
            
            # Send alert
            if rule.get("notify_webhook"):
                await send_webhook(organization_id, "alert_triggered", {
                    "alert_type": alert_type,
                    "message": alert_message,
                    "rule_name": rule["rule_name"],
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Update last triggered
            supabase.table("alert_rules").update({
                "last_triggered_at": datetime.utcnow().isoformat()
            }).eq("id", rule["id"]).execute()


# ============================================
# Rate Limiting
# ============================================

async def check_rate_limit(api_key_id: str) -> bool:
    """Check if API key is within rate limit"""
    key = supabase.table("api_keys").select("rate_limit_per_minute").eq("id", api_key_id).single().execute()
    
    if not key.data or not key.data.get("rate_limit_per_minute"):
        return True  # No rate limit set
    
    rate_limit = key.data["rate_limit_per_minute"]
    one_minute_ago = (datetime.utcnow() - timedelta(minutes=1)).isoformat()
    
    # Count requests in last minute
    recent_requests = supabase.table("runs").select("id", count="exact").eq("proxy_key_id", api_key_id).gte("created_at", one_minute_ago).execute()
    
    return recent_requests.count < rate_limit
