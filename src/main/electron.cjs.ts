import 'reflect-metadata';          // Necesario para NestJS
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { bootstrap } from './bootstrap';

let mainWindow: BrowserWindow | null;

async function createWindow() {
  // Arranca NestJS antes de crear la ventana
  await bootstrap();

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Si usas preload:
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Carga tu aplicación React (Vite)
  mainWindow.loadURL('http://localhost:5173');

  // Oculta el menú
  Menu.setApplicationMenu(null);

  // Maneja el cierre
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
