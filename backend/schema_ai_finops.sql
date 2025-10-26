-- AI FinOps & Advanced Observability Schema
-- Track agents, chains, workflows, and sessions

-- ============================================
-- Agent Calls (Individual model/agent calls)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id TEXT UNIQUE NOT NULL,
    workflow_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    
    -- Call details
    agent_name TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    latency_ms FLOAT NOT NULL,
    cost_usd DECIMAL(10, 6) NOT NULL,
    
    -- Chain tracking
    parent_call_id TEXT,  -- For nested calls
    depth INTEGER DEFAULT 0,  -- Depth in call chain
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    prompt_hash TEXT,  -- For caching detection
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT fk_parent_call FOREIGN KEY (parent_call_id) REFERENCES agent_calls(call_id)
);

CREATE INDEX idx_agent_calls_workflow ON agent_calls(workflow_id);
CREATE INDEX idx_agent_calls_org ON agent_calls(organization_id);
CREATE INDEX idx_agent_calls_agent ON agent_calls(agent_name);
CREATE INDEX idx_agent_calls_model ON agent_calls(model);
CREATE INDEX idx_agent_calls_created ON agent_calls(created_at);
CREATE INDEX idx_agent_calls_parent ON agent_calls(parent_call_id);
CREATE INDEX idx_agent_calls_prompt_hash ON agent_calls(prompt_hash);

-- ============================================
-- Workflows (Complete workflow executions)
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id TEXT UNIQUE NOT NULL,
    workflow_name TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    
    -- Execution details
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds FLOAT GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time))
    ) STORED,
    
    -- Metrics
    total_calls INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 6) DEFAULT 0,
    
    -- Breakdowns
    agent_breakdown JSONB DEFAULT '{}',  -- Cost per agent
    model_breakdown JSONB DEFAULT '{}',  -- Cost per model
    
    -- Status
    success BOOLEAN DEFAULT TRUE,
    error TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflows_org ON workflows(organization_id);
CREATE INDEX idx_workflows_user ON workflows(user_id);
CREATE INDEX idx_workflows_session ON workflows(session_id);
CREATE INDEX idx_workflows_name ON workflows(workflow_name);
CREATE INDEX idx_workflows_start ON workflows(start_time);
CREATE INDEX idx_workflows_cost ON workflows(total_cost_usd DESC);
CREATE INDEX idx_workflows_success ON workflows(success);

-- ============================================
-- User Sessions (User sessions with workflows)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT UNIQUE NOT NULL,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    -- Session details
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds FLOAT GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time))
    ) STORED,
    
    -- Metrics
    workflow_count INTEGER DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 6) DEFAULT 0,
    
    -- Context
    user_agent TEXT,
    ip_address TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_org ON user_sessions(organization_id);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_start ON user_sessions(start_time);
CREATE INDEX idx_sessions_cost ON user_sessions(total_cost_usd DESC);

-- ============================================
-- Cost Attribution (Pre-aggregated for speed)
-- ============================================
CREATE TABLE IF NOT EXISTS cost_attribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL,
    
    -- Attribution dimension
    dimension TEXT NOT NULL,  -- user, workflow, agent, model, session
    dimension_value TEXT NOT NULL,  -- The actual user_id, workflow_name, etc.
    
    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL,  -- hour, day, week, month
    
    -- Metrics
    total_calls INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 6) DEFAULT 0,
    
    -- Breakdown
    model_breakdown JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, dimension, dimension_value, period_start, period_type)
);

CREATE INDEX idx_cost_attr_org ON cost_attribution(organization_id);
CREATE INDEX idx_cost_attr_dimension ON cost_attribution(dimension, dimension_value);
CREATE INDEX idx_cost_attr_period ON cost_attribution(period_start, period_end);
CREATE INDEX idx_cost_attr_cost ON cost_attribution(total_cost_usd DESC);

-- ============================================
-- Caching Opportunities (Detect repeated calls)
-- ============================================
CREATE TABLE IF NOT EXISTS caching_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL,
    
    -- Pattern details
    prompt_hash TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    model TEXT NOT NULL,
    
    -- Frequency
    call_count INTEGER DEFAULT 0,
    first_seen TIMESTAMPTZ NOT NULL,
    last_seen TIMESTAMPTZ NOT NULL,
    
    -- Savings potential
    avg_tokens INTEGER DEFAULT 0,
    avg_cost_usd DECIMAL(10, 6) DEFAULT 0,
    potential_savings_usd DECIMAL(10, 6) DEFAULT 0,
    
    -- Status
    implemented BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, prompt_hash, agent_name, model)
);

CREATE INDEX idx_caching_org ON caching_opportunities(organization_id);
CREATE INDEX idx_caching_savings ON caching_opportunities(potential_savings_usd DESC);
CREATE INDEX idx_caching_implemented ON caching_opportunities(implemented);

-- ============================================
-- Optimization Recommendations
-- ============================================
CREATE TABLE IF NOT EXISTS optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL,
    
    -- Recommendation details
    type TEXT NOT NULL,  -- expensive_agent, expensive_model, caching, failed_workflows
    priority TEXT NOT NULL,  -- high, medium, low
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact
    current_cost_usd DECIMAL(10, 6) DEFAULT 0,
    potential_savings_usd DECIMAL(10, 6) DEFAULT 0,
    
    -- Context
    related_entity TEXT,  -- agent_name, model, workflow_name, etc.
    metadata JSONB DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'open',  -- open, in_progress, implemented, dismissed
    implemented_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_org ON optimization_recommendations(organization_id);
CREATE INDEX idx_recommendations_priority ON optimization_recommendations(priority);
CREATE INDEX idx_recommendations_status ON optimization_recommendations(status);
CREATE INDEX idx_recommendations_savings ON optimization_recommendations(potential_savings_usd DESC);

-- ============================================
-- Agent Performance Metrics
-- ============================================
CREATE TABLE IF NOT EXISTS agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    
    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Performance metrics
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    success_rate FLOAT GENERATED ALWAYS AS (
        CASE WHEN total_calls > 0 
        THEN (successful_calls::FLOAT / total_calls::FLOAT) * 100 
        ELSE 0 END
    ) STORED,
    
    -- Latency metrics
    avg_latency_ms FLOAT DEFAULT 0,
    p50_latency_ms FLOAT DEFAULT 0,
    p95_latency_ms FLOAT DEFAULT 0,
    p99_latency_ms FLOAT DEFAULT 0,
    
    -- Cost metrics
    total_cost_usd DECIMAL(10, 6) DEFAULT 0,
    avg_cost_per_call DECIMAL(10, 6) DEFAULT 0,
    
    -- Token metrics
    total_tokens INTEGER DEFAULT 0,
    avg_tokens_per_call INTEGER DEFAULT 0,
    
    -- Models used
    models_used TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, agent_name, period_start)
);

CREATE INDEX idx_agent_perf_org ON agent_performance(organization_id);
CREATE INDEX idx_agent_perf_agent ON agent_performance(agent_name);
CREATE INDEX idx_agent_perf_period ON agent_performance(period_start);
CREATE INDEX idx_agent_perf_cost ON agent_performance(total_cost_usd DESC);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function to update workflow metrics when agent call is added
CREATE OR REPLACE FUNCTION update_workflow_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE workflows
    SET 
        total_calls = total_calls + 1,
        total_tokens = total_tokens + NEW.total_tokens,
        total_cost_usd = total_cost_usd + NEW.cost_usd
    WHERE workflow_id = NEW.workflow_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflow_metrics
AFTER INSERT ON agent_calls
FOR EACH ROW
EXECUTE FUNCTION update_workflow_metrics();

-- Function to update session metrics when workflow ends
CREATE OR REPLACE FUNCTION update_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
        UPDATE user_sessions
        SET 
            workflow_count = workflow_count + 1,
            total_calls = total_calls + NEW.total_calls,
            total_tokens = total_tokens + NEW.total_tokens,
            total_cost_usd = total_cost_usd + NEW.total_cost_usd
        WHERE session_id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_metrics
AFTER UPDATE ON workflows
FOR EACH ROW
EXECUTE FUNCTION update_session_metrics();

-- Function to detect caching opportunities
CREATE OR REPLACE FUNCTION detect_caching_opportunity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO caching_opportunities (
        organization_id,
        prompt_hash,
        agent_name,
        model,
        call_count,
        first_seen,
        last_seen,
        avg_tokens,
        avg_cost_usd,
        potential_savings_usd
    )
    VALUES (
        NEW.organization_id,
        NEW.prompt_hash,
        NEW.agent_name,
        NEW.model,
        1,
        NOW(),
        NOW(),
        NEW.total_tokens,
        NEW.cost_usd,
        0
    )
    ON CONFLICT (organization_id, prompt_hash, agent_name, model)
    DO UPDATE SET
        call_count = caching_opportunities.call_count + 1,
        last_seen = NOW(),
        avg_tokens = (caching_opportunities.avg_tokens * caching_opportunities.call_count + NEW.total_tokens) / (caching_opportunities.call_count + 1),
        avg_cost_usd = (caching_opportunities.avg_cost_usd * caching_opportunities.call_count + NEW.cost_usd) / (caching_opportunities.call_count + 1),
        potential_savings_usd = CASE 
            WHEN caching_opportunities.call_count + 1 >= 3 
            THEN ((caching_opportunities.avg_cost_usd * caching_opportunities.call_count + NEW.cost_usd) / (caching_opportunities.call_count + 1)) * (caching_opportunities.call_count + 1 - 1)
            ELSE 0
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_detect_caching
AFTER INSERT ON agent_calls
FOR EACH ROW
WHEN (NEW.prompt_hash IS NOT NULL)
EXECUTE FUNCTION detect_caching_opportunity();

-- Function to aggregate cost attribution daily
CREATE OR REPLACE FUNCTION aggregate_cost_attribution()
RETURNS void AS $$
DECLARE
    v_start_date DATE := CURRENT_DATE - INTERVAL '1 day';
    v_end_date DATE := CURRENT_DATE;
BEGIN
    -- Aggregate by user
    INSERT INTO cost_attribution (
        organization_id, dimension, dimension_value,
        period_start, period_end, period_type,
        total_calls, total_tokens, total_cost_usd, model_breakdown
    )
    SELECT 
        w.organization_id,
        'user',
        w.user_id,
        v_start_date,
        v_end_date,
        'day',
        SUM(w.total_calls),
        SUM(w.total_tokens),
        SUM(w.total_cost_usd),
        jsonb_object_agg(
            COALESCE(w.model_breakdown->>'model', 'unknown'),
            w.model_breakdown
        )
    FROM workflows w
    WHERE w.start_time >= v_start_date AND w.start_time < v_end_date
    GROUP BY w.organization_id, w.user_id
    ON CONFLICT (organization_id, dimension, dimension_value, period_start, period_type)
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        total_tokens = EXCLUDED.total_tokens,
        total_cost_usd = EXCLUDED.total_cost_usd,
        model_breakdown = EXCLUDED.model_breakdown,
        updated_at = NOW();
    
    -- Aggregate by workflow
    INSERT INTO cost_attribution (
        organization_id, dimension, dimension_value,
        period_start, period_end, period_type,
        total_calls, total_tokens, total_cost_usd
    )
    SELECT 
        w.organization_id,
        'workflow',
        w.workflow_name,
        v_start_date,
        v_end_date,
        'day',
        COUNT(*),
        SUM(w.total_tokens),
        SUM(w.total_cost_usd)
    FROM workflows w
    WHERE w.start_time >= v_start_date AND w.start_time < v_end_date
    GROUP BY w.organization_id, w.workflow_name
    ON CONFLICT (organization_id, dimension, dimension_value, period_start, period_type)
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        total_tokens = EXCLUDED.total_tokens,
        total_cost_usd = EXCLUDED.total_cost_usd,
        updated_at = NOW();
    
    -- Aggregate by agent
    INSERT INTO cost_attribution (
        organization_id, dimension, dimension_value,
        period_start, period_end, period_type,
        total_calls, total_tokens, total_cost_usd
    )
    SELECT 
        ac.organization_id,
        'agent',
        ac.agent_name,
        v_start_date,
        v_end_date,
        'day',
        COUNT(*),
        SUM(ac.total_tokens),
        SUM(ac.cost_usd)
    FROM agent_calls ac
    WHERE ac.created_at >= v_start_date AND ac.created_at < v_end_date
    GROUP BY ac.organization_id, ac.agent_name
    ON CONFLICT (organization_id, dimension, dimension_value, period_start, period_type)
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        total_tokens = EXCLUDED.total_tokens,
        total_cost_usd = EXCLUDED.total_cost_usd,
        updated_at = NOW();
    
    -- Aggregate by model
    INSERT INTO cost_attribution (
        organization_id, dimension, dimension_value,
        period_start, period_end, period_type,
        total_calls, total_tokens, total_cost_usd
    )
    SELECT 
        ac.organization_id,
        'model',
        ac.model,
        v_start_date,
        v_end_date,
        'day',
        COUNT(*),
        SUM(ac.total_tokens),
        SUM(ac.cost_usd)
    FROM agent_calls ac
    WHERE ac.created_at >= v_start_date AND ac.created_at < v_end_date
    GROUP BY ac.organization_id, ac.model
    ON CONFLICT (organization_id, dimension, dimension_value, period_start, period_type)
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        total_tokens = EXCLUDED.total_tokens,
        total_cost_usd = EXCLUDED.total_cost_usd,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for Common Queries
-- ============================================

-- View: Top spending agents
CREATE OR REPLACE VIEW v_top_spending_agents AS
SELECT 
    organization_id,
    agent_name,
    COUNT(*) as total_calls,
    SUM(total_tokens) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(cost_usd) as avg_cost_per_call,
    ARRAY_AGG(DISTINCT model) as models_used
FROM agent_calls
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY organization_id, agent_name
ORDER BY total_cost_usd DESC;

-- View: Top spending users
CREATE OR REPLACE VIEW v_top_spending_users AS
SELECT 
    organization_id,
    user_id,
    COUNT(DISTINCT session_id) as session_count,
    COUNT(*) as workflow_count,
    SUM(total_calls) as total_calls,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost_usd) as total_cost_usd,
    AVG(total_cost_usd) as avg_cost_per_workflow
FROM workflows
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY organization_id, user_id
ORDER BY total_cost_usd DESC;

-- View: Expensive workflows
CREATE OR REPLACE VIEW v_expensive_workflows AS
SELECT 
    organization_id,
    workflow_name,
    COUNT(*) as execution_count,
    AVG(total_cost_usd) as avg_cost,
    MAX(total_cost_usd) as max_cost,
    SUM(total_cost_usd) as total_cost,
    AVG(duration_seconds) as avg_duration_seconds,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100 as success_rate
FROM workflows
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY organization_id, workflow_name
HAVING AVG(total_cost_usd) > 0.01  -- More than 1 cent average
ORDER BY total_cost DESC;

-- View: Caching opportunities with high savings
CREATE OR REPLACE VIEW v_top_caching_opportunities AS
SELECT 
    organization_id,
    agent_name,
    model,
    call_count,
    avg_cost_usd,
    potential_savings_usd,
    (potential_savings_usd / NULLIF(avg_cost_usd * call_count, 0) * 100) as savings_percentage,
    last_seen
FROM caching_opportunities
WHERE 
    call_count >= 3 
    AND implemented = FALSE
    AND potential_savings_usd > 0.01
ORDER BY potential_savings_usd DESC;

COMMENT ON TABLE agent_calls IS 'Individual agent/model calls in workflows';
COMMENT ON TABLE workflows IS 'Complete workflow executions with metrics';
COMMENT ON TABLE user_sessions IS 'User sessions containing multiple workflows';
COMMENT ON TABLE cost_attribution IS 'Pre-aggregated cost attribution by dimension';
COMMENT ON TABLE caching_opportunities IS 'Detected opportunities for caching';
COMMENT ON TABLE optimization_recommendations IS 'AI-generated optimization recommendations';
COMMENT ON TABLE agent_performance IS 'Agent performance metrics over time';
