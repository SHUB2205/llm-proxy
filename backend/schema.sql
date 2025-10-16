-- =============================================
-- LLM Observability Platform - Database Schema
-- =============================================

-- Users/Organizations Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    encrypted_api_key TEXT NOT NULL, -- Encrypted OpenAI API key
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- API Keys for accessing the proxy
CREATE TABLE IF NOT EXISTS proxy_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(255),
    api_key TEXT UNIQUE NOT NULL, -- The key they use to call our proxy
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- LLM Request Runs
CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    proxy_key_id UUID REFERENCES proxy_keys(id),
    model VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd DECIMAL(10, 6),
    latency_ms INTEGER,
    status VARCHAR(50) DEFAULT 'success', -- success, error, flagged
    created_at TIMESTAMP DEFAULT NOW()
);

-- Request/Response Payloads
CREATE TABLE IF NOT EXISTS payloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    messages JSONB, -- Input messages
    response TEXT, -- AI response
    full_request JSONB,
    full_response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Hallucination Detection & Flags
CREATE TABLE IF NOT EXISTS flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    flag_type VARCHAR(100) NOT NULL, -- hallucination, inconsistency, low_confidence, factual_error, etc.
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    confidence_score DECIMAL(5, 4), -- 0.0000 to 1.0000
    description TEXT,
    details JSONB, -- Additional metadata about the flag
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Detection Rules (configurable by users)
CREATE TABLE IF NOT EXISTS detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100), -- keyword_match, pattern_match, confidence_threshold, etc.
    config JSONB, -- Rule configuration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts/Notifications
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    flag_id UUID REFERENCES flags(id) ON DELETE CASCADE,
    alert_type VARCHAR(50), -- email, webhook, slack, etc.
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100), -- login, api_key_created, flag_resolved, etc.
    resource_type VARCHAR(100),
    resource_id UUID,
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_flags_run_id ON flags(run_id);
CREATE INDEX IF NOT EXISTS idx_flags_severity ON flags(severity);
CREATE INDEX IF NOT EXISTS idx_flags_is_resolved ON flags(is_resolved);
CREATE INDEX IF NOT EXISTS idx_proxy_keys_user_id ON proxy_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_proxy_keys_api_key ON proxy_keys(api_key);

-- View: Run details with flags
CREATE OR REPLACE VIEW run_details AS
SELECT 
    r.*,
    p.messages,
    p.response,
    p.full_request,
    p.full_response,
    COALESCE(json_agg(
        json_build_object(
            'id', f.id,
            'flag_type', f.flag_type,
            'severity', f.severity,
            'confidence_score', f.confidence_score,
            'description', f.description,
            'is_resolved', f.is_resolved
        )
    ) FILTER (WHERE f.id IS NOT NULL), '[]') as flags
FROM runs r
LEFT JOIN payloads p ON r.id = p.run_id
LEFT JOIN flags f ON r.id = f.run_id
GROUP BY r.id, p.id;
