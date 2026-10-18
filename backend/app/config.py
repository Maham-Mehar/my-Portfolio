"""Runtime configuration, read from environment variables (and backend/.env in development)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


def _load_env_file(path: Path) -> None:
    """Tiny .env loader (KEY=VALUE per line). Real environment variables always win."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    llm_provider: str
    llm_api_key: str | None
    llm_model: str | None
    openai_base_url: str
    allowed_origins: tuple[str, ...]
    trust_proxy: bool
    rate_limit_per_minute: int
    rate_limit_per_day: int
    llm_timeout_seconds: float
    max_output_tokens: int

    @property
    def llm_configured(self) -> bool:
        return self.llm_provider in {"openai", "gemini"} and bool(self.llm_api_key) and bool(self.llm_model)


@lru_cache
def get_settings() -> Settings:
    _load_env_file(ENV_FILE)
    origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
    return Settings(
        llm_provider=os.environ.get("LLM_PROVIDER", "").strip().lower(),
        llm_api_key=os.environ.get("LLM_API_KEY") or None,
        llm_model=os.environ.get("LLM_MODEL") or None,
        openai_base_url=os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/"),
        allowed_origins=tuple(o.strip() for o in origins.split(",") if o.strip()),
        trust_proxy=os.environ.get("TRUST_PROXY", "false").lower() == "true",
        rate_limit_per_minute=_int("RATE_LIMIT_PER_MINUTE", 8),
        rate_limit_per_day=_int("RATE_LIMIT_PER_DAY", 60),
        llm_timeout_seconds=float(os.environ.get("LLM_TIMEOUT_SECONDS", "25")),
        max_output_tokens=_int("LLM_MAX_OUTPUT_TOKENS", 600),
    )
