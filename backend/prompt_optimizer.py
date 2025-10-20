"""
Prompt Optimization Engine
Core mission: Make AI reliable enough for mission-critical business operations
"""

import re
from typing import Dict, List, Tuple
from dataclasses import dataclass


@dataclass
class PromptIssue:
    """Represents an issue found in a prompt"""
    issue_type: str
    severity: str  # critical, high, medium, low
    description: str
    suggestion: str
    example: str


@dataclass
class OptimizedPrompt:
    """Result of prompt optimization"""
    original_prompt: str
    optimized_prompt: str
    issues_found: List[PromptIssue]
    reliability_score: float  # 0.0 to 1.0
    improvements: List[str]


class PromptOptimizer:
    """
    Analyzes prompts and suggests improvements to reduce hallucinations
    """
    
    def __init__(self):
        self.hallucination_triggers = self._load_hallucination_triggers()
        self.best_practices = self._load_best_practices()
    
    def _load_hallucination_triggers(self) -> Dict:
        """Common patterns that trigger hallucinations"""
        return {
            "vague_questions": [
                r"\bwhat do you think\b",
                r"\bmaybe\b",
                r"\bpossibly\b",
                r"\bcould you\b",
            ],
            "open_ended": [
                r"^tell me about",
                r"^explain",
                r"^describe",
            ],
            "speculation_requests": [
                r"\bpredict\b",
                r"\bguess\b",
                r"\bspeculate\b",
                r"\bwhat if\b",
            ],
            "missing_context": [
                r"^(?!.*context)(?!.*background)(?!.*given).*",  # No context provided
            ],
            "ambiguous_pronouns": [
                r"\bit\b",
                r"\bthey\b",
                r"\bthem\b",
                r"\bthis\b",
                r"\bthat\b",
            ]
        }
    
    def _load_best_practices(self) -> Dict:
        """Best practices for reliable prompts"""
        return {
            "specificity": {
                "description": "Be specific about what you want",
                "template": "Instead of 'Tell me about X', use 'List 3 specific facts about X with sources'"
            },
            "constraints": {
                "description": "Add explicit constraints",
                "template": "Add: 'Only use information from [source]. If uncertain, say \"I don't know\"'"
            },
            "format": {
                "description": "Specify output format",
                "template": "Add: 'Format your response as: 1. [fact], 2. [fact], 3. [fact]'"
            },
            "verification": {
                "description": "Request verification",
                "template": "Add: 'For each fact, provide a confidence level (high/medium/low)'"
            },
            "boundaries": {
                "description": "Set clear boundaries",
                "template": "Add: 'If you don't have reliable information, respond with: \"Insufficient data\"'"
            }
        }
    
    def analyze_prompt(self, prompt: str) -> OptimizedPrompt:
        """
        Analyze a prompt and return optimization suggestions
        """
        issues = []
        improvements = []
        
        # Check for vague language
        if self._has_vague_language(prompt):
            issues.append(PromptIssue(
                issue_type="vague_language",
                severity="high",
                description="Prompt contains vague or uncertain language",
                suggestion="Use specific, direct language. Replace 'maybe', 'possibly' with concrete requests.",
                example="Instead of: 'Could you maybe tell me about...'\nUse: 'List 3 specific facts about...'"
            ))
        
        # Check for missing context
        if self._missing_context(prompt):
            issues.append(PromptIssue(
                issue_type="missing_context",
                severity="critical",
                description="Prompt lacks context or background information",
                suggestion="Provide relevant context before asking the question",
                example="Add: 'Given that [context], and considering [constraints]...'"
            ))
        
        # Check for open-ended questions
        if self._is_open_ended(prompt):
            issues.append(PromptIssue(
                issue_type="open_ended",
                severity="medium",
                description="Question is too open-ended, may lead to speculation",
                suggestion="Make the question more specific with clear boundaries",
                example="Instead of: 'Explain AI'\nUse: 'List 5 key components of modern AI systems'"
            ))
        
        # Check for speculation requests
        if self._requests_speculation(prompt):
            issues.append(PromptIssue(
                issue_type="speculation",
                severity="critical",
                description="Prompt asks AI to speculate or predict",
                suggestion="Rephrase to ask for factual information only",
                example="Instead of: 'Predict what will happen...'\nUse: 'Based on historical data, what patterns exist...'"
            ))
        
        # Check for missing output format
        if not self._has_output_format(prompt):
            issues.append(PromptIssue(
                issue_type="no_format",
                severity="medium",
                description="No specific output format requested",
                suggestion="Specify the exact format you want",
                example="Add: 'Respond in this format: 1. [item], 2. [item], 3. [item]'"
            ))
        
        # Check for missing uncertainty handling
        if not self._has_uncertainty_handling(prompt):
            issues.append(PromptIssue(
                issue_type="no_uncertainty_handling",
                severity="high",
                description="No instruction for handling uncertainty",
                suggestion="Tell AI what to do when uncertain",
                example="Add: 'If you're not certain, say \"I don't have reliable information about this\"'"
            ))
        
        # Generate optimized prompt
        optimized = self._generate_optimized_prompt(prompt, issues)
        
        # Calculate reliability score
        reliability_score = self._calculate_reliability_score(prompt, issues)
        
        # Generate improvement list
        improvements = self._generate_improvements(issues)
        
        return OptimizedPrompt(
            original_prompt=prompt,
            optimized_prompt=optimized,
            issues_found=issues,
            reliability_score=reliability_score,
            improvements=improvements
        )
    
    def _has_vague_language(self, prompt: str) -> bool:
        """Check for vague language"""
        vague_words = ["maybe", "possibly", "could you", "might", "perhaps", "kind of", "sort of"]
        return any(word in prompt.lower() for word in vague_words)
    
    def _missing_context(self, prompt: str) -> bool:
        """Check if prompt lacks context"""
        context_indicators = ["given", "context", "background", "considering", "based on"]
        return not any(indicator in prompt.lower() for indicator in context_indicators) and len(prompt.split()) < 15
    
    def _is_open_ended(self, prompt: str) -> bool:
        """Check if question is too open-ended"""
        open_starters = ["tell me about", "explain", "describe", "what do you know about"]
        return any(prompt.lower().startswith(starter) for starter in open_starters)
    
    def _requests_speculation(self, prompt: str) -> bool:
        """Check if prompt asks for speculation"""
        speculation_words = ["predict", "guess", "speculate", "what if", "will happen", "in the future"]
        return any(word in prompt.lower() for word in speculation_words)
    
    def _has_output_format(self, prompt: str) -> bool:
        """Check if output format is specified"""
        format_indicators = ["format", "structure", "list", "numbered", "bullet points", "json", "table"]
        return any(indicator in prompt.lower() for indicator in format_indicators)
    
    def _has_uncertainty_handling(self, prompt: str) -> bool:
        """Check if uncertainty handling is specified"""
        uncertainty_phrases = [
            "if uncertain", "if you don't know", "if unsure",
            "only if confident", "don't guess", "don't speculate"
        ]
        return any(phrase in prompt.lower() for phrase in uncertainty_phrases)
    
    def _generate_optimized_prompt(self, original: str, issues: List[PromptIssue]) -> str:
        """Generate an optimized version of the prompt"""
        optimized = original
        
        # Add context wrapper if missing
        if any(i.issue_type == "missing_context" for i in issues):
            optimized = f"Context: [Provide relevant context here]\n\nQuestion: {optimized}"
        
        # Add output format if missing
        if any(i.issue_type == "no_format" for i in issues):
            optimized += "\n\nFormat your response as:\n1. [Point 1]\n2. [Point 2]\n3. [Point 3]"
        
        # Add uncertainty handling if missing
        if any(i.issue_type == "no_uncertainty_handling" for i in issues):
            optimized += "\n\nImportant: If you're not certain about any information, explicitly state 'I don't have reliable information about this' rather than guessing."
        
        # Add verification request
        optimized += "\n\nFor each point, indicate your confidence level: [High/Medium/Low]"
        
        # Add source request for factual claims
        if "fact" in original.lower() or "information" in original.lower():
            optimized += "\n\nCite sources or indicate if information is based on general knowledge."
        
        return optimized
    
    def _calculate_reliability_score(self, prompt: str, issues: List[PromptIssue]) -> float:
        """Calculate how reliable responses to this prompt will be"""
        base_score = 1.0
        
        # Deduct points for each issue
        severity_penalties = {
            "critical": 0.3,
            "high": 0.2,
            "medium": 0.1,
            "low": 0.05
        }
        
        for issue in issues:
            base_score -= severity_penalties.get(issue.severity, 0.1)
        
        # Bonus for good practices
        if self._has_output_format(prompt):
            base_score += 0.1
        if self._has_uncertainty_handling(prompt):
            base_score += 0.15
        if "specific" in prompt.lower() or "exactly" in prompt.lower():
            base_score += 0.1
        
        return max(0.0, min(1.0, base_score))
    
    def _generate_improvements(self, issues: List[PromptIssue]) -> List[str]:
        """Generate list of actionable improvements"""
        improvements = []
        
        for issue in issues:
            improvements.append(f"✓ {issue.suggestion}")
        
        # Add general best practices
        improvements.extend([
            "✓ Always provide context before asking questions",
            "✓ Specify the exact format you want for the response",
            "✓ Tell the AI what to do when it's uncertain",
            "✓ Use specific, measurable language instead of vague terms",
            "✓ Request confidence levels for each claim",
            "✓ Ask for sources or reasoning behind answers"
        ])
        
        return list(set(improvements))  # Remove duplicates


def get_prompt_templates() -> Dict[str, str]:
    """
    Pre-built prompt templates for common business use cases
    These templates are designed to minimize hallucinations
    """
    return {
        "factual_qa": """Context: {context}

Question: {question}

Instructions:
1. Provide only factual information based on the context above
2. If the answer is not in the context, respond with: "This information is not available in the provided context"
3. Format your response as numbered points
4. For each point, indicate confidence level: [High/Medium/Low]
5. Do not speculate or make assumptions

Response:""",

        "data_analysis": """Data: {data}

Task: {task}

Requirements:
1. Analyze only the data provided above
2. State any assumptions you're making
3. Provide specific numbers and percentages
4. If data is insufficient, state: "Insufficient data to determine [X]"
5. Format findings as: Finding | Evidence | Confidence Level

Analysis:""",

        "decision_support": """Situation: {situation}

Options: {options}

Decision Criteria: {criteria}

Instructions:
1. Evaluate each option against the stated criteria
2. Provide pros and cons for each option
3. Do not recommend an option unless explicitly asked
4. Highlight any missing information needed for a decision
5. Use this format:
   Option: [name]
   Pros: [list]
   Cons: [list]
   Missing Info: [list]

Evaluation:""",

        "content_generation": """Topic: {topic}

Requirements:
- Tone: {tone}
- Length: {length}
- Key points to cover: {key_points}

Constraints:
1. Stick to factual, verifiable information
2. If making a claim, provide reasoning
3. Avoid superlatives unless backed by data
4. If uncertain about a fact, mark it as [Needs Verification]
5. Do not fabricate statistics or quotes

Content:""",

        "code_review": """Code: {code}

Review Focus: {focus_areas}

Instructions:
1. Identify specific issues with line numbers
2. Suggest concrete improvements
3. Only flag actual problems, not style preferences
4. If code is correct, state: "No issues found in [area]"
5. Format: Issue | Line | Severity | Suggestion

Review:""",

        "summarization": """Text to summarize: {text}

Requirements:
1. Extract only key points from the original text
2. Do not add information not present in the source
3. Maintain factual accuracy
4. If text is ambiguous, note: [Original text unclear on this point]
5. Format as bullet points with [High confidence] or [Interpretation] tags

Summary:"""
    }


def analyze_response_reliability(response: str) -> Dict:
    """
    Analyze an AI response for reliability indicators
    """
    reliability_indicators = {
        "hedging_phrases": 0,
        "uncertainty_markers": 0,
        "specific_facts": 0,
        "vague_language": 0,
        "confidence_statements": 0
    }
    
    # Hedging phrases (good - shows appropriate uncertainty)
    hedging = ["may", "might", "could", "possibly", "likely", "probably", "appears to", "seems to"]
    reliability_indicators["hedging_phrases"] = sum(1 for phrase in hedging if phrase in response.lower())
    
    # Uncertainty markers (good - acknowledges limitations)
    uncertainty = ["i don't know", "uncertain", "unclear", "not enough information", "cannot determine"]
    reliability_indicators["uncertainty_markers"] = sum(1 for marker in uncertainty if marker in response.lower())
    
    # Specific facts (good - concrete information)
    has_numbers = bool(re.search(r'\d+', response))
    has_dates = bool(re.search(r'\b(19|20)\d{2}\b', response))
    has_sources = bool(re.search(r'(according to|source:|based on|study|research)', response.lower()))
    reliability_indicators["specific_facts"] = sum([has_numbers, has_dates, has_sources])
    
    # Vague language (bad - indicates potential hallucination)
    vague = ["very", "quite", "rather", "somewhat", "fairly", "pretty", "kind of", "sort of"]
    reliability_indicators["vague_language"] = sum(1 for word in vague if word in response.lower())
    
    # Confidence statements (check if appropriate)
    confidence = ["definitely", "certainly", "absolutely", "without doubt", "guaranteed"]
    reliability_indicators["confidence_statements"] = sum(1 for phrase in confidence if phrase in response.lower())
    
    # Calculate overall reliability score
    score = 0.5  # Start neutral
    score += reliability_indicators["hedging_phrases"] * 0.05
    score += reliability_indicators["uncertainty_markers"] * 0.1
    score += reliability_indicators["specific_facts"] * 0.1
    score -= reliability_indicators["vague_language"] * 0.05
    score -= reliability_indicators["confidence_statements"] * 0.1  # Over-confidence is bad
    
    score = max(0.0, min(1.0, score))
    
    return {
        "reliability_score": score,
        "indicators": reliability_indicators,
        "assessment": "High" if score > 0.7 else "Medium" if score > 0.4 else "Low",
        "concerns": _generate_concerns(reliability_indicators)
    }


def _generate_concerns(indicators: Dict) -> List[str]:
    """Generate list of reliability concerns"""
    concerns = []
    
    if indicators["vague_language"] > 3:
        concerns.append("Response contains excessive vague language")
    
    if indicators["confidence_statements"] > 2:
        concerns.append("Response shows overconfidence without supporting evidence")
    
    if indicators["specific_facts"] == 0:
        concerns.append("Response lacks specific, verifiable facts")
    
    if indicators["uncertainty_markers"] == 0 and indicators["hedging_phrases"] == 0:
        concerns.append("Response shows no appropriate uncertainty - may be overconfident")
    
    return concerns
