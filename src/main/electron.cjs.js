"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let mainWindow;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    electron_1.Menu.setApplicationMenu(null); // Desactiva el menú
    // Manejar el evento de cierre de la ventana
    mainWindow.on('closed', () => {
        mainWindow = null;
        electron_1.app.quit(); // Esto termina el proceso de Electron
    });
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
