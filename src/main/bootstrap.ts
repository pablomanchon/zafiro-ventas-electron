// 🔹 1) Polyfill de crypto (soluciona "crypto is not defined")
import { webcrypto } from 'crypto'
;(globalThis as any).crypto = webcrypto

// 🔹 2) Variables de entorno
import { config } from 'dotenv'
import path, { join } from 'path'
import fs from 'fs'

// 🔹 3) Import NestJS
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

function loadEnv() {
  // Prioridad:
  // 1) .env en el directorio actual (dev normal)
  // 2) .env junto al ejecutable / carpeta de la app (cuando está empaquetada)
  const candidates = [
    join(process.cwd(), '.env'),
    join(path.dirname(process.execPath), '.env'),
  ]

  const envPath = candidates.find((p) => fs.existsSync(p))
  if (envPath) config({ path: envPath })
  else config() // fallback: variables del sistema
}

export async function bootstrap() {
  loadEnv()

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  })

  app.setGlobalPrefix('api')

  // ✅ CORS para Electron:
  // - En dev: origin = http://localhost:5173
  // - En prod: origin suele ser null (file://) => hay que permitirlo
  app.enableCors({
    origin: (origin: string, cb: (arg0: Error | null, arg1: boolean) => any) => {
      // origin === undefined/null suele pasar con file:// (Electron)
      if (!origin) return cb(null, true)

      // Dev server
      if (origin === 'http://localhost:5173') return cb(null, true)

      // Si querés permitir otros origins locales:
      if (origin.startsWith('http://localhost:')) return cb(null, true)

      return cb(new Error(`CORS bloqueado para origin: ${origin}`), false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  const PORT = Number(process.env.PORT ?? 3000)
  await app.listen(PORT, '127.0.0.1')
  console.log(`✅ NestJS API escuchando en http://localhost:${PORT}/api`)
}
