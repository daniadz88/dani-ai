/// <reference types="vite/client" />

import type {ChatMessage, ChatResponse} from "../types";

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

export async function sendChat(message: string, profile: string, history: ChatMessage[]): Promise<ChatResponse> {
    const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message, profile, history}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? data.error ?? "Server error");
    return data as ChatResponse;
}

export async function checkHealth() {
    const res = await fetch(`${BASE}/health`);
    return res.json();
}

export async function getSessions(token: string) {
    const res = await fetch(`${BASE}/history`, {
        headers: {Authorization: `Bearer ${token}`},
    });
    if (!res.ok) return [];
    return res.json();
}

export async function deleteSession(sessionId: string, token: string) {
    const res = await fetch(`${BASE}/history/${sessionId}`, {
        method: "DELETE",
        headers: {Authorization: `Bearer ${token}`},
    });
    return res.ok;
}
