// src/components/MessageBubble.tsx

import {useState, useCallback, useMemo} from "react";
import type {DisplayMessage} from "../types";

interface Props {
    msg: DisplayMessage;
}

// ── Syntax highlighter ringan tanpa library eksternal ──────────────────────
function highlightCode(code: string, lang: string): string {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let out = esc(code);

    const keywords: Record<string, string[]> = {
        python: [
            "def",
            "class",
            "import",
            "from",
            "return",
            "if",
            "elif",
            "else",
            "for",
            "while",
            "try",
            "except",
            "finally",
            "with",
            "as",
            "pass",
            "break",
            "continue",
            "and",
            "or",
            "not",
            "in",
            "is",
            "lambda",
            "yield",
            "async",
            "await",
            "True",
            "False",
            "None",
            "print",
            "range",
            "len",
            "open",
            "self",
        ],
        bash: [
            "echo",
            "cd",
            "ls",
            "cat",
            "grep",
            "awk",
            "sed",
            "curl",
            "wget",
            "sudo",
            "apt",
            "pip",
            "npm",
            "git",
            "ssh",
            "scp",
            "chmod",
            "chown",
            "mkdir",
            "rm",
            "cp",
            "mv",
            "find",
            "export",
            "source",
            "if",
            "then",
            "else",
            "fi",
            "for",
            "do",
            "done",
            "while",
            "function",
        ],
        javascript: [
            "const",
            "let",
            "var",
            "function",
            "return",
            "if",
            "else",
            "for",
            "while",
            "class",
            "import",
            "export",
            "default",
            "from",
            "async",
            "await",
            "new",
            "this",
            "true",
            "false",
            "null",
            "undefined",
            "typeof",
            "instanceof",
            "throw",
            "try",
            "catch",
        ],
        typescript: [
            "const",
            "let",
            "var",
            "function",
            "return",
            "if",
            "else",
            "for",
            "while",
            "class",
            "import",
            "export",
            "default",
            "from",
            "async",
            "await",
            "new",
            "this",
            "true",
            "false",
            "null",
            "undefined",
            "type",
            "interface",
            "enum",
            "extends",
            "implements",
            "readonly",
            "public",
            "private",
            "protected",
        ],
        sql: [
            "SELECT",
            "FROM",
            "WHERE",
            "JOIN",
            "LEFT",
            "RIGHT",
            "INNER",
            "OUTER",
            "ON",
            "GROUP",
            "BY",
            "ORDER",
            "HAVING",
            "INSERT",
            "INTO",
            "VALUES",
            "UPDATE",
            "SET",
            "DELETE",
            "CREATE",
            "TABLE",
            "INDEX",
            "DROP",
            "ALTER",
            "ADD",
            "PRIMARY",
            "KEY",
            "FOREIGN",
            "REFERENCES",
            "NOT",
            "NULL",
            "DEFAULT",
            "UNIQUE",
            "IF",
            "EXISTS",
            "AND",
            "OR",
            "IN",
            "LIKE",
            "BETWEEN",
            "AS",
            "DISTINCT",
            "LIMIT",
            "OFFSET",
        ],
    };

    const langAliases: Record<string, string> = {
        js: "javascript",
        ts: "typescript",
        py: "python",
        sh: "bash",
        shell: "bash",
        zsh: "bash",
        fish: "bash",
    };

    const normalLang = langAliases[lang] || lang;
    const kws = keywords[normalLang] || [];

    if (kws.length) {
        const kwPattern = new RegExp(`\\b(${kws.join("|")})\\b`, "g");
        out = out.replace(kwPattern, '<span class="hl-kw">$1</span>');
    }

    // Strings — setelah keyword agar tidak overlap
    out = out.replace(/(&quot;|&#039;|`)(.*?)\1/g, '<span class="hl-str">$&</span>');
    // Numbers
    out = out.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
    // Comments python/bash
    if (["python", "bash"].includes(normalLang)) {
        out = out.replace(/(#[^\n]*)/g, '<span class="hl-cmt">$1</span>');
    }
    // Comments JS/TS
    if (["javascript", "typescript"].includes(normalLang)) {
        out = out.replace(/(\/\/[^\n]*)/g, '<span class="hl-cmt">$1</span>');
        out = out.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-cmt">$1</span>');
    }
    // SQL comments
    if (normalLang === "sql") {
        out = out.replace(/(--[^\n]*)/g, '<span class="hl-cmt">$1</span>');
    }

    return out;
}

// ── Markdown parser ────────────────────────────────────────────────────────
function parseMarkdown(raw: string): string {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let out = raw;

    // 1. Fenced code blocks ```lang\ncode\n```
    out = out.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
        const trimmed = code.replace(/^\n/, "").replace(/\n$/, "");
        const label = lang || "code";
        const highlighted = highlightCode(trimmed, lang.toLowerCase());
        return (
            `<div class="mb-code-wrap">` +
            `<div class="mb-code-header">` +
            `<span class="mb-code-lang">${esc(label)}</span>` +
            `<button class="mb-code-copy" onclick="(function(b){` +
            `const t=b.closest('.mb-code-wrap').querySelector('code').innerText;` +
            `navigator.clipboard?.writeText(t).then(()=>{b.textContent='✓ copied';` +
            `setTimeout(()=>b.textContent='copy',1800)})` +
            `})(this)">copy</button>` +
            `</div>` +
            `<pre class="mb-pre"><code>${highlighted}</code></pre>` +
            `</div>`
        );
    });

    // 2. Inline code `code`
    out = out.replace(/`([^`\n]+)`/g, '<code class="mb-icode">$1</code>');

    // 3. Bold **text**
    out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

    // 4. Italic *text* atau _text_
    out = out.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
    out = out.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");

    // 5. Strikethrough ~~text~~
    out = out.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

    // 6. Headers
    out = out.replace(/^### (.+)$/gm, '<h3 class="mb-h3">$1</h3>');
    out = out.replace(/^## (.+)$/gm, '<h2 class="mb-h2">$1</h2>');
    out = out.replace(/^# (.+)$/gm, '<h1 class="mb-h1">$1</h1>');

    // 7. Horizontal rule
    out = out.replace(/^---+$/gm, '<hr class="mb-hr"/>');

    // 8. Blockquote > text
    out = out.replace(/^&gt; (.+)$/gm, '<blockquote class="mb-bq">$1</blockquote>');
    // (raw > sudah di-escape ke &gt; oleh block code, tapi markdown ini parse raw)
    out = out.replace(/^> (.+)$/gm, '<blockquote class="mb-bq">$1</blockquote>');

    // 9. Unordered list - item / * item
    out = out.replace(/^[\-\*] (.+)$/gm, '<li class="mb-li">$1</li>');
    out = out.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul class="mb-ul">${m}</ul>`);

    // 10. Ordered list 1. item
    out = out.replace(/^\d+\. (.+)$/gm, '<li class="mb-oli">$1</li>');
    out = out.replace(/(<li class="mb-oli">[^<]*<\/li>\n?)+/g, (m) => `<ol class="mb-ol">${m}</ol>`);

    // 11. Paragraphs — baris kosong jadi <br> ganda
    out = out.replace(/\n\n+/g, "\n<br/>\n");
    out = out.replace(/\n(?!<)/g, "<br/>");

    return out;
}

// ── Component ──────────────────────────────────────────────────────────────
export function MessageBubble({msg}: Props) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(() => {
        navigator.clipboard?.writeText(msg.text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    }, [msg.text]);

    const isUser = msg.type === "user";
    const isSys = msg.type === "system";

    const rendered = useMemo(() => parseMarkdown(msg.text), [msg.text]);

    if (isSys) {
        return (
            <div className="mb-sys">
                <span className="mb-sys-icon">⚙</span>
                <span dangerouslySetInnerHTML={{__html: rendered}} />
            </div>
        );
    }

    return (
        <div className={`msg-row${isUser ? " msg-row-user" : ""}`}>
            {/* Role header */}
            <div className="msg-role">
                <div className={`msg-avatar${isUser ? " user" : " ai"}`}>{isUser ? "U" : "D"}</div>
                <span className="msg-role-name">{isUser ? "Kamu" : "Dani AI"}</span>
                {msg.time && <span className="msg-time">{msg.time}</span>}
                {!isUser && (
                    <button className={`msg-action-btn${copied ? " ok" : ""}`} onClick={copy} title="Copy semua teks">
                        {copied ? "✓ copied" : "⎘ copy"}
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="msg-content" dangerouslySetInnerHTML={{__html: rendered}} />
        </div>
    );
}
