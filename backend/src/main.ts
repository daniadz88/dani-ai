import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: ["http://localhost:5173", "https://dani-ai-olive.vercel.app", /https:\/\/dani-ai.*\.vercel\.app$/],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    });

    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`[+] Backend running → http://localhost:${port}`);
}
bootstrap();
