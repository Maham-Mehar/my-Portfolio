"""Read-only access to the exported portfolio data (backend/app/data/portfolio.json)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .schemas import Interest, Level, Project, ProjectMatch, Role, SkillGroup

DATA_FILE = Path(__file__).resolve().parent / "data" / "portfolio.json"


@lru_cache
def load() -> dict[str, Any]:
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def projects() -> list[Project]:
    return [Project.model_validate(p) for p in load()["projects"]]


def roles() -> list[Role]:
    return [Role.model_validate(r) for r in load()["experience"]]


def skill_groups(level: Level | None = None) -> list[SkillGroup]:
    groups = [SkillGroup.model_validate(g) for g in load()["skill_groups"]]
    if level is None:
        return groups
    filtered = [g.model_copy(update={"skills": [s for s in g.skills if s.level == level]}) for g in groups]
    return [g for g in filtered if g.skills]


def search_projects(query: str | None, interest: Interest | None) -> list[ProjectMatch]:
    """Case-insensitive search across a project's text fields; ranked by how many fields match."""
    terms = [t for t in (query or "").lower().split() if t]
    matches: list[ProjectMatch] = []
    for p in projects():
        if interest and interest not in p.interests:
            continue
        fields = [
            p.title,
            p.category,
            p.summary,
            " ".join(p.stack),
            " ".join(p.focus),
            " ".join(p.contributions),
            " ".join(f"{d.label} {d.text}" for d in p.details),
        ]
        score = sum(1 for f in fields if all(t in f.lower() for t in terms)) if terms else 1
        if score:
            matches.append(
                ProjectMatch(id=p.id, title=p.title, category=p.category, summary=p.summary, stack=p.stack, score=score)
            )
    return sorted(matches, key=lambda m: m.score, reverse=True)
