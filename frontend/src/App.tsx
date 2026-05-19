// src/App.tsx — Dani AI — Centered Input + Sidebar Toggle Inside

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "./hooks/useChat";
import { useTimer } from "./hooks/useTimer";
import { useScreenshot } from "./hooks/useScreenshot";
import { MessageBubble } from "./components/MessageBubble";
import { PROFILES, SHORTCUTS } from "./lib/profiles";
import { checkHealth } from "./lib/api";
import { supabase, signInWithGoogle } from "./lib/supabase";
import type { ProfileKey } from "./types";
import "./App.css";

const THEMES = [
    { id: "midnight", label: "Midnight", color: "#cc785c" },
    { id: "forest",   label: "Forest",   color: "#3ddc84" },
    { id: "ocean",    label: "Ocean",    color: "#4ec9e8" },
    { id: "crimson",  label: "Crimson",  color: "#f06c6c" },
    { id: "aurora",   label: "Aurora",   color: "#a78bfa" },
    { id: "sunset",   label: "Sunset",   color: "#f5a623" },
    { id: "matrix",   label: "Matrix",   color: "#00ff41" },
    { id: "nord",     label: "Nord",     color: "#88c0d0" },
    { id: "rose",     label: "Rose",     color: "#f472b6" },
    { id: "slate",    label: "Slate",    color: "#94a3b8" },
    { id: "copper",   label: "Copper",   color: "#cd7f32" },
    { id: "ice",      label: "Ice",      color: "#3b6ef5" },
    { id: "toxic",    label: "Toxic",    color: "#aaff00" },
    { id: "void",     label: "Void",     color: "#ffffff" },
];

function groupHistoryByDate(items: HistoryItem[]) {
    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const lastWeek  = new Date(today); lastWeek.setDate(today.getDate() - 7);
    const lastMonth = new Date(today); lastMonth.setDate(today.getDate() - 30);
    const groups: Record<string, HistoryItem[]> = {
        "Hari ini": [], Kemarin: [], "7 Hari Lalu": [], "30 Hari Lalu": [], "Lebih Lama": [],
    };
    for (const item of items) {
        const d   = new Date(item.created_at);
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if      (day >= today)     groups["Hari ini"].push(item);
        else if (day >= yesterday) groups["Kemarin"].push(item);
        else if (day >= lastWeek)  groups["7 Hari Lalu"].push(item);
        else if (day >= lastMonth) groups["30 Hari Lalu"].push(item);
        else                       groups["Lebih Lama"].push(item);
    }
    return Object.entries(groups).filter(([, items]) => items.length > 0);
}

interface HistoryItem {
    id: string;
    title: string;
    created_at: string;
    profile?: string;
}
interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at?: string;
}

// Cache avatar URL to avoid repeated fetches causing 429
function useAvatarUrl(rawUrl?: string) {
    const [cached, setCached] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (!rawUrl) return;
        setCached(rawUrl);
    }, [rawUrl]);
    return cached;
}

function useTheme() {
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem("dani-theme") || "midnight"; } catch { return "midnight"; }
    });
    const [pickerOpen, setPickerOpen] = useState(false);
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem("dani-theme", theme); } catch {}
    }, [theme]);
    return { theme, setTheme, pickerOpen, setPickerOpen };
}

function useHistory(userToken: string | null) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const loadHistory = useCallback(async () => {
        if (!userToken) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("chat_sessions")
                .select("id, title, created_at, profile")
                .order("created_at", { ascending: false })
                .limit(100);
            if (!error && data) setHistory(data as HistoryItem[]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [userToken]);
    useEffect(() => { loadHistory(); }, [loadHistory]);
    const deleteItem = useCallback(async (id: string) => {
        try {
            await supabase.from("chat_sessions").delete().eq("id", id);
            setHistory((prev) => prev.filter((h) => h.id !== id));
        } catch (e) { console.error(e); }
    }, []);
    return { history, loading, loadHistory, deleteItem };
}

// ===================== PROFILE PAGE =====================
function ProfilePage({ user, onBack }: { user: UserProfile; onBack: () => void }) {
    const [name, setName]   = useState(user.full_name || "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved]   = useState(false);
    const [sessionCount, setSessionCount] = useState<number | null>(null);
    const avatarUrl = useAvatarUrl(user.avatar_url);

    useEffect(() => {
        supabase
            .from("chat_sessions")
            .select("id", { count: "exact", head: true })
            .then(({ count }) => setSessionCount(count ?? 0));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await supabase.auth.updateUser({ data: { full_name: name } });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onBack();
    };

    const initials = (user.full_name || user.email || "?")
        .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const joinDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
        : "-";

    return (
        <div className="profile-page">
            <div className="profile-header">
                <button className="profile-back" onClick={onBack}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Kembali ke chat
                </button>
            </div>
            <div className="profile-body">
                <div className="profile-avatar-wrap">
                    {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" className="profile-avatar-img"
                            loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                        : <div className="profile-avatar-big">{initials}</div>
                    }
                    <h2 className="profile-name">{user.full_name || user.email?.split("@")[0]}</h2>
                    <p className="profile-email">{user.email}</p>
                </div>
                <div className="profile-cards">
                    <div className="profile-card">
                        <span className="profile-card-label">Bergabung</span>
                        <span className="profile-card-value">{joinDate}</span>
                    </div>
                    <div className="profile-card">
                        <span className="profile-card-label">Total Sesi</span>
                        <span className="profile-card-value">{sessionCount === null ? "..." : sessionCount}</span>
                    </div>
                </div>
                <div className="profile-section">
                    <label className="profile-label">Nama Tampilan</label>
                    <input
                        className="profile-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama kamu..."
                    />
                    <button
                        className={`profile-save-btn${saved ? " saved" : ""}`}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saved ? "✓ Tersimpan" : saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
                <div className="profile-danger">
                    <button className="profile-logout-btn" onClick={handleLogout}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===================== SIDEBAR TOGGLE (di dalam sidebar) =====================
function SidebarInternalToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
    return (
        <button
            className="sidebar-internal-toggle"
            onClick={onClick}
            title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {collapsed ? (
                    <>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 3v18" />
                        <path d="m14 9 3 3-3 3" />
                    </>
                ) : (
                    <>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 3v18" />
                        <path d="m16 15-3-3 3-3" />
                    </>
                )}
            </svg>
        </button>
    );
}

// ===================== SIDEBAR =====================
interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
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
    user: UserProfile | null;
    msgCount: number;
    timer: string;
    onOpenProfile: () => void;
    loadingSessionId: string | null;
}

function Sidebar({
    isOpen, onClose, collapsed, onToggleCollapse,
    theme, themes, setTheme,
    pickerOpen, setPickerOpen,
    profile, profiles, switchProfile,
    history, historyLoading, onHistoryLoad, onHistoryDelete, onNewChat,
    connStatus, userToken, user, msgCount, timer, onOpenProfile, loadingSessionId,
}: SidebarProps) {
    const currentTheme   = themes.find((t) => t.id === theme) || themes[0];
    const currentProfile = profiles.find((p) => p.key === profile);
    const grouped        = groupHistoryByDate(history);
    const [modeOpen, setModeOpen] = useState(false);
    const modeRef = useRef<HTMLDivElement>(null);

    // Cache avatar url — prevents repeated fetches (429)
    const avatarUrl = useAvatarUrl(user?.avatar_url);

    useEffect(() => {
        if (!modeOpen) return;
        const handler = (e: MouseEvent) => {
            if (modeRef.current && !modeRef.current.contains(e.target as Node)) setModeOpen(false);
        };
        setTimeout(() => document.addEventListener("click", handler), 0);
        return () => document.removeEventListener("click", handler);
    }, [modeOpen]);

    const initials = user
        ? (user.full_name || user.email || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    return (
        <>
            <div className={`sidebar-overlay${isOpen ? " open" : ""}`} onClick={onClose} />
            <aside className={`sidebar${isOpen ? " mobile-open" : ""}${collapsed ? " sidebar-collapsed" : ""}`}>

                {/* ── Sidebar Top ── */}
                <div className="sidebar-top">
                    {!collapsed && (
                        <span className="sidebar-logo"><em>Dani</em>AI</span>
                    )}
                    {!collapsed && (
                        <button className="new-chat-btn" onClick={onNewChat} title="New chat">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            <span>New chat</span>
                        </button>
                    )}
                    <SidebarInternalToggle collapsed={collapsed} onClick={onToggleCollapse} />
                </div>

                {collapsed && (
                    <div className="sidebar-collapsed-actions">
                        <button className="sidebar-icon-btn" onClick={onNewChat} title="New chat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </button>
                    </div>
                )}

                {!collapsed && (
                    <>
                        <div className="sidebar-section-label">Mode</div>
                        <div style={{ padding: "0 8px 4px" }} ref={modeRef}>
                            <button
                                className="mode-dropdown-btn"
                                onClick={() => setModeOpen((o) => !o)}
                                title={currentProfile?.label ?? profile}
                            >
                                <span style={{ opacity: 0.5, fontSize: 13, flexShrink: 0 }}>◈</span>
                                <span className="mode-dropdown-info">
                                    <span className="mode-dropdown-label">{currentProfile?.label ?? profile}</span>
                                    <span className="mode-dropdown-desc">{currentProfile?.desc ?? ""}</span>
                                </span>
                                <svg
                                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5"
                                    style={{
                                        flexShrink: 0, opacity: 0.35, marginLeft: "auto",
                                        transform: modeOpen ? "rotate(180deg)" : "none",
                                        transition: "transform 0.2s",
                                    }}
                                >
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>
                            {modeOpen && (
                                <div className="mode-dropdown-list">
                                    {profiles.map((p) => (
                                        <button
                                            key={p.key}
                                            className={`mode-dropdown-item${profile === p.key ? " active" : ""}`}
                                            onClick={() => { switchProfile(p.key as ProfileKey); setModeOpen(false); onClose(); }}
                                        >
                                            <span style={{ opacity: 0.4, fontSize: 12, flexShrink: 0 }}>◈</span>
                                            <span className="mode-dropdown-item-info">
                                                <span style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</span>
                                                <span className="mode-dropdown-item-desc">{p.desc}</span>
                                            </span>
                                            {profile === p.key && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2.5"
                                                    style={{ marginLeft: "auto", color: "var(--accent)", flexShrink: 0 }}>
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="sidebar-section-label" style={{ marginTop: 8 }}>
                            Riwayat {historyLoading && <span style={{ opacity: 0.3, fontSize: 10 }}>●</span>}
                        </div>
                        <div className="sidebar-history">
                            {!userToken ? (
                                <p className="history-empty-msg">Login untuk lihat riwayat</p>
                            ) : history.length === 0 && !historyLoading ? (
                                <p className="history-empty-msg">Belum ada percakapan</p>
                            ) : (
                                grouped.map(([label, items]) => (
                                    <div className="history-date-group" key={label}>
                                        <span className="history-date-label">{label}</span>
                                        {items.map((item) => (
                                            // FIX: div+span — no nested <button> inside <button>
                                            <div
                                                key={item.id}
                                                role="button"
                                                tabIndex={loadingSessionId === item.id ? -1 : 0}
                                                className={`history-item${loadingSessionId === item.id ? " loading" : ""}`}
                                                onClick={() => { if (loadingSessionId !== item.id) { onHistoryLoad(item.id); onClose(); } }}
                                                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && loadingSessionId !== item.id) { onHistoryLoad(item.id); onClose(); } }}
                                                title={item.title || "Untitled"}
                                            >
                                                {loadingSessionId === item.id ? (
                                                    <span style={{
                                                        width: 11, height: 11,
                                                        border: "1.5px solid var(--accent)",
                                                        borderTopColor: "transparent",
                                                        borderRadius: "50%",
                                                        display: "inline-block",
                                                        animation: "spin 0.6s linear infinite",
                                                        flexShrink: 0,
                                                    }} />
                                                ) : (
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                                        stroke="currentColor" strokeWidth="2"
                                                        style={{ flexShrink: 0, opacity: 0.3 }}>
                                                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                                    </svg>
                                                )}
                                                <span className="history-item-title">{item.title || "Untitled"}</span>
                                                {/* FIX: span not button — avoids nested button warning */}
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    className="history-item-del"
                                                    onClick={(e) => { e.stopPropagation(); onHistoryDelete(item.id); }}
                                                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onHistoryDelete(item.id); } }}
                                                    title="Hapus"
                                                    aria-label="Hapus riwayat"
                                                >✕</span>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="sidebar-bottom">
                            <div className="sidebar-status-row">
                                <span className={`sidebar-status-dot${connStatus === "online" ? " online" : connStatus === "error" ? " error" : ""}`} />
                                <span>{connStatus === "online" ? "online" : connStatus === "error" ? "offline" : "checking"}</span>
                                <span className="sidebar-status-sep">·</span>
                                <span>{msgCount} pesan</span>
                                <span className="sidebar-status-sep">·</span>
                                <span>{timer}</span>
                            </div>

                            {userToken && user ? (
                                <button className="sidebar-user-btn" onClick={onOpenProfile} title={user.full_name || user.email}>
                                    <div className="sidebar-avatar">
                                        {/* FIX: lazy + referrerPolicy="no-referrer" — stops 429 on Google avatar */}
                                        {avatarUrl
                                            ? <img
                                                src={avatarUrl}
                                                alt="av"
                                                loading="lazy"
                                                decoding="async"
                                                referrerPolicy="no-referrer"
                                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                              />
                                            : initials
                                        }
                                    </div>
                                    <div className="sidebar-user-info">
                                        <span className="sidebar-user-name">{user.full_name || user.email?.split("@")[0]}</span>
                                        <span className="sidebar-user-sub">{user.email}</span>
                                    </div>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2"
                                        style={{ flexShrink: 0, opacity: 0.3, marginLeft: "auto" }}>
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    className="sidebar-user-btn"
                                    onClick={() => signInWithGoogle()}
                                >
                                    <div className="sidebar-avatar" style={{ background: "var(--input-bg)" }}>?</div>
                                    <span style={{ fontSize: 12, color: "var(--text3)" }}>Login untuk simpan riwayat</span>
                                </button>
                            )}

                            <div className="sidebar-theme-wrap" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="sidebar-theme-btn"
                                    onClick={() => setPickerOpen(!pickerOpen)}
                                    title={`Tema: ${currentTheme.label}`}
                                >
                                    <span className="sidebar-theme-dot" style={{ background: currentTheme.color }} />
                                    <span>Tema: {currentTheme.label}</span>
                                    <span style={{ marginLeft: "auto", opacity: 0.3, fontSize: 10 }}>▲</span>
                                </button>
                                {pickerOpen && (
                                    <div className="theme-dropdown">
                                        {themes.map((t) => (
                                            <button
                                                key={t.id}
                                                className={`theme-opt${theme === t.id ? " active" : ""}`}
                                                onClick={() => { setTheme(t.id); setPickerOpen(false); }}
                                            >
                                                <span className="theme-dot" style={{ background: t.color }} />
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </aside>
        </>
    );
}

// ===================== ATTACHMENT CHIP =====================
function AttachmentChip({
    att,
    onRemove,
}: {
    att: { id: string; base64: string; label: string; ocrText: string | null; isOcrDone: boolean };
    onRemove: (id: string) => void;
}) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="att-chip"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="att-chip-thumb-wrap">
                <img src={att.base64} alt="screenshot" className="att-chip-thumb" />
            </div>
            <div className="att-chip-info">
                <span className="att-chip-label">{att.label}</span>
                <span className="att-chip-sub">
                    {!att.isOcrDone ? "Membaca..." : att.ocrText ? `${att.ocrText.length} chars` : "PASTED"}
                </span>
            </div>
            <button className="att-chip-remove" onClick={() => onRemove(att.id)} title="Hapus" aria-label="Hapus">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
            {hovered && (
                <div className="att-chip-preview">
                    <img src={att.base64} alt="preview" className="att-chip-preview-img" />
                    {att.ocrText && (
                        <div className="att-chip-preview-ocr">
                            <span className="att-chip-preview-ocr-label">Teks terdeteksi</span>
                            <p>{att.ocrText.slice(0, 250)}{att.ocrText.length > 250 ? "…" : ""}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ===================== APP =====================
export default function App() {
    const [input, setInput]             = useState("");
    const [connStatus, setConnStatus]   = useState<"checking" | "online" | "error">("checking");
    const [msgCount, setMsgCount]       = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try { return localStorage.getItem("dani-sidebar-collapsed") === "true"; } catch { return false; }
    });
    const [userToken, setUserToken] = useState<string | null>(null);
    const [user, setUser]           = useState<UserProfile | null>(null);
    const [page, setPage]           = useState<"chat" | "profile">("chat");
    const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

    const chatBodyRef = useRef<HTMLDivElement>(null);
    const inputRef    = useRef<HTMLTextAreaElement>(null);

    const timer = useTimer();
    const { theme, setTheme, pickerOpen, setPickerOpen } = useTheme();
    const { messages, isLoading, profile, switchProfile, send, clearMessages, loadSession } = useChat("pentest");
    const { history, loading: historyLoading, loadHistory, deleteItem } = useHistory(userToken);
    const { isProcessing: isOcrProcessing, attachments, addImage, remove: removeAttachment, clear: clearAttachments } = useScreenshot();

    const hasMessages = messages.length > 0;

    useEffect(() => {
        try { localStorage.setItem("dani-sidebar-collapsed", String(sidebarCollapsed)); } catch {}
    }, [sidebarCollapsed]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            const s = data.session;
            setUserToken(s?.access_token ?? null);
            if (s?.user) setUser({
                id: s.user.id,
                email: s.user.email ?? "",
                full_name: s.user.user_metadata?.full_name,
                avatar_url: s.user.user_metadata?.avatar_url,
                created_at: s.user.created_at,
            });
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
            setUserToken(s?.access_token ?? null);
            if (s?.user) setUser({
                id: s.user.id,
                email: s.user.email ?? "",
                full_name: s.user.user_metadata?.full_name,
                avatar_url: s.user.user_metadata?.avatar_url,
                created_at: s.user.created_at,
            });
            else setUser(null);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => { if (userToken) loadHistory(); }, [userToken, loadHistory]);

    useEffect(() => {
        const el = chatBodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, isLoading]);

    useEffect(() => {
        if (!isLoading && page === "chat") setTimeout(() => inputRef.current?.focus(), 50);
    }, [isLoading, page]);

    useEffect(() => {
        setMsgCount(messages.filter((m) => m.type === "user").length);
    }, [messages]);

    useEffect(() => {
        checkHealth()
            .then((d) => setConnStatus(d.api_key === "missing" ? "error" : "online"))
            .catch(() => setConnStatus("error"));
    }, []);

    useEffect(() => {
        if (!pickerOpen) return;
        const h = () => setPickerOpen(false);
        setTimeout(() => document.addEventListener("click", h), 0);
        return () => document.removeEventListener("click", h);
    }, [pickerOpen, setPickerOpen]);

    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const target = e.target as HTMLElement;
            const isTextarea = target === inputRef.current || target.tagName === "TEXTAREA";
            if (!isTextarea && document.activeElement !== inputRef.current) return;
            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    if (blob) addImage(blob);
                    break;
                }
            }
        };
        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [addImage]);

    const handleSend = useCallback(async () => {
        const hasText  = input.trim().length > 0;
        const hasImage = attachments.length > 0;
        if ((!hasText && !hasImage) || isLoading) return;
        const text     = input;
        const imageAtt = attachments[0];
        setInput("");
        clearAttachments();
        if (inputRef.current) inputRef.current.style.height = "auto";
        await send(text, imageAtt?.base64);
    }, [input, attachments, isLoading, send, clearAttachments]);

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleHistoryLoad = useCallback(async (id: string) => {
        setLoadingSessionId(id);
        setSidebarOpen(false);
        setPage("chat");
        try {
            await loadSession(id);
            setTimeout(() => inputRef.current?.focus(), 100);
        } catch (e) { console.error("Load session error:", e); }
        finally { setLoadingSessionId(null); }
    }, [loadSession]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed((v) => !v);
    }, []);

    const hasContent = input.trim().length > 0 || attachments.length > 0;

    const sidebarProps: SidebarProps = {
        isOpen: sidebarOpen,
        onClose: () => setSidebarOpen(false),
        collapsed: sidebarCollapsed,
        onToggleCollapse: toggleSidebar,
        theme, themes: THEMES, setTheme,
        pickerOpen, setPickerOpen,
        profile, profiles: PROFILES, switchProfile,
        history, historyLoading,
        onHistoryLoad: handleHistoryLoad,
        onHistoryDelete: deleteItem,
        onNewChat: () => {
            clearMessages?.();
            clearAttachments();
            setSidebarOpen(false);
            setPage("chat");
            setTimeout(() => inputRef.current?.focus(), 100);
        },
        connStatus, userToken, user, msgCount, timer,
        onOpenProfile: () => setPage("profile"),
        loadingSessionId,
    };

    if (page === "profile" && user) {
        return (
            <div className={`app-layout${sidebarCollapsed ? " sidebar-is-collapsed" : ""}`}>
                <Sidebar {...sidebarProps} />
                <main className="main-area">
                    <ProfilePage user={user} onBack={() => setPage("chat")} />
                </main>
            </div>
        );
    }

    // ── Input box — dipakai di 2 tempat (center & bottom) ──
    const InputBox = (
        <div className={`input-box${hasContent ? " has-content" : ""}${attachments.length > 0 ? " has-att" : ""}`}>
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
                placeholder={
                    attachments.length > 0
                        ? "Tambahkan prompt (opsional)..."
                        : "Kirim pesan ke Dani AI..."
                }
                disabled={isLoading}
                autoComplete="off"
            />
            <button
                className={`send-btn${hasContent ? " ready" : ""}`}
                onClick={handleSend}
                disabled={isLoading || !hasContent}
                title="Kirim"
                aria-label="Kirim pesan"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
            </button>
        </div>
    );

    return (
        <div className={`app-layout${sidebarCollapsed ? " sidebar-is-collapsed" : ""}`}>
            <Sidebar {...sidebarProps} />

            <main className="main-area">
                {/* ── Topbar — hanya tampil saat ada pesan ── */}
                {hasMessages && (
                    <header className="topbar">
                        <button
                            className="topbar-ham mobile-only"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Buka menu"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <span className="topbar-logo"><em>Dani</em>AI</span>
                        <div style={{ flex: 1 }} />
                        <div className="topbar-status">
                            <span className={`status-dot${connStatus === "online" ? " online" : connStatus === "error" ? " error" : ""}`} />
                            {connStatus}
                        </div>
                    </header>
                )}

                {/* ── STATE: No messages → centered welcome + input ── */}
                {!hasMessages ? (
                    <div className="welcome-center">
                        <div className="welcome-content">
                            <div className="welcome-logo">
                                {profile.toUpperCase()} MODE
                            </div>
                            <h1 className="welcome-title">
                                Halo{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
                            </h1>
                            <p className="welcome-sub">
                                Aku Dani AI — asisten keamanan siber. Mau mulai dari mana?
                            </p>
                            <div className="welcome-chips">
                                {SHORTCUTS.map((s) => (
                                    <button
                                        key={s.label}
                                        className="welcome-chip"
                                        onClick={() => { setInput(s.text); setTimeout(() => inputRef.current?.focus(), 50); }}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="welcome-input-wrap">
                                {(attachments.length > 0 || isOcrProcessing) && (
                                    <div className="att-bar">
                                        {attachments.map((att) => (
                                            <AttachmentChip key={att.id} att={att} onRemove={removeAttachment} />
                                        ))}
                                        {isOcrProcessing && (
                                            <div className="att-chip att-chip-loading">
                                                <span className="att-ocr-spinner" />
                                                <span className="att-chip-label">Membaca teks...</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {InputBox}
                                <p className="input-hint">
                                    <span>Enter kirim</span>
                                    <span className="hint-dot">·</span>
                                    <span>Shift+Enter baris baru</span>
                                    <span className="hint-dot">·</span>
                                    <span>Ctrl+V paste screenshot</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="chat-scroll" ref={chatBodyRef}>
                            <div className="chat-inner">
                                {messages.map((msg) => (
                                    <MessageBubble key={msg.id} msg={msg} />
                                ))}
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

                        <div className="input-wrap">
                            {(attachments.length > 0 || isOcrProcessing) && (
                                <div className="att-bar">
                                    {attachments.map((att) => (
                                        <AttachmentChip key={att.id} att={att} onRemove={removeAttachment} />
                                    ))}
                                    {isOcrProcessing && (
                                        <div className="att-chip att-chip-loading">
                                            <span className="att-ocr-spinner" />
                                            <span className="att-chip-label">Membaca teks...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="input-area">
                                <div className="input-inner">
                                    {InputBox}
                                    <p className="input-hint">
                                        <span>Enter kirim</span>
                                        <span className="hint-dot">·</span>
                                        <span>Shift+Enter baris baru</span>
                                        <span className="hint-dot">·</span>
                                        <span>Ctrl+V paste screenshot</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}