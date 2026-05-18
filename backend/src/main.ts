// src/main.ts  ← ganti file ini (sebelumnya mungkin kosong / pakai Vercel handler)
// Jalankan: npx ts-node -r tsconfig-paths/register src/main.ts
// atau:     npm run start:dev  (kalau sudah ada script di package.json)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',   // Vite dev server
      'http://localhost:3000',   // fallback
      'https://dani-ai-olive.vercel.app', // production tetap bisa
    ],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`\n🛡️  Dani AI backend running → http://localhost:${port}`);
  console.log(`   Health : http://localhost:${port}/api/health`);
  console.log(`   Chat   : http://localhost:${port}/api/chat\n`);
}

bootstrap();