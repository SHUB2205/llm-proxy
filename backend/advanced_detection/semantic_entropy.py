"""
Semantic Entropy Detector - Fast Gate for Hallucination Detection

Uses semantic clustering of multiple LLM samples to detect uncertainty.
High semantic entropy = model is uncertain = likely hallucination.

Based on: "Semantic Entropy Probes" (Nature 2024)
"""

import numpy as np
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from sklearn.cluster import HDBSCAN
from collections import Counter
import asyncio
import httpx


class SemanticEntropyDetector:
    """
    Detects hallucinations by measuring semantic uncertainty across multiple samples.
    
    Key insight: If a model generates semantically different answers to the same question,
    it's uncertain and likely to hallucinate.
    """
    
    def __init__(self, embedding_model: str = "all-MiniLM-L6-v2"):
        """
        Initialize the detector.
        
        Args:
            embedding_model: HuggingFace model for embeddings (default: lightweight & fast)
        """
        self.embedding_model = SentenceTransformer(embedding_model)
        self.min_cluster_size = 2
        
    async def detect(
        self,
        question: str,
        samples: Optional[List[str]] = None,
        openai_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        k: int = 5,
        temperature: float = 0.8
    ) -> Dict:
        """
        Detect hallucination via semantic entropy.
        
        Args:
            question: The user's question
            samples: Pre-generated samples (if None, will generate k samples)
            openai_key: OpenAI API key for sampling
            model: Model to use for sampling
            k: Number of samples to generate
            temperature: Sampling temperature (0.8 recommended)
            
        Returns:
            Dict with entropy, suspicion level, clusters, and samples
        """
        # Generate samples if not provided
        if samples is None:
            if openai_key is None:
                raise ValueError("Either samples or openai_key must be provided")
            samples = await self._generate_samples(question, openai_key, model, k, temperature)
        
        # Embed all samples
        embeddings = self.embedding_model.encode(samples)
        
        # Cluster by semantic meaning
        clusters = self._cluster_embeddings(embeddings)
        
        # Calculate semantic entropy
        entropy = self._calculate_entropy(clusters)
        
        # Determine suspicion level
        suspicious = entropy > 0.5  # Threshold from literature
        
        # Calculate additional metrics
        num_clusters = len(set(clusters)) - (1 if -1 in clusters else 0)  # Exclude noise
        max_cluster_size = max(Counter(clusters).values()) if len(clusters) > 0 else 0
        consensus_strength = max_cluster_size / len(samples) if samples else 0
        
        return {
            "semantic_entropy": round(entropy, 4),
            "suspicious": suspicious,
            "num_clusters": num_clusters,
            "num_samples": len(samples),
            "consensus_strength": round(consensus_strength, 4),
            "samples": samples,
            "clusters": clusters.tolist() if isinstance(clusters, np.ndarray) else clusters,
            "threshold": 0.5,
            "interpretation": self._interpret_entropy(entropy, num_clusters)
        }
    
    async def _generate_samples(
        self,
        question: str,
        openai_key: str,
        model: str,
        k: int,
        temperature: float
    ) -> List[str]:
        """Generate k samples from OpenAI API."""
        samples = []
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            tasks = []
            for _ in range(k):
                task = self._call_openai(client, question, openai_key, model, temperature)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    print(f"Warning: Sample generation failed: {result}")
                    continue
                samples.append(result)
        
        return samples
    
    async def _call_openai(
        self,
        client: httpx.AsyncClient,
        question: str,
        api_key: str,
        model: str,
        temperature: float
    ) -> str:
        """Single OpenAI API call."""
        try:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": question}],
                    "temperature": temperature,
                    "max_tokens": 500
                }
            )
            
            response.raise_for_status()  # Raise exception for bad status codes
            result = response.json()
            
            if "choices" not in result:
                raise ValueError(f"Invalid API response: {result}")
            
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            raise Exception(f"OpenAI API call failed: {str(e)}")
    
    def _cluster_embeddings(self, embeddings: np.ndarray) -> np.ndarray:
        """
        Cluster embeddings by semantic similarity.
        
        Uses HDBSCAN for density-based clustering (handles noise better than k-means).
        """
        if len(embeddings) < 2:
            return np.array([0])
        
        clusterer = HDBSCAN(
            min_cluster_size=self.min_cluster_size,
            metric='euclidean',
            cluster_selection_method='eom'
        )
        
        clusters = clusterer.fit_predict(embeddings)
        
        # If all points are noise (-1), treat as single cluster
        if np.all(clusters == -1):
            return np.zeros(len(clusters), dtype=int)
        
        return clusters
    
    def _calculate_entropy(self, clusters: np.ndarray) -> float:
        """
        Calculate semantic entropy from cluster distribution.
        
        Formula: H = -Σ p_i * log(p_i)
        where p_i is the proportion of samples in cluster i
        """
        if len(clusters) == 0:
            return 0.0
        
        # Count samples per cluster (ignore noise cluster -1)
        cluster_counts = Counter(c for c in clusters if c != -1)
        
        if not cluster_counts:
            return 0.0
        
        total = sum(cluster_counts.values())
        
        # Calculate entropy
        entropy = 0.0
        for count in cluster_counts.values():
            p = count / total
            if p > 0:
                entropy -= p * np.log(p)
        
        return entropy
    
    def _interpret_entropy(self, entropy: float, num_clusters: int) -> str:
        """Provide human-readable interpretation."""
        if entropy < 0.3:
            return "High confidence - model responses are very consistent"
        elif entropy < 0.5:
            return "Moderate confidence - some variation in responses"
        elif entropy < 0.7:
            return "Low confidence - significant disagreement between responses"
        else:
            return "Very low confidence - model is highly uncertain"
    
    def adaptive_sampling(
        self,
        initial_entropy: float,
        initial_k: int = 3,
        max_k: int = 8
    ) -> int:
        """
        Determine if more samples are needed.
        
        If entropy is near the decision boundary, sample more for confidence.
        
        Args:
            initial_entropy: Entropy from initial samples
            initial_k: Number of initial samples
            max_k: Maximum samples to collect
            
        Returns:
            Number of additional samples needed
        """
        # If clearly safe or clearly suspicious, no need for more samples
        if initial_entropy < 0.4 or initial_entropy > 0.6:
            return 0
        
        # Near boundary (0.4-0.6) - get more samples
        additional = min(max_k - initial_k, 5)
        return additional


# Utility function for easy integration
async def check_semantic_entropy(
    question: str,
    openai_key: str,
    model: str = "gpt-4o-mini",
    k: int = 5
) -> Dict:
    """
    Convenience function to check semantic entropy.
    
    Usage:
        result = await check_semantic_entropy(
            "What is the capital of France?",
            openai_key="sk-..."
        )
        
        if result["suspicious"]:
            print(f"⚠️ High entropy: {result['semantic_entropy']}")
    """
    detector = SemanticEntropyDetector()
    return await detector.detect(question, openai_key=openai_key, model=model, k=k)