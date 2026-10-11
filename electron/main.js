const { app, BrowserWindow } = require('electron');
const path = require('path');
const { server } = require('../server/index.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 650,
    title: 'NEXA ERP - Enterprise Multi-Vertical Edition',
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
  const startUrl = isDev ? 'http://localhost:5173' : 'http://localhost:4000';

  mainWindow.loadURL(startUrl).catch(() => {
    // Retry if server is still starting
    setTimeout(() => {
      mainWindow.loadURL(startUrl);
    }, 1200);
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
  if (server && server.close) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

