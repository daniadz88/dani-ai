// src/App.tsx — Dani AI (Claude-style UI)
// Sidebar kiri permanen di desktop, drawer di mobile
// History terintegrasi di sidebar
import {useState, useEffect, useRef, useCallback} from "react";
import {useChat} from "./hooks/useChat";
import {useTimer} from "./hooks/useTimer";
import {MessageBubble} from "./components/MessageBubble";
import {PROFILES, SHORTCUTS} from "./lib/profiles";
import {checkHealth} from "./lib/api";
import {AuthButton} from "./components/AuthButton";
import {supabase} from "./lib/supabase";
import type {ProfileKey} from "./types";
import "./App.css";

// ===================== THEMES =====================
const THEMES = [
    {id: "midnight", label: "Midnight", color: "#cc785c"},
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

// ===================== HISTORY MOCK (ganti dengan data real dari Supabase) =====================
// Struktur history dari Supabase: { id, title, created_at, messages[] }
// Group berdasarkan tanggal (Today, Yesterday, Last 7 Days, dst)
function groupHistoryByDate(items: HistoryItem[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);

    const groups: Record<string, HistoryItem[]> = {
        Today: [],
        Yesterday: [],
        "Last 7 Days": [],
        "Last 30 Days": [],
        Older: [],
    };

    for (const item of items) {
        const d = new Date(item.created_at);
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (day >= today) groups["Today"].push(item);
        else if (day >= yesterday) groups["Yesterday"].push(item);
        else if (day >= lastWeek) groups["Last 7 Days"].push(item);
        else if (day >= lastMonth) groups["Last 30 Days"].push(item);
        else groups["Older"].push(item);
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0);
}

interface HistoryItem {
    id: string;
    title: string;
    created_at: string;
    profile?: string;
}

// ===================== HOOKS =====================
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

function useHistory(userToken: string | null) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    const loadHistory = useCallback(async () => {
        if (!userToken) return;
        setLoading(true);
        try {
            // Ganti ini dengan query Supabase yang sesuai schema-mu
            // Contoh: SELECT id, title, created_at, profile FROM chat_sessions ORDER BY created_at DESC
            const {data, error} = await supabase
            .from("chat_sessions")
            .select("id, title, created_at, profile")
            .order("created_at", {ascending: false})
            .limit(100);

            if (!error && data) {
                setHistory(data as HistoryItem[]);
            }
        } catch (e) {
            console.error("Load history error:", e);
        } finally {
            setLoading(false);
        }
    }, [userToken]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const deleteItem = useCallback(async (id: string) => {
        try {
            await supabase.from("chat_sessions").delete().eq("id", id);
            setHistory((prev) => prev.filter((h) => h.id !== id));
        } catch (e) {
            console.error("Delete history error:", e);
        }
    }, []);

    return {history, loading, loadHistory, deleteItem};
}

// ===================== SIDEBAR COMPONENT =====================
interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    theme: string;
    themes: typeof THEMES;
    setTheme: (t: string) => void;
    pickerOpen: boolean;
    setPickerOpen: (v: boolean) => void;
    profile: string;
    profiles: typeof PROFILES;
    switchProfile: (p: ProfileKey) => void;
    history: HistoryItem[];
    historyLoading: boolean;
    onHistoryLoad: (id: string) => void;
    onHistoryDelete: (id: string) => void;
    onNewChat: () => void;
    connStatus: "checking" | "online" | "error";
    userToken: string | null;
    msgCount: number;
    timer: string;
}

function Sidebar({
    isOpen,
    onClose,
    theme,
    themes,
    setTheme,
    pickerOpen,
    setPickerOpen,
    profile,
    profiles,
    switchProfile,
    history,
    historyLoading,
    onHistoryLoad,
    onHistoryDelete,
    onNewChat,
    connStatus,
    userToken,
    msgCount,
    timer,
}: SidebarProps) {
    const currentTheme = themes.find((t) => t.id === theme) || themes[0];
    const grouped = groupHistoryByDate(history);

    return (
        <>
            {/* Overlay untuk mobile */}
            <div className={`sidebar-overlay${isOpen ? " open" : ""}`} onClick={onClose} />

            <aside className={`sidebar${isOpen ? " mobile-open" : ""}`}>
                {/* Top: Logo + New Chat */}
                <div className="sidebar-top">
                    <span className="sidebar-logo">
                        <em>Dani</em>AI
                    </span>
                    <button className="new-chat-btn" onClick={onNewChat} title="New Chat">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New chat
                    </button>
                </div>

                {/* Mode / Profile */}
                <div className="sidebar-section-label">Mode</div>
                {profiles.map((p) => (
                    <button
                        key={p.key}
                        className={`mode-btn${profile === p.key ? " active" : ""}`}
                        onClick={() => {
                            switchProfile(p.key as ProfileKey);
                            onClose();
                        }}
                    >
                        <span className="mode-btn-icon">◈</span>
                        <span className="mode-btn-info">
                            <span className="mode-btn-label">{p.label}</span>
                            <span className="mode-btn-desc">{p.desc}</span>
                        </span>
                    </button>
                ))}

                {/* History */}
                <div className="sidebar-section-label">
                    History
                    {historyLoading && <span style={{marginLeft: 6, opacity: 0.5}}>···</span>}
                </div>
                <div className="sidebar-history">
                    {!userToken ? (
                        <p className="history-empty-msg">Login untuk lihat history</p>
                    ) : history.length === 0 && !historyLoading ? (
                        <p className="history-empty-msg">Belum ada percakapan</p>
                    ) : (
                        grouped.map(([label, items]) => (
                            <div className="history-date-group" key={label}>
                                <span className="history-date-label">{label}</span>
                                {items.map((item) => (
                                    <button
                                        key={item.id}
                                        className="history-item"
                                        onClick={() => {
                                            onHistoryLoad(item.id);
                                            onClose();
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-title">{item.title || "Untitled"}</span>
                                        <button
                                            className="history-item-del"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onHistoryDelete(item.id);
                                            }}
                                            title="Hapus"
                                        >
                                            ✕
                                        </button>
                                    </button>
                                ))}
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom: User + Theme */}
                <div className="sidebar-bottom">
                    {/* Status bar kecil */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            fontSize: 11,
                            color: "var(--text3)",
                        }}
                    >
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background:
                                    connStatus === "online"
                                        ? "#3ddc84"
                                        : connStatus === "error"
                                        ? "#f06c6c"
                                        : "var(--text3)",
                                display: "inline-block",
                                flexShrink: 0,
                            }}
                        />
                        {connStatus === "online" ? "online" : connStatus === "error" ? "offline" : "checking"}
                        <span style={{margin: "0 4px", opacity: 0.4}}>·</span>
                        {msgCount} pesan
                        <span style={{margin: "0 4px", opacity: 0.4}}>·</span>
                        {timer}
                    </div>

                    {/* Auth */}
                    <div style={{padding: "0 2px"}}>
                        <AuthButton />
                    </div>

                    {/* Theme picker */}
                    <div className="sidebar-theme-wrap" onClick={(e) => e.stopPropagation()}>
                        <button className="sidebar-theme-btn" onClick={() => setPickerOpen(!pickerOpen)}>
                            <span className="sidebar-theme-dot" style={{background: currentTheme.color}} />
                            Tema: {currentTheme.label}
                            <span style={{marginLeft: "auto", opacity: 0.5, fontSize: 10}}>▲</span>
                        </button>
                        {pickerOpen && (
                            <div className="theme-dropdown">
                                {themes.map((t) => (
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
                </div>
            </aside>
        </>
    );
}

// ===================== APP =====================
export default function App() {
    const [input, setInput] = useState("");
    const [connStatus, setConnStatus] = useState<"checking" | "online" | "error">("checking");
    const [msgCount, setMsgCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userToken, setUserToken] = useState<string | null>(null);

    const chatBodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const timer = useTimer();
    const {theme, setTheme, pickerOpen, setPickerOpen} = useTheme();
    const {messages, isLoading, profile, switchProfile, send, clearMessages} = useChat("pentest");
    const {history, loading: historyLoading, loadHistory, deleteItem} = useHistory(userToken);

    // Auth
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

    // Refresh history saat login
    useEffect(() => {
        if (userToken) loadHistory();
    }, [userToken, loadHistory]);

    // Auto scroll
    useEffect(() => {
        const el = chatBodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, isLoading]);

    // Auto focus
    useEffect(() => {
        if (!isLoading) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isLoading]);

    // Msg count
    useEffect(() => {
        setMsgCount(messages.filter((m) => m.type === "user").length);
    }, [messages]);

    // Health check
    useEffect(() => {
        checkHealth()
        .then((data) => setConnStatus(data.api_key === "missing" ? "error" : "online"))
        .catch(() => setConnStatus("error"));
    }, []);

    // Close picker on outside click
    useEffect(() => {
        if (!pickerOpen) return;
        const handler = () => setPickerOpen(false);
        setTimeout(() => document.addEventListener("click", handler), 0);
        return () => document.removeEventListener("click", handler);
    }, [pickerOpen, setPickerOpen]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        const text = input;
        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";
        await send(text);
        // Simpan ke history setelah send
        // TODO: simpan session ke Supabase di sini atau di useChat hook
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

    const handleNewChat = () => {
        clearMessages?.();
        setSidebarOpen(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleHistoryLoad = (id: string) => {
        // TODO: load messages dari session id
        console.log("Load session:", id);
        setSidebarOpen(false);
    };

    return (
        <div className="app-layout">
            {/* ===== SIDEBAR (kiri, permanen di desktop) ===== */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                theme={theme}
                themes={THEMES}
                setTheme={setTheme}
                pickerOpen={pickerOpen}
                setPickerOpen={setPickerOpen}
                profile={profile}
                profiles={PROFILES}
                switchProfile={switchProfile}
                history={history}
                historyLoading={historyLoading}
                onHistoryLoad={handleHistoryLoad}
                onHistoryDelete={deleteItem}
                onNewChat={handleNewChat}
                connStatus={connStatus}
                userToken={userToken}
                msgCount={msgCount}
                timer={timer}
            />

            {/* ===== MAIN AREA ===== */}
            <main className="main-area">
                {/* Topbar — hanya tampil di mobile */}
                <header className="topbar">
                    <button className="topbar-ham" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <span className="topbar-logo">
                        <em>Dani</em>AI
                    </span>
                    <div style={{flex: 1}} />
                    <div className="topbar-status">
                        <span
                            className={`status-dot${
                                connStatus === "online" ? " online" : connStatus === "error" ? " error" : ""
                            }`}
                        />
                        {connStatus}
                    </div>
                </header>

                {/* Chat area */}
                <div className="chat-scroll" ref={chatBodyRef}>
                    <div className="chat-inner">
                        {messages.length === 0 ? (
                            // Welcome screen
                            <div className="welcome">
                                <div className="welcome-logo">🛡️</div>
                                <h1 className="welcome-title">Halo, aku Dani AI</h1>
                                <p className="welcome-sub">
                                    Asisten keamanan untuk pentest, CTF, OSINT, dan lebih banyak lagi.
                                </p>
                                <div className="welcome-chips">
                                    {SHORTCUTS.map((s) => (
                                        <button
                                            key={s.label}
                                            className="welcome-chip"
                                            onClick={() => fillInput(s.text)}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
                        )}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="typing-row">
                                <div className="msg-role">
                                    <div className="msg-avatar ai">D</div>
                                    <span className="msg-role-name">Dani AI</span>
                                </div>
                                <div className="typing-dots">
                                    <div className="tdot" />
                                    <div className="tdot" />
                                    <div className="tdot" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input area */}
                <div className="input-area">
                    <div className="input-inner">
                        <div className="input-box">
                            <textarea
                                ref={inputRef}
                                className="chat-input"
                                value={input}
                                rows={1}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                                }}
                                onKeyDown={handleKey}
                                placeholder="Kirim pesan ke Dani AI..."
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            <button
                                className={`send-btn${input.trim() ? " ready" : ""}`}
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                aria-label="Kirim"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path d="M12 19V5M5 12l7-7 7 7" />
                                </svg>
                            </button>
                        </div>
                        <p className="input-hint">Enter kirim · Shift+Enter baris baru</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
