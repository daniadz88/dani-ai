// frontend/src/lib/api.ts

// Simple detection - jangan pakai window.location untuk local
const isLocalDev = import.meta.env.DEV;
const BASE = isLocalDev 
    ? 'http://localhost:3001/api'  // Local development
    : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

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
    try {
        const res = await fetch(`${BASE}/health`, {
            method: "GET",
            headers: {"Content-Type": "application/json"},
        });
        if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
        return res.json();
    } catch (error) {
        console.error("Health check error:", error);
        throw error;
    }
}

export async function sendChat(
    message: string,
    profile: string,
    history: {role: string; content: string; imageUrl?: string}[],
    imageBase64?: string,
    token?: string          // ← tambah ini
): Promise<ChatResponse> {
    const payload: any = { message, profile, history };
    if (imageBase64) {
    payload.image = imageBase64;
    payload.hasImage = true;
    if (imageBase64.length > 500000) payload.compress = true;
    }

    const headers: Record<string, string> = {
    "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`; // ← tambah ini

    const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    });

    if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
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