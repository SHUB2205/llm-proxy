"""
Multi-Provider LLM Support
Supports OpenAI, Anthropic Claude, Google Gemini, DeepSeek, and more
"""

import httpx
import os
from typing import Dict, Any, Optional
from openai import OpenAI
try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    import google.generativeai as genai
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False


class LLMProvider:
    """Base class for LLM providers"""
    
    @staticmethod
    def detect_provider(model: str) -> str:
        """Detect which provider to use based on model name"""
        model_lower = model.lower()
        
        if any(x in model_lower for x in ['gpt', 'openai', 'o1', 'o3']):
            return 'openai'
        elif any(x in model_lower for x in ['claude', 'anthropic']):
            return 'anthropic'
        elif any(x in model_lower for x in ['gemini', 'palm', 'bard']):
            return 'google'
        elif 'deepseek' in model_lower:
            return 'deepseek'
        elif any(x in model_lower for x in ['llama', 'mistral', 'mixtral']):
            return 'openrouter'  # Can route to various open models
        else:
            return 'openai'  # Default to OpenAI
    
    @staticmethod
    async def call_llm(
        provider: str,
        model: str,
        messages: list,
        api_key: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Universal LLM caller that works with multiple providers
        Returns standardized response format
        """
        
        if provider == 'openai':
            return await LLMProvider._call_openai(model, messages, api_key, **kwargs)
        elif provider == 'anthropic':
            return await LLMProvider._call_anthropic(model, messages, api_key, **kwargs)
        elif provider == 'google':
            return await LLMProvider._call_google(model, messages, api_key, **kwargs)
        elif provider == 'deepseek':
            return await LLMProvider._call_deepseek(model, messages, api_key, **kwargs)
        elif provider == 'openrouter':
            return await LLMProvider._call_openrouter(model, messages, api_key, **kwargs)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    @staticmethod
    async def _call_openai(model: str, messages: list, api_key: str, **kwargs) -> Dict[str, Any]:
        """Call OpenAI API"""
        client = OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )
        
        return {
            'provider': 'openai',
            'model': model,
            'content': response.choices[0].message.content,
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            },
            'raw_response': response.model_dump()
        }
    
    @staticmethod
    async def _call_anthropic(model: str, messages: list, api_key: str, **kwargs) -> Dict[str, Any]:
        """Call Anthropic Claude API"""
        if not ANTHROPIC_AVAILABLE:
            raise ImportError("Anthropic library not installed. Run: pip install anthropic")
        
        client = Anthropic(api_key=api_key)
        
        # Convert OpenAI format to Anthropic format
        system_message = None
        anthropic_messages = []
        
        for msg in messages:
            if msg['role'] == 'system':
                system_message = msg['content']
            else:
                anthropic_messages.append({
                    'role': msg['role'],
                    'content': msg['content']
                })
        
        # Call Anthropic API
        response = client.messages.create(
            model=model,
            max_tokens=kwargs.get('max_tokens', 1024),
            system=system_message if system_message else None,
            messages=anthropic_messages
        )
        
        return {
            'provider': 'anthropic',
            'model': model,
            'content': response.content[0].text,
            'usage': {
                'prompt_tokens': response.usage.input_tokens,
                'completion_tokens': response.usage.output_tokens,
                'total_tokens': response.usage.input_tokens + response.usage.output_tokens
            },
            'raw_response': response.model_dump()
        }
    
    @staticmethod
    async def _call_google(model: str, messages: list, api_key: str, **kwargs) -> Dict[str, Any]:
        """Call Google Gemini API"""
        if not GOOGLE_AVAILABLE:
            raise ImportError("Google Generative AI library not installed. Run: pip install google-generativeai")
        
        genai.configure(api_key=api_key)
        model_instance = genai.GenerativeModel(model)
        
        # Convert messages to Gemini format
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        
        response = model_instance.generate_content(prompt)
        
        return {
            'provider': 'google',
            'model': model,
            'content': response.text,
            'usage': {
                'prompt_tokens': 0,  # Google doesn't provide token counts easily
                'completion_tokens': 0,
                'total_tokens': 0
            },
            'raw_response': {'text': response.text}
        }
    
    @staticmethod
    async def _call_deepseek(model: str, messages: list, api_key: str, **kwargs) -> Dict[str, Any]:
        """Call DeepSeek API (OpenAI-compatible)"""
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1"
        )
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )
        
        return {
            'provider': 'deepseek',
            'model': model,
            'content': response.choices[0].message.content,
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            },
            'raw_response': response.model_dump()
        }
    
    @staticmethod
    async def _call_openrouter(model: str, messages: list, api_key: str, **kwargs) -> Dict[str, Any]:
        """Call OpenRouter API (supports Llama, Mistral, etc.)"""
        client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )
        
        return {
            'provider': 'openrouter',
            'model': model,
            'content': response.choices[0].message.content,
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            },
            'raw_response': response.model_dump()
        }


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
    'openrouter': [
        'meta-llama/llama-3.1-70b-instruct', 'mistralai/mixtral-8x7b-instruct',
        'anthropic/claude-3-opus', 'google/gemini-pro-1.5'
    ]
}
