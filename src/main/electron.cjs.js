// src/main/electron.ts (o como lo tengas nombrado)
import 'reflect-metadata';
import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'path';
import { bootstrap } from './bootstrap';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  await bootstrap();

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nativeWindowOpen: true,             // ① Activa window.open nativo
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // ② Intercepta todas las llamadas a window.open / <a target="_blank">
  mainWindow.webContents.setWindowOpenHandler(({ url, features }) => {
    // Si es ruta CRUD en tu HashRouter...
    if (url.includes('#/crud/')) {
      // Ejemplo: usa distinto ancho según sea "create" o "edit"
      const isCreate = url.includes('/create');
      const width = isCreate ? 500 : 800;
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: mainWindow!,
          modal: false,
          width,
          height: 700,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            nativeWindowOpen: true,
            preload: path.join(__dirname, 'preload.js'),
          },
        },
      };
    }

    // Para todo lo demás, abre en el navegador externo
    shell.openExternal(url);
    return { action: 'deny' };
  });

  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
