"""
Self-Consistency Checker - Fallback Detection

Checks if the model contradicts itself when asked the same question differently.
Useful when no external context is available for verification.

Based on: SelfCheckGPT and self-consistency methods
"""

from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
import httpx
import asyncio
import numpy as np


class SelfConsistencyDetector:
    """
    Detects hallucinations by checking if the model contradicts itself.
    
    Key insight: If a model gives different answers to the same question
    (or contradicts itself when probed), it's uncertain and likely hallucinating.
    """
    
    def __init__(self, embedding_model: str = "all-MiniLM-L6-v2"):
        """
        Initialize the detector.
        
        Args:
            embedding_model: Model for semantic similarity
        """
        self.embedding_model = SentenceTransformer(embedding_model)
    
    async def detect(
        self,
        question: str,
        answer: str,
        openai_key: str,
        model: str = "gpt-4o-mini",
        num_variations: int = 2
    ) -> Dict:
        """
        Detect hallucinations via self-consistency checks.
        
        Args:
            question: Original question
            answer: Original answer to check
            openai_key: OpenAI API key
            model: Model to use
            num_variations: Number of question variations to try
            
        Returns:
            Dict with similarity scores, contradictions, and verdict
        """
        # 1. Re-ask with variations
        alt_answers = await self._generate_variations(
            question, openai_key, model, num_variations
        )
        
        # 2. Compare semantic similarity
        similarity_scores = self._compute_similarities(answer, alt_answers)
        avg_similarity = np.mean(similarity_scores)
        
        # 3. Extract key claims from original answer
        key_claims = self._extract_key_claims(answer)
        
        # 4. Probe each claim
        probe_results = await self._probe_claims(
            key_claims, openai_key, model
        )
        
        # 5. Check for contradictions
        contradictions = self._find_contradictions(answer, probe_results)
        
        # 6. Determine verdict
        disagrees = avg_similarity < 0.7
        has_contradictions = len(contradictions) > 0
        
        return {
            "similarity_score": round(avg_similarity, 4),
            "disagrees": disagrees,
            "alt_answers": alt_answers,
            "similarity_scores": [round(s, 4) for s in similarity_scores],
            "key_claims": key_claims,
            "probe_results": probe_results,
            "contradictions": contradictions,
            "num_contradictions": len(contradictions),
            "verdict": "inconsistent" if (disagrees or has_contradictions) else "consistent"
        }
    
    async def _generate_variations(
        self,
        question: str,
        openai_key: str,
        model: str,
        num_variations: int
    ) -> List[str]:
        """Generate alternative phrasings of the question and get answers."""
        variations = [
            f"Answer concisely: {question}",
            f"Briefly explain: {question}",
            f"In simple terms: {question}"
        ][:num_variations]
        
        answers = []
        async with httpx.AsyncClient(timeout=60.0) as client:
            tasks = []
            for variation in variations:
                task = self._call_openai(client, variation, openai_key, model)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    print(f"Warning: Variation failed: {result}")
                    continue
                answers.append(result)
        
        return answers
    
    async def _call_openai(
        self,
        client: httpx.AsyncClient,
        question: str,
        api_key: str,
        model: str
    ) -> str:
        """Single OpenAI API call."""
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": question}],
                "temperature": 0.3,  # Lower for consistency
                "max_tokens": 300
            }
        )
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    def _compute_similarities(self, answer: str, alt_answers: List[str]) -> List[float]:
        """Compute semantic similarity between original and alternatives."""
        if not alt_answers:
            return [1.0]
        
        # Embed all answers
        all_answers = [answer] + alt_answers
        embeddings = self.embedding_model.encode(all_answers)
        
        # Compute cosine similarity
        original_emb = embeddings[0]
        similarities = []
        
        for alt_emb in embeddings[1:]:
            similarity = np.dot(original_emb, alt_emb) / (
                np.linalg.norm(original_emb) * np.linalg.norm(alt_emb)
            )
            similarities.append(float(similarity))
        
        return similarities
    
    def _extract_key_claims(self, answer: str) -> List[str]:
        """Extract key factual claims from answer."""
        # Simple: split into sentences, take first 3
        sentences = [s.strip() for s in answer.split('.') if s.strip()]
        return sentences[:3]
    
    async def _probe_claims(
        self,
        claims: List[str],
        openai_key: str,
        model: str
    ) -> List[Dict]:
        """Probe each claim with targeted questions."""
        results = []
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            for claim in claims:
                probe_question = f"Is this statement true? '{claim}' Answer with Yes/No/Unknown and explain briefly in 1 sentence."
                
                try:
                    probe_answer = await self._call_openai(
                        client, probe_question, openai_key, model
                    )
                    
                    results.append({
                        "claim": claim,
                        "probe_answer": probe_answer,
                        "stance": self._extract_stance(probe_answer)
                    })
                except Exception as e:
                    print(f"Warning: Probe failed: {e}")
                    results.append({
                        "claim": claim,
                        "probe_answer": f"Error: {e}",
                        "stance": "unknown"
                    })
        
        return results
    
    def _extract_stance(self, probe_answer: str) -> str:
        """Extract Yes/No/Unknown from probe answer."""
        lower = probe_answer.lower()
        
        if any(word in lower[:20] for word in ["yes", "true", "correct"]):
            return "affirm"
        elif any(word in lower[:20] for word in ["no", "false", "incorrect"]):
            return "deny"
        else:
            return "unknown"
    
    def _find_contradictions(
        self,
        original_answer: str,
        probe_results: List[Dict]
    ) -> List[Dict]:
        """Find claims where the probe contradicts the original."""
        contradictions = []
        
        for probe in probe_results:
            # If the probe denies a claim that was stated in the original
            if probe["stance"] == "deny":
                contradictions.append({
                    "claim": probe["claim"],
                    "probe_answer": probe["probe_answer"],
                    "reason": "Model contradicts its own claim when probed"
                })
        
        return contradictions


# Utility function
async def check_self_consistency(
    question: str,
    answer: str,
    openai_key: str,
    model: str = "gpt-4o-mini"
) -> Dict:
    """
    Convenience function to check self-consistency.
    
    Usage:
        result = await check_self_consistency(
            question="What is the capital of France?",
            answer="Paris is the capital of France with 2 million people.",
            openai_key="sk-..."
        )
        
        if result["disagrees"]:
            print(f"⚠️ Low similarity: {result['similarity_score']}")
        
        if result["contradictions"]:
            print(f"🚨 {len(result['contradictions'])} contradictions found")
    """
    detector = SelfConsistencyDetector()
    return await detector.detect(question, answer, openai_key, model)