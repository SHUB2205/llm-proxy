# 🎯 Drift Detection Guide

## Overview

Drift Detection monitors changes in your LLM's behavior over time, alerting you when performance degrades or behavior shifts unexpectedly.

## What is Drift?

**Drift** occurs when your LLM's behavior changes from its baseline. This can happen due to:
- Model updates from OpenAI
- Changes in prompt templates
- Shifts in user behavior
- Data distribution changes

## Metrics Tracked

### 1. **Average Response Length**
- Tracks completion token count
- Detects if responses become too short or verbose
- **Alert threshold:** 20% change from baseline

### 2. **Hallucination Rate**
- Percentage of responses flagged as high/medium risk
- Uses advanced hallucination detection
- **Alert threshold:** 20% increase

### 3. **Average Cost**
- Cost per request in USD
- Detects unexpected cost spikes
- **Alert threshold:** 20% increase

### 4. **P95 Latency**
- 95th percentile response time
- Detects performance degradation
- **Alert threshold:** 20% increase

## How It Works

### 1. Baseline Establishment
- Automatically created from first 100 requests
- Stores mean and standard deviation for each metric
- Can be manually reset via API

### 2. Continuous Monitoring
- Checks last 100 requests
- Compares against baseline
- Triggers alerts when drift exceeds 20%

### 3. Severity Levels
- **Low:** 20-35% change
- **Medium:** 35-50% change
- **High:** 50%+ change
- **Critical:** Severe degradation

## Setup Instructions

### 1. Run Database Migration

Execute this SQL in your Supabase SQL editor:

```sql
-- Run the migration file
-- backend/migrations/002_drift_detection.sql
```

This creates two tables:
- `drift_baselines` - Stores baseline metrics
- `drift_detections` - Stores detected drift events

### 2. Start Backend

The drift detection is automatically enabled when you start the backend:

```bash
cd backend
python main.py
```

You should see: `✅ Drift Detection enabled`

### 3. Access Dashboard

Navigate to: **http://localhost:3000/drift**

## API Endpoints

### Check for Drift
```bash
GET /v1/drift/check?model=gpt-4o-mini
Authorization: Bearer {your_proxy_key}
```

**Response:**
```json
{
  "has_drift": true,
  "drift_count": 2,
  "drifts": [
    {
      "metric_name": "avg_cost",
      "current_value": 0.0012,
      "baseline_value": 0.001,
      "drift_score": 0.20,
      "severity": "medium",
      "change_percent": 20.0
    }
  ],
  "current_metrics": {...},
  "baseline_metrics": {...},
  "sample_size": 100
}
```

### Get Drift History
```bash
GET /v1/drift/history?limit=50
Authorization: Bearer {your_proxy_key}
```

### Get Drift Statistics
```bash
GET /v1/drift/stats
Authorization: Bearer {your_proxy_key}
```

**Response:**
```json
{
  "total_drifts": 15,
  "critical_drifts": 2,
  "high_drifts": 5,
  "medium_drifts": 8,
  "recent_drifts_24h": 3,
  "drift_by_metric": {
    "avg_cost": 5,
    "p95_latency": 10
  }
}
```

### Reset Baseline
```bash
POST /v1/drift/baseline/reset
Authorization: Bearer {your_proxy_key}
Content-Type: application/json

{
  "model": "gpt-4o-mini"
}
```

## Dashboard Features

### 1. **Real-Time Drift Check**
- Click "Check Drift Now" button
- Analyzes last 100 requests
- Shows immediate results

### 2. **Statistics Cards**
- Total drifts detected
- Critical drift count
- Last 24 hours activity
- High severity count

### 3. **Drift by Metric**
- Breakdown of which metrics are drifting
- Visual representation of problem areas

### 4. **Drift History**
- Timeline of all drift detections
- Severity indicators
- Drift scores and percentages

## Use Cases

### 1. **Model Version Changes**
Detect when OpenAI updates GPT-4:
- Response quality changes
- Cost increases
- Latency shifts

### 2. **Prompt Engineering**
Track impact of prompt changes:
- Response length variations
- Quality degradation
- Cost implications

### 3. **Performance Monitoring**
Catch performance issues early:
- Latency spikes
- Timeout increases
- Error rate changes

### 4. **Cost Control**
Prevent unexpected cost increases:
- Token usage spikes
- Model pricing changes
- Inefficient prompts

## Best Practices

### 1. **Establish Good Baselines**
- Wait for 100+ requests before trusting drift detection
- Reset baseline after intentional changes
- Use separate baselines per model

### 2. **Monitor Regularly**
- Check drift dashboard daily
- Set up alerts for critical drifts
- Review drift history weekly

### 3. **Investigate Drift**
When drift is detected:
1. Check if OpenAI updated the model
2. Review recent prompt changes
3. Analyze user behavior shifts
4. Examine error logs

### 4. **Reset When Needed**
Reset baseline after:
- Intentional prompt updates
- Model version changes
- Major feature releases

## Configuration

### Adjust Thresholds

Edit `backend/drift_detection/drift_monitor.py`:

```python
class DriftMonitor:
    def __init__(self):
        self.window_size = 100  # Number of requests to analyze
        self.check_interval = 50  # How often to check
        self.drift_threshold = 0.20  # 20% change triggers alert
```

### Change Severity Levels

```python
def _get_severity(self, drift_score: float) -> str:
    if drift_score > 0.50:  # Adjust these values
        return "critical"
    elif drift_score > 0.35:
        return "high"
    elif drift_score > 0.20:
        return "medium"
    else:
        return "low"
```

## Troubleshooting

### "Insufficient data for drift detection"
**Solution:** Send at least 50 requests before checking drift

### Baseline seems incorrect
**Solution:** Reset baseline via API:
```bash
POST /v1/drift/baseline/reset
```

### Too many false positives
**Solution:** Increase `drift_threshold` from 0.20 to 0.30

### Not detecting obvious drift
**Solution:** Decrease `drift_threshold` or check if baseline is stale

## Future Enhancements

Planned features:
- [ ] Email/Slack alerts for critical drift
- [ ] Automatic baseline updates
- [ ] Drift prediction (ML-based)
- [ ] Multi-model comparison
- [ ] Custom metric definitions
- [ ] Drift root cause analysis

## Technical Details

### Database Schema

**drift_baselines:**
- `model` - Model name
- `metric_name` - Metric being tracked
- `baseline_value` - Mean value
- `std_deviation` - Standard deviation
- `sample_size` - Number of requests used

**drift_detections:**
- `model` - Model name
- `metric_name` - Metric that drifted
- `current_value` - Current metric value
- `baseline_value` - Expected value
- `drift_score` - Magnitude of drift (0-1)
- `severity` - low/medium/high/critical
- `details` - Additional context

### Algorithm

1. **Collect** last N requests (default: 100)
2. **Calculate** current metrics
3. **Compare** to baseline
4. **Compute** drift score: `|current - baseline| / baseline`
5. **Alert** if drift score > threshold (default: 0.20)
6. **Log** detection to database

## Support

For issues or questions:
1. Check this guide
2. Review API documentation
3. Examine drift history for patterns
4. Reset baseline if needed

---

**Drift Detection Lite** - Lightweight, high-value monitoring for production LLM applications! 🚀
