const { app, BrowserWindow } = require('electron');
const path = require('path');

// Disable GPU sandbox and IPC flags that trigger ICU/GPU descriptor errors on Windows
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Enforce Single Instance: Prevent multiple conflicting desktop instances
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow = null;
let server = null;

if (!gotTheLock) {
  // If another instance is already running, exit this process immediately
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Start internal Express server
  try {
    const srvModule = require('../server/index.js');
    server = srvModule.server;
  } catch (err) {
    console.warn('Internal server initialization notice:', err.message);
  }

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 650,
      title: 'NEXA ERP - Enterprise Multi-Vertical Edition',
      backgroundColor: '#090d16',
      autoHideMenuBar: true,
      show: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
    const startUrl = isDev ? 'http://localhost:5173' : 'http://localhost:4000';

    mainWindow.loadURL(startUrl).catch(() => {
      // Retry in case server port is still binding
      setTimeout(() => {
        mainWindow.loadURL(startUrl).catch((err) => {
          console.error('Failed to load NEXA ERP interface:', err.message);
        });
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
    if (server && server.close) {
      try { server.close(); } catch (_) {}
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}


