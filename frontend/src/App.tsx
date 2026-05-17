// src/App.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from './hooks/useChat';
import { useTimer } from './hooks/useTimer';
import { MessageBubble } from './components/MessageBubble';
import { PROFILES, SHORTCUTS } from './lib/profiles';
import { checkHealth } from './lib/api';
import type { ProfileKey } from './types';
import './App.css';

export default function App() {
  const [input, setInput] = useState('');
  const [connStatus, setConnStatus] = useState<'checking' | 'online' | 'error'>('checking');
  const [msgCount, setMsgCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useTimer();

  const { messages, isLoading, profile, switchProfile, send } = useChat('pentest');

  // scroll to bottom on new messages
  useEffect(() => {
    const el = chatBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  // focus input when not loading
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  // count user messages
  useEffect(() => {
    setMsgCount(messages.filter((m) => m.type === 'user').length);
  }, [messages]);

  // health check
  useEffect(() => {
    checkHealth()
      .then((data) => {
        setConnStatus(data.api_key === 'missing' ? 'error' : 'online');
      })
      .catch(() => setConnStatus('error'));
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await send(text);
  }, [input, isLoading, send]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fillInput = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const connLabel = {
    checking: '● checking...',
    online:   '● connected',
    error:    '● offline',
  }[connStatus];

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo"><em>Dani</em>AI <span className="nav-pill">BETA</span></div>
        <div className="nav-links">
          <a className="nav-link active" href="#install">install</a>
          <a className="nav-link" href="#endpoints">endpoints</a>
          <a className="nav-link" href="#profiles">profiles</a>
        </div>
        <span className={`nav-conn ${connStatus}`}>{connLabel}</span>
        <button className="nav-doc-btn" onClick={() => setDrawerOpen(true)}>☰ docs</button>
      </nav>

      <div className="shell">
        {/* TERMINAL PANE */}
        <section className="pane-terminal">
          {/* header */}
          <div className="term-header">
            <div className="term-header-top">
              <div className="dots">
                <div className="dot r" /><div className="dot y" /><div className="dot g" />
              </div>
              <span className="term-title">dani-ai — security research terminal</span>
            </div>
            <div className="profile-tabs">
              {PROFILES.map((p) => (
                <button
                  key={p.key}
                  className={`ptab${profile === p.key ? ' active' : ''}`}
                  onClick={() => switchProfile(p.key as ProfileKey)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* stat bar */}
          <div className="stat-bar">
            <div className="stat">
              <div className="stat-lbl">Status</div>
              <div className={`stat-val sv-${connStatus === 'online' ? 'g' : 'r'}`}>
                {connStatus === 'online' ? '● online' : '● offline'}
              </div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Profile</div>
              <div className="stat-val sv-p">{profile}</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Pesan</div>
              <div className="stat-val sv-b">{msgCount}</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Session</div>
              <div className="stat-val sv-a">{timer}</div>
            </div>
          </div>

          {/* chat body */}
          <div className="chat-body" ref={chatBodyRef}>
            {/* welcome */}
            <div className="msg-block">
              <div className="msg-meta"><span className="m-ai">dani-ai</span><span>— siap</span></div>
              <div className="msg-wrap">
                <div className="msg-body mb-ai">
                  Halo! Gue <code>Dani AI</code> — asisten keamanan terhubung ke Groq API.
                  Mau ngapain dulu?
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

            {/* typing indicator */}
            <div className={`typing-row${isLoading ? ' show' : ''}`}>
              {isLoading && (
                <div className="typing show">
                  <div className="tdot" /><div className="tdot" /><div className="tdot" />
                  <span className="typing-lbl">dani-ai mengetik...</span>
                </div>
              )}
            </div>
          </div>

          {/* input */}
          <div className="input-row">
            <span className="prompt">
              <span className="pu">dani</span>
              <span className="ph">@sec</span>
              <span style={{ color: 'var(--text3)' }}>:</span>
              <span className="pp">~</span>
              <span style={{ color: 'var(--text3)' }}>$ </span>
            </span>
            <input
              ref={inputRef}
              className="term-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="ketik pertanyaan..."
              disabled={isLoading}
              autoComplete="off"
              inputMode="text"
            />
            <button className="send-btn" onClick={handleSend} disabled={isLoading}>
              kirim ↵
            </button>
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

      {/* DRAWER mobile */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay open" onClick={() => setDrawerOpen(false)} />
          <div className="drawer open">
            <div className="docs-head">
              <span className="docs-head-icon">◈</span> dokumentasi
              <button className="docs-close" onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className="docs-scroll"><DocsContent /></div>
          </div>
        </>
      )}

      {/* BOTTOM NAV mobile */}
      <nav className="bottom-nav">
        <button className="bnav-btn active" onClick={() => inputRef.current?.focus()}>
          <span className="bnav-icon">⌨</span><span className="bnav-lbl">terminal</span>
        </button>
        <button className="bnav-btn" onClick={() => setDrawerOpen(true)}>
          <span className="bnav-icon">☰</span><span className="bnav-lbl">docs</span>
        </button>
        <button className="bnav-btn">
          <span className="bnav-icon">◉</span><span className="bnav-lbl">profile</span>
        </button>
      </nav>
    </>
  );
}

// ===================== DOCS CONTENT =====================

function DocsContent() {
  return (
    <div className="docs-body">
      <div className="doc-section" id="install">
        <div className="doc-section-title">instalasi</div>
        <div className="install-steps">
          {[
            ['01', 'Clone / extract project', 'cd dani-ai/'],
            ['02', 'Install backend deps', 'cd backend && npm install'],
            ['03', 'Install frontend deps', 'cd frontend && npm install'],
            ['04', 'Isi .env', 'GROQ_API_KEY=gsk_...'],
            ['05', 'Jalanin backend', 'npm run start:dev'],
            ['06', 'Jalanin frontend', 'npm run dev'],
          ].map(([num, text, code]) => (
            <div className="istep" key={num}>
              <span className="istep-num">{num}</span>
              <div className="istep-text">{text}<br /><span className="istep-code">{code}</span></div>
            </div>
          ))}
        </div>
        <div className="doc-note">
          <strong>Stack:</strong> NestJS (port 3001) + React/Vite (port 5173).
          Vite auto-proxy <code>/api</code> ke backend — gak perlu CORS manual.
        </div>
      </div>

      <hr className="doc-divider" />

      <div className="doc-section" id="endpoints">
        <div className="doc-section-title">API endpoints</div>
        <div className="doc-code">
          <div className="doc-code-head"><span>base url</span></div>
          <div className="doc-code-body">http://localhost:3001</div>
        </div>
        <table className="ep-table">
          <thead><tr><th>method</th><th>path</th><th>fungsi</th></tr></thead>
          <tbody>
            <tr><td><span className="ep-method get">GET</span></td><td className="ep-path">/api/health</td><td className="ep-desc">Cek status & API key</td></tr>
            <tr><td><span className="ep-method post">POST</span></td><td className="ep-path">/api/chat</td><td className="ep-desc">Kirim pesan ke AI</td></tr>
            <tr><td><span className="ep-method get">GET</span></td><td className="ep-path">/api/profiles</td><td className="ep-desc">List profile tersedia</td></tr>
          </tbody>
        </table>
      </div>

      <hr className="doc-divider" />

      <div className="doc-section" id="profiles">
        <div className="doc-section-title">profiles</div>
        <div className="profile-chips">
          {PROFILES.map((p) => (
            <div className="pchip" key={p.key}>
              <div className="pchip-dot" style={{ background: p.color }} />
              <div>
                <div className="pchip-name">{p.key}</div>
                <div className="pchip-desc">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="doc-note">
          <strong>Catatan:</strong> Ganti profile akan <strong>reset history</strong>.
          History dibatasi 20 pesan terakhir.
        </div>
      </div>

      <hr className="doc-divider" />

      <div className="doc-section">
        <div className="doc-section-title">struktur project</div>
        <div className="doc-code">
          <div className="doc-code-head"><span>project tree</span></div>
          <div className="doc-code-body">{`dani-ai/
├── backend/          ← NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   └── dani.config.ts   ← port dari dani_core.py
│   │   ├── chat/
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   └── chat.module.ts
│   │   └── health/
│   │       └── health.controller.ts
│   ├── .env
│   └── package.json
└── frontend/         ← React + Vite
    ├── src/
    │   ├── App.tsx
    │   ├── App.css
    │   ├── hooks/
    │   ├── components/
    │   ├── lib/
    │   └── types/
    ├── vite.config.ts
    └── package.json`}</div>
        </div>
      </div>
    </div>
  );
}
