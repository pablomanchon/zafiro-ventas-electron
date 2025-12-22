import 'reflect-metadata'
import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron'
import path from 'path'
import { URL, pathToFileURL } from 'url'
import fs from 'fs'
import { validateLicense } from './license'
import { onChange } from './broadcast/event-bus'
import { broadcast } from './broadcast/ipc-broadcast'

// -------------------------------------------------------
let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null

const icon = path.join(__dirname, '../public/zafiro_rounded.ico')

// ⚙️ Detección de entorno
const isProd = app.isPackaged
const DEV_SERVER = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

async function startApi() {
 /* if (!isProd) {
    // DEV: usa el bootstrap local (TS/JS en tu proyecto)
    const mod = await import('./bootstrap')
    return mod.bootstrap()
  }
*/
  // PROD: usa el build de Nest (dist)
  // Ajustá esta ruta si tu estructura final difiere
  const apiBootstrapPath = path.join(__dirname, '../dist/bootstrap.js')

  // Opcional: logs para diagnosticar si la ruta existe en el instalador
  if (!fs.existsSync(apiBootstrapPath)) {
    throw new Error(`No se encontró bootstrap de Nest en: ${apiBootstrapPath}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(apiBootstrapPath) as { bootstrap: () => Promise<void> }
  return mod.bootstrap()
}

function buildSplashHtml(): string {
  const content = `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Zafiro - Iniciando</title>
      <style>
        body { margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a, #1e293b); color: #e2e8f0; font-family: "Inter", system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .card { background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(226, 232, 240, 0.1); box-shadow: 0 20px 60px rgba(0,0,0,0.45); border-radius: 18px; padding: 32px 28px; width: 380px; text-align: center; }
        .logo { font-weight: 700; font-size: 1.4rem; letter-spacing: 0.02em; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; justify-content: center; }
        .logo-circle { width: 38px; height: 38px; border-radius: 12px; background: linear-gradient(135deg, #22d3ee, #0ea5e9); display: grid; place-items: center; color: #0b1120; font-weight: 800; box-shadow: 0 10px 30px rgba(34, 211, 238, 0.35); }
        .title { font-size: 1rem; opacity: 0.9; margin-bottom: 16px; }
        .status { margin-top: 18px; color: #cbd5e1; font-size: 0.95rem; letter-spacing: 0.01em; }
        .spinner { width: 58px; height: 58px; border-radius: 50%; border: 6px solid rgba(255, 255, 255, 0.08); border-top-color: #22d3ee; margin: 12px auto; animation: spin 1s linear infinite; box-shadow: 0 0px 24px rgba(14, 165, 233, 0.35); }
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">
          <div class="logo-circle">Z</div>
          Zafiro
        </div>
        <div class="title">Preparando tu entorno...</div>
        <div class="spinner"></div>
        <div class="status" id="status-text">Verificando licencia...</div>
      </div>
    </body>
  </html>`

  return `data:text/html;charset=utf-8,${encodeURIComponent(content)}`
}

function getRendererUrl(hash = ''): string {
  //if (!isProd) return `${DEV_SERVER}${hash}`

  const indexHtml = path.join(__dirname, '../dist-renderer/index.html')
  return pathToFileURL(indexHtml).toString() + hash
}

function normalizeHashRoute(route: string): string {
  if (!route) return ''
  if (route.startsWith('#')) return route
  if (route.startsWith('/')) return `#${route}`
  return `#/${route}`
}

function buildChildWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    modal: false,
    alwaysOnTop: false,
    focusable: true,
    show: false,
    width: 900,
    height: 700,
    icon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // @ts-ignore
      nativeWindowOpen: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  }
}

function createSplashWindow(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 420,
    height: 300,
    resizable: false,
    frame: false,
    transparent: false,
    show: false,
    alwaysOnTop: true,
    icon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'splash-preload.js'),
    },
  })

  splash.loadURL(buildSplashHtml())
  splash.once('ready-to-show', () => splash.show())
  splash.on('closed', () => {
    if (!mainWindow) splashWindow = null
  })
  return splash
}

function updateSplashStatus(message: string) {
  if (!splashWindow || splashWindow.isDestroyed()) return

  if (splashWindow.webContents.isLoading()) {
    splashWindow.webContents.once('did-finish-load', () => {
      if (!splashWindow || splashWindow.isDestroyed()) return
      splashWindow.webContents.send('splash:update', message)
    })
    return
  }

  splashWindow.webContents.send('splash:update', message)
}

async function createWindow() {
  splashWindow = createSplashWindow()
  updateSplashStatus('Verificando licencia...')

  // 🔐 Licencia (solo una vez)
  try {
    validateLicense()
    console.log('🔐 Licencia válida, iniciando app...')
  } catch (e: any) {
    console.error('❌ ERROR DE LICENCIA:', e?.message)

    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Licencia expirada',
      message:
        e?.code === 'LICENSE_EXPIRED'
          ? 'Tu licencia ha expirado.\nPor favor, contacta al desarrollador.'
          : 'No se pudo validar la licencia.\nPor favor, contacta al desarrollador.',
      buttons: ['Aceptar'],
    })

    splashWindow?.close()
    splashWindow = null
    app.quit()
    return
  }

  updateSplashStatus('Abriendo base de datos...')
  try {
    await startApi()
  } catch (e: any) {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Error al iniciar',
      message: 'No se pudo iniciar la base de datos o servidor interno.\n' + (e?.message ?? e),
      buttons: ['Aceptar'],
    })

    splashWindow?.close()
    splashWindow = null
    app.quit()
    return
  }

  updateSplashStatus('Iniciando aplicación...')
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // @ts-ignore
      nativeWindowOpen: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.maximize()
  mainWindow.loadURL(getRendererUrl())

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
    splashWindow?.close()
    splashWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const u = new URL(url)
    const isSameOriginDev = !isProd && u.origin === new URL(DEV_SERVER).origin
    const isSameOriginProd = isProd && url.startsWith('file:')
    const isHashRoute = u.hash?.startsWith('#/')

    if ((isSameOriginDev || isSameOriginProd) && isHashRoute) {
      const isCreateOrEdit = /\/(create|edit)/.test(u.hash)
      const isVentaCreate = u.hash.includes('#/ventas/create')
      const width = isVentaCreate ? 900 : isCreateOrEdit ? 500 : 800
      const height = isVentaCreate ? 750 : 600

      const overrideOptions = buildChildWindowOptions()
      overrideOptions.width = width
      overrideOptions.height = height

      return { action: 'allow', overrideBrowserWindowOptions: overrideOptions }
    }

    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-create-window', (child: BrowserWindow) => {
    child.setAlwaysOnTop(false)
    child.once('ready-to-show', () => {
      child.show()
      child.focus()
      try {
        child.moveTop()
      } catch {}
    })
  })

  // Broadcasts
  onChange('clientes:changed', (p) => broadcast('clientes:changed', p))
  onChange('productos:changed', (p) => broadcast('productos:changed', p))
  onChange('metodos:changed', (p) => broadcast('metodos:changed', p))
  onChange('ventas:changed', (p) => broadcast('ventas:changed', p))
  onChange('vendedores:changed', (p) => broadcast('vendedores:changed', p))

  Menu.setApplicationMenu(null)

  mainWindow.on('closed', () => {
    mainWindow = null
    splashWindow?.destroy()
    app.quit()
  })
}

// IPC
ipcMain.handle('splash:close', () => {
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close()
  splashWindow = null
  return true
})

ipcMain.handle('open-child', async (_event, options: { route: string; payload?: unknown }) => {
  const { route, payload } = options ?? { route: '' }

  const child = new BrowserWindow({
    ...buildChildWindowOptions(),
  })

  const targetRoute = normalizeHashRoute(route)
  const targetUrl = getRendererUrl(targetRoute)

  child.once('ready-to-show', () => {
    try {
      child.show()
      child.focus()
      child.moveTop()
    } catch {}
  })

  child.webContents.once('did-finish-load', () => {
    child.webContents.send('init-data', payload)
  })

  try {
    await child.loadURL(targetUrl)
  } catch (err) {
    child.close()
    throw err
  }

  return { windowId: child.id }
})

// Start
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
