/**
 * Client for the portfolio's FastAPI backend (see backend/).
 * Configure with NEXT_PUBLIC_API_URL; when unset, AI features show a setup
 * state and the assistant falls back to its local answer engine.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || null;

export interface Health {
  status: "ok";
  version: string;
  llm: { configured: boolean; provider: string | null; model: string | null };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

async function toError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as { detail?: unknown; code?: string };
    // FastAPI validation errors arrive as a list of issues.
    const detail = Array.isArray(body.detail)
      ? (body.detail as Array<{ msg?: string }>)
          .map((d) => d.msg)
          .filter(Boolean)
          .join("; ")
      : String(body.detail ?? res.statusText);
    return new ApiError(detail || `Request failed (${res.status})`, res.status, body.code ?? "error");
  } catch {
    return new ApiError(`Request failed (${res.status})`, res.status, "error");
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  if (!API_URL) throw new ApiError("The backend isn't configured.", 0, "no_backend");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init?.timeoutMs ?? 30_000);
  init?.signal?.addEventListener("abort", () => controller.abort());
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) throw await toError(res);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") throw new ApiError("The request timed out.", 0, "timeout");
    throw new ApiError("Couldn't reach the backend.", 0, "unreachable");
  } finally {
    clearTimeout(timer);
  }
}

let healthPromise: Promise<Health | null> | null = null;

/** Cached per page load; resolves null when the backend is missing or unreachable. */
export function getHealth(): Promise<Health | null> {
  if (!API_URL) return Promise.resolve(null);
  healthPromise ??= apiFetch<Health>("/health", { timeoutMs: 6000 }).catch(() => {
    healthPromise = null; // allow a later retry
    return null;
  });
  return healthPromise;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const ERROR_MARKER = "[[error]]";

/** Streams the assistant's answer as text chunks. Throws ApiError on failure. */
export async function* streamChat(messages: ChatTurn[], signal?: AbortSignal): AsyncGenerator<string> {
  if (!API_URL) throw new ApiError("The backend isn't configured.", 0, "no_backend");
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError("Couldn't reach the backend.", 0, "unreachable");
  }
  if (!res.ok || !res.body) throw await toError(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const marker = pending.indexOf(ERROR_MARKER);
    if (marker !== -1) {
      if (marker > 0) yield pending.slice(0, marker).trimEnd();
      throw new ApiError(
        pending.slice(marker + ERROR_MARKER.length).trim() || "The answer was interrupted.",
        502,
        "interrupted",
      );
    }
    // Hold back a few chars in case the marker is split across chunks.
    const safe = pending.length - ERROR_MARKER.length;
    if (safe > 0) {
      yield pending.slice(0, safe);
      pending = pending.slice(safe);
    }
  }
  pending += decoder.decode();
  if (pending) yield pending;
}

/** Opens the portfolio assistant and asks a question (used by project cards, etc.). */
export function askAssistant(question: string) {
  window.dispatchEvent(new CustomEvent<string>("assistant:ask", { detail: question }));
}
