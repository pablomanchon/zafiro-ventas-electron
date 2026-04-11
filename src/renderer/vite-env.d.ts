/// <reference types="vite/client" />

interface ElectronAPI {
  openChild: (route: string, payload: unknown) => Promise<number | void>;
  onInitData: <T = unknown>(callback: (payload: T) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
