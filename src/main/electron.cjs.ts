import 'reflect-metadata';          // Necesario para NestJS
import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'path';
import { bootstrap } from './bootstrap';

let mainWindow: BrowserWindow | null;

async function createWindow() {
  // Arranca NestJS antes de crear la ventana de Electron
  await bootstrap();

  // Crea la ventana principal con nativeWindowOpen habilitado
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // @ts-ignore: Habilita window.open nativo en Electron
      nativeWindowOpen: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Carga tu aplicación React (Vite)
  mainWindow.loadURL('http://localhost:5173');

  // Intercepta todas las llamadas a window.open / <a target="_blank">
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Si es ruta CRUD en tu HashRouter
    if (url.includes('#/crud/')) {
      const isCreate = url.includes('/create') || url.includes('/edit');
      const width = isCreate ? 500 : 800;
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: mainWindow!,
          modal: false,
          width,
          height: 600,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            // @ts-ignore: mantener nativeWindowOpen
            nativeWindowOpen: true,
            preload: path.join(__dirname, 'preload.js'),
          },
        },
      };
    }
    // Para cualquier otro URL, abrir en el navegador externo
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Oculta el menú por defecto
  Menu.setApplicationMenu(null);

  // Maneja el cierre de la ventana principal
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
