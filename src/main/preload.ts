// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// 🔒 Sólo los canales que vas a usar
const allowedIncoming = new Set([
  'clientes:changed',
  'productos:changed',
  'metodos:changed',
  'ventas:changed',
])

type Listener = (payload: unknown) => void

// Mapa para poder desuscribir correctamente
const registered = new WeakMap<Listener, (...args: any[]) => void>()

contextBridge.exposeInMainWorld('entityEvents', {
  /**
   * Suscribite a un canal permitido y recibí el payload "limpio".
   * Devuelve una función para desuscribir.
   */
  on(channel: string, listener: Listener) {
    if (!allowedIncoming.has(channel)) return
    const wrapped = (_ev: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    registered.set(listener, wrapped)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  },

  /**
   * Desuscribite pasando el mismo listener que usaste en .on(...)
   */
  off(channel: string, listener: Listener) {
    if (!allowedIncoming.has(channel)) return
    const wrapped = registered.get(listener)
    if (wrapped) {
      ipcRenderer.removeListener(channel, wrapped)
      registered.delete(listener)
    }
  },

  /**
   * (Opcional) Suscribirse una sola vez.
   */
  once(channel: string, listener: Listener) {
    if (!allowedIncoming.has(channel)) return
    const wrapped = (_ev: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    ipcRenderer.once(channel, wrapped)
  },
})
