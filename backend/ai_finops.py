"""
AI FinOps & Advanced Observability
Complete visibility into AI model chains, agents, and workflows
Track every token, every dollar, every decision
"""

from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict
import json
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


@dataclass
class AgentCall:
    """Single agent or model call in a chain"""
    call_id: str
    agent_name: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    cost_usd: float
    parent_call_id: Optional[str]  # For chaining
    metadata: Dict[str, Any]


@dataclass
class WorkflowExecution:
    """Complete workflow execution with all agent calls"""
    workflow_id: str
    workflow_name: str
    user_id: str
    session_id: str
    start_time: datetime
    end_time: datetime
    total_calls: int
    total_tokens: int
    total_cost_usd: float
    agent_breakdown: Dict[str, Dict]  # Cost per agent
    model_breakdown: Dict[str, Dict]  # Cost per model
    call_chain: List[AgentCall]
    success: bool
    error: Optional[str]


@dataclass
class UserSession:
    """User session with all workflows"""
    session_id: str
    user_id: str
    start_time: datetime
    end_time: Optional[datetime]
    workflows: List[WorkflowExecution]
    total_cost_usd: float
    total_tokens: int
    total_calls: int


class AIFinOpsTracker:
    """
    Track AI usage across:
    - Individual model calls
    - Agent chains
    - Workflows
    - User sessions
    - Time periods
    """
    
    def __init__(self):
        self.active_sessions: Dict[str, UserSession] = {}
        self.active_workflows: Dict[str, WorkflowExecution] = {}
    
    # ============================================
    # TRACKING: Record Usage
    # ============================================
    
    async def track_agent_call(
        self,
        call_id: str,
        agent_name: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: float,
        workflow_id: str,
        parent_call_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        """Track a single agent/model call"""
        
        # Calculate cost
        cost = self._calculate_cost(model, input_tokens, output_tokens)
        
        # Create agent call record
        agent_call = AgentCall(
            call_id=call_id,
            agent_name=agent_name,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            cost_usd=cost,
            parent_call_id=parent_call_id,
            metadata=metadata or {}
        )
        
        # Add to workflow
        if workflow_id in self.active_workflows:
            workflow = self.active_workflows[workflow_id]
            workflow.call_chain.append(agent_call)
            workflow.total_calls += 1
            workflow.total_tokens += (input_tokens + output_tokens)
            workflow.total_cost_usd += cost
            
            # Update agent breakdown
            if agent_name not in workflow.agent_breakdown:
                workflow.agent_breakdown[agent_name] = {
                    "calls": 0,
                    "tokens": 0,
                    "cost": 0.0
                }
            workflow.agent_breakdown[agent_name]["calls"] += 1
            workflow.agent_breakdown[agent_name]["tokens"] += (input_tokens + output_tokens)
            workflow.agent_breakdown[agent_name]["cost"] += cost
            
            # Update model breakdown
            if model not in workflow.model_breakdown:
                workflow.model_breakdown[model] = {
                    "calls": 0,
                    "tokens": 0,
                    "cost": 0.0
                }
            workflow.model_breakdown[model]["calls"] += 1
            workflow.model_breakdown[model]["tokens"] += (input_tokens + output_tokens)
            workflow.model_breakdown[model]["cost"] += cost
        
        # Save to database
        await self._save_agent_call(agent_call, workflow_id)
        
        return agent_call
    
    async def start_workflow(
        self,
        workflow_id: str,
        workflow_name: str,
        user_id: str,
        session_id: str
    ):
        """Start tracking a workflow"""
        
        workflow = WorkflowExecution(
            workflow_id=workflow_id,
            workflow_name=workflow_name,
            user_id=user_id,
            session_id=session_id,
            start_time=datetime.utcnow(),
            end_time=None,
            total_calls=0,
            total_tokens=0,
            total_cost_usd=0.0,
            agent_breakdown={},
            model_breakdown={},
            call_chain=[],
            success=True,
            error=None
        )
        
        self.active_workflows[workflow_id] = workflow
        
        # Add to session
        if session_id not in self.active_sessions:
            await self.start_session(session_id, user_id)
        
        return workflow
    
    async def end_workflow(
        self,
        workflow_id: str,
        success: bool = True,
        error: Optional[str] = None
    ):
        """End workflow tracking"""
        
        if workflow_id not in self.active_workflows:
            return None
        
        workflow = self.active_workflows[workflow_id]
        workflow.end_time = datetime.utcnow()
        workflow.success = success
        workflow.error = error
        
        # Add to session
        session = self.active_sessions.get(workflow.session_id)
        if session:
            session.workflows.append(workflow)
            session.total_cost_usd += workflow.total_cost_usd
            session.total_tokens += workflow.total_tokens
            session.total_calls += workflow.total_calls
        
        # Save to database
        await self._save_workflow(workflow)
        
        # Remove from active
        del self.active_workflows[workflow_id]
        
        return workflow
    
    async def start_session(self, session_id: str, user_id: str):
        """Start user session"""
        
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            start_time=datetime.utcnow(),
            end_time=None,
            workflows=[],
            total_cost_usd=0.0,
            total_tokens=0,
            total_calls=0
        )
        
        self.active_sessions[session_id] = session
        return session
    
    async def end_session(self, session_id: str):
        """End user session"""
        
        if session_id not in self.active_sessions:
            return None
        
        session = self.active_sessions[session_id]
        session.end_time = datetime.utcnow()
        
        # Save to database
        await self._save_session(session)
        
        # Remove from active
        del self.active_sessions[session_id]
        
        return session
    
    # ============================================
    # ANALYTICS: Get Insights
    # ============================================
    
    async def get_agent_spend_breakdown(
        self,
        organization_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Dict]:
        """Which agents drive the most spend?"""
        
        result = supabase.table("agent_calls").select(
            "agent_name, model, input_tokens, output_tokens"
        ).eq("organization_id", organization_id).gte(
            "created_at", start_date.isoformat()
        ).lte("created_at", end_date.isoformat()).execute()
        
        breakdown = defaultdict(lambda: {
            "calls": 0,
            "tokens": 0,
            "cost": 0.0,
            "models_used": set()
        })
        
        for call in result.data:
            agent = call["agent_name"]
            model = call["model"]
            tokens = call["input_tokens"] + call["output_tokens"]
            cost = self._calculate_cost(model, call["input_tokens"], call["output_tokens"])
            
            breakdown[agent]["calls"] += 1
            breakdown[agent]["tokens"] += tokens
            breakdown[agent]["cost"] += cost
            breakdown[agent]["models_used"].add(model)
        
        # Convert sets to lists for JSON serialization
        for agent in breakdown:
            breakdown[agent]["models_used"] = list(breakdown[agent]["models_used"])
        
        # Sort by cost
        sorted_breakdown = dict(sorted(
            breakdown.items(),
            key=lambda x: x[1]["cost"],
            reverse=True
        ))
        
        return sorted_breakdown
    
    async def get_model_spend_breakdown(
        self,
        organization_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Dict]:
        """Which models drive the most spend?"""
        
        result = supabase.table("agent_calls").select(
            "model, input_tokens, output_tokens"
        ).eq("organization_id", organization_id).gte(
            "created_at", start_date.isoformat()
        ).lte("created_at", end_date.isoformat()).execute()
        
        breakdown = defaultdict(lambda: {
            "calls": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "cost": 0.0
        })
        
        for call in result.data:
            model = call["model"]
            input_tokens = call["input_tokens"]
            output_tokens = call["output_tokens"]
            cost = self._calculate_cost(model, input_tokens, output_tokens)
            
            breakdown[model]["calls"] += 1
            breakdown[model]["input_tokens"] += input_tokens
            breakdown[model]["output_tokens"] += output_tokens
            breakdown[model]["total_tokens"] += (input_tokens + output_tokens)
            breakdown[model]["cost"] += cost
        
        # Sort by cost
        sorted_breakdown = dict(sorted(
            breakdown.items(),
            key=lambda x: x[1]["cost"],
            reverse=True
        ))
        
        return sorted_breakdown
    
    async def get_user_session_costs(
        self,
        organization_id: str,
        start_date: datetime,
        end_date: datetime,
        limit: int = 100
    ) -> List[Dict]:
        """What does each user session cost?"""
        
        result = supabase.table("user_sessions").select(
            "*"
        ).eq("organization_id", organization_id).gte(
            "start_time", start_date.isoformat()
        ).lte("start_time", end_date.isoformat()).order(
            "total_cost_usd", desc=True
        ).limit(limit).execute()
        
        return result.data
    
    async def get_workflow_performance(
        self,
        organization_id: str,
        workflow_name: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """Analyze workflow performance and costs"""
        
        query = supabase.table("workflows").select("*").eq("organization_id", organization_id)
        
        if workflow_name:
            query = query.eq("workflow_name", workflow_name)
        if start_date:
            query = query.gte("start_time", start_date.isoformat())
        if end_date:
            query = query.lte("start_time", end_date.isoformat())
        
        result = query.execute()
        
        if not result.data:
            return {}
        
        # Aggregate stats
        total_executions = len(result.data)
        successful = sum(1 for w in result.data if w["success"])
        failed = total_executions - successful
        
        total_cost = sum(w["total_cost_usd"] for w in result.data)
        avg_cost = total_cost / total_executions
        
        total_tokens = sum(w["total_tokens"] for w in result.data)
        avg_tokens = total_tokens / total_executions
        
        total_calls = sum(w["total_calls"] for w in result.data)
        avg_calls = total_calls / total_executions
        
        durations = [
            (datetime.fromisoformat(w["end_time"]) - datetime.fromisoformat(w["start_time"])).total_seconds()
            for w in result.data if w["end_time"]
        ]
        avg_duration = sum(durations) / len(durations) if durations else 0
        
        return {
            "workflow_name": workflow_name or "All Workflows",
            "total_executions": total_executions,
            "successful": successful,
            "failed": failed,
            "success_rate": successful / total_executions,
            "total_cost_usd": total_cost,
            "avg_cost_per_execution": avg_cost,
            "total_tokens": total_tokens,
            "avg_tokens_per_execution": avg_tokens,
            "total_calls": total_calls,
            "avg_calls_per_execution": avg_calls,
            "avg_duration_seconds": avg_duration
        }
    
    async def get_call_chain_analysis(
        self,
        workflow_id: str
    ) -> Dict:
        """Analyze the call chain for a workflow"""
        
        result = supabase.table("agent_calls").select(
            "*"
        ).eq("workflow_id", workflow_id).order("created_at").execute()
        
        if not result.data:
            return {}
        
        # Build call tree
        calls_by_id = {call["call_id"]: call for call in result.data}
        root_calls = [call for call in result.data if not call.get("parent_call_id")]
        
        def build_tree(call):
            children = [
                build_tree(c) for c in result.data
                if c.get("parent_call_id") == call["call_id"]
            ]
            return {
                "call_id": call["call_id"],
                "agent_name": call["agent_name"],
                "model": call["model"],
                "tokens": call["input_tokens"] + call["output_tokens"],
                "cost": call["cost_usd"],
                "latency_ms": call["latency_ms"],
                "children": children
            }
        
        call_tree = [build_tree(call) for call in root_calls]
        
        # Calculate depth
        def get_depth(node, current_depth=0):
            if not node.get("children"):
                return current_depth
            return max(get_depth(child, current_depth + 1) for child in node["children"])
        
        max_depth = max(get_depth(node) for node in call_tree) if call_tree else 0
        
        # Calculate critical path (most expensive)
        def get_critical_path(node, path=[]):
            current_path = path + [node]
            if not node.get("children"):
                return current_path
            return max(
                (get_critical_path(child, current_path) for child in node["children"]),
                key=lambda p: sum(n["cost"] for n in p)
            )
        
        critical_path = max(
            (get_critical_path(node) for node in call_tree),
            key=lambda p: sum(n["cost"] for n in p)
        ) if call_tree else []
        
        return {
            "workflow_id": workflow_id,
            "total_calls": len(result.data),
            "max_chain_depth": max_depth,
            "call_tree": call_tree,
            "critical_path": [
                {
                    "agent": node["agent_name"],
                    "cost": node["cost"],
                    "tokens": node["tokens"]
                }
                for node in critical_path
            ],
            "critical_path_cost": sum(node["cost"] for node in critical_path)
        }
    
    async def get_optimization_opportunities(
        self,
        organization_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Find opportunities to optimize costs"""
        
        opportunities = []
        
        # 1. Expensive agents
        agent_breakdown = await self.get_agent_spend_breakdown(
            organization_id, start_date, end_date
        )
        
        for agent, stats in list(agent_breakdown.items())[:5]:
            if stats["cost"] > 10.0:  # More than $10
                opportunities.append({
                    "type": "expensive_agent",
                    "priority": "high",
                    "agent": agent,
                    "current_cost": stats["cost"],
                    "recommendation": f"Agent '{agent}' costs ${stats['cost']:.2f}. Consider: 1) Using cheaper models, 2) Caching results, 3) Reducing calls",
                    "potential_savings": stats["cost"] * 0.3  # 30% savings estimate
                })
        
        # 2. Expensive models
        model_breakdown = await self.get_model_spend_breakdown(
            organization_id, start_date, end_date
        )
        
        for model, stats in model_breakdown.items():
            if "gpt-4" in model.lower() and stats["cost"] > 5.0:
                cheaper_model = "gpt-4o-mini" if "gpt-4o" in model else "gpt-3.5-turbo"
                opportunities.append({
                    "type": "expensive_model",
                    "priority": "medium",
                    "model": model,
                    "current_cost": stats["cost"],
                    "recommendation": f"Model '{model}' costs ${stats['cost']:.2f}. Consider switching to '{cheaper_model}' for non-critical tasks",
                    "potential_savings": stats["cost"] * 0.7  # 70% savings
                })
        
        # 3. Repeated calls (caching opportunity)
        # TODO: Implement similarity detection for repeated prompts
        
        # 4. Failed workflows (wasted cost)
        workflows = supabase.table("workflows").select(
            "*"
        ).eq("organization_id", organization_id).eq(
            "success", False
        ).gte("start_time", start_date.isoformat()).lte(
            "start_time", end_date.isoformat()
        ).execute()
        
        if workflows.data:
            failed_cost = sum(w["total_cost_usd"] for w in workflows.data)
            if failed_cost > 1.0:
                opportunities.append({
                    "type": "failed_workflows",
                    "priority": "high",
                    "count": len(workflows.data),
                    "wasted_cost": failed_cost,
                    "recommendation": f"{len(workflows.data)} workflows failed, wasting ${failed_cost:.2f}. Investigate error handling and retry logic",
                    "potential_savings": failed_cost
                })
        
        # Sort by potential savings
        opportunities.sort(key=lambda x: x.get("potential_savings", 0), reverse=True)
        
        return opportunities
    
    async def get_cost_attribution(
        self,
        organization_id: str,
        start_date: datetime,
        end_date: datetime,
        group_by: str = "user"  # user, workflow, agent, model, session
    ) -> Dict:
        """Attribute costs to different dimensions"""
        
        if group_by == "user":
            result = supabase.table("workflows").select(
                "user_id, total_cost_usd, total_tokens"
            ).eq("organization_id", organization_id).gte(
                "start_time", start_date.isoformat()
            ).lte("start_time", end_date.isoformat()).execute()
            
            attribution = defaultdict(lambda: {"cost": 0.0, "tokens": 0})
            for row in result.data:
                attribution[row["user_id"]]["cost"] += row["total_cost_usd"]
                attribution[row["user_id"]]["tokens"] += row["total_tokens"]
        
        elif group_by == "workflow":
            result = supabase.table("workflows").select(
                "workflow_name, total_cost_usd, total_tokens"
            ).eq("organization_id", organization_id).gte(
                "start_time", start_date.isoformat()
            ).lte("start_time", end_date.isoformat()).execute()
            
            attribution = defaultdict(lambda: {"cost": 0.0, "tokens": 0, "executions": 0})
            for row in result.data:
                attribution[row["workflow_name"]]["cost"] += row["total_cost_usd"]
                attribution[row["workflow_name"]]["tokens"] += row["total_tokens"]
                attribution[row["workflow_name"]]["executions"] += 1
        
        elif group_by == "agent":
            attribution = await self.get_agent_spend_breakdown(
                organization_id, start_date, end_date
            )
        
        elif group_by == "model":
            attribution = await self.get_model_spend_breakdown(
                organization_id, start_date, end_date
            )
        
        else:
            attribution = {}
        
        return dict(attribution)
    
    # ============================================
    # HELPERS
    # ============================================
    
    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost based on model pricing"""
        
        # Pricing per 1M tokens
        pricing = {
            "gpt-4": {"input": 30.0, "output": 60.0},
            "gpt-4-turbo": {"input": 10.0, "output": 30.0},
            "gpt-4o": {"input": 5.0, "output": 15.0},
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
            "claude-3-opus": {"input": 15.0, "output": 75.0},
            "claude-3-sonnet": {"input": 3.0, "output": 15.0},
            "claude-3-haiku": {"input": 0.25, "output": 1.25},
        }
        
        # Find matching pricing
        model_lower = model.lower()
        for key, prices in pricing.items():
            if key in model_lower:
                input_cost = (input_tokens / 1_000_000) * prices["input"]
                output_cost = (output_tokens / 1_000_000) * prices["output"]
                return input_cost + output_cost
        
        # Default pricing if model not found
        return ((input_tokens + output_tokens) / 1_000_000) * 1.0
    
    async def _save_agent_call(self, call: AgentCall, workflow_id: str):
        """Save agent call to database"""
        try:
            supabase.table("agent_calls").insert({
                "call_id": call.call_id,
                "workflow_id": workflow_id,
                "agent_name": call.agent_name,
                "model": call.model,
                "input_tokens": call.input_tokens,
                "output_tokens": call.output_tokens,
                "latency_ms": call.latency_ms,
                "cost_usd": call.cost_usd,
                "parent_call_id": call.parent_call_id,
                "metadata": call.metadata,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"Error saving agent call: {e}")
    
    async def _save_workflow(self, workflow: WorkflowExecution):
        """Save workflow to database"""
        try:
            supabase.table("workflows").insert({
                "workflow_id": workflow.workflow_id,
                "workflow_name": workflow.workflow_name,
                "user_id": workflow.user_id,
                "session_id": workflow.session_id,
                "start_time": workflow.start_time.isoformat(),
                "end_time": workflow.end_time.isoformat() if workflow.end_time else None,
                "total_calls": workflow.total_calls,
                "total_tokens": workflow.total_tokens,
                "total_cost_usd": workflow.total_cost_usd,
                "agent_breakdown": workflow.agent_breakdown,
                "model_breakdown": workflow.model_breakdown,
                "success": workflow.success,
                "error": workflow.error
            }).execute()
        except Exception as e:
            print(f"Error saving workflow: {e}")
    
    async def _save_session(self, session: UserSession):
        """Save session to database"""
        try:
            supabase.table("user_sessions").insert({
                "session_id": session.session_id,
                "user_id": session.user_id,
                "start_time": session.start_time.isoformat(),
                "end_time": session.end_time.isoformat() if session.end_time else None,
                "total_cost_usd": session.total_cost_usd,
                "total_tokens": session.total_tokens,
                "total_calls": session.total_calls,
                "workflow_count": len(session.workflows)
            }).execute()
        except Exception as e:
            print(f"Error saving session: {e}")


# Global tracker instance
tracker = AIFinOpsTracker()
