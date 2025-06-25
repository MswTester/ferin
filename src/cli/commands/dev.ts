import { compile } from '../../compiler';
import { startWebDevServer, triggerReload } from '../../runtime/web';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';

export async function devCommand(file: string, target: 'web' | 'app') {
  console.log(chalk.green(`Starting dev server for ${file} with target: ${target}`));
  
  const filePath = path.resolve(file);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  let webServerInstance: any = null;
  let electronApp: any = null;
  
  const compileAndRun = async () => {
    try {
      const source = fs.readFileSync(filePath, 'utf-8');
      const compiled = await compile(source, target);
      
      if (target === 'web') {
        if (!webServerInstance) {
          webServerInstance = await startWebDevServer(compiled);
        } else {
          // Trigger hot reload
          triggerReload(webServerInstance.wss);
        }
      } else {
        // For Electron, we need to restart the app
        if (electronApp) {
          electronApp.close();
        }
        // Dynamically import Electron runtime only when needed
        const { startElectronDevApp } = await import('../../runtime/app');
        electronApp = await startElectronDevApp(compiled);
      }
    } catch (error) {
      console.error(chalk.red('Compilation error:'), error);
    }
  };
  
  await compileAndRun();
  
  const watcher = chokidar.watch(filePath, { ignoreInitial: true });
  watcher.on('change', () => {
    console.log(chalk.yellow('File changed, recompiling...'));
    compileAndRun();
  });
  
  console.log(chalk.green('Dev server started. Watching for changes...'));
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.blue('\\nShutting down dev server...'));
    if (webServerInstance) {
      webServerInstance.server.close();
      webServerInstance.wss.close();
    }
    if (electronApp) {
      electronApp.close();
    }
    process.exit(0);
  });
}