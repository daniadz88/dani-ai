// src/hooks/useChat.ts (sama seperti sebelumnya, tidak perlu sendWithScreenshot)

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

    const addDisplay = useCallback((type: DisplayMessage["type"], text: string, imageUrl?: string) => {
        const msg: DisplayMessage = {
            id: `msg-${msgIdx++}`,
            type,
            text,
            time: nowStr(),
            imageUrl,
        };
        setMessages((prev) => [...prev, msg]);
        return msg.id;
    }, []);

    const saveSession = useCallback(
        async (allHistory: ChatMessage[], currentProfile: ProfileKey, firstUserMsg: string) => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                if (!sessionId.current) sessionId.current = genId();
                const { error } = await supabase.from("chat_sessions").upsert({
                    id: sessionId.current,
                    user_id: user.id,
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

    const loadSession = useCallback(async (id: string) => {
        try {
            const { data, error } = await supabase.from("chat_sessions").select("*").eq("id", id).single();
            if (error || !data) return;
            sessionId.current = data.id;
            history.current = data.messages ?? [];
            setProfileState(data.profile as ProfileKey);
            const restored: DisplayMessage[] = [];
            for (const msg of history.current) {
                if (msg.role === "user" || msg.role === "assistant") {
                    restored.push({
                        id: `msg-${msgIdx++}`,
                        type: msg.role === "user" ? "user" : "ai",
                        text: msg.content,
                        time: "",
                        imageUrl: msg.imageUrl,
                    });
                }
            }
            setMessages(restored);
        } catch (e) {
            console.warn("loadSession failed:", e);
        }
    }, []);

    const switchProfile = useCallback((p: ProfileKey) => {
        setProfileState(p);
        history.current = [];
        sessionId.current = null;
        addDisplay("system", `Profile diubah ke **${p}**. History direset.`);
    }, [addDisplay]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        history.current = [];
        sessionId.current = null;
    }, []);

    const send = useCallback(
        async (input: string, imageBase64?: string) => {
            const text = input.trim();
            if (!text && !imageBase64) return;

            const isFirstMessage = history.current.length === 0;
            const firstMsg = isFirstMessage ? (text || "[Image]") : history.current[0]?.content ?? (text || "[Image]");

            addDisplay("user", text || (imageBase64 ? "[Gambar]" : ""), imageBase64);
            setIsLoading(true);

            try {
                const data = await sendChat(text, profile, history.current, imageBase64);

                history.current.push({role: "user", content: text || "[Image]", imageUrl: imageBase64});
                history.current.push({role: "assistant", content: data.reply});
                if (history.current.length > 40) history.current = history.current.slice(-40);

                addDisplay("ai", data.reply);
                saveSession(history.current, profile, firstMsg);
            } catch (e: any) {
                addDisplay("system", `❌ ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        },
        [profile, addDisplay, saveSession]
    );

    return {messages, isLoading, profile, switchProfile, send, clearMessages, loadSession};
}