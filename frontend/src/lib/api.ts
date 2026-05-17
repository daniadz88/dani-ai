// frontend/src/lib/api.ts

// ── Base URL ──────────────────────────────────────────────────────────────
// Di development: proxy Vite ke localhost:3001
// Di production (Vercel): pakai env variable VITE_API_URL
const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

// ── Types ─────────────────────────────────────────────────────────────────
export interface HealthResponse {
    status: string;
    model: string;
    api_key: "set" | "missing";
}

export interface ChatResponse {
    reply: string;
    profile: string;
    model: string;
}

// ── Health check ──────────────────────────────────────────────────────────
export async function checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${BASE}/health`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    });
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
}

// ── Send chat ─────────────────────────────────────────────────────────────
export async function sendChat(
    message: string,
    profile: string,
    history: {role: string; content: string}[]
): Promise<ChatResponse> {
    const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message, profile, history}),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({error: `HTTP ${res.status}`}));
        throw new Error(err.error || `Request failed: ${res.status}`);
    }

    return res.json();
}
