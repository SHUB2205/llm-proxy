"""
Hallucination Detection Module
Analyzes LLM responses for potential hallucinations, inconsistencies, and errors
"""

import re
from typing import List, Dict, Tuple
from datetime import datetime
import json


class HallucinationDetector:
    """Detects potential hallucinations and issues in LLM responses"""
    
    # Confidence indicators (phrases that suggest uncertainty)
    LOW_CONFIDENCE_PHRASES = [
        "i think", "i believe", "probably", "maybe", "might be",
        "could be", "possibly", "perhaps", "i'm not sure", "not certain",
        "it seems", "appears to be", "likely", "i guess"
    ]
    
    # Contradiction indicators
    CONTRADICTION_PHRASES = [
        "however", "but", "on the other hand", "although", "despite",
        "nevertheless", "yet", "conversely", "in contrast"
    ]
    
    # Hallucination red flags
    HALLUCINATION_INDICATORS = [
        "as of my last update", "i don't have access to", "i cannot verify",
        "i don't have real-time", "i cannot browse", "i don't have information after",
        "my knowledge cutoff", "i cannot access", "i'm not able to verify"
    ]
    
    # Fabrication patterns (specific dates, numbers without context)
    FABRICATION_PATTERNS = [
        r'\b(?:on|in)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{1,3}(?:,\d{3})+\s+(?:people|users|customers|dollars|deaths|cases)\b',
        r'\bexactly\s+\d+(?:\.\d+)?\s*%\b'
    ]
    
    def __init__(self):
        self.flags = []
    
    def analyze(self, prompt: str, response: str, model: str) -> List[Dict]:
        """
        Main analysis function that runs all detection algorithms
        
        Returns: List of flags with type, severity, confidence, and description
        """
        self.flags = []
        response_lower = response.lower()
        
        # Run all detection methods
        self._check_confidence_level(response_lower)
        self._check_contradictions(response_lower)
        self._check_hallucination_indicators(response_lower)
        self._check_fabricated_details(response)
        self._check_response_length(response, prompt)
        self._check_repetition(response)
        self._check_vagueness(response_lower)
        self._check_hedging(response_lower)
        
        return self.flags
    
    def _add_flag(self, flag_type: str, severity: str, confidence: float, description: str, details: Dict = None):
        """Helper to add a flag"""
        self.flags.append({
            "flag_type": flag_type,
            "severity": severity,
            "confidence_score": round(confidence, 4),
            "description": description,
            "details": details or {},
            "created_at": datetime.utcnow().isoformat()
        })
    
    def _check_confidence_level(self, response_lower: str):
        """Detect low confidence phrases"""
        found_phrases = [phrase for phrase in self.LOW_CONFIDENCE_PHRASES if phrase in response_lower]
        
        if len(found_phrases) >= 3:
            self._add_flag(
                flag_type="low_confidence",
                severity="medium",
                confidence=0.75,
                description=f"Response contains {len(found_phrases)} low-confidence phrases",
                details={"phrases": found_phrases[:5]}
            )
        elif len(found_phrases) >= 1:
            self._add_flag(
                flag_type="low_confidence",
                severity="low",
                confidence=0.60,
                description=f"Response contains uncertain language",
                details={"phrases": found_phrases}
            )
    
    def _check_contradictions(self, response_lower: str):
        """Detect potential contradictions in response"""
        contradiction_count = sum(1 for phrase in self.CONTRADICTION_PHRASES if phrase in response_lower)
        
        if contradiction_count >= 3:
            self._add_flag(
                flag_type="potential_contradiction",
                severity="high",
                confidence=0.70,
                description=f"Response contains {contradiction_count} contradiction indicators",
                details={"count": contradiction_count}
            )
    
    def _check_hallucination_indicators(self, response_lower: str):
        """Detect phrases that indicate potential hallucination"""
        found = [phrase for phrase in self.HALLUCINATION_INDICATORS if phrase in response_lower]
        
        if found:
            self._add_flag(
                flag_type="hallucination_indicator",
                severity="high",
                confidence=0.85,
                description="Response contains phrases indicating knowledge limitations",
                details={"indicators": found}
            )
    
    def _check_fabricated_details(self, response: str):
        """Detect potentially fabricated specific details"""
        fabrications = []
        
        for pattern in self.FABRICATION_PATTERNS:
            matches = re.findall(pattern, response, re.IGNORECASE)
            if matches:
                fabrications.extend(matches)
        
        if fabrications:
            self._add_flag(
                flag_type="fabricated_details",
                severity="high",
                confidence=0.65,
                description="Response contains specific details that may be fabricated",
                details={"examples": fabrications[:3]}
            )
    
    def _check_response_length(self, response: str, prompt: str):
        """Check if response is suspiciously short or long"""
        response_words = len(response.split())
        prompt_words = len(prompt.split())
        
        if response_words < 10 and prompt_words > 20:
            self._add_flag(
                flag_type="insufficient_response",
                severity="medium",
                confidence=0.70,
                description="Response is unusually short for the prompt complexity",
                details={"response_words": response_words, "prompt_words": prompt_words}
            )
        
        if response_words > 1000:
            self._add_flag(
                flag_type="excessive_verbosity",
                severity="low",
                confidence=0.55,
                description="Response is unusually verbose",
                details={"word_count": response_words}
            )
    
    def _check_repetition(self, response: str):
        """Detect repetitive content"""
        sentences = [s.strip() for s in response.split('.') if s.strip()]
        
        if len(sentences) > 5:
            unique_sentences = set(sentences)
            repetition_ratio = 1 - (len(unique_sentences) / len(sentences))
            
            if repetition_ratio > 0.3:
                self._add_flag(
                    flag_type="repetitive_content",
                    severity="medium",
                    confidence=0.80,
                    description=f"Response contains {int(repetition_ratio * 100)}% repetitive content",
                    details={"repetition_ratio": round(repetition_ratio, 2)}
                )
    
    def _check_vagueness(self, response_lower: str):
        """Detect overly vague responses"""
        vague_phrases = [
            "it depends", "varies", "different situations", "case by case",
            "many factors", "it's complicated", "there are various"
        ]
        
        vague_count = sum(1 for phrase in vague_phrases if phrase in response_lower)
        
        if vague_count >= 3:
            self._add_flag(
                flag_type="vague_response",
                severity="low",
                confidence=0.60,
                description="Response is overly vague without specific information",
                details={"vague_phrase_count": vague_count}
            )
    
    def _check_hedging(self, response_lower: str):
        """Detect excessive hedging (avoiding commitment)"""
        hedging_phrases = [
            "generally", "typically", "usually", "often", "sometimes",
            "in most cases", "tend to", "may", "can", "might"
        ]
        
        hedge_count = sum(1 for phrase in hedging_phrases if phrase in response_lower)
        response_words = len(response_lower.split())
        
        if response_words > 50:
            hedge_ratio = hedge_count / (response_words / 100)  # hedges per 100 words
            
            if hedge_ratio > 5:
                self._add_flag(
                    flag_type="excessive_hedging",
                    severity="low",
                    confidence=0.65,
                    description="Response contains excessive hedging language",
                    details={"hedge_count": hedge_count, "hedge_ratio": round(hedge_ratio, 2)}
                )


def calculate_overall_risk_score(flags: List[Dict]) -> Tuple[float, str]:
    """
    Calculate overall risk score based on flags
    
    Returns: (risk_score, risk_level)
    risk_score: 0.0 (safe) to 1.0 (critical)
    risk_level: "safe", "low", "medium", "high", "critical"
    """
    if not flags:
        return 0.0, "safe"
    
    severity_weights = {
        "low": 0.2,
        "medium": 0.5,
        "high": 0.8,
        "critical": 1.0
    }
    
    total_score = 0.0
    for flag in flags:
        severity_weight = severity_weights.get(flag["severity"], 0.5)
        confidence = flag["confidence_score"]
        total_score += severity_weight * confidence
    
    # Normalize by number of flags (but cap at 1.0)
    risk_score = min(total_score / max(len(flags), 1), 1.0)
    
    # Determine risk level
    if risk_score < 0.2:
        risk_level = "safe"
    elif risk_score < 0.4:
        risk_level = "low"
    elif risk_score < 0.6:
        risk_level = "medium"
    elif risk_score < 0.8:
        risk_level = "high"
    else:
        risk_level = "critical"
    
    return round(risk_score, 4), risk_level
