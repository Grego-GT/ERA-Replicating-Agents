import figlet from 'figlet';
import chalk from 'chalk';

export function displayBanner(): void {
  const banner = figlet.textSync('AgFactory', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.clear();
  console.log(chalk.cyan(banner));
  console.log(chalk.gray('  A powerful CLI tool for your projects'));
  console.log(chalk.gray('  Version: 1.0.0\n'));
}

