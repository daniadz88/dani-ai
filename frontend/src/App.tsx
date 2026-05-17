// src/App.tsx
import {useState, useEffect, useRef, useCallback} from "react";
import {useChat} from "./hooks/useChat";
import {useTimer} from "./hooks/useTimer";
import {MessageBubble} from "./components/MessageBubble";
import {HistoryPanel} from "./components/HistoryPanel";
import {PROFILES, SHORTCUTS} from "./lib/profiles";
import {checkHealth} from "./lib/api";
import {AuthButton} from "./components/AuthButton";
import {supabase} from "./lib/supabase";
import type {ProfileKey} from "./types";
import "./App.css";

// ===================== THEMES =====================
const THEMES = [
    {id: "midnight", label: "Midnight", color: "#6c8ef5"},
    {id: "forest", label: "Forest", color: "#3ddc84"},
    {id: "ocean", label: "Ocean", color: "#4ec9e8"},
    {id: "crimson", label: "Crimson", color: "#f06c6c"},
    {id: "aurora", label: "Aurora", color: "#a78bfa"},
    {id: "sunset", label: "Sunset", color: "#f5a623"},
    {id: "matrix", label: "Matrix", color: "#00ff41"},
    {id: "nord", label: "Nord", color: "#88c0d0"},
    {id: "rose", label: "Rose", color: "#f472b6"},
    {id: "slate", label: "Slate", color: "#94a3b8"},
    {id: "copper", label: "Copper", color: "#cd7f32"},
    {id: "ice", label: "Ice", color: "#3b6ef5"},
    {id: "toxic", label: "Toxic", color: "#aaff00"},
    {id: "void", label: "Void", color: "#ffffff"},
];

function useTheme() {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem("dani-theme") || "midnight";
        } catch {
            return "midnight";
        }
    });
    const [pickerOpen, setPickerOpen] = useState(false);
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem("dani-theme", theme);
        } catch {}
    }, [theme]);
    return {theme, setTheme, pickerOpen, setPickerOpen};
}

// ===================== APP =====================
export default function App() {
    const [input, setInput] = useState("");
    const [connStatus, setConnStatus] = useState<"checking" | "online" | "error">("checking");
    const [msgCount, setMsgCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    const chatBodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const timer = useTimer();
    const {theme, setTheme, pickerOpen, setPickerOpen} = useTheme();
    const {messages, isLoading, profile, switchProfile, send} = useChat("pentest");

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 900);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Supabase auth token
    useEffect(() => {
        supabase.auth.getSession().then(({data}) => {
            setUserToken(data.session?.access_token ?? null);
        });
        const {
            data: {subscription},
        } = supabase.auth.onAuthStateChange((_e, session) => {
            setUserToken(session?.access_token ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Auto scroll
    useEffect(() => {
        const el = chatBodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, isLoading]);

    // Auto focus input
    useEffect(() => {
        if (!isLoading) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isLoading]);

    useEffect(() => {
        setMsgCount(messages.filter((m) => m.type === "user").length);
    }, [messages]);

    // Health check
    useEffect(() => {
        checkHealth()
        .then((data) => setConnStatus(data.api_key === "missing" ? "error" : "online"))
        .catch(() => setConnStatus("error"));
    }, []);

    // Close theme picker on outside click
    useEffect(() => {
        if (!pickerOpen) return;
        const handler = () => setPickerOpen(false);
        setTimeout(() => document.addEventListener("click", handler), 0);
        return () => document.removeEventListener("click", handler);
    }, [pickerOpen]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        const text = input;
        setInput("");
        // Reset textarea height
        if (inputRef.current) inputRef.current.style.height = "auto";
        await send(text);
    }, [input, isLoading, send]);

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const fillInput = (text: string) => {
        setInput(text);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const connLabel = {
        checking: "● checking...",
        online: "● connected",
        error: "● offline",
    }[connStatus];

    const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

    // History: desktop = sidebar dalam shell, mobile = drawer overlay
    const showDesktopHistory = historyOpen && userToken && !isMobile;
    const showMobileHistory = historyOpen && userToken && isMobile;

    return (
        <>
            {/* ===== NAV ===== */}
            <nav className="nav">
                <div className="nav-logo">
                    <em>Dani</em>AI <span className="nav-pill">BETA</span>
                </div>

                <span className={`nav-conn ${connStatus}`}>{connLabel}</span>

                {/* Theme picker — desktop only */}
                <div className="theme-picker-wrap" onClick={(e) => e.stopPropagation()}>
                    <button className="theme-picker-btn" onClick={() => setPickerOpen((p) => !p)}>
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: currentTheme.color,
                                display: "inline-block",
                                border: "1px solid rgba(255,255,255,0.2)",
                            }}
                        />
                        {currentTheme.label} ▾
                    </button>
                    {pickerOpen && (
                        <div className="theme-dropdown">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    className={`theme-opt${theme === t.id ? " active" : ""}`}
                                    onClick={() => {
                                        setTheme(t.id);
                                        setPickerOpen(false);
                                    }}
                                >
                                    <span className="theme-dot" style={{background: t.color}} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <AuthButton />

                {/* History btn — desktop only */}
                {userToken && (
                    <button
                        className={`nav-history-btn${historyOpen ? " active" : ""}`}
                        onClick={() => setHistoryOpen((o) => !o)}
                        title="Chat History"
                    >
                        ⧗ history
                    </button>
                )}

                {/* Hamburger — mobile only */}
                <button className="nav-ham" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
                    ☰
                </button>
            </nav>

            {/* ===== SHELL ===== */}
            <div className="shell">
                {/* History sidebar — desktop only, di dalam shell */}
                {showDesktopHistory && (
                    <aside className="pane-history">
                        <HistoryPanel
                            token={userToken!}
                            onLoad={(_session) => {
                                // TODO: load session messages ke chat
                                setHistoryOpen(false);
                            }}
                            onClose={() => setHistoryOpen(false)}
                        />
                    </aside>
                )}

                {/* Terminal pane */}
                <section className="pane-terminal">
                    <div className="term-header">
                        <div className="term-header-top">
                            <div className="dots">
                                <div className="dot r" />
                                <div className="dot y" />
                                <div className="dot g" />
                            </div>
                            <span className="term-title">dani-ai — security research terminal</span>
                        </div>
                        <div className="profile-tabs">
                            {PROFILES.map((p) => (
                                <button
                                    key={p.key}
                                    className={`ptab${profile === p.key ? " active" : ""}`}
                                    onClick={() => switchProfile(p.key as ProfileKey)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="info-bar">
                        <span className={`ib-badge ${connStatus === "online" ? "ib-online" : "ib-offline"}`}>
                            <span
                                className="ib-dot"
                                style={{background: connStatus === "online" ? "var(--green)" : "var(--red)"}}
                            />
                            {connStatus === "online" ? "online" : "offline"}
                        </span>
                        <span className="ib-sep">·</span>
                        <span className="ib-badge ib-profile">{profile}</span>
                        <span className="ib-sep">·</span>
                        <span className="ib-badge" style={{color: "var(--text3)", borderColor: "var(--border)"}}>
                            {msgCount} pesan
                        </span>
                        <span className="ib-sep">·</span>
                        <span className="ib-badge ib-session">
                            <span className="ib-flag">⚑</span> {timer}
                        </span>
                    </div>

                    <div className="chat-body" ref={chatBodyRef}>
                        {/* Welcome message */}
                        <div className="msg-block">
                            <div className="msg-meta">
                                <span className="m-ai">dani-ai</span>
                                <span>— siap</span>
                            </div>
                            <div className="msg-wrap">
                                <div className="msg-body mb-ai">
                                    Halo! Gue <code>Dani AI</code> — asisten keamanan terhubung ke Groq API. Mau ngapain
                                    dulu?
                                    <div className="shortcuts">
                                        {SHORTCUTS.map((s) => (
                                            <span key={s.label} className="sc" onClick={() => fillInput(s.text)}>
                                                {s.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} msg={msg} />
                        ))}

                        <div className="typing-row">
                            {isLoading && (
                                <div className="typing">
                                    <div className="tdot" />
                                    <div className="tdot" />
                                    <div className="tdot" />
                                    <span className="typing-lbl">dani-ai mengetik...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="input-row">
                        <div className="input-box">
                            <span className="prompt-prefix">
                                <span className="pu">dani</span>
                                <span className="ph">@sec</span>
                                <span style={{color: "var(--text3)"}}>:~$ </span>
                            </span>
                            <textarea
                                ref={inputRef}
                                className="term-input"
                                value={input}
                                rows={1}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                                }}
                                onKeyDown={handleKey}
                                placeholder="ketik pertanyaan... (Enter kirim, Shift+Enter baris baru)"
                                disabled={isLoading}
                                autoComplete="off"
                                autoFocus
                            />
                            <button className="send-btn" onClick={handleSend} disabled={isLoading} aria-label="Kirim">
                                {isLoading ? "⏳" : "↑"}
                            </button>
                        </div>
                        <div className="input-hint">Enter kirim · Shift+Enter baris baru</div>
                    </div>
                </section>
            </div>

            {/* ===== MOBILE MENU ===== */}
            <div
                className={`mobile-menu-overlay${mobileMenuOpen ? " open" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
            />
            <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
                <div className="mm-head">
                    <div className="mm-logo">
                        <em>Dani</em>AI
                    </div>
                    <button className="mm-close" onClick={() => setMobileMenuOpen(false)}>
                        ✕
                    </button>
                </div>
                <div className="mm-body">
                    <div className="mm-section-lbl">Mode</div>
                    {PROFILES.map((p) => (
                        <button
                            key={p.key}
                            className={`mm-item${profile === p.key ? " active" : ""}`}
                            onClick={() => {
                                switchProfile(p.key as ProfileKey);
                                setMobileMenuOpen(false);
                                setTimeout(() => inputRef.current?.focus(), 100);
                            }}
                        >
                            <span className="mm-item-icon">◈</span>
                            <span>
                                {p.label}
                                <span className="mm-item-desc">{p.desc}</span>
                            </span>
                        </button>
                    ))}

                    <hr className="mm-divider" />
                    <div className="mm-section-lbl">Tema (14)</div>
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            className={`mm-item${theme === t.id ? " active" : ""}`}
                            onClick={() => {
                                setTheme(t.id);
                                setMobileMenuOpen(false);
                            }}
                        >
                            <span className="mm-item-icon">
                                <span
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        background: t.color,
                                        display: "inline-block",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                    }}
                                />
                            </span>
                            <span>{t.label}</span>
                        </button>
                    ))}

                    {userToken && (
                        <>
                            <hr className="mm-divider" />
                            <div className="mm-section-lbl">Riwayat</div>
                            <button
                                className="mm-item"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    // Tunggu menu tutup dulu baru buka drawer
                                    setTimeout(() => setHistoryOpen(true), 300);
                                }}
                            >
                                <span className="mm-item-icon">⧗</span>
                                <span>
                                    Chat History
                                    <span className="mm-item-desc">Lihat percakapan sebelumnya</span>
                                </span>
                            </button>
                        </>
                    )}
                </div>
                <div className="mm-footer">
                    <div className="mm-footer-info">
                        <span>{profile}</span> · {connStatus === "online" ? "● online" : "● offline"}
                        <br />
                        session {timer}
                    </div>
                </div>
            </div>

            {/* ===== HISTORY DRAWER — mobile overlay ===== */}
            {showMobileHistory && (
                <>
                    <div className="drawer-overlay open" onClick={() => setHistoryOpen(false)} />
                    <div className="drawer-left open">
                        <HistoryPanel
                            token={userToken!}
                            onLoad={(_session) => {
                                // TODO: load session messages ke chat
                                setHistoryOpen(false);
                            }}
                            onClose={() => setHistoryOpen(false)}
                        />
                    </div>
                </>
            )}
        </>
    );
}
