import 'reflect-metadata';
import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'path';
import { bootstrap } from './bootstrap';

let mainWindow: BrowserWindow | null;

async function createWindow() {
  await bootstrap();

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // @ts-ignore
      nativeWindowOpen: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });


  // Cargar el index.html generado por Vite
  //mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.loadURL(path.join("http://localhost:5173"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isCrudRoute = url.includes('#/crud/');
    const isVentaCreate = url.includes('#/ventas/create');

    if (isCrudRoute || isVentaCreate) {
      const width = isVentaCreate
        ? 900
        : (url.includes('/create') || url.includes('/edit'))
          ? 500
          : 800;

      const height = isVentaCreate
        ? 750 // o 800, lo que quieras
        : 600;

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: mainWindow!,
          modal: false,
          width,
          height,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            // @ts-ignore
            nativeWindowOpen: true,
            preload: path.join(__dirname, 'preload.js'),
          },
        },
      };
    }

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
