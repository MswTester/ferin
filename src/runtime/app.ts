import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { CompiledResult } from '../types';

export async function startElectronApp(compiled: CompiledResult) {
  await app.whenReady();
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  const html = generateElectronHTML(compiled);
  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  
  mainWindow.loadURL(dataUrl);
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  // Handle window closed
  mainWindow.on('closed', () => {
    app.quit();
  });
  
  console.log('=� Ferin Electron app started');
  
  return mainWindow;
}

export async function startElectronDevApp(compiled: CompiledResult) {
  await app.whenReady();
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  const html = generateElectronHTML(compiled, true);
  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  
  mainWindow.loadURL(dataUrl);
  mainWindow.webContents.openDevTools();
  
  // Handle window closed
  mainWindow.on('closed', () => {
    app.quit();
  });
  
  console.log('=% Ferin Electron dev app started');
  
  return mainWindow;
}

function generateElectronHTML(compiled: CompiledResult, devMode: boolean = false): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ferin Electron App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${compiled.css ? `<style>${compiled.css}</style>` : ''}
</head>
<body>
  <div id="app"></div>
  
  <script>
    // Electron-specific globals
    const { ipcRenderer } = require('electron');
    
    // Override console.log to also send to main process
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog(...args);
      if (ipcRenderer) {
        ipcRenderer.send('console-log', args);
      }
    };
    
${compiled.js}
  </script>
</body>
</html>
`;
}

// Handle app events (only run when in Electron environment)
if (typeof app !== 'undefined') {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      // Re-create window when dock icon is clicked
    }
  });
}