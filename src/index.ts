#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import * as fs from 'fs';
import * as path from 'path';
import { version, description } from '../package.json';

// ============================================================================
// Banner
// ============================================================================

function displayBanner(): void {
  const banner = figlet.textSync('AgFactory', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.clear();
  console.log(chalk.cyan(banner));
  console.log(chalk.gray('  Agentic agent factory'));
  console.log(chalk.gray(`  Version: ${version}\n`));
}

// ============================================================================
// Command Handler
// ============================================================================

function handleCreateCommand(
  name: string,
  options: { prompt?: string }
): void {
  console.log(chalk.green(`\n✅ Creating agent: ${chalk.bold(name)}`));
  console.log(chalk.gray(`   Debug - options:`, JSON.stringify(options, null, 2)));
  
  if (options.prompt) {
    console.log(chalk.blue(`💬 Prompt: ${chalk.bold(options.prompt)}`));
  }

  // Create agents directory if it doesn't exist
  const agentsDir = path.join(process.cwd(), 'agents');
  if (!fs.existsSync(agentsDir)) {
    fs.mkdirSync(agentsDir, { recursive: true });
    console.log(chalk.gray(`   📁 Created agents directory`));
  }

  // Create agent-specific directory
  const agentDir = path.join(agentsDir, name);
  if (fs.existsSync(agentDir)) {
    console.log(chalk.yellow(`   ⚠️  Agent "${name}" already exists, overwriting...`));
  } else {
    fs.mkdirSync(agentDir, { recursive: true });
  }

  // Generate the agent TypeScript file
  const agentCode = generateAgentCode(name, options.prompt);
  const agentFilePath = path.join(agentDir, 'index.ts');
  fs.writeFileSync(agentFilePath, agentCode);

  console.log(chalk.green(`   ✨ Agent created at: ${chalk.bold(`agents/${name}/index.ts`)}`));
  console.log(chalk.gray(`\n   Run it with: ${chalk.white(`ts-node agents/${name}/index.ts`)}`));
  console.log(chalk.green('\n   Done! ✨\n'));
}

function generateAgentCode(name: string, prompt?: string): string {
  const promptComment = prompt 
    ? `/**
 * Agent: ${name}
 * Prompt: ${prompt}
 */

` 
    : `/**
 * Agent: ${name}
 */

`;

  return `${promptComment}function main(): void {
  console.log('Hello World');
  console.log('Agent "${name}" is running!');
}

main();
`;
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function startInteractiveMode(): Promise<void> {
  displayBanner();

  console.log(chalk.cyan('🚀 Welcome to AgFactory CLI!\n'));
  console.log(chalk.gray('Create AI agents with custom prompts\n'));

  let continueLoop = true;

  while (continueLoop) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.yellow('What would you like to do?'),
        choices: [
          {
            name: chalk.blue('🤖 Create an Agent'),
            value: 'create',
          },
          new inquirer.Separator(),
          {
            name: chalk.red('❌ Exit'),
            value: 'exit',
          },
        ],
      },
    ]);

    console.log(); // Empty line for spacing

    if (action === 'create') {
      await handleCreateInteractive();
      console.log(chalk.gray('\n' + '─'.repeat(50) + '\n'));
    } else if (action === 'exit') {
      console.log(chalk.cyan('\n👋 Thanks for using AgFactory CLI! Goodbye!\n'));
      continueLoop = false;
    }
  }
}

async function handleCreateInteractive(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: chalk.yellow('Enter the agent name:'),
      validate: (input) => {
        if (input.trim().length === 0) {
          return 'Agent name cannot be empty!';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'prompt',
      message: chalk.yellow('Enter the agent prompt:'),
      validate: (input) => {
        if (input.trim().length === 0) {
          return 'Prompt cannot be empty!';
        }
        return true;
      },
    },
  ]);

  handleCreateCommand(answers.name, {
    prompt: answers.prompt,
  });
}

// ============================================================================
// CLI Setup
// ============================================================================

const program = new Command();

program
  .name('agfactory')
  .description(description)
  .version(version);

// Create command
program
  .command('create')
  .description('Create a new agent')
  .argument('<name>', 'Name of the agent')
  .option('-p, --prompt <prompt>', 'Agent prompt/instructions')
  .action((name, options) => {
    console.log('Action called with:', { name, options });
    handleCreateCommand(name, options);
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
