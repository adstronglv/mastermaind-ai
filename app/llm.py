"""
LLM abstraction layer - supports Anthropic (Cloud) and Ollama (On-Premise).
Toggle via LLM_PROVIDER env variable: "anthropic" or "ollama"
"""

import os
import re
import httpx
from fastapi import HTTPException


def chat(system: str, messages: list[dict], max_tokens: int = 1500) -> str:
    """Send a chat completion request to the configured LLM provider.

    Returns the text content of the response.
    """
    provider = os.getenv("LLM_PROVIDER", "anthropic")

    if provider == "ollama":
        return _chat_ollama(system, messages, max_tokens)
    else:
        return _chat_anthropic(system, messages, max_tokens)


def _chat_anthropic(system: str, messages: list[dict], max_tokens: int) -> str:
    """Call Anthropic Claude API."""
    import anthropic
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model=os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
        max_tokens=max_tokens,
        system=system,
        messages=messages
    )
    return response.content[0].text


def _chat_ollama(system: str, messages: list[dict], max_tokens: int) -> str:
    """Call Ollama local API (OpenAI-compatible)."""
    url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "qwen3:14b")

    # Qwen3 uses thinking mode which consumes extra tokens for reasoning.
    # Triple the budget so enough tokens remain for the actual response.
    ollama_max_tokens = max_tokens * 3

    ollama_messages = [{"role": "system", "content": system}] + messages

    try:
        response = httpx.post(
            f"{url}/v1/chat/completions",
            json={
                "model": model,
                "messages": ollama_messages,
                "max_tokens": ollama_max_tokens,
                "temperature": 0.7,
            },
            timeout=120.0
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        # Qwen3 may wrap response in <think>...</think> tags — strip them
        content = re.sub(r"<think>.*?</think>\s*", "", content, flags=re.DOTALL)
        return content if content else response.json()["choices"][0]["message"].get("reasoning", "")
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama not running at {url}. Start with: ollama serve"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")


def get_provider_info() -> dict:
    """Return current LLM provider info (for UI badge)."""
    provider = os.getenv("LLM_PROVIDER", "anthropic")
    if provider == "ollama":
        return {
            "provider": "ollama",
            "model": os.getenv("OLLAMA_MODEL", "qwen3:14b"),
            "mode": "on-premise"
        }
    return {
        "provider": "anthropic",
        "model": os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
        "mode": "cloud"
    }
