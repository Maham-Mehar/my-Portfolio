"""Pydantic models — every request is validated here before any handler logic runs."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

# ── Portfolio data ────────────────────────────────────────────────────────────

Level = Literal["core", "working", "growing"]
Interest = Literal["frontend", "dashboards", "api", "marketplace", "backend"]


class Skill(BaseModel):
    name: str
    level: Level | None = None


class SkillGroup(BaseModel):
    id: str
    title: str
    description: str
    skills: list[Skill]


class ProjectDetail(BaseModel):
    label: str
    text: str


class Project(BaseModel):
    id: str
    title: str
    category: str
    summary: str
    context: str | None = None
    contributions: list[str]
    details: list[ProjectDetail]
    focus: list[str]
    stack: list[str]
    interests: list[Interest]
    links: dict[str, str]
    has_screenshot: bool


class ProjectMatch(BaseModel):
    id: str
    title: str
    category: str
    summary: str
    stack: list[str]
    score: int = Field(description="Number of fields that matched the query.")


class ProjectSearchResponse(BaseModel):
    query: str | None
    interest: Interest | None
    count: int
    results: list[ProjectMatch]


class Role(BaseModel):
    id: str
    company: str
    role: str
    start: str
    end: str
    summary: str
    points: list[str]
    tags: list[str]


class Profile(BaseModel):
    name: str | None
    role: str
    availability: str | None
    email: str | None
    socials: dict[str, str | None]
    resume_available: bool
    current_role: Role | None
    counts: dict[str, int]


# ── Health ────────────────────────────────────────────────────────────────────


class LLMStatus(BaseModel):
    configured: bool
    provider: str | None
    model: str | None


class Health(BaseModel):
    status: Literal["ok"]
    version: str
    llm: LLMStatus


# ── Assistant ─────────────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1200)

    @field_validator("content")
    @classmethod
    def strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be blank.")
        return v


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def last_is_user(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("The last message must come from the user.")
        if len(self.messages[-1].content) > 500:
            raise ValueError("Questions are limited to 500 characters.")
        return self


# ── Lab: prompt → UI concept ──────────────────────────────────────────────────

SectionKind = Literal[
    "navbar", "hero", "stats", "card-grid", "list", "form", "table", "chart", "tabs", "cta", "footer", "sidebar"
]


class UIConceptRequest(BaseModel):
    idea: str = Field(min_length=8, max_length=240, description="A short description of an interface.")

    @field_validator("idea")
    @classmethod
    def strip(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 8:
            raise ValueError("Describe the interface in a few more words.")
        return v


class UISection(BaseModel):
    kind: SectionKind
    title: str = Field(max_length=60)
    items: list[str] = Field(default_factory=list, max_length=6)
    note: str = Field(default="", max_length=140)

    @field_validator("items")
    @classmethod
    def clip_items(cls, v: list[str]) -> list[str]:
        return [item.strip()[:40] for item in v if item.strip()]


class UISpec(BaseModel):
    """A constrained, declarative UI description. The frontend renders it from
    whitelisted components — nothing generated is ever executed as code."""

    title: str = Field(max_length=60)
    summary: str = Field(max_length=220)
    layout: Literal["single-column", "sidebar", "split", "dashboard"]
    sections: list[UISection] = Field(min_length=2, max_length=7)
    accessibility: list[str] = Field(default_factory=list, max_length=4)
    components: list[str] = Field(default_factory=list, max_length=8, description="Suggested React components.")


class ErrorBody(BaseModel):
    detail: str
    code: str
