import { contextBridge, ipcRenderer } from 'electron'

const setStatus = (text: string) => {
  const statusEl = document.getElementById('status-text')
  if (statusEl) statusEl.textContent = text
}

window.addEventListener('DOMContentLoaded', () => {
  setStatus('Inicializando...')
})

ipcRenderer.on('splash:update', (_event, text: string) => setStatus(text))

contextBridge.exposeInMainWorld('splashWindow', {
  close: () => ipcRenderer.invoke('splash:close'),
})
