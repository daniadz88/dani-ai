import {NestFactory} from "@nestjs/core";
import {AppModule} from "../src/app.module";
import {ExpressAdapter} from "@nestjs/platform-express";
import express from "express";

const server = express();

export default async function handler(req: any, res: any) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.enableCors({
        origin: ["https://dani-ai-one.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });
    await app.init();
    server(req, res);
}
