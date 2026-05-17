// src/App.tsx — Dani AI Full Redesign

import {useState, useEffect, useRef, useCallback} from "react";
import {useChat} from "./hooks/useChat";
import {useTimer} from "./hooks/useTimer";
import {MessageBubble} from "./components/MessageBubble";
import {PROFILES, SHORTCUTS} from "./lib/profiles";
import {checkHealth} from "./lib/api";
import {AuthButton} from "./components/AuthButton";
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
        return localStorage.getItem("dani-theme") || "midnight";
    });
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("dani-theme", theme);
    }, [theme]);

    return {theme, setTheme, pickerOpen, setPickerOpen};
}

// ===================== APP =====================
export default function App() {
    const [input, setInput] = useState("");
    const [connStatus, setConnStatus] = useState<"checking" | "online" | "error">("checking");
    const [msgCount, setMsgCount] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const timer = useTimer();
    const {theme, setTheme, pickerOpen, setPickerOpen} = useTheme();

    const {messages, isLoading, profile, switchProfile, send} = useChat("pentest");

    // auto-scroll
    useEffect(() => {
        const el = chatBodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, isLoading]);

    // auto-focus input
    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isLoading]);

    // count user messages
    useEffect(() => {
        setMsgCount(messages.filter((m) => m.type === "user").length);
    }, [messages]);

    // health check
    useEffect(() => {
        checkHealth()
        .then((data) => setConnStatus(data.api_key === "missing" ? "error" : "online"))
        .catch(() => setConnStatus("error"));
    }, []);

    // close picker on outside click
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

    return (
        <>
            {/* NAV */}
            <nav className="nav">
                <div className="nav-logo">
                    <em>Dani</em>AI <span className="nav-pill">BETA</span>
                </div>
                <div className="nav-links">
                    <a className="nav-link active" href="#install">
                        install
                    </a>
                    <a className="nav-link" href="#endpoints">
                        endpoints
                    </a>
                    <a className="nav-link" href="#profiles">
                        profiles
                    </a>
                </div>

                <span className={`nav-conn ${connStatus}`}>{connLabel}</span>

                {/* Theme picker */}
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

                <button className="nav-ham" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
                    ☰
                </button>
                <button className="nav-doc-btn" onClick={() => setDrawerOpen(true)}>
                    ☰ docs
                </button>
            </nav>

            <div className="shell">
                {/* TERMINAL PANE */}
                <section className="pane-terminal">
                    {/* header */}
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

                    {/* info bar */}
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
                            <span className="ib-flag">⚑</span>
                            {timer}
                        </span>
                    </div>

                    {/* chat body */}
                    <div className="chat-body" ref={chatBodyRef}>
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

                        <div className={`typing-row${isLoading ? " show" : ""}`}>
                            {isLoading && (
                                <div className="typing show">
                                    <div className="tdot" />
                                    <div className="tdot" />
                                    <div className="tdot" />
                                    <span className="typing-lbl">dani-ai mengetik...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* input — Claude style */}
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
                                    // auto-resize
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                                }}
                                onKeyDown={handleKey}
                                placeholder="ketik pertanyaan... (Enter kirim, Shift+Enter baris baru)"
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            <button className="send-btn" onClick={handleSend} disabled={isLoading} aria-label="Kirim">
                                {isLoading ? "⏳" : "↑"}
                            </button>
                        </div>
                        <div className="input-hint">Enter kirim · Shift+Enter baris baru</div>
                    </div>
                </section>

                {/* DOCS SIDEBAR desktop */}
                <aside className="pane-docs" id="pane-docs">
                    <div className="docs-head">
                        <span className="docs-head-icon">◈</span> dokumentasi
                    </div>
                    <div className="docs-scroll">
                        <DocsContent />
                    </div>
                </aside>
            </div>

            {/* MOBILE MENU */}
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

                    <hr className="mm-divider" />
                    <div className="mm-section-lbl">Navigasi</div>
                    <button
                        className="mm-item"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            setTimeout(() => inputRef.current?.focus(), 100);
                        }}
                    >
                        <span className="mm-item-icon">⌨</span>
                        <span>
                            Terminal<span className="mm-item-desc">Kembali ke chat</span>
                        </span>
                    </button>
                    <button
                        className="mm-item"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            setDrawerOpen(true);
                        }}
                    >
                        <span className="mm-item-icon">☰</span>
                        <span>
                            Dokumentasi<span className="mm-item-desc">Panduan & API reference</span>
                        </span>
                    </button>
                </div>
                <div className="mm-footer">
                    <div className="mm-footer-info">
                        <span>{profile}</span> · {connStatus === "online" ? "● online" : "● offline"}
                        <br />
                        session {timer}
                    </div>
                </div>
            </div>

            {/* DRAWER docs */}
            {drawerOpen && (
                <>
                    <div className="drawer-overlay open" onClick={() => setDrawerOpen(false)} />
                    <div className="drawer open">
                        <div className="docs-head">
                            <span className="docs-head-icon">◈</span> dokumentasi
                            <button className="docs-close" onClick={() => setDrawerOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="docs-scroll">
                            <DocsContent />
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

// ===================== DOCS =====================
function DocsContent() {
    return (
        <div className="docs-body">
            <div className="doc-section" id="install">
                <div className="doc-section-title">instalasi</div>
                <div className="install-steps">
                    {[
                        ["01", "Clone project", "cd dani-ai/"],
                        ["02", "Install backend", "cd backend && npm install"],
                        ["03", "Install frontend", "cd frontend && npm install"],
                        ["04", "Isi .env", "GROQ_API_KEY=gsk_..."],
                        ["05", "Jalanin backend", "npm run start:dev"],
                        ["06", "Jalanin frontend", "npm run dev"],
                    ].map(([num, text, code]) => (
                        <div className="istep" key={num}>
                            <span className="istep-num">{num}</span>
                            <div className="istep-text">
                                {text}
                                <br />
                                <span className="istep-code">{code}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <hr className="doc-divider" />
            <div className="doc-section" id="endpoints">
                <div className="doc-section-title">API endpoints</div>
                <table className="ep-table">
                    <thead>
                        <tr>
                            <th>method</th>
                            <th>path</th>
                            <th>fungsi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <span className="ep-method get">GET</span>
                            </td>
                            <td className="ep-path">/api/health</td>
                            <td className="ep-desc">Status & API key</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="ep-method post">POST</span>
                            </td>
                            <td className="ep-path">/api/chat</td>
                            <td className="ep-desc">Kirim pesan ke AI</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="ep-method get">GET</span>
                            </td>
                            <td className="ep-path">/api/history</td>
                            <td className="ep-desc">Ambil chat history</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <hr className="doc-divider" />
            <div className="doc-section" id="profiles">
                <div className="doc-section-title">profiles</div>
                <div className="profile-chips">
                    {PROFILES.map((p) => (
                        <div className="pchip" key={p.key}>
                            <div className="pchip-dot" style={{background: p.color}} />
                            <div>
                                <div className="pchip-name">{p.key}</div>
                                <div className="pchip-desc">{p.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
