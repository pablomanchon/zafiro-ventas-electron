# Zafiro - Stock y Ventas

Aplicacion de escritorio con Electron, frontend en React y API local en NestJS.

## Base de datos

El backend soporta dos modos:

- `Postgres/Supabase` si existe `DATABASE_URL`
- `SQLite` como fallback si no existe `DATABASE_URL`

## Variables recomendadas

Usa `.env.example` como referencia.

- `DATABASE_URL`: conexion a Supabase Postgres
- `TYPEORM_SYNCHRONIZE`: en Supabase conviene `false`
- `VITE_SUPABASE_URL`: URL del proyecto de Supabase
- `VITE_SUPABASE_ANON_KEY`: clave publica para el frontend
- `SUPABASE_ACCESS_TOKEN`: token personal para tareas administrativas
- `ZAFIRO_DB_PATH`: ruta local del archivo SQLite si quieres seguir usando modo local

## Recomendacion de arquitectura

La recomendacion para este proyecto es:

- mantener una capa backend chica para la logica de negocio;
- usar Supabase como Postgres principal;
- no mover ventas, stock y caja directamente al cliente.

Eso simplifica la infraestructura sin repartir logica critica por toda la app.
