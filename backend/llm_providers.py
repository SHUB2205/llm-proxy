"""
Multi-Provider LLM Support
Async httpx adapters that return OpenAI-compatible JSON responses.
Supports OpenAI, Anthropic Claude, Google Gemini, DeepSeek.
"""

import httpx
import os
import time
import uuid
from typing import Dict, Any, Optional, Tuple


# ============================================
# Provider Detection
# ============================================

def detect_provider(model: str) -> str:
    """Detect which provider to use based on model name"""
    model_lower = model.lower()

    if any(x in model_lower for x in ['gpt', 'o1', 'o3', 'o4']):
        return 'openai'
    elif any(x in model_lower for x in ['claude']):
        return 'anthropic'
    elif any(x in model_lower for x in ['gemini']):
        return 'google'
    elif 'deepseek' in model_lower:
        return 'deepseek'
    else:
        return 'openai'  # Default to OpenAI


def get_provider_api_key(provider: str, user_api_key: Optional[str] = None) -> str:
    """
    Resolve the API key for a provider.
    Priority: user's stored key (for openai) > platform env var > error
    """
    if provider == 'openai':
        return user_api_key or os.getenv("OPENAI_API_KEY", "")
    elif provider == 'anthropic':
        return os.getenv("ANTHROPIC_API_KEY", "")
    elif provider == 'google':
        return os.getenv("GEMINI_API_KEY", "")
    elif provider == 'deepseek':
        return os.getenv("DEEPSEEK_API_KEY", "")
    return ""


# ============================================
# Cost Pricing (per 1K tokens)
# ============================================

COST_PER_1K = {
    # OpenAI
    "gpt-4o":            {"input": 0.0025, "output": 0.01},
    "gpt-4o-mini":       {"input": 0.00015, "output": 0.0006},
    "gpt-4-turbo":       {"input": 0.01, "output": 0.03},
    "gpt-4":             {"input": 0.03, "output": 0.06},
    "gpt-3.5-turbo":     {"input": 0.0005, "output": 0.0015},
    "o1-preview":        {"input": 0.015, "output": 0.06},
    "o1-mini":           {"input": 0.003, "output": 0.012},
    "o3-mini":           {"input": 0.003, "output": 0.012},
    # Anthropic
    "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
    "claude-3-5-haiku-20241022":  {"input": 0.001, "output": 0.005},
    "claude-3-opus-20240229":     {"input": 0.015, "output": 0.075},
    "claude-3-sonnet-20240229":   {"input": 0.003, "output": 0.015},
    "claude-3-haiku-20240307":    {"input": 0.00025, "output": 0.00125},
    # Google Gemini
    "gemini-2.0-flash-exp": {"input": 0.0, "output": 0.0},
    "gemini-1.5-pro":       {"input": 0.00125, "output": 0.005},
    "gemini-1.5-flash":     {"input": 0.000075, "output": 0.0003},
    "gemini-pro":           {"input": 0.0005, "output": 0.0015},
    # DeepSeek
    "deepseek-chat":  {"input": 0.00014, "output": 0.00028},
    "deepseek-coder": {"input": 0.00014, "output": 0.00028},
}


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculate USD cost for a request"""
    costs = COST_PER_1K.get(model, {"input": 0.001, "output": 0.002})
    return (prompt_tokens / 1000 * costs["input"]) + (completion_tokens / 1000 * costs["output"])


# ============================================
# Async Provider Adapters (httpx)
# All return OpenAI-compatible chat completions JSON
# ============================================

async def call_provider(
    provider: str,
    model: str,
    body: dict,
    api_key: str,
    timeout: float = 60.0,
) -> Dict[str, Any]:
    """
    Route to the correct provider adapter.
    Returns OpenAI-compatible chat completions JSON.
    """
    if provider == 'openai':
        return await _call_openai(model, body, api_key, timeout)
    elif provider == 'anthropic':
        return await _call_anthropic(model, body, api_key, timeout)
    elif provider == 'google':
        return await _call_google(model, body, api_key, timeout)
    elif provider == 'deepseek':
        return await _call_deepseek(model, body, api_key, timeout)
    else:
        raise ValueError(f"Unsupported provider: {provider}")


async def _call_openai(model: str, body: dict, api_key: str, timeout: float) -> Dict[str, Any]:
    """Forward request to OpenAI — already OpenAI-compatible, pass through."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            json=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )
    if resp.status_code != 200:
        raise ProviderError("openai", resp.status_code, resp.text)
    return resp.json()


async def _call_anthropic(model: str, body: dict, api_key: str, timeout: float) -> Dict[str, Any]:
    """
    Convert OpenAI-format request to Anthropic Messages API,
    call Anthropic, then normalize response back to OpenAI format.
    """
    messages = body.get("messages", [])

    # Extract system message (Anthropic handles it separately)
    system_text = None
    anthropic_messages = []
    for msg in messages:
        if msg.get("role") == "system":
            system_text = msg.get("content", "")
        else:
            anthropic_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })

    # Build Anthropic request body
    anthropic_body: Dict[str, Any] = {
        "model": model,
        "max_tokens": body.get("max_tokens", 1024),
        "messages": anthropic_messages,
    }
    if system_text:
        anthropic_body["system"] = system_text
    if body.get("temperature") is not None:
        anthropic_body["temperature"] = body["temperature"]
    if body.get("top_p") is not None:
        anthropic_body["top_p"] = body["top_p"]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            json=anthropic_body,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )
    if resp.status_code != 200:
        raise ProviderError("anthropic", resp.status_code, resp.text)

    data = resp.json()

    # Normalize to OpenAI format
    content = ""
    if data.get("content"):
        content = "".join(
            block.get("text", "") for block in data["content"] if block.get("type") == "text"
        )

    input_tokens = data.get("usage", {}).get("input_tokens", 0)
    output_tokens = data.get("usage", {}).get("output_tokens", 0)

    return {
        "id": data.get("id", f"chatcmpl-{uuid.uuid4().hex[:12]}"),
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": content,
                },
                "finish_reason": _map_anthropic_stop(data.get("stop_reason")),
            }
        ],
        "usage": {
            "prompt_tokens": input_tokens,
            "completion_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
        },
        "_provider": "anthropic",
    }


async def _call_google(model: str, body: dict, api_key: str, timeout: float) -> Dict[str, Any]:
    """
    Convert OpenAI-format request to Gemini generateContent API,
    then normalize response back to OpenAI format.
    """
    messages = body.get("messages", [])

    # Convert to Gemini contents format
    contents = []
    system_instruction = None
    for msg in messages:
        role = msg.get("role", "user")
        text = msg.get("content", "")
        if role == "system":
            system_instruction = text
            continue
        gemini_role = "model" if role == "assistant" else "user"
        contents.append({
            "role": gemini_role,
            "parts": [{"text": text}],
        })

    gemini_body: Dict[str, Any] = {"contents": contents}

    if system_instruction:
        gemini_body["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    # Generation config
    gen_config: Dict[str, Any] = {}
    if body.get("temperature") is not None:
        gen_config["temperature"] = body["temperature"]
    if body.get("max_tokens") is not None:
        gen_config["maxOutputTokens"] = body["max_tokens"]
    if body.get("top_p") is not None:
        gen_config["topP"] = body["top_p"]
    if gen_config:
        gemini_body["generationConfig"] = gen_config

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            json=gemini_body,
            headers={"Content-Type": "application/json"},
            timeout=timeout,
        )
    if resp.status_code != 200:
        raise ProviderError("google", resp.status_code, resp.text)

    data = resp.json()

    # Extract text from Gemini response
    content = ""
    candidates = data.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        content = "".join(p.get("text", "") for p in parts)

    # Token usage from usageMetadata
    usage_meta = data.get("usageMetadata", {})
    prompt_tokens = usage_meta.get("promptTokenCount", 0)
    completion_tokens = usage_meta.get("candidatesTokenCount", 0)

    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": content,
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
        },
        "_provider": "google",
    }


async def _call_deepseek(model: str, body: dict, api_key: str, timeout: float) -> Dict[str, Any]:
    """DeepSeek is OpenAI-compatible, just different base URL."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.deepseek.com/v1/chat/completions",
            json=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )
    if resp.status_code != 200:
        raise ProviderError("deepseek", resp.status_code, resp.text)
    result = resp.json()
    result["_provider"] = "deepseek"
    return result


# ============================================
# Helpers
# ============================================

def _map_anthropic_stop(stop_reason: Optional[str]) -> str:
    """Map Anthropic stop_reason to OpenAI finish_reason"""
    mapping = {
        "end_turn": "stop",
        "max_tokens": "length",
        "stop_sequence": "stop",
    }
    return mapping.get(stop_reason, "stop")


class ProviderError(Exception):
    """Raised when an upstream provider returns an error"""
    def __init__(self, provider: str, status_code: int, detail: str):
        self.provider = provider
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"{provider} API error ({status_code}): {detail}")


# Supported models mapping
SUPPORTED_MODELS = {
    'openai': [
        'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo',
        'o1-preview', 'o1-mini', 'o3-mini'
    ],
    'anthropic': [
        'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'
    ],
    'google': [
        'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'
    ],
    'deepseek': [
        'deepseek-chat', 'deepseek-coder'
    ],
}
