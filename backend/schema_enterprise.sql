-- =============================================
-- LLM Observability Platform - Enterprise Schema
-- Additional tables for production features
-- =============================================

-- Organizations (rename from users for clarity)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free', -- free, starter, professional, enterprise
    encrypted_api_key TEXT NOT NULL,
    
    -- Billing
    monthly_budget DECIMAL(10, 2),
    current_month_spend DECIMAL(10, 2) DEFAULT 0,
    
    -- Quotas
    monthly_request_limit INTEGER,
    current_month_requests INTEGER DEFAULT 0,
    
    -- Settings
    webhook_url TEXT,
    webhook_secret TEXT,
    alert_email VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    trial_ends_at TIMESTAMP
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
    
    -- Permissions
    can_view_analytics BOOLEAN DEFAULT TRUE,
    can_manage_keys BOOLEAN DEFAULT FALSE,
    can_manage_team BOOLEAN DEFAULT FALSE,
    can_manage_billing BOOLEAN DEFAULT FALSE,
    can_resolve_flags BOOLEAN DEFAULT TRUE,
    
    invited_by UUID REFERENCES team_members(id),
    invited_at TIMESTAMP DEFAULT NOW(),
    joined_at TIMESTAMP,
    last_login_at TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(organization_id, email)
);

-- API Keys (enhanced)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES team_members(id),
    
    key_name VARCHAR(255) NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    key_prefix VARCHAR(20), -- First few chars for display
    
    -- Permissions
    allowed_models TEXT[], -- NULL = all models
    rate_limit_per_minute INTEGER,
    
    -- Usage tracking
    total_requests INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    last_used_at TIMESTAMP,
    
    -- Rotation
    expires_at TIMESTAMP,
    rotated_from UUID REFERENCES api_keys(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Usage Analytics (aggregated daily)
CREATE TABLE IF NOT EXISTS daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Requests
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    flagged_requests INTEGER DEFAULT 0,
    
    -- Tokens
    total_tokens BIGINT DEFAULT 0,
    prompt_tokens BIGINT DEFAULT 0,
    completion_tokens BIGINT DEFAULT 0,
    
    -- Cost
    total_cost DECIMAL(10, 6) DEFAULT 0,
    
    -- Performance
    avg_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,
    
    -- Models
    model_usage JSONB, -- {"gpt-4": 100, "gpt-3.5": 50}
    
    -- Flags
    flag_breakdown JSONB, -- {"hallucination": 5, "low_confidence": 3}
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(organization_id, date)
);

-- Custom Detection Rules
CREATE TABLE IF NOT EXISTS custom_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES team_members(id),
    
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50), -- keyword, regex, ml_model, custom_function
    
    -- Configuration
    config JSONB NOT NULL,
    -- Example: {"keywords": ["confidential", "internal"], "severity": "high"}
    -- Example: {"regex": "\\d{3}-\\d{2}-\\d{4}", "description": "SSN detected"}
    
    severity VARCHAR(20) DEFAULT 'medium',
    action VARCHAR(50) DEFAULT 'flag', -- flag, block, alert
    
    -- Stats
    times_triggered INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks Log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    event_type VARCHAR(100), -- flag_created, budget_exceeded, quota_reached
    payload JSONB,
    
    -- Delivery
    webhook_url TEXT,
    status_code INTEGER,
    response_body TEXT,
    attempt_number INTEGER DEFAULT 1,
    
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cost Optimization Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    recommendation_type VARCHAR(100), -- model_downgrade, prompt_optimization, caching
    title VARCHAR(255),
    description TEXT,
    
    -- Impact
    estimated_monthly_savings DECIMAL(10, 2),
    confidence_score DECIMAL(3, 2), -- 0.0 to 1.0
    
    -- Data
    supporting_data JSONB,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, implemented
    implemented_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Billing Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    invoice_number VARCHAR(50) UNIQUE,
    billing_period_start DATE,
    billing_period_end DATE,
    
    -- Amounts
    subtotal DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2),
    
    -- Breakdown
    usage_cost DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2),
    
    -- Details
    line_items JSONB,
    
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue
    due_date DATE,
    paid_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Alert Rules
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    rule_name VARCHAR(255),
    alert_type VARCHAR(100), -- budget_threshold, quota_threshold, high_flag_rate, error_rate
    
    -- Conditions
    threshold_value DECIMAL(10, 2),
    threshold_type VARCHAR(50), -- percentage, absolute, rate
    time_window_minutes INTEGER,
    
    -- Notification
    notify_webhook BOOLEAN DEFAULT TRUE,
    notify_email BOOLEAN DEFAULT TRUE,
    notify_slack BOOLEAN DEFAULT FALSE,
    
    -- Cooldown (prevent spam)
    cooldown_minutes INTEGER DEFAULT 60,
    last_triggered_at TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Model Performance Tracking
CREATE TABLE IF NOT EXISTS model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    model_name VARCHAR(100),
    date DATE,
    
    -- Performance
    avg_latency_ms INTEGER,
    avg_cost_per_request DECIMAL(10, 6),
    avg_tokens_per_request DECIMAL(10, 2),
    
    -- Quality
    flag_rate DECIMAL(5, 4), -- Percentage of requests flagged
    error_rate DECIMAL(5, 4),
    
    -- Usage
    total_requests INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(organization_id, model_name, date)
);

-- Prompt Templates (for optimization)
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES team_members(id),
    
    template_name VARCHAR(255),
    description TEXT,
    template_text TEXT,
    
    -- Variables
    variables JSONB, -- {"user_input": "string", "context": "string"}
    
    -- Performance
    avg_cost DECIMAL(10, 6),
    avg_tokens INTEGER,
    flag_rate DECIMAL(5, 4),
    times_used INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_daily_usage_org_date ON daily_usage(organization_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_custom_rules_org ON custom_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_rules_active ON custom_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org ON webhook_deliveries(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_org ON recommendations(organization_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_alert_rules_org ON alert_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_model_performance_org_date ON model_performance(organization_id, date DESC);

-- =============================================
-- Functions for Automation
-- =============================================

-- Function to update monthly usage
CREATE OR REPLACE FUNCTION update_monthly_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE organizations
    SET 
        current_month_spend = current_month_spend + NEW.cost_usd,
        current_month_requests = current_month_requests + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage on new run
DROP TRIGGER IF EXISTS trigger_update_monthly_usage ON runs;
CREATE TRIGGER trigger_update_monthly_usage
    AFTER INSERT ON runs
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_usage();

-- Function to check quotas
CREATE OR REPLACE FUNCTION check_quota_limits()
RETURNS TRIGGER AS $$
DECLARE
    org_record RECORD;
BEGIN
    SELECT * INTO org_record FROM organizations WHERE id = NEW.user_id;
    
    -- Check request limit
    IF org_record.monthly_request_limit IS NOT NULL AND 
       org_record.current_month_requests >= org_record.monthly_request_limit THEN
        RAISE EXCEPTION 'Monthly request quota exceeded';
    END IF;
    
    -- Check budget limit
    IF org_record.monthly_budget IS NOT NULL AND 
       org_record.current_month_spend >= org_record.monthly_budget THEN
        RAISE EXCEPTION 'Monthly budget exceeded';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Enterprise schema created successfully!';
    RAISE NOTICE 'New features: Team management, billing, quotas, webhooks, custom rules, recommendations';
END $$;
