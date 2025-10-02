import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

type InitDataCallback<T = unknown> = (payload: T) => void;

declare global {
  interface Window {
    electronAPI?: {
      openChild: (route: string, payload: unknown) => Promise<number | void>;
      onInitData: <T = unknown>(callback: InitDataCallback<T>) => () => void;
    };
  }
}

const api = {
  openChild(route: string, payload: unknown) {
    return ipcRenderer.invoke('open-child', { route, payload });
  },
  onInitData<T = unknown>(callback: InitDataCallback<T>) {
    const listener = (_event: IpcRendererEvent, data: T) => {
      callback(data);
    };

    ipcRenderer.on('init-data', listener);

    return () => {
      ipcRenderer.removeListener('init-data', listener);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

