"""
Advanced Hallucination Detector - Main Pipeline

Orchestrates all detection modules into a unified, adaptive pipeline.
Implements the state-of-the-art detection strategy.

Usage:
    detector = AdvancedHallucinationDetector(config)
    result = await detector.detect(question, answer, context, openai_key)
"""

from typing import Dict, List, Optional, Any
import numpy as np
from .semantic_entropy import SemanticEntropyDetector
from .llm_judge import LLMJudge
from .claim_nli import ClaimNLIDetector
from .self_consistency import SelfConsistencyDetector
from .meta_classifier import MetaClassifier
from .detection_config import DetectionConfig


def convert_numpy_types(obj: Any) -> Any:
    """Convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    return obj


class AdvancedHallucinationDetector:
    """
    Main detection pipeline that orchestrates all modules.
    
    Implements adaptive detection: runs expensive checks only when needed.
    """
    
    def __init__(self, config: Optional[DetectionConfig] = None):
        """
        Initialize the detector.
        
        Args:
            config: Detection configuration (if None, uses default)
        """
        self.config = config or DetectionConfig()
        
        # Initialize all detectors
        self.entropy_detector = SemanticEntropyDetector()
        self.judge = LLMJudge(judge_model=self.config.judge_model)
        self.claim_detector = ClaimNLIDetector(use_llm_extraction=self.config.use_llm_claim_extraction)
        self.self_check_detector = SelfConsistencyDetector()
        self.meta_classifier = MetaClassifier(model_path=self.config.meta_model_path)
        
        print(f"✅ Advanced detector initialized (mode: {self.config.mode})")
    
    async def detect(
        self,
        question: str,
        answer: str,
        context: Optional[List[str]] = None,
        openai_key: str = None,
        model: str = "gpt-4o-mini"
    ) -> Dict:
        """
        Main detection method - runs adaptive pipeline.
        
        Args:
            question: User's question
            answer: LLM's answer to check
            context: RAG context chunks (if available)
            openai_key: OpenAI API key
            model: Model used to generate answer
            
        Returns:
            Complete detection results with risk score and recommendation
        """
        results = {
            "question": question,
            "answer": answer,
            "model": model,
            "mode": self.config.mode
        }
        
        # STEP 1: Fast Gate (Semantic Entropy)
        if self.config.use_semantic_entropy:
            print("🔍 Running semantic entropy check...")
            entropy_result = await self.entropy_detector.detect(
                question=question,
                openai_key=openai_key,
                model=model,
                k=self.config.entropy_samples
            )
            results["semantic_entropy"] = entropy_result
            
            # Adaptive sampling
            if self.config.adaptive_sampling:
                additional = self.entropy_detector.adaptive_sampling(
                    entropy_result["semantic_entropy"],
                    initial_k=self.config.entropy_samples
                )
                if additional > 0:
                    print(f"  ↳ Collecting {additional} more samples...")
                    # Re-run with more samples
                    entropy_result = await self.entropy_detector.detect(
                        question=question,
                        openai_key=openai_key,
                        model=model,
                        k=self.config.entropy_samples + additional
                    )
                    results["semantic_entropy"] = entropy_result
        
        # STEP 2: Judge Layer (conditional)
        run_judge = (
            self.config.use_judge and
            (self.config.mode == "thorough" or 
             (self.config.mode == "balanced" and results.get("semantic_entropy", {}).get("suspicious", False)))
        )
        
        if run_judge:
            print("⚖️  Running LLM-as-judge...")
            judge_result = await self.judge.judge(
                answer=answer,
                context=context,
                openai_key=openai_key
            )
            results["judge"] = judge_result
        
        # STEP 3: Claim-Level NLI (if context available)
        if self.config.use_claim_nli and context:
            print("📋 Running claim-level verification...")
            claims_result = await self.claim_detector.detect(
                answer=answer,
                context=context,
                openai_key=openai_key if self.config.use_llm_claim_extraction else None
            )
            results["claims"] = claims_result
        
        # STEP 4: Self-Consistency (fallback or if low support)
        run_self_check = (
            self.config.use_self_consistency and
            (not context or 
             results.get("claims", {}).get("support_rate", 1.0) < 0.6 or
             self.config.mode == "thorough")
        )
        
        if run_self_check:
            print("🔄 Running self-consistency check...")
            self_check_result = await self.self_check_detector.detect(
                question=question,
                answer=answer,
                openai_key=openai_key,
                model=model,
                num_variations=self.config.self_check_variations
            )
            results["self_check"] = self_check_result
        
        # STEP 5: Meta-Classification (Risk Fusion)
        print("🎯 Computing final risk score...")
        features = self.meta_classifier.extract_features(results)
        final_result = self.meta_classifier.predict(features)
        
        results["final_assessment"] = final_result
        results["risk_probability"] = final_result["risk_probability"]
        results["risk_level"] = final_result["risk_level"]
        results["action"] = final_result["action"]
        results["explanation"] = final_result["explanation"]
        
        # Add summary
        results["summary"] = self._generate_summary(results)
        
        # Convert all numpy types to Python native types for JSON serialization
        results = convert_numpy_types(results)
        
        return results
    
    def _generate_summary(self, results: Dict) -> Dict:
        """Generate human-readable summary."""
        summary = {
            "verdict": results["risk_level"],
            "confidence": 1.0 - results["risk_probability"],
            "checks_run": [],
            "issues_found": [],
            "recommendation": results["action"]
        }
        
        # Track which checks ran
        if "semantic_entropy" in results:
            summary["checks_run"].append("semantic_entropy")
            if results["semantic_entropy"].get("suspicious"):
                summary["issues_found"].append("High uncertainty across samples")
        
        if "judge" in results:
            summary["checks_run"].append("llm_judge")
            if results["judge"].get("score", 1.0) < 0.6:
                summary["issues_found"].append(f"Low factuality score: {results['judge']['score']}")
        
        if "claims" in results:
            summary["checks_run"].append("claim_nli")
            if results["claims"].get("support_rate", 1.0) < 0.6:
                summary["issues_found"].append(f"Only {results['claims']['support_rate']*100:.0f}% claims supported")
            if results["claims"].get("has_contradiction"):
                summary["issues_found"].append("Contradictions detected")
        
        if "self_check" in results:
            summary["checks_run"].append("self_consistency")
            if results["self_check"].get("disagrees"):
                summary["issues_found"].append("Inconsistent answers")
            if results["self_check"].get("num_contradictions", 0) > 0:
                summary["issues_found"].append(f"{results['self_check']['num_contradictions']} self-contradictions")
        
        if not summary["issues_found"]:
            summary["issues_found"].append("No issues detected")
        
        return summary
    
    async def batch_detect(
        self,
        questions: List[str],
        answers: List[str],
        contexts: List[Optional[List[str]]],
        openai_key: str,
        model: str = "gpt-4o-mini"
    ) -> List[Dict]:
        """
        Detect hallucinations in batch.
        
        Args:
            questions: List of questions
            answers: List of answers
            contexts: List of context lists
            openai_key: OpenAI API key
            model: Model name
            
        Returns:
            List of detection results
        """
        import asyncio
        
        tasks = []
        for question, answer, context in zip(questions, answers, contexts):
            task = self.detect(question, answer, context, openai_key, model)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        processed = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed.append({
                    "error": str(result),
                    "question": questions[i],
                    "answer": answers[i],
                    "risk_level": "unknown"
                })
            else:
                processed.append(result)
        
        return processed


# Convenience function
async def detect_hallucination(
    question: str,
    answer: str,
    context: Optional[List[str]] = None,
    openai_key: str = None,
    mode: str = "balanced"
) -> Dict:
    """
    Convenience function for quick detection.
    
    Usage:
        result = await detect_hallucination(
            question="What is the capital of France?",
            answer="Paris is the capital with 2 million people.",
            context=["France is a country. Paris is its capital with 2.1M population."],
            openai_key="sk-...",
            mode="balanced"  # or "fast" or "thorough"
        )
        
        print(f"Risk: {result['risk_level']}")
        print(f"Action: {result['action']}")
        print(f"Why: {result['explanation']}")
    """
    config = DetectionConfig(mode=mode)
    detector = AdvancedHallucinationDetector(config)
    return await detector.detect(question, answer, context, openai_key)