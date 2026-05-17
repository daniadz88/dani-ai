// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // CORS — izinkan React dev server
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');

  const key = process.env.GROQ_API_KEY ?? '';
  if (!key) {
    console.warn('\n[!] GROQ_API_KEY belum di-set! Isi file .env dulu.\n');
  } else {
    console.log(`[+] Groq API Key: gsk_...${key.slice(-6)}`);
  }
  console.log(`[+] Dani AI backend running → http://localhost:${port}\n`);
}

bootstrap();
