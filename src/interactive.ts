import inquirer from 'inquirer';
import chalk from 'chalk';
import { displayBanner } from './utils/banner';
import { 
  handleHelloCommand, 
  handleCreateCommand, 
  handleListCommand 
} from './commands';

export async function startInteractiveMode(): Promise<void> {
  displayBanner();

  console.log(chalk.cyan('\n🚀 Welcome to AgFactory CLI!\n'));
  console.log(chalk.gray('Select an option below to get started:\n'));

  let continueLoop = true;

  while (continueLoop) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.yellow('What would you like to do?'),
        choices: [
          {
            name: chalk.green('👋 Say Hello'),
            value: 'hello',
          },
          {
            name: chalk.blue('🎨 Create a Resource'),
            value: 'create',
          },
          {
            name: chalk.magenta('📋 List Resources'),
            value: 'list',
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

    switch (action) {
      case 'hello':
        await handleHelloInteractive();
        break;
      case 'create':
        await handleCreateInteractive();
        break;
      case 'list':
        await handleListInteractive();
        break;
      case 'exit':
        console.log(chalk.cyan('\n👋 Thanks for using AgFactory CLI! Goodbye!\n'));
        continueLoop = false;
        break;
    }

    if (continueLoop) {
      console.log(chalk.gray('\n' + '─'.repeat(50) + '\n'));
    }
  }
}

async function handleHelloInteractive(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: chalk.yellow('What is your name?'),
      default: 'World',
    },
    {
      type: 'confirm',
      name: 'uppercase',
      message: chalk.yellow('Convert to uppercase?'),
      default: false,
    },
  ]);

  handleHelloCommand(answers.name, { uppercase: answers.uppercase });
}

async function handleCreateInteractive(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: chalk.yellow('What type of resource would you like to create?'),
      choices: ['project', 'file', 'component', 'service'],
    },
    {
      type: 'input',
      name: 'name',
      message: chalk.yellow('Enter the name of the resource:'),
      validate: (input) => {
        if (input.trim().length === 0) {
          return 'Name cannot be empty!';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'template',
      message: chalk.yellow('Template to use (optional):'),
    },
  ]);

  handleCreateCommand(answers.type, answers.name, {
    template: answers.template || undefined,
  });
}

async function handleListInteractive(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'all',
      message: chalk.yellow('Show all resources (including hidden)?'),
      default: false,
    },
    {
      type: 'list',
      name: 'sort',
      message: chalk.yellow('Sort by:'),
      choices: ['name', 'date', 'size', 'type'],
      default: 'name',
    },
  ]);

  handleListCommand({ all: answers.all, sort: answers.sort });
}

