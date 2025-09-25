import { BrowserWindow } from 'electron'

export function broadcast(channel: string, payload: any) {
  for (const w of BrowserWindow.getAllWindows()) {
    try { w.webContents.send(channel, payload) } catch {}
  }
}
