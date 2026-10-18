# Portfolio API (FastAPI)

The small Python service behind the portfolio's AI features.

| Endpoint | What it does |
| --- | --- |
| `GET /health` | Liveness, plus whether an LLM is configured (never exposes the key) |
| `GET /api/profile` | Owner, current role, content counts |
| `GET /api/skills?level=` | Skill groups, optionally filtered (`growing` = currently learning) |
| `GET /api/projects?q=&interest=` | Validated project search (q: 2–60 chars) |
| `GET /api/projects/{id}` | One project, or a 404 |
| `POST /api/assistant/chat` | Grounded portfolio Q&A, **streamed** as plain text (rate-limited) |
| `POST /api/lab/ui-concept` | Interface idea → validated `UISpec` JSON (rate-limited) |

Interactive docs: `http://localhost:8000/docs` (Swagger UI).

## Run locally

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # then fill in the LLM settings (optional)
uvicorn app.main:app --reload --port 8000
pytest -q                      # 31 tests, no network or API key needed
```

Then set `NEXT_PUBLIC_API_URL=http://localhost:8000` in the site's `.env.local` and restart `npm run dev`.

## Configuring the LLM

| Variable | Notes |
| --- | --- |
| `LLM_PROVIDER` | `openai` (OpenAI or any OpenAI-compatible API) or `gemini`. Empty = AI off. |
| `LLM_API_KEY` | Server-side only. Never put it in the Next.js app. |
| `LLM_MODEL` | Pick a current, small chat model from your provider's model list. |
| `OPENAI_BASE_URL` | For OpenAI-compatible providers other than OpenAI (Groq, OpenRouter, Ollama…). |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed by CORS, e.g. `https://your-domain.com`. |
| `RATE_LIMIT_PER_MINUTE` / `RATE_LIMIT_PER_DAY` | Per-IP limits on the AI endpoints (defaults 8 / 60). |
| `LLM_TIMEOUT_SECONDS`, `LLM_MAX_OUTPUT_TOKENS` | Request timeout and answer length cap. |
| `TRUST_PROXY` | `true` only behind a proxy you control that sets `X-Forwarded-For`. |

Without a key, everything except the two AI endpoints works; those return `503` with a clear message and the site shows a labelled setup state.

## How it's built

- **Grounding** — `prompts.py` puts the whole portfolio dataset (it's small) into the system prompt with strict honesty rules. No vector database needed at this size.
- **Single source of truth** — content lives in the site's `data/*.ts`. `npm run export:portfolio` (from the repo root) regenerates `app/data/portfolio.json`. Run it whenever you edit the data files.
- **Providers** — `llm.py` talks to OpenAI-compatible and Gemini APIs over plain HTTP (httpx), streaming Server-Sent Events. Provider errors are logged server-side and returned to visitors as short, non-revealing messages.
- **Streaming with real status codes** — the chat endpoint awaits the first token before responding, so timeouts and auth failures still return proper `5xx` codes.
- **Safe generated UI** — the model's JSON must pass the `UISpec` Pydantic schema (strict enums, length limits; one retry). The browser renders it from whitelisted components only.
- **Abuse protection** — Pydantic input limits (500-char questions, 12-turn history), per-IP rate limiting, timeouts, output token caps, CORS allow-list. Conversations are not stored or logged.

The in-memory rate limiter suits a single instance. If you scale to several, back it with Redis.

## Deploy

Any host that runs a Python web process works (Render, Railway, Fly.io, a small VPS):

- **Build:** `pip install -r requirements.txt`
- **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment:** the variables above, with `ALLOWED_ORIGINS` set to your site's URL.

Then set `NEXT_PUBLIC_API_URL` to the service URL in your frontend host (e.g. Vercel) and redeploy the site.
