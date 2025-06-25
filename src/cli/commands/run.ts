import { compile } from '../../compiler';
import { startWebServer } from '../../runtime/web';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export async function runCommand(file: string, target: 'web' | 'app') {
  console.log(chalk.blue(`Running ${file} with target: ${target}`));
  
  const filePath = path.resolve(file);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const source = fs.readFileSync(filePath, 'utf-8');
  const compiled = await compile(source, target);
  
  if (target === 'web') {
    await startWebServer(compiled);
  } else {
    // Dynamically import Electron runtime only when needed
    const { startElectronApp } = await import('../../runtime/app');
    await startElectronApp(compiled);
  }
}