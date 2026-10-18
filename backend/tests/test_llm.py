"""Provider wire-format tests: real SSE/JSON payloads through httpx.MockTransport."""

from __future__ import annotations

import asyncio
import json
from dataclasses import replace

import httpx
import pytest

from app import llm
from app.config import get_settings
from app.schemas import ChatMessage

BASE = get_settings()
OPENAI = replace(BASE, llm_provider="openai", llm_api_key="sk-test", llm_model="m", openai_base_url="https://api.test/v1")
GEMINI = replace(BASE, llm_provider="gemini", llm_api_key="g-test", llm_model="gm")
MSGS = [ChatMessage(role="user", content="Hello there")]


def sse(events: list[dict | str]) -> bytes:
    lines = [f"data: {e if isinstance(e, str) else json.dumps(e)}\n\n" for e in events]
    return "".join(lines).encode()


@pytest.fixture
def transport(monkeypatch):
    """Route every httpx.AsyncClient through a handler the test supplies."""
    holder: dict = {}
    real = httpx.AsyncClient

    def factory(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(lambda req: holder["handler"](req))
        return real(*args, **kwargs)

    monkeypatch.setattr(llm.httpx, "AsyncClient", factory)
    return holder


async def collect(settings) -> str:
    return "".join([chunk async for chunk in llm.stream_chat(settings, "system", MSGS)])


def test_openai_stream_parsing(transport):
    seen = {}

    def handler(req: httpx.Request):
        seen["url"] = str(req.url)
        seen["auth"] = req.headers["authorization"]
        seen["body"] = json.loads(req.content)
        body = sse([
            {"choices": [{"delta": {"role": "assistant"}}]},
            {"choices": [{"delta": {"content": "Hel"}}]},
            {"choices": [{"delta": {"content": "lo"}}]},
            "[DONE]",
        ])
        return httpx.Response(200, content=body, headers={"content-type": "text/event-stream"})

    transport["handler"] = handler
    assert asyncio.run(collect(OPENAI)) == "Hello"
    assert seen["url"] == "https://api.test/v1/chat/completions"
    assert seen["auth"] == "Bearer sk-test"
    assert seen["body"]["messages"][0] == {"role": "system", "content": "system"}
    assert seen["body"]["stream"] is True


def test_gemini_stream_parsing(transport):
    seen = {}

    def handler(req: httpx.Request):
        seen["url"] = str(req.url)
        seen["key"] = req.headers["x-goog-api-key"]
        seen["body"] = json.loads(req.content)
        body = sse([
            {"candidates": [{"content": {"parts": [{"text": "Hi "}]}}]},
            {"candidates": [{"content": {"parts": [{"text": "there"}]}}]},
        ])
        return httpx.Response(200, content=body, headers={"content-type": "text/event-stream"})

    transport["handler"] = handler
    assert asyncio.run(collect(GEMINI)) == "Hi there"
    assert seen["url"].endswith("/models/gm:streamGenerateContent?alt=sse")
    assert seen["key"] == "g-test"
    assert seen["body"]["systemInstruction"]["parts"][0]["text"] == "system"
    assert seen["body"]["contents"][0]["role"] == "user"


@pytest.mark.parametrize(
    ("status", "code"),
    [(401, "provider_auth"), (429, "provider_busy"), (404, "provider_model"), (500, "provider_error")],
)
def test_provider_errors_are_mapped_without_leaking(transport, status, code):
    transport["handler"] = lambda req: httpx.Response(status, json={"error": {"message": "secret internal detail"}})
    with pytest.raises(llm.LLMError) as info:
        asyncio.run(collect(OPENAI))
    assert info.value.code == code
    assert "secret" not in info.value.message


def test_timeout_maps_to_504(transport):
    def handler(req):
        raise httpx.ReadTimeout("slow", request=req)

    transport["handler"] = handler
    with pytest.raises(llm.LLMError) as info:
        asyncio.run(collect(OPENAI))
    assert info.value.status == 504


def test_complete_json_both_providers(transport):
    transport["handler"] = lambda req: httpx.Response(200, json={"choices": [{"message": {"content": '{"a":1}'}}]})
    assert asyncio.run(llm.complete_json(OPENAI, "s", "u")) == '{"a":1}'
    transport["handler"] = lambda req: httpx.Response(
        200, json={"candidates": [{"content": {"parts": [{"text": '{"b":2}'}]}}]}
    )
    assert asyncio.run(llm.complete_json(GEMINI, "s", "u")) == '{"b":2}'
