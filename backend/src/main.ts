// backend/src/main.ts
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {ExpressAdapter} from "@nestjs/platform-express";
import express from "express";

const server = express();
let initialized = false;

async function bootstrap() {
    if (initialized) return;
    initialized = true;

    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.enableCors({
        origin: ["http://localhost:5173", "https://dani-ai-olive.vercel.app", /https:\/\/dani-ai.*\.vercel\.app$/],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    });

    // Jangan pakai setGlobalPrefix — biarkan controller yang handle /api/*
    await app.init();
}

// Handler untuk Vercel serverless
export default async function handler(req: any, res: any) {
    await bootstrap();
    server(req, res);
}
