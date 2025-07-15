import 'reflect-metadata';
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { bootstrap } from './bootstrap';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  // Arranca NestJS antes de crear la ventana de Electron
  await bootstrap();

  // Crea la ventana principal
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Carga tu frontend en desarrollo o producción
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Desactiva el menú por defecto
  Menu.setApplicationMenu(null);

  // Maneja el evento de cierre
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

// Cuando Electron está listo, crea la ventana
app.whenReady().then(createWindow);

// Cierra la app cuando todas las ventanas estén cerradas (excepto macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// En macOS, re-crea la ventana si el ícono es clicado
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});