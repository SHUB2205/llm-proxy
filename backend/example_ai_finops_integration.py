"""
Example: How to integrate AI FinOps tracking into your application

This shows how to instrument your AI agents and workflows for complete visibility
"""

import asyncio
import uuid
from ai_finops import tracker
import httpx


# ============================================
# Example 1: Simple Agent Call
# ============================================

async def example_simple_agent_call():
    """Track a single agent call"""
    
    # Start a workflow
    workflow_id = str(uuid.uuid4())
    await tracker.start_workflow(
        workflow_id=workflow_id,
        workflow_name="Simple Task",
        user_id="user_123",
        session_id="session_456"
    )
    
    # Make an agent call (your actual AI call here)
    # ... your code that calls OpenAI/Anthropic/etc ...
    
    # Track the call
    await tracker.track_agent_call(
        call_id=str(uuid.uuid4()),
        agent_name="SimpleAgent",
        model="gpt-4o-mini",
        input_tokens=100,
        output_tokens=50,
        latency_ms=1234.5,
        workflow_id=workflow_id
    )
    
    # End workflow
    workflow = await tracker.end_workflow(workflow_id, success=True)
    
    print(f"✅ Workflow completed!")
    print(f"   Cost: ${workflow.total_cost_usd:.4f}")
    print(f"   Tokens: {workflow.total_tokens}")


# ============================================
# Example 2: Multi-Agent Chain
# ============================================

async def example_multi_agent_chain():
    """Track a chain of agent calls"""
    
    # Start workflow
    workflow_id = str(uuid.uuid4())
    await tracker.start_workflow(
        workflow_id=workflow_id,
        workflow_name="Generate Report",
        user_id="user_123",
        session_id="session_456"
    )
    
    # Agent 1: Orchestrator (parent)
    orchestrator_call_id = str(uuid.uuid4())
    await tracker.track_agent_call(
        call_id=orchestrator_call_id,
        agent_name="Orchestrator",
        model="gpt-4o",
        input_tokens=500,
        output_tokens=200,
        latency_ms=2000,
        workflow_id=workflow_id,
        parent_call_id=None  # Root call
    )
    
    # Agent 2: DataFetcher (child of Orchestrator)
    data_fetcher_call_id = str(uuid.uuid4())
    await tracker.track_agent_call(
        call_id=data_fetcher_call_id,
        agent_name="DataFetcher",
        model="gpt-4o-mini",
        input_tokens=200,
        output_tokens=100,
        latency_ms=1000,
        workflow_id=workflow_id,
        parent_call_id=orchestrator_call_id  # Child of Orchestrator
    )
    
    # Agent 3: Analyzer (child of Orchestrator)
    analyzer_call_id = str(uuid.uuid4())
    await tracker.track_agent_call(
        call_id=analyzer_call_id,
        agent_name="Analyzer",
        model="gpt-4o",
        input_tokens=1000,
        output_tokens=500,
        latency_ms=3000,
        workflow_id=workflow_id,
        parent_call_id=orchestrator_call_id  # Child of Orchestrator
    )
    
    # Agent 4: Summarizer (child of Analyzer)
    await tracker.track_agent_call(
        call_id=str(uuid.uuid4()),
        agent_name="Summarizer",
        model="gpt-4o-mini",
        input_tokens=500,
        output_tokens=200,
        latency_ms=1500,
        workflow_id=workflow_id,
        parent_call_id=analyzer_call_id  # Child of Analyzer
    )
    
    # End workflow
    workflow = await tracker.end_workflow(workflow_id, success=True)
    
    print(f"✅ Multi-agent workflow completed!")
    print(f"   Total Cost: ${workflow.total_cost_usd:.4f}")
    print(f"   Total Tokens: {workflow.total_tokens}")
    print(f"   Total Calls: {workflow.total_calls}")
    print(f"   Agent Breakdown: {workflow.agent_breakdown}")


# ============================================
# Example 3: User Session with Multiple Workflows
# ============================================

async def example_user_session():
    """Track a complete user session"""
    
    # Start session
    session_id = str(uuid.uuid4())
    user_id = "user_123"
    await tracker.start_session(session_id, user_id)
    
    # Workflow 1: Generate Report
    workflow1_id = str(uuid.uuid4())
    await tracker.start_workflow(
        workflow_id=workflow1_id,
        workflow_name="Generate Report",
        user_id=user_id,
        session_id=session_id
    )
    
    await tracker.track_agent_call(
        call_id=str(uuid.uuid4()),
        agent_name="ReportGenerator",
        model="gpt-4o",
        input_tokens=1000,
        output_tokens=500,
        latency_ms=2500,
        workflow_id=workflow1_id
    )
    
    await tracker.end_workflow(workflow1_id, success=True)
    
    # Workflow 2: Analyze Data
    workflow2_id = str(uuid.uuid4())
    await tracker.start_workflow(
        workflow_id=workflow2_id,
        workflow_name="Analyze Data",
        user_id=user_id,
        session_id=session_id
    )
    
    await tracker.track_agent_call(
        call_id=str(uuid.uuid4()),
        agent_name="DataAnalyzer",
        model="gpt-4o-mini",
        input_tokens=500,
        output_tokens=250,
        latency_ms=1500,
        workflow_id=workflow2_id
    )
    
    await tracker.end_workflow(workflow2_id, success=True)
    
    # End session
    session = await tracker.end_session(session_id)
    
    print(f"✅ User session completed!")
    print(f"   Session Cost: ${session.total_cost_usd:.4f}")
    print(f"   Workflows: {len(session.workflows)}")
    print(f"   Total Tokens: {session.total_tokens}")


# ============================================
# Example 4: Integration with Existing Code
# ============================================

class MyAIAgent:
    """Example of integrating tracking into your existing agent"""
    
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model
    
    async def run(self, prompt: str, workflow_id: str, parent_call_id: str = None):
        """Run agent with tracking"""
        
        # Your existing AI call
        start_time = asyncio.get_event_loop().time()
        
        # Simulate AI call (replace with your actual code)
        await asyncio.sleep(1)  # Simulate latency
        response = "AI response here"
        input_tokens = len(prompt.split()) * 2  # Rough estimate
        output_tokens = len(response.split()) * 2
        
        end_time = asyncio.get_event_loop().time()
        latency_ms = (end_time - start_time) * 1000
        
        # Track the call
        call_id = str(uuid.uuid4())
        await tracker.track_agent_call(
            call_id=call_id,
            agent_name=self.name,
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            workflow_id=workflow_id,
            parent_call_id=parent_call_id,
            metadata={"prompt_length": len(prompt)}
        )
        
        return response, call_id


async def example_integrated_agent():
    """Use the integrated agent"""
    
    # Start workflow
    workflow_id = str(uuid.uuid4())
    await tracker.start_workflow(
        workflow_id=workflow_id,
        workflow_name="Integrated Example",
        user_id="user_123",
        session_id="session_456"
    )
    
    # Use your agent
    agent = MyAIAgent("MyAgent", "gpt-4o-mini")
    response, call_id = await agent.run(
        prompt="Analyze this data",
        workflow_id=workflow_id
    )
    
    print(f"Agent response: {response}")
    
    # End workflow
    await tracker.end_workflow(workflow_id, success=True)


# ============================================
# Example 5: Query Analytics
# ============================================

async def example_query_analytics():
    """Query analytics after tracking"""
    
    from datetime import datetime, timedelta
    
    organization_id = "org_123"
    start_date = datetime.utcnow() - timedelta(days=30)
    end_date = datetime.utcnow()
    
    # Get agent breakdown
    agent_breakdown = await tracker.get_agent_spend_breakdown(
        organization_id, start_date, end_date
    )
    
    print("\n📊 Agent Spend Breakdown:")
    for agent, stats in agent_breakdown.items():
        print(f"   {agent}:")
        print(f"      Calls: {stats['calls']}")
        print(f"      Cost: ${stats['cost']:.2f}")
        print(f"      Models: {stats['models_used']}")
    
    # Get model breakdown
    model_breakdown = await tracker.get_model_spend_breakdown(
        organization_id, start_date, end_date
    )
    
    print("\n📊 Model Spend Breakdown:")
    for model, stats in model_breakdown.items():
        print(f"   {model}:")
        print(f"      Calls: {stats['calls']}")
        print(f"      Cost: ${stats['cost']:.2f}")
        print(f"      Tokens: {stats['total_tokens']:,}")
    
    # Get optimization opportunities
    opportunities = await tracker.get_optimization_opportunities(
        organization_id, start_date, end_date
    )
    
    print("\n💡 Optimization Opportunities:")
    for opp in opportunities[:3]:  # Top 3
        print(f"   {opp['type']} (Priority: {opp['priority']})")
        print(f"      {opp['recommendation']}")
        print(f"      Potential Savings: ${opp['potential_savings']:.2f}")


# ============================================
# Example 6: Real-Time Monitoring
# ============================================

async def example_real_time_monitoring():
    """Monitor costs in real-time"""
    
    workflow_id = str(uuid.uuid4())
    await tracker.start_workflow(
        workflow_id=workflow_id,
        workflow_name="Monitored Workflow",
        user_id="user_123",
        session_id="session_456"
    )
    
    # Track multiple calls
    total_cost = 0.0
    budget_limit = 0.50  # $0.50 budget
    
    for i in range(10):
        await tracker.track_agent_call(
            call_id=str(uuid.uuid4()),
            agent_name=f"Agent_{i}",
            model="gpt-4o-mini",
            input_tokens=100,
            output_tokens=50,
            latency_ms=1000,
            workflow_id=workflow_id
        )
        
        # Check current workflow cost
        if workflow_id in tracker.active_workflows:
            workflow = tracker.active_workflows[workflow_id]
            total_cost = workflow.total_cost_usd
            
            print(f"Call {i+1}: Current cost ${total_cost:.4f}")
            
            # Budget check
            if total_cost > budget_limit:
                print(f"⚠️  Budget exceeded! Stopping workflow.")
                await tracker.end_workflow(
                    workflow_id, 
                    success=False, 
                    error="Budget limit exceeded"
                )
                break
    
    if workflow_id in tracker.active_workflows:
        await tracker.end_workflow(workflow_id, success=True)


# ============================================
# Example 7: API Integration
# ============================================

async def example_api_integration():
    """Use the API endpoints directly"""
    
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        # Start workflow via API
        response = await client.post(
            f"{base_url}/v1/finops/workflows/start",
            json={
                "workflow_name": "API Example",
                "user_id": "user_123",
                "session_id": "session_456",
                "organization_id": "org_123"
            }
        )
        workflow_id = response.json()["workflow_id"]
        print(f"Started workflow: {workflow_id}")
        
        # Track agent call via API
        response = await client.post(
            f"{base_url}/v1/finops/calls/track",
            json={
                "agent_name": "APIAgent",
                "model": "gpt-4o-mini",
                "input_tokens": 100,
                "output_tokens": 50,
                "latency_ms": 1234.5,
                "workflow_id": workflow_id,
                "organization_id": "org_123"
            }
        )
        print(f"Tracked call: ${response.json()['cost_usd']:.4f}")
        
        # End workflow via API
        response = await client.post(
            f"{base_url}/v1/finops/workflows/end",
            json={
                "workflow_id": workflow_id,
                "success": True
            }
        )
        print(f"Workflow cost: ${response.json()['total_cost_usd']:.4f}")
        
        # Get analytics via API
        response = await client.get(
            f"{base_url}/v1/finops/analytics/agents",
            params={"organization_id": "org_123"}
        )
        print(f"Agent breakdown: {response.json()}")


# ============================================
# Run Examples
# ============================================

async def main():
    """Run all examples"""
    
    print("=" * 60)
    print("AI FinOps Integration Examples")
    print("=" * 60)
    
    print("\n1. Simple Agent Call")
    await example_simple_agent_call()
    
    print("\n2. Multi-Agent Chain")
    await example_multi_agent_chain()
    
    print("\n3. User Session")
    await example_user_session()
    
    print("\n4. Integrated Agent")
    await example_integrated_agent()
    
    print("\n5. Query Analytics")
    await example_query_analytics()
    
    print("\n6. Real-Time Monitoring")
    await example_real_time_monitoring()
    
    # Uncomment to test API integration (requires server running)
    # print("\n7. API Integration")
    # await example_api_integration()
    
    print("\n" + "=" * 60)
    print("✅ All examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
