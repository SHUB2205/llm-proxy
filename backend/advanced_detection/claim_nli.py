"""
Claim-Level NLI - Explainable Hallucination Detection

Breaks answers into atomic claims and checks each against context using NLI.
Provides fine-grained attribution: which claims are supported/contradicted/unverifiable.

Based on: FActScore and attribution benchmarks
"""

import re
from typing import List, Dict, Optional
from transformers import pipeline
import httpx
import asyncio
import nltk

# Download required NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)


class ClaimNLIDetector:
    """
    Detects hallucinations by checking individual claims against context.
    
    Key insight: Break down the answer into atomic facts, then verify each
    one independently. This pinpoints exactly what's wrong.
    """
    
    def __init__(
        self,
        nli_model: str = "facebook/bart-large-mnli",
        use_llm_extraction: bool = False
    ):
        """
        Initialize the detector.
        
        Args:
            nli_model: HuggingFace NLI model for entailment checking
            use_llm_extraction: If True, use LLM for claim extraction (more accurate but slower)
        """
        self.nli_model = pipeline(
            "text-classification",
            model=nli_model,
            device=-1  # CPU (use 0 for GPU)
        )
        self.use_llm_extraction = use_llm_extraction
    
    async def detect(
        self,
        answer: str,
        context: List[str],
        openai_key: Optional[str] = None
    ) -> Dict:
        """
        Detect hallucinations via claim-level NLI.
        
        Args:
            answer: The LLM response to check
            context: List of context chunks (RAG sources)
            openai_key: OpenAI API key (only needed if use_llm_extraction=True)
            
        Returns:
            Dict with claims, verdicts, support rate, and unsupported claims
        """
        # Extract claims
        if self.use_llm_extraction and openai_key:
            claims = await self._extract_claims_llm(answer, openai_key)
        else:
            claims = self._extract_claims_rule_based(answer)
        
        if not claims:
            return {
                "claims": [],
                "support_rate": 1.0,
                "has_contradiction": False,
                "unsupported_claims": [],
                "num_claims": 0
            }
        
        # Check each claim
        claim_results = []
        for claim in claims:
            # Find best evidence
            evidence = self._find_evidence(claim, context)
            
            # Run NLI
            verdict = self._check_entailment(claim, evidence)
            
            claim_results.append({
                "claim": claim,
                "verdict": verdict["label"],
                "confidence": verdict["confidence"],
                "evidence": evidence
            })
        
        # Aggregate results
        support_rate = sum(1 for r in claim_results if r["verdict"] == "supported") / len(claim_results)
        has_contradiction = any(r["verdict"] == "contradicted" for r in claim_results)
        unsupported = [r for r in claim_results if r["verdict"] != "supported"]
        
        return {
            "claims": claim_results,
            "support_rate": round(support_rate, 4),
            "has_contradiction": has_contradiction,
            "unsupported_claims": unsupported,
            "num_claims": len(claim_results),
            "num_supported": sum(1 for r in claim_results if r["verdict"] == "supported"),
            "num_contradicted": sum(1 for r in claim_results if r["verdict"] == "contradicted"),
            "num_unverifiable": sum(1 for r in claim_results if r["verdict"] == "unverifiable")
        }
    
    def _extract_claims_rule_based(self, answer: str) -> List[str]:
        """
        Extract claims using rule-based approach.
        
        Simple but fast: split into sentences, filter for factual claims.
        """
        # Split into sentences
        sentences = nltk.sent_tokenize(answer)
        
        claims = []
        for sent in sentences:
            # Filter out non-factual sentences
            if self._is_factual_claim(sent):
                claims.append(sent.strip())
        
        return claims
    
    def _is_factual_claim(self, sentence: str) -> bool:
        """Check if sentence contains a factual claim."""
        # Skip questions
        if sentence.strip().endswith('?'):
            return False
        
        # Skip very short sentences
        if len(sentence.split()) < 4:
            return False
        
        # Skip meta-statements
        meta_phrases = [
            "let me", "i will", "here is", "here are",
            "in summary", "in conclusion", "to summarize"
        ]
        if any(phrase in sentence.lower() for phrase in meta_phrases):
            return False
        
        # Must contain at least one of: named entity, number, or date
        has_entity = bool(re.search(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', sentence))
        has_number = bool(re.search(r'\d+', sentence))
        has_date = bool(re.search(r'\b\d{4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b', sentence))
        
        return has_entity or has_number or has_date
    
    async def _extract_claims_llm(self, answer: str, openai_key: str) -> List[str]:
        """
        Extract claims using LLM (more accurate).
        
        Prompt the LLM to break down the answer into atomic factual claims.
        """
        prompt = f"""Extract atomic factual claims from the following text. Each claim should be:
- A single, verifiable fact
- Self-contained (understandable without context)
- Maximum 20 words
- No opinions or subjective statements

Text:
{answer}

Respond with a JSON list of claims:
["claim 1", "claim 2", ...]
"""
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.0,
                        "max_tokens": 500
                    }
                )
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Parse JSON
                import json
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                claims = json.loads(content.strip())
                return claims
                
        except Exception as e:
            print(f"Warning: LLM claim extraction failed: {e}")
            return self._extract_claims_rule_based(answer)
    
    def _find_evidence(self, claim: str, context: List[str]) -> str:
        """
        Find the most relevant evidence for a claim from context.
        
        Uses simple keyword overlap (can be upgraded to semantic search).
        """
        if not context:
            return ""
        
        # Simple keyword matching - combine ALL relevant chunks
        claim_words = set(claim.lower().split())
        
        relevant_chunks = []
        
        for chunk in context:
            chunk_words = set(chunk.lower().split())
            overlap = len(claim_words & chunk_words)
            
            # Include chunks with any overlap
            if overlap > 0:
                relevant_chunks.append((overlap, chunk))
        
        if not relevant_chunks:
            # No overlap found, return all context
            return " ".join(context)
        
        # Sort by relevance and combine top chunks
        relevant_chunks.sort(reverse=True, key=lambda x: x[0])
        top_chunks = [chunk for score, chunk in relevant_chunks[:3]]  # Top 3
        
        return " ".join(top_chunks)
    
    def _check_entailment(self, claim: str, evidence: str) -> Dict:
        """
        Check if evidence entails, contradicts, or is neutral to claim.
        
        Uses NLI model (BART trained on MNLI).
        """
        if not evidence:
            return {
                "label": "unverifiable",
                "confidence": 1.0
            }
        
        # BART-MNLI expects: premise (evidence) + hypothesis (claim)
        # Format: "premise </s></s> hypothesis"
        input_text = f"{evidence} </s></s> {claim}"
        
        try:
            result = self.nli_model(input_text)[0]
            
            # Map NLI labels to our labels
            # BART-MNLI outputs: entailment, neutral, contradiction
            label_map = {
                "entailment": "supported",
                "ENTAILMENT": "supported",
                "contradiction": "contradicted",
                "CONTRADICTION": "contradicted",
                "neutral": "unverifiable",
                "NEUTRAL": "unverifiable"
            }
            
            nli_label = result["label"]
            confidence = result["score"]
            
            # Lower threshold for better detection
            if confidence < 0.5:
                verdict_label = "unverifiable"
            else:
                verdict_label = label_map.get(nli_label, "unverifiable")
            
            return {
                "label": verdict_label,
                "confidence": round(confidence, 4)
            }
        except Exception as e:
            print(f"Warning: NLI check failed: {e}")
            return {
                "label": "unverifiable",
                "confidence": 0.0
            }


# Utility function
async def check_claims(
    answer: str,
    context: List[str],
    openai_key: Optional[str] = None,
    use_llm_extraction: bool = False
) -> Dict:
    """
    Convenience function to check claims.
    
    Usage:
        result = await check_claims(
            answer="Paris is the capital of France. It has 2 million people.",
            context=["France is a country. Paris is its capital with 2.1M population."]
        )
        
        print(f"Support rate: {result['support_rate']}")
        for claim in result['unsupported_claims']:
            print(f"❌ {claim['claim']} - {claim['verdict']}")
    """
    detector = ClaimNLIDetector(use_llm_extraction=use_llm_extraction)
    return await detector.detect(answer, context, openai_key)