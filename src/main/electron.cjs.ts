import 'reflect-metadata'
import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron'
import path from 'path'
import { URL, pathToFileURL } from 'url'
import { bootstrap } from './bootstrap'
import { onChange } from './broadcast/event-bus'
import { broadcast } from './broadcast/ipc-broadcast'

let mainWindow: BrowserWindow | null
const icon = path.join(__dirname, '../public/zafiro_rounded.ico')

// ⚙️ Detección de entorno
// - app.isPackaged es confiable: true cuando está empaquetado.
// - En dev usamos Vite dev server (VARIABLE o fallback a localhost).
const isProd = app.isPackaged
const DEV_SERVER = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

function getRendererUrl(hash = ''): string {
  if (!isProd) return `${DEV_SERVER}${hash}`

  // En prod: el index.html del renderer generado por tu build.
  // Normalmente queda en .../dist/renderer/index.html si estás usando vite-electron.
  const indexHtml = path.join(__dirname, '../renderer/index.html')
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

async function createWindow() {
  await bootstrap()

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
  // ⬇️ Carga correcta según entorno
  mainWindow.loadURL(getRendererUrl())
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  // 🪟 Abrir rutas internas (HashRouter) en nueva ventana de Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const u = new URL(url)

    // ¿Es la misma origin de la app y usa hash #/ ?
    const isSameOriginDev = !isProd && u.origin === new URL(DEV_SERVER).origin
    const isSameOriginProd = isProd && url.startsWith('file:')
    const isHashRoute = u.hash?.startsWith('#/')

    if ((isSameOriginDev || isSameOriginProd) && isHashRoute) {
      const isCreateOrEdit = /\/(create|edit)/.test(u.hash)
      const isVentaCreate = u.hash.includes('#/ventas/create')

      const width = isVentaCreate ? 900 : (isCreateOrEdit ? 500 : 800)
      const height = isVentaCreate ? 750 : 600

      const overrideOptions = buildChildWindowOptions()
      overrideOptions.width = width
      overrideOptions.height = height

      return {
        action: 'allow',
        overrideBrowserWindowOptions: overrideOptions,
      }
    }

    // Externas → navegador del sistema
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Mostrar y enfocar toda ventana hija
  mainWindow.webContents.on('did-create-window', (child: BrowserWindow) => {
    child.setAlwaysOnTop(false)
    child.once('ready-to-show', () => {
      child.show()
      child.focus()
      try { child.moveTop() } catch {}
    })
  })

  // Broadcasts
  onChange('clientes:changed', (p) => broadcast('clientes:changed', p))
  onChange('productos:changed', (p) => broadcast('productos:changed', p))
  onChange('metodos:changed', (p) => broadcast('metodos:changed', p))
  onChange('ventas:changed', (p) => broadcast('ventas:changed', p))

  Menu.setApplicationMenu(null)

  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })
}

ipcMain.handle('open-child', async (event, options: { route: string; payload?: unknown }) => {
  const { route, payload } = options ?? { route: '' }
  const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined

  const child = new BrowserWindow({
    ...buildChildWindowOptions(),
    parent,
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

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
