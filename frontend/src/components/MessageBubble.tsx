// src/components/MessageBubble.tsx — Fixed

import { useState, useCallback, useMemo } from "react";
import type { DisplayMessage } from "../types";

interface Props {
    msg: DisplayMessage;
    onRetry?: (text: string) => void;
    onEdit?: (id: string, newText: string) => void;
    onAvatarClick?: () => void;
}

// ── Syntax highlighter ─────────────────────────────────────────────────────
function highlightCode(code: string, lang: string): string {
    const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let out = esc(code);

    const keywords: Record<string, string[]> = {
        python: ["def","class","import","from","return","if","elif","else","for","while","try","except","finally","with","as","pass","break","continue","and","or","not","in","is","lambda","yield","async","await","True","False","None","print","range","len","open","self"],
        bash: ["echo","cd","ls","cat","grep","awk","sed","curl","wget","sudo","apt","pip","npm","git","ssh","scp","chmod","chown","mkdir","rm","cp","mv","find","export","source","if","then","else","fi","for","do","done","while","function"],
        javascript: ["const","let","var","function","return","if","else","for","while","class","import","export","default","from","async","await","new","this","true","false","null","undefined","typeof","throw","try","catch"],
        typescript: ["const","let","var","function","return","if","else","for","while","class","import","export","default","from","async","await","new","this","true","false","null","undefined","type","interface","enum","extends","implements","readonly","public","private","protected"],
        sql: ["SELECT","FROM","WHERE","JOIN","LEFT","RIGHT","INNER","ON","GROUP","BY","ORDER","HAVING","INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","DROP","ALTER","AND","OR","IN","LIKE","AS","LIMIT"],
    };
    const aliases: Record<string, string> = {
        js: "javascript", ts: "typescript", py: "python",
        sh: "bash", shell: "bash", zsh: "bash",
    };
    const l = aliases[lang] || lang;
    const kws = keywords[l] || [];
    if (kws.length)
        out = out.replace(new RegExp(`\\b(${kws.join("|")})\\b`, "g"), '<span class="hl-kw">$1</span>');
    out = out.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
    if (["python", "bash"].includes(l))
        out = out.replace(/(#[^\n]*)/g, '<span class="hl-cmt">$1</span>');
    if (["javascript", "typescript"].includes(l))
        out = out.replace(/(\/\/[^\n]*)/g, '<span class="hl-cmt">$1</span>');
    if (l === "sql")
        out = out.replace(/(--[^\n]*)/g, '<span class="hl-cmt">$1</span>');
    out = out.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>');
    out = out.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-str">$1</span>');
    return out;
}

// ── Markdown parser ────────────────────────────────────────────────────────
function parseMarkdown(raw: string): string {
    let out = raw;

    // Code blocks first
    out = out.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
        const trimmed = code.replace(/^\n/, "").replace(/\n$/, "");
        const label   = lang || "code";
        const hl      = highlightCode(trimmed, lang.toLowerCase());
        return (
            `<div class="mb-code-wrap">` +
            `<div class="mb-code-header">` +
            `<span class="mb-code-lang">${label}</span>` +
            `<button class="mb-code-copy" onclick="(function(b){` +
            `const pre=b.closest('.mb-code-wrap').querySelector('pre code');` +
            `const t=pre?pre.innerText:'';` +
            `navigator.clipboard?.writeText(t).then(()=>{` +
            `b.textContent='✓ tersalin';` +
            `setTimeout(()=>b.textContent='copy',1800)` +
            `})` +
            `})(this)">copy</button>` +
            `</div>` +
            `<pre class="mb-pre"><code>${hl}</code></pre>` +
            `</div>`
        );
    });

    // Inline code
    out = out.replace(/`([^`\n]+)`/g, '<code class="mb-icode">$1</code>');

    // Bold / italic / strikethrough
    out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
    out = out.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

    // Headings
    out = out.replace(/^### (.+)$/gm, '<h3 class="mb-h3">$1</h3>');
    out = out.replace(/^## (.+)$/gm,  '<h2 class="mb-h2">$1</h2>');
    out = out.replace(/^# (.+)$/gm,   '<h1 class="mb-h1">$1</h1>');

    // HR
    out = out.replace(/^---+$/gm, '<hr class="mb-hr"/>');

    // Blockquote
    out = out.replace(/^> (.+)$/gm, '<blockquote class="mb-bq">$1</blockquote>');

    // Unordered list
    out = out.replace(/^[\-\*] (.+)$/gm, '<li class="mb-li"><span>$1</span></li>');
    out = out.replace(/(<li class="mb-li">[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="mb-ul">${m}</ul>`);

    // Ordered list
    out = out.replace(/^\d+\. (.+)$/gm, '<li class="mb-oli"><span>$1</span></li>');
    out = out.replace(/(<li class="mb-oli">[\s\S]*?<\/li>\n?)+/g, (m) => `<ol class="mb-ol">${m}</ol>`);

    // Paragraph breaks
    out = out.replace(/\n\n+/g, "\n<br/>\n");
    out = out.replace(/\n(?!<)/g, "<br/>");

    return out;
}

// ── Component ──────────────────────────────────────────────────────────────
export function MessageBubble({ msg, onRetry, onEdit, onAvatarClick }: Props) {
    const [copied,     setCopied]     = useState(false);
    const [retryed,    setRetryed]    = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [isEditing,  setIsEditing]  = useState(false);
    const [editText,   setEditText]   = useState(msg.text);

    const copyAll = useCallback(() => {
        navigator.clipboard?.writeText(msg.text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    }, [msg.text]);

    const download = useCallback(() => {
        const blob = new Blob([msg.text], { type: "text/plain" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url;
        a.download = `dani-ai-${msg.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 1800);
    }, [msg.text, msg.id]);

    const retry = useCallback(() => {
        if (!onRetry) return;
        setRetryed(true);
        setTimeout(() => setRetryed(false), 1800);
        onRetry(msg.text);
    }, [msg.text, onRetry]);

    const handleEdit = useCallback(() => {
        if (!onEdit) return;
        onEdit(msg.id, editText);
        setIsEditing(false);
    }, [msg.id, editText, onEdit]);

    const isUser = msg.type === "user";
    const isSys  = msg.type === "system";
    const rendered = useMemo(() => parseMarkdown(msg.text), [msg.text]);
    const hasImage = msg.imageUrl || (msg.metadata?.image);

    // System message
    if (isSys) {
        return (
            <div className="mb-sys">
                <span className="mb-sys-icon">⚙</span>
                <span dangerouslySetInnerHTML={{ __html: rendered }} />
            </div>
        );
    }

    return (
        <div className={`msg-row${isUser ? " msg-row-user" : " msg-row-ai"}`}>
            {/* Role header */}
            <div className="msg-role">
                <button
                    className="msg-avatar-btn"
                    onClick={isUser && onAvatarClick ? onAvatarClick : undefined}
                    style={{
                        background: "none", border: "none", padding: 0, lineHeight: 0,
                        cursor: isUser && onAvatarClick ? "pointer" : "default",
                    }}
                    title={isUser && onAvatarClick ? "Lihat profil" : undefined}
                >
                    <div className={`msg-avatar${isUser ? " user" : " ai"}`}>
                        {isUser ? "U" : "D"}
                    </div>
                </button>
                <span className="msg-role-name">{isUser ? "Kamu" : "Dani AI"}</span>
                {msg.time && <span className="msg-time">{msg.time}</span>}
            </div>

            {/* Attached image */}
            {hasImage && (
                <div className="msg-image-wrap">
                    <img
                        src={msg.imageUrl || msg.metadata?.image}
                        alt="Uploaded"
                        className="msg-image"
                        onClick={() => window.open(msg.imageUrl || msg.metadata?.image, "_blank")}
                    />
                </div>
            )}

            {/* Message content / edit mode */}
            {isEditing && isUser ? (
                <div className="msg-edit-wrap">
                    <textarea
                        className="msg-edit-textarea"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        autoFocus
                    />
                    <div className="msg-edit-actions">
                        <button onClick={() => setIsEditing(false)}>Batal</button>
                        <button onClick={handleEdit}>Simpan</button>
                    </div>
                </div>
            ) : (
                <div
                    className="msg-content"
                    dangerouslySetInnerHTML={{ __html: rendered }}
                />
            )}

            {/* Action bar */}
            <div className="msg-action-bar">
                {/* Copy — semua pesan */}
                <button
                    className={`mab-btn${copied ? " mab-ok" : ""}`}
                    onClick={copyAll}
                    title="Copy pesan"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    {copied ? "Copied!" : "Copy"}
                </button>

                {/* Download — hanya AI */}
                {!isUser && (
                    <button
                        className={`mab-btn${downloaded ? " mab-ok" : ""}`}
                        onClick={download}
                        title="Download jawaban"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        {downloaded ? "Downloaded!" : "Download"}
                    </button>
                )}

                {/* Edit — hanya user */}
                {isUser && onEdit && !isEditing && (
                    <button
                        className="mab-btn"
                        onClick={() => setIsEditing(true)}
                        title="Edit pesan"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3l4 4L7 21H3v-4L17 3z"/>
                        </svg>
                        Edit
                    </button>
                )}

                {/* Retry — hanya AI */}
                {!isUser && onRetry && (
                    <button
                        className={`mab-btn${retryed ? " mab-ok" : ""}`}
                        onClick={retry}
                        title="Ulangi"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 4v6h6"/>
                            <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                        </svg>
                        {retryed ? "Mengulangi..." : "Ulangi"}
                    </button>
                )}
            </div>
        </div>
    );
}