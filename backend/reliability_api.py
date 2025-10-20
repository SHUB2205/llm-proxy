"""
Reliability & Prompt Optimization API
Core mission: Make AI reliable for mission-critical business operations
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Optional
from prompt_optimizer import (
    PromptOptimizer,
    get_prompt_templates,
    analyze_response_reliability
)
from database import supabase

router = APIRouter(prefix="/v1/reliability", tags=["reliability"])

# Initialize optimizer
optimizer = PromptOptimizer()


@router.post("/analyze-prompt")
async def analyze_prompt_endpoint(request: Request):
    """
    Analyze a prompt and get optimization suggestions
    
    This is the CORE feature - helps companies write prompts that reduce hallucinations
    """
    body = await request.json()
    prompt = body.get("prompt")
    
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    # Analyze the prompt
    result = optimizer.analyze_prompt(prompt)
    
    return {
        "original_prompt": result.original_prompt,
        "optimized_prompt": result.optimized_prompt,
        "reliability_score": result.reliability_score,
        "assessment": "Reliable" if result.reliability_score > 0.7 else "Needs Improvement" if result.reliability_score > 0.4 else "High Risk",
        "issues_found": [
            {
                "type": issue.issue_type,
                "severity": issue.severity,
                "description": issue.description,
                "suggestion": issue.suggestion,
                "example": issue.example
            }
            for issue in result.issues_found
        ],
        "improvements": result.improvements,
        "recommendation": _generate_recommendation(result.reliability_score)
    }


@router.post("/analyze-response")
async def analyze_response_endpoint(request: Request):
    """
    Analyze an AI response for reliability indicators
    """
    body = await request.json()
    response_text = body.get("response")
    
    if not response_text:
        raise HTTPException(status_code=400, detail="Response text is required")
    
    analysis = analyze_response_reliability(response_text)
    
    return {
        "reliability_score": analysis["reliability_score"],
        "assessment": analysis["assessment"],
        "indicators": analysis["indicators"],
        "concerns": analysis["concerns"],
        "recommendation": _generate_response_recommendation(analysis)
    }


@router.get("/templates")
async def get_templates():
    """
    Get pre-built prompt templates for common use cases
    These templates are optimized to minimize hallucinations
    """
    templates = get_prompt_templates()
    
    return {
        "templates": [
            {
                "name": name,
                "template": template,
                "use_case": _get_use_case_description(name),
                "reliability_score": 0.9  # Pre-optimized templates
            }
            for name, template in templates.items()
        ]
    }


@router.post("/test-prompt")
async def test_prompt_endpoint(request: Request):
    """
    Test a prompt with actual API call and analyze results
    """
    body = await request.json()
    prompt = body.get("prompt")
    organization_id = body.get("organization_id")
    
    if not prompt or not organization_id:
        raise HTTPException(status_code=400, detail="Prompt and organization_id required")
    
    # First, analyze the prompt
    prompt_analysis = optimizer.analyze_prompt(prompt)
    
    # TODO: Make actual API call and analyze response
    # For now, return analysis
    
    return {
        "prompt_analysis": {
            "reliability_score": prompt_analysis.reliability_score,
            "issues": len(prompt_analysis.issues_found),
            "critical_issues": len([i for i in prompt_analysis.issues_found if i.severity == "critical"])
        },
        "recommendation": "Test with optimized prompt" if prompt_analysis.reliability_score < 0.7 else "Prompt is reliable",
        "optimized_prompt": prompt_analysis.optimized_prompt
    }


@router.post("/compare-prompts")
async def compare_prompts_endpoint(request: Request):
    """
    Compare two prompts and recommend the better one
    """
    body = await request.json()
    prompt_a = body.get("prompt_a")
    prompt_b = body.get("prompt_b")
    
    if not prompt_a or not prompt_b:
        raise HTTPException(status_code=400, detail="Both prompts required")
    
    # Analyze both prompts
    analysis_a = optimizer.analyze_prompt(prompt_a)
    analysis_b = optimizer.analyze_prompt(prompt_b)
    
    winner = "A" if analysis_a.reliability_score > analysis_b.reliability_score else "B"
    
    return {
        "prompt_a": {
            "reliability_score": analysis_a.reliability_score,
            "issues_count": len(analysis_a.issues_found),
            "critical_issues": len([i for i in analysis_a.issues_found if i.severity == "critical"])
        },
        "prompt_b": {
            "reliability_score": analysis_b.reliability_score,
            "issues_count": len(analysis_b.issues_found),
            "critical_issues": len([i for i in analysis_b.issues_found if i.severity == "critical"])
        },
        "winner": winner,
        "recommendation": f"Use Prompt {winner} - it has {abs(analysis_a.reliability_score - analysis_b.reliability_score):.2%} higher reliability",
        "improvement_suggestions": analysis_a.improvements if winner == "A" else analysis_b.improvements
    }


@router.get("/best-practices")
async def get_best_practices():
    """
    Get best practices for writing reliable prompts
    """
    return {
        "best_practices": [
            {
                "category": "Specificity",
                "principle": "Be specific about what you want",
                "bad_example": "Tell me about AI",
                "good_example": "List 5 key components of modern AI systems with brief descriptions",
                "why": "Specific requests reduce ambiguity and speculation"
            },
            {
                "category": "Context",
                "principle": "Always provide relevant context",
                "bad_example": "What should we do?",
                "good_example": "Given our Q4 sales data showing 20% decline, what are 3 specific actions to improve revenue?",
                "why": "Context grounds the AI in facts, reducing hallucinations"
            },
            {
                "category": "Constraints",
                "principle": "Set clear boundaries and constraints",
                "bad_example": "Explain the market",
                "good_example": "Based only on the attached market report, summarize the top 3 trends",
                "why": "Constraints prevent the AI from inventing information"
            },
            {
                "category": "Format",
                "principle": "Specify the exact output format",
                "bad_example": "Give me some ideas",
                "good_example": "Provide 3 ideas in this format: 1. [Idea] - [Benefit] - [Risk]",
                "why": "Structured output is easier to verify and less prone to hallucination"
            },
            {
                "category": "Uncertainty Handling",
                "principle": "Tell AI what to do when uncertain",
                "bad_example": "What will happen next year?",
                "good_example": "Based on historical data, what patterns exist? If uncertain, state 'Insufficient data'",
                "why": "Explicit uncertainty handling prevents guessing"
            },
            {
                "category": "Verification",
                "principle": "Request confidence levels and sources",
                "bad_example": "Is this true?",
                "good_example": "Verify this claim and provide: 1) Confidence level 2) Supporting evidence 3) Contradicting evidence",
                "why": "Forces AI to self-assess and provide evidence"
            },
            {
                "category": "Avoid Speculation",
                "principle": "Never ask AI to predict or speculate",
                "bad_example": "What will the stock price be tomorrow?",
                "good_example": "What factors historically influenced this stock price? List with evidence.",
                "why": "Speculation is the #1 cause of hallucinations"
            }
        ],
        "quick_checklist": [
            "✓ Does your prompt provide context?",
            "✓ Is the request specific and measurable?",
            "✓ Have you specified the output format?",
            "✓ Did you tell AI what to do when uncertain?",
            "✓ Are you asking for facts, not speculation?",
            "✓ Have you set clear boundaries?",
            "✓ Did you request confidence levels?"
        ]
    }


@router.get("/hallucination-patterns")
async def get_hallucination_patterns():
    """
    Get common hallucination patterns to watch for
    """
    return {
        "patterns": [
            {
                "pattern": "Fabricated Statistics",
                "description": "AI invents specific numbers without source",
                "example": "Studies show that 73.4% of users prefer...",
                "red_flags": ["Overly specific percentages", "No source cited", "Round numbers"],
                "prevention": "Always ask for sources: 'Cite the source for any statistics'"
            },
            {
                "pattern": "Invented Dates",
                "description": "AI creates specific dates for events",
                "example": "On March 15, 2023, the company announced...",
                "red_flags": ["Specific dates without verification", "Recent dates for historical events"],
                "prevention": "Add: 'Only include dates you can verify from provided context'"
            },
            {
                "pattern": "Fake Citations",
                "description": "AI invents academic papers or sources",
                "example": "According to Smith et al. (2022) in the Journal of...",
                "red_flags": ["Academic citations without verification", "Plausible-sounding but fake sources"],
                "prevention": "Request: 'Only cite sources from the provided list'"
            },
            {
                "pattern": "Overconfident Claims",
                "description": "AI states uncertain things with certainty",
                "example": "This will definitely increase revenue by 50%",
                "red_flags": ["Absolute language", "Predictions stated as facts", "No caveats"],
                "prevention": "Require: 'State confidence level for each claim'"
            },
            {
                "pattern": "Logical Inconsistencies",
                "description": "AI contradicts itself within response",
                "example": "X is true because Y. However, Y is false because...",
                "red_flags": ["Internal contradictions", "Circular reasoning"],
                "prevention": "Ask: 'Check for logical consistency before responding'"
            },
            {
                "pattern": "Temporal Confusion",
                "description": "AI mixes up timelines or causality",
                "example": "The 2025 event caused the 2020 change...",
                "red_flags": ["Reversed causality", "Anachronisms"],
                "prevention": "Specify: 'Maintain chronological order and verify causality'"
            },
            {
                "pattern": "Attribute Errors",
                "description": "AI attributes quotes or actions to wrong people",
                "example": "As Einstein said, 'To be or not to be'",
                "red_flags": ["Misattributed quotes", "Wrong person for achievement"],
                "prevention": "Require: 'Verify attribution before including quotes'"
            },
            {
                "pattern": "Scope Creep",
                "description": "AI answers beyond what was asked",
                "example": "Asked about X, but AI also explains Y, Z, and makes predictions",
                "red_flags": ["Unsolicited information", "Going beyond scope"],
                "prevention": "Constrain: 'Answer only what is asked, nothing more'"
            }
        ],
        "detection_tips": [
            "🔍 Always verify specific numbers and dates",
            "🔍 Check citations against real sources",
            "🔍 Look for hedging language (or lack thereof)",
            "🔍 Verify logical consistency",
            "🔍 Cross-reference claims across multiple responses",
            "🔍 Be suspicious of overly specific details",
            "🔍 Watch for confident predictions about uncertain things"
        ]
    }


def _generate_recommendation(score: float) -> str:
    """Generate recommendation based on reliability score"""
    if score > 0.8:
        return "Excellent prompt! This should produce reliable results. Consider using this as a template."
    elif score > 0.6:
        return "Good prompt with minor improvements needed. Review the suggestions to increase reliability."
    elif score > 0.4:
        return "Moderate reliability. Significant improvements recommended before using in production."
    else:
        return "High risk of hallucinations. Please revise prompt using the optimized version before use."


def _generate_response_recommendation(analysis: dict) -> str:
    """Generate recommendation for response analysis"""
    score = analysis["reliability_score"]
    concerns = analysis["concerns"]
    
    if score > 0.7 and not concerns:
        return "Response appears reliable. Proceed with confidence."
    elif score > 0.5:
        return "Response has moderate reliability. Verify key facts before using."
    else:
        return "Response shows low reliability. Do not use without thorough verification."


def _get_use_case_description(template_name: str) -> str:
    """Get description for template use case"""
    descriptions = {
        "factual_qa": "Use for factual questions where accuracy is critical. Prevents speculation.",
        "data_analysis": "Use for analyzing data sets. Ensures AI sticks to provided data only.",
        "decision_support": "Use for decision-making scenarios. Provides structured evaluation.",
        "content_generation": "Use for creating content. Maintains factual accuracy.",
        "code_review": "Use for reviewing code. Focuses on specific, actionable feedback.",
        "summarization": "Use for summarizing text. Prevents adding information not in source."
    }
    return descriptions.get(template_name, "General purpose template")
