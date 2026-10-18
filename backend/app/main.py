"""Portfolio API — a small FastAPI service behind the portfolio's AI features.

Run locally:   uvicorn app.main:app --reload --port 8000   (from backend/)
Docs:          http://localhost:8000/docs
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Path, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import ValidationError

from . import llm, portfolio, prompts
from .config import Settings, get_settings
from .ratelimit import rate_limit
from .schemas import (
    ChatRequest,
    ErrorBody,
    Health,
    Interest,
    Level,
    LLMStatus,
    Profile,
    Project,
    ProjectSearchResponse,
    SkillGroup,
    UIConceptRequest,
    UISpec,
)

VERSION = "1.0.0"
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(
    title="Portfolio API",
    version=VERSION,
    description=(
        "The backend behind the portfolio's AI features: structured portfolio data, project search, "
        "a grounded LLM assistant and a prompt-to-UI concept generator. Built with FastAPI and Pydantic."
    ),
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=600,
)

AI_ERRORS = {
    422: {"description": "Validation error"},
    429: {"model": ErrorBody, "description": "Rate limit reached"},
    502: {"model": ErrorBody, "description": "AI provider error"},
    503: {"model": ErrorBody, "description": "AI not configured or provider busy"},
    504: {"model": ErrorBody, "description": "AI provider timed out"},
}


def error(status_code: int, detail: str, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": detail, "code": code})


@app.exception_handler(HTTPException)
async def http_error(_: Request, exc: HTTPException) -> JSONResponse:
    codes = {404: "not_found", 429: "rate_limited"}
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": codes.get(exc.status_code, "error")},
        headers=exc.headers,
    )


def require_llm(s: Annotated[Settings, Depends(get_settings)]) -> Settings:
    if not s.llm_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI assistant isn't configured on this server yet.",
        )
    return s


# ── Health & data ─────────────────────────────────────────────────────────────


@app.get("/health", response_model=Health, tags=["meta"])
def health(s: Annotated[Settings, Depends(get_settings)]) -> Health:
    """Liveness plus whether an LLM provider is configured (never reveals keys)."""
    return Health(
        status="ok",
        version=VERSION,
        llm=LLMStatus(
            configured=s.llm_configured,
            provider=s.llm_provider or None if s.llm_configured else None,
            model=s.llm_model if s.llm_configured else None,
        ),
    )


@app.get("/api/profile", response_model=Profile, tags=["portfolio"])
def profile() -> Profile:
    """Who this portfolio belongs to, current role and content counts."""
    data = portfolio.load()
    roles = portfolio.roles()
    owner = data["owner"]
    return Profile(
        name=owner["name"],
        role=owner["role"],
        availability=owner["availability"],
        email=owner["email"],
        socials=owner["socials"],
        resume_available=owner["resume_available"],
        current_role=roles[0] if roles else None,
        counts={
            "projects": len(data["projects"]),
            "roles": len(roles),
            "skills": sum(len(g["skills"]) for g in data["skill_groups"]),
        },
    )


@app.get("/api/skills", response_model=list[SkillGroup], tags=["portfolio"])
def skills(
    level: Annotated[Level | None, Query(description="Only skills at this level. `growing` = currently learning.")] = None,
) -> list[SkillGroup]:
    """Skill groups, optionally filtered by proficiency level."""
    return portfolio.skill_groups(level)


@app.get("/api/projects", response_model=ProjectSearchResponse, tags=["portfolio"])
def search_projects(
    q: Annotated[
        str | None,
        Query(min_length=2, max_length=60, description="Search text, e.g. `api`, `marketplace`, `react`."),
    ] = None,
    interest: Annotated[Interest | None, Query(description="Filter by area of work.")] = None,
) -> ProjectSearchResponse:
    """Search featured projects. Validation rejects queries shorter than 2 or longer than 60 characters (422)."""
    results = portfolio.search_projects(q, interest)
    return ProjectSearchResponse(query=q, interest=interest, count=len(results), results=results)


@app.get("/api/projects/{project_id}", response_model=Project, responses={404: {"model": ErrorBody}}, tags=["portfolio"])
def get_project(project_id: Annotated[str, Path(pattern=r"^[a-z0-9-]{1,40}$")]) -> Project:
    """A single project by id. Unknown ids return 404."""
    for p in portfolio.projects():
        if p.id == project_id:
            return p
    raise HTTPException(status_code=404, detail=f"No project with id '{project_id}'.")


# ── AI ────────────────────────────────────────────────────────────────────────


@app.post(
    "/api/assistant/chat",
    tags=["ai"],
    responses={200: {"content": {"text/plain": {}}, "description": "Streamed answer (plain text)"}, **AI_ERRORS},
    dependencies=[Depends(rate_limit)],
)
async def assistant_chat(body: ChatRequest, s: Annotated[Settings, Depends(require_llm)]):
    """Grounded portfolio Q&A, streamed as plain text.

    The first chunk is awaited before responding, so provider failures still
    return a proper JSON error and status code instead of a broken 200.
    Conversations are not stored or logged.
    """
    stream = llm.stream_chat(s, prompts.assistant_system_prompt(), body.messages)
    try:
        first = await anext(stream)
    except StopAsyncIteration:
        return error(502, "The AI provider returned an empty answer.", "provider_empty")
    except llm.LLMError as exc:
        return error(exc.status, exc.message, exc.code)

    async def relay() -> AsyncIterator[str]:
        yield first
        try:
            async for chunk in stream:
                yield chunk
        except llm.LLMError as exc:
            # Headers are already sent; append a marker the client recognises.
            yield f"\n\n[[error]] {exc.message}"

    return StreamingResponse(
        relay(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


@app.post("/api/lab/ui-concept", response_model=UISpec, tags=["ai"], responses=AI_ERRORS, dependencies=[Depends(rate_limit)])
async def ui_concept(body: UIConceptRequest, s: Annotated[Settings, Depends(require_llm)]):
    """Turn a short interface idea into a validated, declarative UI spec.

    The model's output must pass the `UISpec` schema; the frontend renders it
    from whitelisted components, so generated content is never executed.
    """
    last_error: ValidationError | None = None
    for _ in range(2):  # one retry if the model returns an invalid spec
        try:
            raw = await llm.complete_json(s, prompts.UI_CONCEPT_SYSTEM, body.idea)
        except llm.LLMError as exc:
            return error(exc.status, exc.message, exc.code)
        try:
            return UISpec.model_validate_json(raw)
        except ValidationError as exc:
            last_error = exc
    logging.getLogger("portfolio.lab").warning("Invalid UI spec from model: %s", last_error)
    return error(502, "The model returned a concept that didn't pass validation. Please try again.", "invalid_spec")
