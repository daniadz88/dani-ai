# 🛡️ Dani AI — Security Research Terminal

<div align="center">

<img src="https://raw.githubusercontent.com/daniadz88/dani-ai/main/frontend/public/favicon.svg" width="120" height="120" alt="Dani AI Logo"/>

```
██████╗  █████╗ ███╗   ██╗██╗     █████╗ ██╗
██╔══██╗██╔══██╗████╗  ██║██║    ██╔══██╗██║
██║  ██║███████║██╔██╗ ██║██║    ███████║██║
██║  ██║██╔══██║██║╚██╗██║██║    ██╔══██║██║
██████╔╝██║  ██║██║ ╚████║██║    ██║  ██║██║
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝    ╚═╝  ╚═╝╚═╝
        [ Security Research Terminal ]
        [ by: github.com/daniadz88  ]
        [ powered by: LLaMA 3.3 70B ]
```

![Backend](https://img.shields.io/badge/Backend-NestJS-ea2845?style=for-the-badge&logo=nestjs&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?style=for-the-badge&logo=react&logoColor=black)
![AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3%2070B-f55036?style=for-the-badge&logo=meta&logoColor=white)
![Deploy](https://img.shields.io/badge/Deploy-Vercel%20Serverless-000?style=for-the-badge&logo=vercel&logoColor=white)
![DB](https://img.shields.io/badge/Database-Supabase-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![Lang](https://img.shields.io/badge/Language-TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)

**AI-powered security research assistant untuk ethical hacking, CTF, dan riset keamanan.**

[🚀 Quick Start](#-quick-start) · [📖 API Docs](#-api-endpoints) · [⚠️ Disclaimer](#%EF%B8%8F-disclaimer)

</div>

---

## ⚠️ Disclaimer

> Gunakan **hanya** untuk keperluan legal: ethical hacking pada sistem yang Anda miliki/izini, CTF, riset, edukasi. Developer tidak bertanggung jawab atas penyalahgunaan.

---

## 🧠 Tentang Dani AI

Dani AI adalah AI chatbot berbasis terminal yang dirancang sebagai **asisten riset keamanan**. Ditenagai **LLaMA 3.3 70B** via Groq API, dengan 15 mode spesialisasi:

| Kategori | Profile |
|----------|---------|
| 🔐 **Security** | pentest · osint · ctf · script · aidefense |
| 💻 **Tech** | linux · networking · coding · data · devops |
| 📚 **Education** | math · english |
| 🧩 **Lifestyle** | productivity · finance · creative |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Groq API Key → [console.groq.com](https://console.groq.com)
- Supabase project → [supabase.com](https://supabase.com)

### 1. Clone

```bash
git clone https://github.com/daniadz88/dani-ai.git
cd dani-ai
```

### 2. Backend (Express + TypeScript)

```bash
cd backend
npm install

# Buat .env
echo "GROQ_API_KEY=gsk_xxxxxxxx" > .env
echo "PORT=3001" >> .env

npm run dev
# → http://localhost:3001
```

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install

# Buat .env.local
echo "VITE_API_URL=http://localhost:3001" > .env.local
echo "VITE_SUPABASE_URL=https://xxx.supabase.co" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=eyJ..." >> .env.local

npm run dev
# → http://localhost:5173
```

---

## 📁 Struktur Project

```
dani-ai/
├── backend/
│   ├── src/
│   │   ├── main.ts               ← Express serverless handler
│   │   └── config/
│   │       └── dani.config.ts    ← 15 profiles & system prompts
│   └── vercel.json
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── hooks/
    │   │   ├── useChat.ts         ← chat logic + Supabase session
    │   │   └── useTimer.ts
    │   ├── components/
    │   │   └── MessageBubble.tsx  ← markdown + syntax highlight
    │   └── lib/
    │       ├── api.ts
    │       ├── supabase.ts
    │       └── profiles.ts
    └── vite.config.ts             ← PWA config
```

---

## 🔌 API Endpoints

Base URL: `https://dani-ai-eph8.vercel.app`

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/health` | Status server & API key |
| `POST` | `/api/chat` | Kirim pesan ke AI |
| `GET` | `/api/profiles` | List semua profile |

### Contoh Request

```bash
curl -X POST https://dani-ai-eph8.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Gimana cara nmap stealth scan?",
    "profile": "pentest",
    "history": []
  }'
```

### Response

```json
{
  "reply": "Untuk stealth scan dengan nmap...",
  "profile": "pentest",
  "model": "llama-3.3-70b-versatile"
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend (NestJS + TypeScript)) |
| Frontend | React 18 + Vite + TypeScript |
| AI Model | LLaMA 3.3 70B via Groq |
| Database | Supabase (chat history) |
| Auth | Supabase Auth (Google OAuth) |
| PWA | vite-plugin-pwa |
| Styling | Pure CSS + CSS Variables |

---

## 📜 License

MIT License — lihat [LICENSE](LICENSE)

---

<div align="center">

Dibuat untuk **edukasi & riset keamanan** oleh [daniadz88](https://github.com/daniadz88)

**Gunakan dengan bijak. Hack ethically.**

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&duration=3000&pause=1000&color=8B6EF5&center=true&vCenter=true&multiline=true&width=600&height=80&lines=dani%40sec%3A~%24+whoami;daniadz88+%7C+security+researcher+%7C+builder)](https://github.com/daniadz88)

</div>