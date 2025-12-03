import 'reflect-metadata'
import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron'
import path from 'path'
import { URL, pathToFileURL } from 'url'
import { bootstrap } from './bootstrap'
import { onChange } from './broadcast/event-bus'
import { broadcast } from './broadcast/ipc-broadcast'

// 🧩 🔹 Supabase + Keytar (agregado)
import { createClient } from '@supabase/supabase-js'
import keytar from 'keytar'
import { validateLicense } from './license'

// 🧩 Variables Supabase (leídas desde .env)
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// 🧩 Configuración de almacenamiento seguro del token
const SERVICE = 'zafiro-stock'
const ACCOUNT = 'supabase-session'

// -------------------------------------------------------
let mainWindow: BrowserWindow | null
const icon = path.join(__dirname, '../public/zafiro_rounded.ico')

// ⚙️ Detección de entorno
const isProd = app.isPackaged
const DEV_SERVER = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

function getRendererUrl(hash = ''): string {
  if (!isProd) return `${DEV_SERVER}${hash}`
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
  try {
    validateLicense();
    console.log('🔐 Licencia válida, iniciando app...');
  } catch (e: any) {
    console.error('❌ ERROR DE LICENCIA:', e.message);

    // Cartel para el usuario
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Licencia expirada',
      message:
        e.code === 'LICENSE_EXPIRED'
          ? 'Tu licencia ha expirado.\nPor favor, contacta al desarrollador.'
          : 'No se pudo validar la licencia.\nPor favor, contacta al desarrollador.',
      buttons: ['Aceptar'],
    });

    app.quit();
    return; // 👈 MUY IMPORTANTE: no sigas creando la ventana
  }
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
  mainWindow.loadURL(getRendererUrl())
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const u = new URL(url)
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

    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-create-window', (child: BrowserWindow) => {
    child.setAlwaysOnTop(false)
    child.once('ready-to-show', () => {
      child.show()
      child.focus()
      try { child.moveTop() } catch { }
    })
  })

  onChange('clientes:changed', (p) => broadcast('clientes:changed', p))
  onChange('productos:changed', (p) => broadcast('productos:changed', p))
  onChange('metodos:changed', (p) => broadcast('metodos:changed', p))
  onChange('ventas:changed', (p) => broadcast('ventas:changed', p))
  onChange('vendedores:changed', (p) => broadcast('vendedores:changed', p))

  Menu.setApplicationMenu(null)

  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })
}

ipcMain.handle('open-child', async (event, options: { route: string; payload?: unknown }) => {
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
    } catch { }
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

// ---------------------------------------------------------------------------
// 🔐 IPC Supabase Auth (agregado)
// ---------------------------------------------------------------------------

// Login
ipcMain.handle('auth:login', async (_e, { email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw error || new Error('Error de inicio de sesión')
  await keytar.setPassword(SERVICE, ACCOUNT, data.session.access_token)
  return { user: data.user, access_token: data.session.access_token }
})

// Logout
ipcMain.handle('auth:logout', async () => {
  await keytar.deletePassword(SERVICE, ACCOUNT)
  await supabase.auth.signOut()
  return true
})

// Obtener usuario actual
ipcMain.handle('auth:getUser', async () => {
  const token = await keytar.getPassword(SERVICE, ACCOUNT)
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
})

// Token directo (para fetch)
ipcMain.handle('auth:getToken', async () => {
  const token = await keytar.getPassword(SERVICE, ACCOUNT)
  return token ?? null
})

// Fetch proxy (inyecta Authorization)
ipcMain.handle('net:fetch', async (_e, { input, init }) => {
  const token = await keytar.getPassword(SERVICE, ACCOUNT)
  const headers = new Headers(init?.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(input, { ...init, headers })
  const text = await res.text()
  return { status: res.status, ok: res.ok, body: text }
})

// ---------------------------------------------------------------------------

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
