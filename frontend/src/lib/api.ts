// frontend/src/lib/api.ts

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

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

export async function checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${BASE}/health`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    });
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
}

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

export async function getSessions(token: string) {
    const res = await fetch(`${BASE}/sessions`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error(`getSessions failed: ${res.status}`);
    const data: unknown = await res.json();
    return data;
}

export async function deleteSession(id: string, token: string) {
    const res = await fetch(`${BASE}/sessions/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error(`deleteSession failed: ${res.status}`);
    return res.json().catch(() => null);
}
