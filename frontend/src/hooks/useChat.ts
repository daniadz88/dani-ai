// src/hooks/useChat.ts

import {useState, useCallback, useRef} from "react";
import type {ChatMessage, DisplayMessage, ProfileKey} from "../types";
import {sendChat} from "../lib/api";
import {supabase} from "../lib/supabase";

let msgIdx = 1;
const nowStr = () => new Date().toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"});

// Generate UUID sederhana
const genId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useChat(initialProfile: ProfileKey = "pentest") {
    const [profile, setProfileState] = useState<ProfileKey>(initialProfile);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const history = useRef<ChatMessage[]>([]);
    // Session ID untuk Supabase — baru di-generate saat pesan pertama dikirim
    const sessionId = useRef<string | null>(null);

    const addDisplay = useCallback((type: DisplayMessage["type"], text: string) => {
        const msg: DisplayMessage = {
            id: `msg-${msgIdx++}`,
            type,
            text,
            time: nowStr(),
        };
        setMessages((prev) => [...prev, msg]);
        return msg.id;
    }, []);

    // ── Simpan / update session ke Supabase ──────────────────────────────────
    const saveSession = useCallback(
        async (allHistory: ChatMessage[], currentProfile: ProfileKey, firstUserMsg: string) => {
            try {
                const {
                    data: {user},
                } = await supabase.auth.getUser();
                if (!user) return; // tidak login, skip

                if (!sessionId.current) {
                    sessionId.current = genId();
                }

                await supabase.from("chat_sessions").upsert({
                    id: sessionId.current,
                    user_id: user.id,
                    title: firstUserMsg.slice(0, 80),
                    profile: currentProfile,
                    messages: allHistory,
                    updated_at: new Date().toISOString(),
                });
            } catch (e) {
                // Jangan crash app kalau save gagal
                console.warn("Save session failed:", e);
            }
        },
        []
    );

    // ── Switch profile ────────────────────────────────────────────────────────
    const switchProfile = useCallback(
        (p: ProfileKey) => {
            setProfileState(p);
            history.current = [];
            sessionId.current = null; // mulai session baru saat ganti profile
            addDisplay("system", `Profile diubah ke **${p}**. History direset.`);
        },
        [addDisplay]
    );

    // ── Clear messages (New Chat) ─────────────────────────────────────────────
    const clearMessages = useCallback(() => {
        setMessages([]);
        history.current = [];
        sessionId.current = null; // session baru
    }, []);

    // ── Send ──────────────────────────────────────────────────────────────────
    const send = useCallback(
        async (input: string) => {
            const text = input.trim();
            if (!text || isLoading) return;

            // Catat pesan pertama untuk judul session
            const isFirstMessage = history.current.length === 0;
            const firstMsg = isFirstMessage ? text : history.current[0]?.content ?? text;

            addDisplay("user", text);
            setIsLoading(true);

            try {
                const data = await sendChat(text, profile, history.current);

                history.current.push({role: "user", content: text});
                history.current.push({role: "assistant", content: data.reply});
                if (history.current.length > 20) history.current = history.current.slice(-20);

                addDisplay("ai", data.reply);

                // Simpan ke Supabase (fire-and-forget, tidak block UI)
                saveSession(history.current, profile, firstMsg);
            } catch (e: any) {
                addDisplay("system", `❌ ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, profile, addDisplay, saveSession]
    );

    return {messages, isLoading, profile, switchProfile, send, clearMessages};
}
