// 🔹 1) Polyfill de crypto (soluciona "crypto is not defined")
import { webcrypto } from 'crypto';
(globalThis as any).crypto = webcrypto;

// 🔹 2) Cargar variables de entorno (.env)
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env') });

// 🔹 3) Importar NestJS y AppModule
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://10.0.0.183:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(3000, '0.0.0.0');
  console.log('✅ NestJS API escuchando en http://localhost:3000/api');
}
