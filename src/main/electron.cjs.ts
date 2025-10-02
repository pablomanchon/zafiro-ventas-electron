import 'reflect-metadata';          // Necesario para NestJS
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';
import path from 'path';
import { bootstrap } from './bootstrap';

const RENDERER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

const DEFAULT_CHILD_OPTIONS = {
  width: 1000,
  height: 700,
  show: true,
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    nativeWindowOpen: true,
    preload: path.join(__dirname, 'preload.js'),
  },
} as const;

function buildWindowOptions(
  overrides: BrowserWindowConstructorOptions = {},
): BrowserWindowConstructorOptions {
  return {
    ...DEFAULT_CHILD_OPTIONS,
    ...overrides,
    webPreferences: {
      ...DEFAULT_CHILD_OPTIONS.webPreferences,
      ...(overrides.webPreferences ?? {}),
    },
  };
}

let mainWindow: BrowserWindow | null;

function buildRendererUrl(route: string): string {
  const url = new URL(RENDERER_URL);
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  url.hash = normalizedRoute;
  return url.toString();
}

function attachWindowHandlers(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      ...buildWindowOptions(),
    },
  }));
}

async function createWindow() {
  await bootstrap();

  mainWindow = new BrowserWindow(buildWindowOptions());

  attachWindowHandlers(mainWindow);

  mainWindow.loadURL(buildRendererUrl('/'));

  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

function createChildWindow(route: string, payload: unknown, opener?: BrowserWindow) {
  const childWindow = new BrowserWindow(
    buildWindowOptions({
      parent: opener ?? undefined,
    }),
  );

  attachWindowHandlers(childWindow);

  childWindow.loadURL(buildRendererUrl(route));

  if (payload !== undefined) {
    childWindow.webContents.once('did-finish-load', () => {
      childWindow.webContents.send('init-data', payload);
    });
  }

  return childWindow;
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('open-child', async (event, { route, payload }) => {
    const opener = BrowserWindow.fromWebContents(event.sender);
    const normalizedRoute = typeof route === 'string' && route.trim() ? route : '/';
    const child = createChildWindow(normalizedRoute, payload ?? null, opener ?? undefined);
    return child.id;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
