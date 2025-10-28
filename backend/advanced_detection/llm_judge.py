"""
LLM-as-Judge - Factuality Scoring Layer

Uses a strong LLM to judge the factuality and grounding of responses.
More accurate than heuristics, aligns well with human judgment.

Based on: G-Eval (EMNLP 2023) and LLM-as-Judge surveys
"""

import json
from typing import Dict, List, Optional
import httpx
import asyncio


class LLMJudge:
    """
    Uses an LLM to score factuality of responses.
    
    Key insight: Strong LLMs can reliably judge factuality when given
    proper rubrics, often matching or exceeding human agreement.
    """
    
    JUDGE_PROMPT_TEMPLATE = """You are a factuality judge. Evaluate the Answer's factuality and grounding.

Score from 0.0 to 1.0:
- 1.0 = Fully supported by context, internally consistent, specific and verifiable
- 0.7 = Mostly supported with minor unsupported details
- 0.5 = Partially supported or contains unverifiable claims
- 0.3 = Largely unsupported or contradicts context
- 0.0 = Contradicted by context or clearly fabricated

Evaluation criteria:
1. **Grounding**: Are claims supported by the provided context?
2. **Internal consistency**: Does the answer contradict itself?
3. **Entity correctness**: Are names, dates, numbers accurate?
4. **Citation quality**: Are sources/evidence properly referenced?
5. **Confidence calibration**: Does hedging match claim strength?

Context:
{context}

Answer to evaluate:
{answer}

Respond ONLY with valid JSON in this exact format:
{{"score": <float between 0.0 and 1.0>, "rationale": "<1-2 sentence explanation>", "issues": ["<issue1>", "<issue2>"]}}
"""

    def __init__(
        self,
        judge_model: str = "gpt-4o-mini",
        temperature: float = 0.0
    ):
        """
        Initialize the judge.
        
        Args:
            judge_model: Model to use for judging (stronger = better)
            temperature: Keep at 0.0 for consistency
        """
        self.judge_model = judge_model
        self.temperature = temperature
    
    async def judge(
        self,
        answer: str,
        context: Optional[List[str]] = None,
        openai_key: str = None
    ) -> Dict:
        """
        Judge the factuality of an answer.
        
        Args:
            answer: The LLM response to evaluate
            context: List of context chunks (RAG sources) or None
            openai_key: OpenAI API key
            
        Returns:
            Dict with score, rationale, issues, and verdict
        """
        # Format context
        context_str = self._format_context(context)
        
        # Build prompt
        prompt = self.JUDGE_PROMPT_TEMPLATE.format(
            context=context_str,
            answer=answer
        )
        
        # Call judge model
        try:
            response = await self._call_judge(prompt, openai_key)
            result = self._parse_response(response)
            
            # Add verdict
            result["verdict"] = self._get_verdict(result["score"])
            result["judge_model"] = self.judge_model
            
            return result
            
        except Exception as e:
            print(f"Warning: Judge failed: {e}")
            return {
                "score": 0.5,
                "rationale": f"Judge failed: {str(e)}",
                "issues": [],
                "verdict": "unknown",
                "judge_model": self.judge_model
            }
    
    async def _call_judge(self, prompt: str, api_key: str) -> str:
        """Call the judge model."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.judge_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a factuality evaluation expert. Respond only with valid JSON."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": self.temperature,
                    "max_tokens": 300
                }
            )
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    def _format_context(self, context: Optional[List[str]]) -> str:
        """Format context for the prompt."""
        if not context:
            return "No context provided"
        
        formatted = []
        for i, chunk in enumerate(context[:5], 1):  # Limit to top 5
            formatted.append(f"[{i}] {chunk}")
        
        return "\n\n".join(formatted)
    
    def _parse_response(self, response: str) -> Dict:
        """Parse JSON response from judge."""
        try:
            # Try to extract JSON if wrapped in markdown
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            
            result = json.loads(response.strip())
            
            # Validate structure
            if "score" not in result:
                raise ValueError("Missing 'score' field")
            
            # Ensure score is in range
            result["score"] = max(0.0, min(1.0, float(result["score"])))
            
            # Ensure required fields
            result.setdefault("rationale", "No rationale provided")
            result.setdefault("issues", [])
            
            return result
            
        except Exception as e:
            print(f"Warning: Failed to parse judge response: {e}")
            print(f"Raw response: {response}")
            return {
                "score": 0.5,
                "rationale": "Failed to parse judge response",
                "issues": []
            }
    
    def _get_verdict(self, score: float) -> str:
        """Convert score to verdict."""
        if score >= 0.8:
            return "trusted"
        elif score >= 0.6:
            return "acceptable"
        elif score >= 0.4:
            return "review_required"
        else:
            return "reject"
    
    async def batch_judge(
        self,
        answers: List[str],
        contexts: List[Optional[List[str]]],
        openai_key: str
    ) -> List[Dict]:
        """
        Judge multiple answers in parallel.
        
        Args:
            answers: List of answers to judge
            contexts: List of context lists (one per answer)
            openai_key: OpenAI API key
            
        Returns:
            List of judgment results
        """
        tasks = []
        for answer, context in zip(answers, contexts):
            task = self.judge(answer, context, openai_key)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        processed = []
        for result in results:
            if isinstance(result, Exception):
                processed.append({
                    "score": 0.5,
                    "rationale": f"Error: {str(result)}",
                    "issues": [],
                    "verdict": "unknown"
                })
            else:
                processed.append(result)
        
        return processed


# Utility function
async def judge_factuality(
    answer: str,
    context: Optional[List[str]],
    openai_key: str,
    judge_model: str = "gpt-4o-mini"
) -> Dict:
    """
    Convenience function to judge factuality.
    
    Usage:
        result = await judge_factuality(
            answer="Paris is the capital of France",
            context=["France is a country in Europe. Paris is its capital."],
            openai_key="sk-..."
        )
        
        if result["verdict"] == "reject":
            print(f"⚠️ Low score: {result['score']}")
            print(f"Issues: {result['issues']}")
    """
    judge = LLMJudge(judge_model=judge_model)
    return await judge.judge(answer, context, openai_key)