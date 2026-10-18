"""In-memory sliding-window rate limiter for the public AI endpoints.

Good enough for a single-instance portfolio backend. Behind several workers or
instances, swap it for a shared store (e.g. Redis) — the interface stays the same.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from .config import Settings, get_settings

_WINDOWS = ((60, "minute"), (86_400, "day"))


class RateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str, per_minute: int, per_day: int) -> None:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > 86_400:
                hits.popleft()
            limits = {"minute": per_minute, "day": per_day}
            for window, name in _WINDOWS:
                recent = sum(1 for t in hits if now - t <= window)
                if recent >= limits[name]:
                    oldest = next(t for t in hits if now - t <= window)
                    retry = max(1, int(window - (now - oldest)))
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit reached ({limits[name]} per {name}). Try again in {retry}s.",
                        headers={"Retry-After": str(retry)},
                    )
            hits.append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = RateLimiter()


def client_key(request: Request, settings: Settings) -> str:
    if settings.trust_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(request: Request, s: Annotated[Settings, Depends(get_settings)]) -> None:
    """FastAPI dependency for the AI endpoints."""
    limiter.check(client_key(request, s), s.rate_limit_per_minute, s.rate_limit_per_day)
