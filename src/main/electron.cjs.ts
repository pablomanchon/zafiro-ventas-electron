import { app, BrowserWindow, Menu } from 'electron';
import "./server"
import * as path from 'path';

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Cargar la aplicación de React en Electron
  mainWindow.loadURL('http://localhost:5173'); // Puerto de desarrollo de Vite

  // Quitar el menú predeterminado
  Menu.setApplicationMenu(null);  // Desactiva el menú

  // Manejar el evento de cierre de la ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit(); // Esto termina el proceso de Electron
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
