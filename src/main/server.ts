// src/server.ts
import express from 'express';
import { AppDataSource } from './database/data-source';
import cors from 'cors';
const app = express();
const port = 3000;

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Inicializar la base de datos y arrancar el servidor
AppDataSource.initialize().then(() => {
  console.log('Base de datos SQLite inicializada.');

  app.listen(port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${port}`);
  });
}).catch((error) => console.error('Error al inicializar la base de datos', error));
