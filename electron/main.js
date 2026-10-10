const { app, BrowserWindow } = require('electron');
const path = require('path');
const { server } = require('../server/index.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'OmniRetail ERP - Multi-Vertical Desktop Edition',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = process.env.NODE_ENV !== 'production';
  const startUrl = isDev ? 'http://localhost:5173' : 'http://localhost:4000';

  mainWindow.loadURL(startUrl).catch(() => {
    // Retry if Vite dev server is still starting
    setTimeout(() => {
      mainWindow.loadURL(startUrl);
    }, 1500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
