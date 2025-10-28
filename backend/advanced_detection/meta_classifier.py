"""
Meta-Classifier - Risk Fusion Layer

Combines signals from all detectors into a single calibrated risk score.
Uses machine learning to learn optimal weighting from labeled data.

Based on: Ensemble methods and calibrated classifiers
"""

import numpy as np
from typing import Dict, List, Optional
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
import pickle
import os


class MetaClassifier:
    """
    Fuses multiple detection signals into a single risk probability.
    
    Key insight: Different detectors catch different types of hallucinations.
    Learn optimal combination from your data.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the meta-classifier.
        
        Args:
            model_path: Path to saved model (if None, uses default weights)
        """
        self.model = None
        self.calibrator = None
        self.feature_names = [
            "semantic_entropy",
            "num_clusters",
            "consensus_strength",
            "judge_score",
            "claim_support_rate",
            "has_contradiction",
            "self_similarity",
            "num_contradictions",
            "answer_length",
            "citation_density"
        ]
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            # Use default heuristic weights until trained
            self.use_heuristic = True
    
    def extract_features(self, detection_results: Dict) -> Dict[str, float]:
        """
        Extract features from all detector outputs.
        
        Args:
            detection_results: Combined results from all detectors
            
        Returns:
            Feature dict with normalized values
        """
        features = {}
        
        # Semantic entropy features
        entropy_data = detection_results.get("semantic_entropy", {})
        features["semantic_entropy"] = entropy_data.get("semantic_entropy", 0.5)
        features["num_clusters"] = min(entropy_data.get("num_clusters", 1) / 5.0, 1.0)
        features["consensus_strength"] = entropy_data.get("consensus_strength", 1.0)
        
        # Judge features
        judge_data = detection_results.get("judge", {})
        features["judge_score"] = judge_data.get("score", 0.5)
        
        # Claim-level NLI features
        claims_data = detection_results.get("claims", {})
        features["claim_support_rate"] = claims_data.get("support_rate", 1.0)
        features["has_contradiction"] = float(claims_data.get("has_contradiction", False))
        
        # Self-consistency features
        self_check_data = detection_results.get("self_check", {})
        features["self_similarity"] = self_check_data.get("similarity_score", 1.0)
        features["num_contradictions"] = min(
            self_check_data.get("num_contradictions", 0) / 3.0, 1.0
        )
        
        # Basic features
        answer = detection_results.get("answer", "")
        features["answer_length"] = min(len(answer.split()) / 500.0, 1.0)
        
        # Citation density (count citations / words)
        import re
        citations = len(re.findall(r'\[[\d,\s]+\]|\(\d{4}\)', answer))
        features["citation_density"] = min(citations / max(len(answer.split()), 1), 1.0)
        
        return features
    
    def predict(self, features: Dict[str, float]) -> Dict:
        """
        Predict hallucination risk from features.
        
        Args:
            features: Feature dict from extract_features()
            
        Returns:
            Dict with risk_probability, risk_level, and explanation
        """
        # Convert to array
        X = np.array([[features.get(name, 0.5) for name in self.feature_names]])
        
        if hasattr(self, 'use_heuristic') and self.use_heuristic:
            # Use heuristic scoring until model is trained
            risk_prob = self._heuristic_score(features)
        else:
            # Use trained model
            risk_prob = self.calibrator.predict_proba(X)[0][1]
        
        risk_level = self._get_risk_level(risk_prob)
        explanation = self._explain_prediction(features, risk_prob)
        
        return {
            "risk_probability": round(risk_prob, 4),
            "risk_level": risk_level,
            "features": {k: round(v, 4) for k, v in features.items()},
            "explanation": explanation,
            "action": self._get_action(risk_prob)
        }
    
    def _heuristic_score(self, features: Dict[str, float]) -> float:
        """
        Heuristic scoring when no trained model available.
        
        Weighted combination based on literature and intuition.
        """
        weights = {
            "semantic_entropy": 0.25,
            "judge_score": -0.30,  # Negative: high score = low risk
            "claim_support_rate": -0.20,  # Negative: high support = low risk
            "has_contradiction": 0.15,
            "self_similarity": -0.10,  # Negative: high similarity = low risk
            "num_contradictions": 0.10
        }
        
        score = 0.5  # Baseline
        for feature, weight in weights.items():
            score += weight * features.get(feature, 0.5)
        
        # Clip to [0, 1]
        return max(0.0, min(1.0, score))
    
    def _get_risk_level(self, prob: float) -> str:
        """Convert probability to risk level."""
        if prob < 0.2:
            return "safe"
        elif prob < 0.4:
            return "low"
        elif prob < 0.6:
            return "medium"
        elif prob < 0.8:
            return "high"
        else:
            return "critical"
    
    def _get_action(self, prob: float) -> str:
        """Recommend action based on risk."""
        if prob < 0.2:
            return "show"
        elif prob < 0.6:
            return "show_with_warning"
        else:
            return "block_and_regenerate"
    
    def _explain_prediction(self, features: Dict[str, float], risk_prob: float) -> str:
        """Generate human-readable explanation."""
        issues = []
        
        if features.get("semantic_entropy", 0) > 0.5:
            issues.append("high uncertainty across samples")
        
        if features.get("judge_score", 1.0) < 0.5:
            issues.append("low factuality score")
        
        if features.get("claim_support_rate", 1.0) < 0.6:
            issues.append("many unsupported claims")
        
        if features.get("has_contradiction", 0) > 0:
            issues.append("contradictions detected")
        
        if features.get("self_similarity", 1.0) < 0.7:
            issues.append("inconsistent answers")
        
        if not issues:
            return "All checks passed - response appears reliable"
        
        return f"Risk factors: {', '.join(issues)}"
    
    def train(self, X: np.ndarray, y: np.ndarray):
        """
        Train the meta-classifier on labeled data.
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Labels (0 = ok, 1 = hallucinated)
        """
        self.model = LogisticRegression(random_state=42, max_iter=1000)
        self.calibrator = CalibratedClassifierCV(self.model, cv=5, method='isotonic')
        self.calibrator.fit(X, y)
        self.use_heuristic = False
        
        print(f"✅ Model trained on {len(X)} examples")
    
    def save_model(self, path: str):
        """Save trained model to disk."""
        if self.calibrator is None:
            raise ValueError("No model to save. Train first.")
        
        with open(path, 'wb') as f:
            pickle.dump({
                'calibrator': self.calibrator,
                'feature_names': self.feature_names
            }, f)
        
        print(f"✅ Model saved to {path}")
    
    def load_model(self, path: str):
        """Load trained model from disk."""
        with open(path, 'rb') as f:
            data = pickle.load(f)
        
        self.calibrator = data['calibrator']
        self.feature_names = data['feature_names']
        self.use_heuristic = False
        
        print(f"✅ Model loaded from {path}")


# Utility function
def score_detection_results(detection_results: Dict) -> Dict:
    """
    Convenience function to score detection results.
    
    Usage:
        result = score_detection_results({
            "semantic_entropy": {"semantic_entropy": 0.65, ...},
            "judge": {"score": 0.45, ...},
            "claims": {"support_rate": 0.5, ...},
            "answer": "..."
        })
        
        print(f"Risk: {result['risk_level']} ({result['risk_probability']})")
        print(f"Action: {result['action']}")
        print(f"Why: {result['explanation']}")
    """
    classifier = MetaClassifier()
    features = classifier.extract_features(detection_results)
    return classifier.predict(features)