import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: ["https://dani-ai-one.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true,
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`[+] Dani AI backend running → http://localhost:${port}`);
}
bootstrap();
