#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runCommand } from './commands/run';
import { devCommand } from './commands/dev';
import { buildCommand } from './commands/build';

const program = new Command();

program
  .name('ferin')
  .description('Ferin Language Framework - Easy build for Web & App projects')
  .version('1.0.0');

program
  .argument('[file]', 'Ferin file to run', 'main.ferin')
  .option('--target <target>', 'Target platform (web|app)', 'web')
  .action(async (file: string, options: { target: string }) => {
    try {
      await runCommand(file, options.target as 'web' | 'app');
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('dev')
  .argument('[file]', 'Ferin file to run in dev mode', 'main.ferin')
  .option('--target <target>', 'Target platform (web|app)', 'web')
  .description('Start development server with hot reload')
  .action(async (file: string, options: { target: string }) => {
    try {
      await devCommand(file, options.target as 'web' | 'app');
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('build')
  .argument('[file]', 'Ferin file to build', 'main.ferin')
  .option('-t, --target <target>', 'Target platform (web|app)', 'web')
  .description('Build the application for production')
  .action(async (file: string, options: { target: string }) => {
    try {
      await buildCommand(file, options.target as 'web' | 'app');
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();