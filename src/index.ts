#!/usr/bin/env node

import { Command } from 'commander';
import { version, description } from '../package.json';
import { startInteractiveMode } from './interactive';
import { handleHelloCommand, handleCreateCommand, handleListCommand } from './commands';

const program = new Command();

program
  .name('agfactory')
  .description(description)
  .version(version);

// Hello command
program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'Name to greet', 'World')
  .option('-u, --uppercase', 'Output in uppercase')
  .action((name: string, options: { uppercase?: boolean }) => {
    handleHelloCommand(name, options);
  });

// Create command
program
  .command('create')
  .description('Create a new resource')
  .argument('<type>', 'Type of resource to create (e.g., project, file)')
  .argument('<name>', 'Name of the resource')
  .option('-t, --template <template>', 'Template to use')
  .action((type: string, name: string, options: { template?: string }) => {
    handleCreateCommand(type, name, options);
  });

// List command
program
  .command('list')
  .description('List all resources')
  .option('-a, --all', 'Show all resources including hidden ones')
  .option('-s, --sort <field>', 'Sort by field', 'name')
  .action((options: { all?: boolean; sort?: string }) => {
    handleListCommand(options);
  });

// Interactive command (explicit)
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(async () => {
    await startInteractiveMode();
  });

// Parse arguments
program.parse(process.argv);

// If no command was provided, start interactive mode
if (!process.argv.slice(2).length) {
  startInteractiveMode().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

