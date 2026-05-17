// src/hooks/useChat.ts

import {useState, useCallback, useRef} from "react";
import type {ChatMessage, DisplayMessage, ProfileKey} from "../types";
import {sendChat} from "../lib/api";
import {supabase} from "../lib/supabase";

let msgIdx = 1;
const nowStr = () => new Date().toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"});

const genId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useChat(initialProfile: ProfileKey = "pentest") {
    const [profile, setProfileState] = useState<ProfileKey>(initialProfile);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const history = useRef<ChatMessage[]>([]);
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

                // user.id sudah UUID — langsung pakai
                const {error} = await supabase.from("chat_sessions").upsert({
                    id: sessionId.current,
                    user_id: user.id, // UUID, bukan TEXT
                    title: firstUserMsg.slice(0, 80),
                    profile: currentProfile,
                    messages: allHistory,
                    updated_at: new Date().toISOString(),
                });

                if (error) console.warn("Supabase upsert error:", error.message);
            } catch (e) {
                console.warn("Save session failed:", e);
            }
        },
        []
    );

    // ── Load session dari history ─────────────────────────────────────────────
    const loadSession = useCallback(async (id: string) => {
        try {
            const {data, error} = await supabase.from("chat_sessions").select("*").eq("id", id).single();

            if (error || !data) {
                console.warn("Load session error:", error?.message);
                return;
            }

            // Restore state
            sessionId.current = data.id;
            history.current = data.messages ?? [];
            setProfileState(data.profile as ProfileKey);

            // Restore display messages dari history
            const restored: DisplayMessage[] = [];
            for (const msg of history.current) {
                if (msg.role === "user" || msg.role === "assistant") {
                    restored.push({
                        id: `msg-${msgIdx++}`,
                        type: msg.role === "user" ? "user" : "ai",
                        text: msg.content,
                        time: "",
                    });
                }
            }
            setMessages(restored);
        } catch (e) {
            console.warn("loadSession failed:", e);
        }
    }, []);

    // ── Switch profile ────────────────────────────────────────────────────────
    const switchProfile = useCallback(
        (p: ProfileKey) => {
            setProfileState(p);
            history.current = [];
            sessionId.current = null;
            addDisplay("system", `Profile diubah ke **${p}**. History direset.`);
        },
        [addDisplay]
    );

    // ── Clear messages (New Chat) ─────────────────────────────────────────────
    const clearMessages = useCallback(() => {
        setMessages([]);
        history.current = [];
        sessionId.current = null;
    }, []);

    // ── Send ──────────────────────────────────────────────────────────────────
    const send = useCallback(
        async (input: string) => {
            const text = input.trim();
            if (!text || isLoading) return;

            const isFirstMessage = history.current.length === 0;
            const firstMsg = isFirstMessage ? text : history.current[0]?.content ?? text;

            addDisplay("user", text);
            setIsLoading(true);

            try {
                const data = await sendChat(text, profile, history.current);

                history.current.push({role: "user", content: text});
                history.current.push({role: "assistant", content: data.reply});
                if (history.current.length > 40) history.current = history.current.slice(-40);

                addDisplay("ai", data.reply);

                // Fire-and-forget — tidak block UI
                saveSession(history.current, profile, firstMsg);
            } catch (e: any) {
                addDisplay("system", `❌ ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, profile, addDisplay, saveSession]
    );

    return {messages, isLoading, profile, switchProfile, send, clearMessages, loadSession};
}
