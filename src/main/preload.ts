// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// ─────────────────────────────────────────────
// 🔐 EVENTOS PERMITIDOS (lo que ya tenías)
// ─────────────────────────────────────────────
const allowedIncoming = new Set([
  'clientes:changed',
  'productos:changed',
  'metodos:changed',
  'ventas:changed',
  'vendedores:changed',
  'init-data',
])

type Listener = (payload: unknown) => void
const registered = new WeakMap<Listener, (...args: any[]) => void>()

contextBridge.exposeInMainWorld('entityEvents', {
  on(channel: string, listener: Listener) {
    if (!allowedIncoming.has(channel)) return
    const wrapped = (_ev: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    registered.set(listener, wrapped)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  },

  off(channel: string, listener: Listener) {
    if (!allowedIncoming.has(channel)) return
    const wrapped = registered.get(listener)
    if (wrapped) {
      ipcRenderer.removeListener(channel, wrapped)
      registered.delete(listener)
    }
  },

  once(channel: string, listener: Listener) {
    if (!allowedIncoming.has(channel)) return
    const wrapped = (_ev: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    ipcRenderer.once(channel, wrapped)
  },
})

// ─────────────────────────────────────────────
// 🪟 UTILIDADES DE VENTANAS (lo que ya tenías)
// ─────────────────────────────────────────────
contextBridge.exposeInMainWorld('windowApi', {
  openChild(route: string, payload?: unknown) {
    return ipcRenderer.invoke('open-child', { route, payload })
  },

  onInitData(listener: (payload: unknown) => void) {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    ipcRenderer.on('init-data', wrapped)
    return () => ipcRenderer.removeListener('init-data', wrapped)
  },
})

// ─────────────────────────────────────────────
// 🔑 AUTH SEGURA (token en main mediante IPC)
// ─────────────────────────────────────────────
contextBridge.exposeInMainWorld('secureAuth', {
  setToken: (token: string) => ipcRenderer.invoke('auth:setToken', token),
  getToken: () => ipcRenderer.invoke('auth:getToken') as Promise<string | null>,
  clearToken: () => ipcRenderer.invoke('auth:clearToken'),
})

// ─────────────────────────────────────────────
// 🌐 NET PROXY (inyecta Authorization si hay token)
// Devuelve {status, ok, body, headers} para manejar errores
// ─────────────────────────────────────────────
contextBridge.exposeInMainWorld('secureNet', {
  fetch: (input: RequestInfo, init?: RequestInit) =>
    ipcRenderer.invoke('net:fetch', { input, init }) as Promise<{
      status: number
      ok: boolean
      body: string
      headers: Record<string, string>
    }>,
})
