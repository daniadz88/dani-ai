# 🛡️ Dani AI — Security Research Terminal

<div align="center">

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

![Made with NestJS](https://img.shields.io/badge/Backend-NestJS-ea2845?style=for-the-badge&logo=nestjs&logoColor=white)
![Made with React](https://img.shields.io/badge/Frontend-React-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Powered by Groq](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-f55036?style=for-the-badge&logo=meta&logoColor=white)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**AI-powered security research assistant khusus buat ethical hacking, CTF, dan riset keamanan.**

[🚀 Quick Start](#-quick-start) · [📖 Dokumentasi](#-api-endpoints) · [⚠️ Disclaimer](#%EF%B8%8F-disclaimer--legal-notice)

</div>

---

## ⚠️ DISCLAIMER & LEGAL NOTICE

> **BACA INI SEBELUM MENGGUNAKAN**

```
MIT License — Copyright (c) 2025 daniadz88

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, subject to the following conditions:
```

### 🔴 Penggunaan yang Dilarang

Proyek ini dibuat **SEMATA-MATA** untuk keperluan:
- ✅ Ethical hacking & penetration testing pada sistem yang **Anda miliki** atau **sudah mendapat izin tertulis**
- ✅ Riset keamanan siber dan akademik
- ✅ CTF (Capture The Flag) competition
- ✅ Edukasi dan pembelajaran keamanan informasi
- ✅ Bug bounty program resmi

**Developer (daniadz88) TIDAK BERTANGGUNG JAWAB atas:**
- ❌ Penyalahgunaan tool ini untuk aktivitas ilegal
- ❌ Akses tidak sah ke sistem orang lain
- ❌ Kerusakan data, sistem, atau infrastruktur pihak ketiga
- ❌ Segala bentuk kejahatan siber yang dilakukan menggunakan tool ini
- ❌ Pelanggaran hukum siber di yurisdiksi manapun (UU ITE Indonesia, CFAA USA, dll)

> **Dengan menggunakan, mengkloning, atau mendeploy proyek ini, Anda setuju bahwa segala konsekuensi hukum akibat penyalahgunaan adalah tanggung jawab Anda sepenuhnya.**

---

## 🧠 Tentang Dani AI

Dani AI adalah terminal chatbot berbasis AI yang dirancang sebagai **asisten riset keamanan**. Ditenagai oleh **LLaMA 3.3 70B** via Groq API, Dani AI memiliki 5 mode spesialisasi:

| Profile | Fokus |
|---------|-------|
| 🔴 **pentest** | Penetration testing, exploits, vulnerability assessment |
| 🔵 **osint** | Reconnaissance, footprinting, intel gathering |
| 🏴 **ctf** | CTF solving, writeup-style hints |
| 🟢 **script** | Python / Bash security scripting & automation |
| 🤖 **ai-def** | AI security, OWASP LLM Top 10, prompt injection defense |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Groq API Key → [console.groq.com](https://console.groq.com)

### 1. Clone & Setup

```bash
git clone https://github.com/daniadz88/dani-ai.git
cd dani-ai
```

### 2. Backend (NestJS)

```bash
cd backend
npm install

# Buat file .env
echo "GROQ_API_KEY=gsk_xxxxxxxx" > .env
echo "PORT=3001" >> .env

npm run start:dev
# → http://localhost:3001
```

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 📁 Struktur Project

```
dani-ai/
├── backend/                  ← NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   └── dani.config.ts    ← Profiles & system prompts
│   │   ├── chat/
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   └── chat.module.ts
│   │   └── health/
│   │       └── health.controller.ts
│   └── package.json
└── frontend/                 ← React + Vite
    ├── src/
    │   ├── App.tsx
    │   ├── hooks/
    │   │   ├── useChat.ts
    │   │   └── useTimer.ts
    │   ├── components/
    │   │   └── MessageBubble.tsx
    │   └── lib/
    │       ├── api.ts
    │       └── profiles.ts
    └── vite.config.ts
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:3001`

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/health` | Cek status server & API key |
| `POST` | `/api/chat` | Kirim pesan ke AI |
| `GET` | `/api/profiles` | List semua profile tersedia |

### Contoh Request

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Gimana cara nmap stealth scan?",
    "profile": "pentest",
    "history": []
  }'
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript |
| Frontend | React 18 + Vite + TypeScript |
| AI Model | LLaMA 3.3 70B via Groq |
| Styling | Pure CSS (terminal aesthetic) |
| Font | Geist Mono |

---

## 📜 License

MIT License — lihat [LICENSE](LICENSE) untuk detail lengkap.

---

<div align="center">

Dibuat untuk keperluan **edukasi & riset keamanan** oleh [daniadz88](https://github.com/daniadz88)

**Gunakan dengan bijak. Hack ethically.**

---

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&duration=3000&pause=1000&color=8B6EF5&center=true&vCenter=true&multiline=true&width=600&height=80&lines=dani%40sec%3A~%24+whoami;daniadz88+%7C+security+researcher+%7C+builder)](https://github.com/daniadz88)

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=13&duration=2000&pause=500&color=3DDC84&center=true&vCenter=true&multiline=true&width=600&height=100&lines=dani%40sec%3A~%24+cat+disclaimer.txt;%5B!%5D+For+educational+%26+ethical+use+ONLY.;%5B!%5D+Unauthorized+access+is+illegal.;%5B!%5D+Dev+not+responsible+for+misuse.)](https://github.com/daniadz88)

<img src="https://capsule-render.vercel.app/api?type=waving&color=8B6EF5&height=80&section=footer&text=daniadz88&fontSize=20&fontColor=ffffff&animation=twinkling&fontAlignY=70" width="100%"/>

</div>