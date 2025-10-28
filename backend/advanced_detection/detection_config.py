"""
Detection Configuration

Defines detection modes and parameters for the advanced detector.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class DetectionConfig:
    """
    Configuration for advanced hallucination detection.
    
    Three modes:
    - fast: Semantic entropy only (~200ms, $0.001/request)
    - balanced: Entropy + conditional judge + claims (~1-2s, $0.005/request)
    - thorough: All checks enabled (~3-5s, $0.015/request)
    """
    
    # Mode selection
    mode: str = "balanced"  # "fast", "balanced", or "thorough"
    
    # Semantic Entropy settings
    use_semantic_entropy: bool = True
    entropy_samples: int = 5  # Number of samples (3-8)
    adaptive_sampling: bool = True  # Collect more samples if near boundary
    
    # LLM-as-Judge settings
    use_judge: bool = True
    judge_model: str = "gpt-4o-mini"  # Use stronger model for better accuracy
    
    # Claim-level NLI settings
    use_claim_nli: bool = True
    use_llm_claim_extraction: bool = False  # True = more accurate but slower
    
    # Self-consistency settings
    use_self_consistency: bool = True
    self_check_variations: int = 2  # Number of question variations
    
    # Meta-classifier settings
    meta_model_path: Optional[str] = None  # Path to trained model (None = use heuristic)
    
    @classmethod
    def fast(cls):
        """Fast mode: Semantic entropy only."""
        return cls(
            mode="fast",
            use_semantic_entropy=True,
            entropy_samples=3,
            adaptive_sampling=False,
            use_judge=False,
            use_claim_nli=False,
            use_self_consistency=False
        )
    
    @classmethod
    def balanced(cls):
        """Balanced mode: Adaptive checks based on signals."""
        return cls(
            mode="balanced",
            use_semantic_entropy=True,
            entropy_samples=5,
            adaptive_sampling=True,
            use_judge=True,  # Only if entropy high
            use_claim_nli=True,
            use_self_consistency=True  # Only if low support
        )
    
    @classmethod
    def thorough(cls):
        """Thorough mode: All checks enabled."""
        return cls(
            mode="thorough",
            use_semantic_entropy=True,
            entropy_samples=8,
            adaptive_sampling=True,
            use_judge=True,
            use_claim_nli=True,
            use_llm_claim_extraction=True,
            use_self_consistency=True,
            self_check_variations=3
        )
    
    def estimate_cost(self) -> dict:
        """Estimate cost and latency for this configuration."""
        costs = {
            "fast": {
                "latency_ms": 200,
                "cost_usd": 0.001,
                "llm_calls": 3
            },
            "balanced": {
                "latency_ms": 1500,
                "cost_usd": 0.005,
                "llm_calls": 7
            },
            "thorough": {
                "latency_ms": 4000,
                "cost_usd": 0.015,
                "llm_calls": 15
            }
        }
        
        return costs.get(self.mode, costs["balanced"])
    
    def __str__(self):
        """String representation."""
        estimate = self.estimate_cost()
        return f"""DetectionConfig(mode={self.mode})
  Latency: ~{estimate['latency_ms']}ms
  Cost: ~${estimate['cost_usd']}/request
  LLM calls: ~{estimate['llm_calls']}
  
  Enabled checks:
    - Semantic Entropy: {self.use_semantic_entropy} (k={self.entropy_samples})
    - LLM Judge: {self.use_judge}
    - Claim NLI: {self.use_claim_nli}
    - Self-Consistency: {self.use_self_consistency}
"""