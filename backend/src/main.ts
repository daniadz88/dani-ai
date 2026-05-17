// backend/src/main.ts

import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // ── CORS fix untuk Vercel deployment ──────────────────────────
    app.enableCors({
        origin: [
            // Local dev
            "http://localhost:5173",
            "http://localhost:3000",
            // Vercel — tambah semua domain frontend lo di sini
            "https://dani-ai-olive.vercel.app",
            // Wildcard untuk semua subdomain vercel lo (opsional)
            /https:\/\/dani-ai.*\.vercel\.app$/,
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    });

    const port = process.env.PORT ?? 3001;
    await app.listen(port);

    const key = process.env.GROQ_API_KEY ?? "";
    console.log(`[+] Groq API Key: gsk_...${key.slice(-6)}`);
    console.log(`[+] Dani AI backend running → http://localhost:${port}`);
}

bootstrap();
