# Dani AI — NestJS + React

Security research chatbot. Backend NestJS, frontend React + Vite.

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # atau edit .env langsung
# isi GROQ_API_KEY=gsk_...
npm run start:dev
# → http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Vite otomatis proxy `/api` ke backend port 3001 — tidak perlu setting CORS manual di frontend.

## Struktur

```
dani-ai/
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
    │   │   ├── useChat.ts
    │   │   └── useTimer.ts
    │   ├── components/
    │   │   └── MessageBubble.tsx
    │   ├── lib/
    │   │   ├── api.ts
    │   │   └── profiles.ts
    │   └── types/
    │       └── index.ts
    ├── vite.config.ts
    └── package.json
```

## API Endpoints

| Method | Path | Fungsi |
|--------|------|--------|
| GET | /api/health | Status & API key check |
| POST | /api/chat | Kirim pesan ke AI |
| GET | /api/profiles | List profile |

## Profiles

- `pentest` — Penetration testing & offensive security
- `osint` — OSINT & reconnaissance
- `ctf` — CTF solving
- `script` — Python/Bash security scripting
- `aidefense` — AI security defense (OWASP LLM Top 10)
