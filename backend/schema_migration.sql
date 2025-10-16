-- =============================================
-- LLM Observability Platform - Database Migration
-- Run this to update existing tables or create new ones
-- =============================================

-- Drop existing tables if you want a fresh start (CAREFUL - this deletes data!)
-- Uncomment the lines below ONLY if you want to start fresh:
-- DROP TABLE IF EXISTS audit_log CASCADE;
-- DROP TABLE IF EXISTS alerts CASCADE;
-- DROP TABLE IF EXISTS detection_rules CASCADE;
-- DROP TABLE IF EXISTS flags CASCADE;
-- DROP TABLE IF EXISTS payloads CASCADE;
-- DROP TABLE IF EXISTS runs CASCADE;
-- DROP TABLE IF EXISTS proxy_keys CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Users/Organizations Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    encrypted_api_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- API Keys for accessing the proxy
CREATE TABLE IF NOT EXISTS proxy_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(255),
    api_key TEXT UNIQUE NOT NULL,
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
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT NOW()
);

-- If runs table already exists without user_id, add the columns
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'runs') THEN
        -- Add user_id if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'user_id') THEN
            ALTER TABLE runs ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        -- Add proxy_key_id if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'proxy_key_id') THEN
            ALTER TABLE runs ADD COLUMN proxy_key_id UUID REFERENCES proxy_keys(id);
        END IF;
        
        -- Add status if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'runs' AND column_name = 'status') THEN
            ALTER TABLE runs ADD COLUMN status VARCHAR(50) DEFAULT 'success';
        END IF;
    END IF;
END $$;

-- Request/Response Payloads
CREATE TABLE IF NOT EXISTS payloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    messages JSONB,
    response TEXT,
    full_request JSONB,
    full_response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Hallucination Detection & Flags
CREATE TABLE IF NOT EXISTS flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    flag_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    confidence_score DECIMAL(5, 4),
    description TEXT,
    details JSONB,
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
    rule_type VARCHAR(100),
    config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts/Notifications
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    flag_id UUID REFERENCES flags(id) ON DELETE CASCADE,
    alert_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100),
    resource_type VARCHAR(100),
    resource_id UUID,
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_flags_run_id ON flags(run_id);
CREATE INDEX IF NOT EXISTS idx_flags_severity ON flags(severity);
CREATE INDEX IF NOT EXISTS idx_flags_is_resolved ON flags(is_resolved);
CREATE INDEX IF NOT EXISTS idx_proxy_keys_user_id ON proxy_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_proxy_keys_api_key ON proxy_keys(api_key);

-- Drop and recreate view with new structure
DROP VIEW IF EXISTS run_details CASCADE;

-- Create View: Run details with flags
CREATE VIEW run_details AS
SELECT 
    r.id,
    r.user_id,
    r.proxy_key_id,
    r.model,
    r.prompt_tokens,
    r.completion_tokens,
    r.total_tokens,
    r.cost_usd,
    r.latency_ms,
    r.status,
    r.created_at,
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
GROUP BY r.id, r.user_id, r.proxy_key_id, r.model, r.prompt_tokens, 
         r.completion_tokens, r.total_tokens, r.cost_usd, r.latency_ms, 
         r.status, r.created_at, p.messages, p.response, p.full_request, p.full_response;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Schema migration completed successfully!';
END $$;
