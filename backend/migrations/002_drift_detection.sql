-- Drift Detection Tables
-- Run this in your Supabase SQL editor

-- Table: drift_baselines
-- Stores baseline metrics for drift comparison
CREATE TABLE IF NOT EXISTS drift_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    baseline_value FLOAT NOT NULL,
    std_deviation FLOAT NOT NULL,
    sample_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model, metric_name)
);

-- Table: drift_detections
-- Stores detected drift events
CREATE TABLE IF NOT EXISTS drift_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    current_value FLOAT NOT NULL,
    baseline_value FLOAT NOT NULL,
    drift_score FLOAT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details JSONB,
    alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drift_baselines_model ON drift_baselines(model);
CREATE INDEX IF NOT EXISTS idx_drift_detections_model ON drift_detections(model);
CREATE INDEX IF NOT EXISTS idx_drift_detections_created_at ON drift_detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drift_detections_severity ON drift_detections(severity);

-- Enable Row Level Security (optional, for multi-tenant)
ALTER TABLE drift_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_detections ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
CREATE POLICY "Enable read access for all users" ON drift_baselines FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON drift_baselines FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON drift_baselines FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON drift_detections FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON drift_detections FOR INSERT WITH CHECK (true);
