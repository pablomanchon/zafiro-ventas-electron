import 'reflect-metadata';
import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'path';
import { bootstrap } from './bootstrap';
import { onChange } from './broadcast/event-bus';
import { broadcast } from './broadcast/ipc-broadcast';

let mainWindow: BrowserWindow | null;
const icon = path.join(__dirname, '../public/zafiro_rounded.ico');

async function createWindow() {
  await bootstrap();

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // @ts-ignore
      nativeWindowOpen: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.maximize();

  // Si estás en Vite dev, con loadURL alcanza:
  // mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.loadURL(path.join('http://localhost:5173'));

  // Permitir ventanas nuevas SIN 'parent' y mostrarlas con foco
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isCrudRoute = url.includes('#/crud/');
    const isVentaCreate = url.includes('#/ventas/create');

    if (isCrudRoute || isVentaCreate) {
      const width = isVentaCreate
        ? 900
        : (url.includes('/create') || url.includes('/edit'))
          ? 500
          : 800;

      const height = isVentaCreate ? 750 : 600;

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          // ⚠️ Sin parent para que no quede “siempre encima” del padre
          // parent: mainWindow!,
          modal: false,
          alwaysOnTop: false,
          focusable: true,
          show: false, // mostramos manualmente cuando esté lista
          width,
          height,
          icon,
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

    // Resto de URLs: abrir en el navegador del sistema
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Mostrar y ENFOCAR cada nueva ventana cuando esté lista
  mainWindow.webContents.on('did-create-window', (child: BrowserWindow) => {
    child.setAlwaysOnTop(false);
    child.once('ready-to-show', () => {
      child.show();   // visible
      child.focus();  // toma foco
      try { child.moveTop(); } catch { }
    });
  });

  onChange('clientes:changed', (p) => broadcast('clientes:changed', p))
  onChange('productos:changed', (p) => broadcast('productos:changed', p))
  onChange('metodos:changed', (p) => broadcast('metodos:changed', p))
  onChange('ventas:changed', (p) => broadcast('ventas:changed', p))

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
