"""Provider-agnostic LLM client over plain HTTP (httpx) — no vendor SDKs.

Supported via LLM_PROVIDER:
  • "openai" — the OpenAI Chat Completions API, or any OpenAI-compatible
    endpoint (set OPENAI_BASE_URL, e.g. for Groq, OpenRouter, Together, Ollama).
  • "gemini" — the Google Gemini API (generativelanguage.googleapis.com).

Provider errors are logged server-side and surfaced to visitors as short,
non-revealing messages.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Literal

import httpx

from .config import Settings
from .schemas import ChatMessage

log = logging.getLogger("portfolio.llm")

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"


class LLMError(Exception):
    """A failure that is safe to describe to a visitor."""

    def __init__(self, status: int, message: str, code: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message
        self.code = code


def _raise_for_provider(resp: httpx.Response, body: str) -> None:
    log.warning("LLM provider returned %s: %s", resp.status_code, body[:500])
    if resp.status_code in (401, 403):
        raise LLMError(502, "The AI provider rejected the server's credentials.", "provider_auth")
    if resp.status_code == 429:
        raise LLMError(503, "The AI provider is busy right now. Please try again shortly.", "provider_busy")
    if resp.status_code == 404:
        raise LLMError(502, "The configured AI model wasn't found.", "provider_model")
    raise LLMError(502, "The AI provider returned an error.", "provider_error")


def _timeout(settings: Settings) -> httpx.Timeout:
    return httpx.Timeout(settings.llm_timeout_seconds, connect=8.0)


# ── Request builders ──────────────────────────────────────────────────────────


def _openai_request(settings: Settings, system: str, messages: list[ChatMessage], *, stream: bool, json_mode: bool):
    body: dict = {
        "model": settings.llm_model,
        "messages": [{"role": "system", "content": system}, *[m.model_dump() for m in messages]],
        "max_completion_tokens": settings.max_output_tokens,
        "stream": stream,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    headers = {"Authorization": f"Bearer {settings.llm_api_key}"}
    return f"{settings.openai_base_url}/chat/completions", headers, body


def _gemini_request(settings: Settings, system: str, messages: list[ChatMessage], *, stream: bool, json_mode: bool):
    method = "streamGenerateContent?alt=sse" if stream else "generateContent"
    config: dict = {"maxOutputTokens": settings.max_output_tokens}
    if json_mode:
        config["responseMimeType"] = "application/json"
    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [
            {"role": "model" if m.role == "assistant" else "user", "parts": [{"text": m.content}]} for m in messages
        ],
        "generationConfig": config,
    }
    headers = {"x-goog-api-key": settings.llm_api_key or ""}
    return f"{GEMINI_BASE}/models/{settings.llm_model}:{method}", headers, body


def _request(settings: Settings, *args, **kwargs):
    builder = _gemini_request if settings.llm_provider == "gemini" else _openai_request
    return builder(settings, *args, **kwargs)


def _delta_text(provider: Literal["openai", "gemini"] | str, event: dict) -> str:
    if provider == "gemini":
        parts = (event.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts)
    choice = (event.get("choices") or [{}])[0]
    return (choice.get("delta") or {}).get("content") or ""


# ── Public API ────────────────────────────────────────────────────────────────


async def stream_chat(settings: Settings, system: str, messages: list[ChatMessage]) -> AsyncIterator[str]:
    """Yield text deltas as the provider streams them (Server-Sent Events on both APIs)."""
    url, headers, body = _request(settings, system, messages, stream=True, json_mode=False)
    try:
        async with httpx.AsyncClient(timeout=_timeout(settings)) as client:
            async with client.stream("POST", url, headers=headers, json=body) as resp:
                if resp.status_code >= 400:
                    _raise_for_provider(resp, (await resp.aread()).decode(errors="replace"))
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if not data or data == "[DONE]":
                        continue
                    try:
                        text = _delta_text(settings.llm_provider, json.loads(data))
                    except json.JSONDecodeError:
                        continue
                    if text:
                        yield text
    except httpx.TimeoutException as exc:
        raise LLMError(504, "The AI provider took too long to respond.", "provider_timeout") from exc
    except httpx.HTTPError as exc:
        log.warning("LLM transport error: %s", exc)
        raise LLMError(502, "Couldn't reach the AI provider.", "provider_unreachable") from exc


async def complete_json(settings: Settings, system: str, user: str) -> str:
    """One-shot completion in the provider's JSON mode; returns the raw JSON string."""
    messages = [ChatMessage(role="user", content=user)]
    url, headers, body = _request(settings, system, messages, stream=False, json_mode=True)
    try:
        async with httpx.AsyncClient(timeout=_timeout(settings)) as client:
            resp = await client.post(url, headers=headers, json=body)
    except httpx.TimeoutException as exc:
        raise LLMError(504, "The AI provider took too long to respond.", "provider_timeout") from exc
    except httpx.HTTPError as exc:
        log.warning("LLM transport error: %s", exc)
        raise LLMError(502, "Couldn't reach the AI provider.", "provider_unreachable") from exc
    if resp.status_code >= 400:
        _raise_for_provider(resp, resp.text)
    data = resp.json()
    if settings.llm_provider == "gemini":
        parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts)
    return ((data.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
