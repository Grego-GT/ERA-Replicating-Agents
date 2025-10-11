import chalk from 'chalk';

export function handleHelloCommand(
  name: string,
  options: { uppercase?: boolean }
): void {
  let message = `Hello, ${name}!`;
  if (options.uppercase) {
    message = message.toUpperCase();
  }
  console.log(chalk.green(`\n✨ ${message}\n`));
}

export function handleCreateCommand(
  type: string,
  name: string,
  options: { template?: string }
): void {
  console.log(chalk.green(`\n✅ Creating ${chalk.bold(type)}: ${chalk.bold(name)}`));
  if (options.template) {
    console.log(chalk.blue(`📋 Using template: ${chalk.bold(options.template)}`));
  }
  console.log(chalk.gray('   (This is a demo - implement your creation logic here)'));
  console.log(chalk.green('   Done! ✨\n'));
}

export function handleListCommand(options: { all?: boolean; sort?: string }): void {
  console.log(chalk.green('\n📋 Listing resources...\n'));
  console.log(chalk.cyan(`   Show all: ${options.all ? chalk.green('✓ yes') : chalk.red('✗ no')}`));
  console.log(chalk.cyan(`   Sort by: ${chalk.bold(options.sort || 'name')}`));
  console.log(chalk.gray('\n   (This is a demo - implement your listing logic here)'));
  console.log(chalk.green('   Done! ✨\n'));
}

