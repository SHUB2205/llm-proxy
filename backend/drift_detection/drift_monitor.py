"""
Drift Detection Lite - Lightweight drift monitoring
Tracks 4 key metrics: response length, hallucination rate, cost, and latency
"""

import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv
import statistics

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


class DriftMonitor:
    """
    Lightweight drift detection monitoring 4 key metrics:
    1. Average response length (tokens)
    2. Hallucination rate (from advanced detection)
    3. Average cost per request
    4. P95 latency
    """
    
    def __init__(self):
        self.window_size = 100  # Last 100 requests
        self.check_interval = 50  # Check every 50 requests
        self.drift_threshold = 0.20  # 20% change triggers alert
        
    async def record_request(
        self,
        model: str,
        response_length: int,
        hallucination_detected: bool,
        cost: float,
        latency_ms: int
    ):
        """
        Record a request for drift monitoring
        This is called after each LLM request
        """
        # For now, we'll rely on the existing runs table
        # The actual drift check happens periodically
        pass
    
    async def check_drift(self, model: str = "gpt-4o-mini") -> Dict:
        """
        Check for drift in the last N requests
        Returns drift detection results
        """
        # Get recent requests
        recent_requests = await self._get_recent_requests(model, self.window_size)
        
        if len(recent_requests) < 50:
            return {
                "has_drift": False,
                "reason": "Insufficient data for drift detection",
                "sample_size": len(recent_requests)
            }
        
        # Get or create baseline
        baseline = await self._get_or_create_baseline(model, recent_requests)
        
        # Calculate current metrics
        current_metrics = self._calculate_metrics(recent_requests)
        
        # Detect drift for each metric
        drift_results = []
        
        for metric_name, current_value in current_metrics.items():
            baseline_value = baseline.get(metric_name, {}).get("value", 0)
            std_dev = baseline.get(metric_name, {}).get("std_dev", 0)
            
            if baseline_value == 0:
                continue
            
            # Calculate drift score (percentage change)
            drift_score = abs(current_value - baseline_value) / baseline_value
            
            # Determine severity
            severity = self._get_severity(drift_score)
            
            if drift_score > self.drift_threshold:
                drift_results.append({
                    "metric_name": metric_name,
                    "current_value": current_value,
                    "baseline_value": baseline_value,
                    "drift_score": drift_score,
                    "severity": severity,
                    "change_percent": drift_score * 100
                })
                
                # Log drift detection
                await self._log_drift_detection(
                    model=model,
                    metric_name=metric_name,
                    current_value=current_value,
                    baseline_value=baseline_value,
                    drift_score=drift_score,
                    severity=severity
                )
        
        return {
            "has_drift": len(drift_results) > 0,
            "drift_count": len(drift_results),
            "drifts": drift_results,
            "current_metrics": current_metrics,
            "baseline_metrics": {k: v["value"] for k, v in baseline.items()},
            "sample_size": len(recent_requests)
        }
    
    async def _get_recent_requests(self, model: str, limit: int) -> List[Dict]:
        """Get recent requests from database"""
        try:
            result = supabase.table("runs")\
                .select("*")\
                .eq("model", model)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching recent requests: {e}")
            return []
    
    def _calculate_metrics(self, requests: List[Dict]) -> Dict[str, float]:
        """Calculate current metrics from requests"""
        if not requests:
            return {}
        
        # 1. Average response length (completion tokens)
        response_lengths = [r.get("completion_tokens", 0) for r in requests if r.get("completion_tokens")]
        avg_response_length = statistics.mean(response_lengths) if response_lengths else 0
        
        # 2. Hallucination rate
        hallucinations = [
            1 for r in requests 
            if r.get("advanced_detection", {}).get("risk_level") in ["high", "medium"]
        ]
        hallucination_rate = len(hallucinations) / len(requests) if requests else 0
        
        # 3. Average cost
        costs = [r.get("cost", 0) for r in requests if r.get("cost")]
        avg_cost = statistics.mean(costs) if costs else 0
        
        # 4. P95 latency
        latencies = [r.get("latency_ms", 0) for r in requests if r.get("latency_ms")]
        p95_latency = statistics.quantiles(latencies, n=20)[18] if len(latencies) > 20 else (
            max(latencies) if latencies else 0
        )
        
        return {
            "avg_response_length": avg_response_length,
            "hallucination_rate": hallucination_rate,
            "avg_cost": avg_cost,
            "p95_latency": p95_latency
        }
    
    async def _get_or_create_baseline(self, model: str, requests: List[Dict]) -> Dict:
        """Get existing baseline or create new one"""
        try:
            # Try to get existing baseline
            result = supabase.table("drift_baselines")\
                .select("*")\
                .eq("model", model)\
                .execute()
            
            if result.data and len(result.data) > 0:
                # Convert to dict format
                baseline = {}
                for row in result.data:
                    baseline[row["metric_name"]] = {
                        "value": row["baseline_value"],
                        "std_dev": row["std_deviation"]
                    }
                return baseline
            else:
                # Create new baseline
                return await self._create_baseline(model, requests)
        except Exception as e:
            print(f"Error getting baseline: {e}")
            return await self._create_baseline(model, requests)
    
    async def _create_baseline(self, model: str, requests: List[Dict]) -> Dict:
        """Create a new baseline from current data"""
        metrics = self._calculate_metrics(requests)
        baseline = {}
        
        for metric_name, value in metrics.items():
            # Calculate standard deviation (simplified)
            std_dev = value * 0.1  # 10% of value as std dev
            
            try:
                # Insert into database
                supabase.table("drift_baselines").upsert({
                    "model": model,
                    "metric_name": metric_name,
                    "baseline_value": value,
                    "std_deviation": std_dev,
                    "sample_size": len(requests),
                    "updated_at": datetime.now().isoformat()
                }).execute()
                
                baseline[metric_name] = {
                    "value": value,
                    "std_dev": std_dev
                }
            except Exception as e:
                print(f"Error creating baseline for {metric_name}: {e}")
        
        return baseline
    
    def _get_severity(self, drift_score: float) -> str:
        """Determine severity based on drift score"""
        if drift_score > 0.50:  # >50% change
            return "critical"
        elif drift_score > 0.35:  # >35% change
            return "high"
        elif drift_score > 0.20:  # >20% change
            return "medium"
        else:
            return "low"
    
    async def _log_drift_detection(
        self,
        model: str,
        metric_name: str,
        current_value: float,
        baseline_value: float,
        drift_score: float,
        severity: str
    ):
        """Log drift detection to database"""
        try:
            supabase.table("drift_detections").insert({
                "model": model,
                "metric_name": metric_name,
                "current_value": current_value,
                "baseline_value": baseline_value,
                "drift_score": drift_score,
                "severity": severity,
                "details": {
                    "change_percent": drift_score * 100,
                    "direction": "increase" if current_value > baseline_value else "decrease"
                },
                "alert_sent": False
            }).execute()
        except Exception as e:
            print(f"Error logging drift detection: {e}")
    
    async def get_drift_history(
        self,
        model: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Get drift detection history"""
        try:
            query = supabase.table("drift_detections").select("*")
            
            if model:
                query = query.eq("model", model)
            
            result = query.order("created_at", desc=True).limit(limit).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting drift history: {e}")
            return []
    
    async def get_drift_stats(self, model: Optional[str] = None) -> Dict:
        """Get drift statistics"""
        try:
            # Get all drift detections
            query = supabase.table("drift_detections").select("*")
            if model:
                query = query.eq("model", model)
            
            result = query.execute()
            drifts = result.data if result.data else []
            
            # Calculate stats
            total_drifts = len(drifts)
            critical_drifts = len([d for d in drifts if d["severity"] == "critical"])
            high_drifts = len([d for d in drifts if d["severity"] == "high"])
            medium_drifts = len([d for d in drifts if d["severity"] == "medium"])
            
            # Get recent drifts (last 24h)
            yesterday = (datetime.now() - timedelta(days=1)).isoformat()
            recent_drifts = [d for d in drifts if d["created_at"] > yesterday]
            
            return {
                "total_drifts": total_drifts,
                "critical_drifts": critical_drifts,
                "high_drifts": high_drifts,
                "medium_drifts": medium_drifts,
                "recent_drifts_24h": len(recent_drifts),
                "drift_by_metric": self._group_by_metric(drifts)
            }
        except Exception as e:
            print(f"Error getting drift stats: {e}")
            return {}
    
    def _group_by_metric(self, drifts: List[Dict]) -> Dict:
        """Group drifts by metric name"""
        grouped = {}
        for drift in drifts:
            metric = drift["metric_name"]
            if metric not in grouped:
                grouped[metric] = 0
            grouped[metric] += 1
        return grouped


# Global instance
drift_monitor = DriftMonitor()
