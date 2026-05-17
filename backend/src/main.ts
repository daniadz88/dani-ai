// backend/src/main.ts
import express from "express";
import cors from "cors";
import path from "path";
import {buildMessages, PROFILES, MODEL, getProfileList} from "./config/dani.config";
import OpenAI from "openai";

const app = express();

app.use(
    cors({
        origin: ["http://localhost:5173", "https://dani-ai-olive.vercel.app", /https:\/\/dani-ai.*\.vercel\.app$/],
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use(express.json());

// ── Health ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
    const keySet = !!process.env.GROQ_API_KEY;
    res.json({
        status: "ok",
        model: MODEL,
        api_key: keySet ? "set" : "missing",
    });
});

// ── Profiles ──────────────────────────────────────────────────
app.get("/api/profiles", (_req, res) => {
    res.json(getProfileList());
});

// ── Chat ──────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
    const {message, profile = "pentest", history = []} = req.body;

    if (!message?.trim()) {
        return res.status(400).json({error: "Message kosong"});
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) {
        return res.status(401).json({error: "GROQ_API_KEY tidak ditemukan"});
    }

    const validProfile = PROFILES[profile as keyof typeof PROFILES] ? profile : "pentest";

    try {
        const client = new OpenAI({
            apiKey: key,
            baseURL: "https://api.groq.com/openai/v1",
        });

        const messages = buildMessages(history, message, validProfile as any);

        const completion = await client.chat.completions.create({
            model: MODEL,
            messages,
            max_tokens: 2000,
            temperature: 0.65,
        });

        const reply = completion.choices[0].message.content;
        return res.json({reply, profile: validProfile, model: MODEL});
    } catch (e: any) {
        const err = String(e.message || e);
        if (err.includes("401")) return res.status(401).json({error: "API Key tidak valid"});
        if (err.includes("429")) return res.status(429).json({error: "Rate limit, coba lagi"});
        return res.status(500).json({error: err});
    }
});

// ── Local dev ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT ?? 3001;
    app.listen(port, () => {
        const key = process.env.GROQ_API_KEY ?? "";
        console.log(`[+] Groq API Key: gsk_...${key.slice(-6)}`);
        console.log(`[+] Backend running → http://localhost:${port}`);
    });
}

// Export untuk Vercel serverless
export default app;
