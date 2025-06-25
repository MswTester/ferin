import { compile } from '../../compiler';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export async function buildCommand(file: string, target: 'web' | 'app') {
  console.log(chalk.yellow(`Building ${file} for ${target}...`));
  
  const filePath = path.resolve(file);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const source = fs.readFileSync(filePath, 'utf-8');
  const compiled = await compile(source, target);
  
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  if (target === 'web') {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ferin App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app"></div>
  <script>${compiled.js}</script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
    if (compiled.css) {
      fs.writeFileSync(path.join(distDir, 'style.css'), compiled.css);
    }
    
    console.log(chalk.green('Web build completed! Files saved to ./dist/'));
  } else {
    const electronMain = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ferin App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app"></div>
  <script>${compiled.js}</script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distDir, 'main.js'), electronMain);
    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
    if (compiled.css) {
      fs.writeFileSync(path.join(distDir, 'style.css'), compiled.css);
    }
    
    const packageJson = {
      name: 'ferin-app',
      version: '1.0.0',
      main: 'main.js'
    };
    
    fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    console.log(chalk.green('Electron app build completed! Files saved to ./dist/'));
    console.log(chalk.blue('Run "electron ./dist" to start the app'));
  }
}