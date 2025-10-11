# AgFactory

Agentic agent factory - create an agent with a prompt.

## ✨ Features

- 🎨 **Beautiful UI** - Styled output with Chalk and ASCII art banners
- 🤝 **Interactive Mode** - User-friendly prompts with Inquirer.js
- ⚡ **Fast & Typed** - Built with TypeScript for type safety
- 📦 **Easy to Extend** - Clean modular structure for adding commands
- 🚀 **pnpm** - Fast, disk space efficient package manager

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in interactive mode
pnpm run dev

# Or run a specific command
pnpm run dev -- hello World --uppercase
```

## Installation

This project uses **pnpm** as the package manager. If you don't have it installed:

```bash
npm install -g pnpm
```

Then install dependencies:

```bash
pnpm install
```

## Development

Run the CLI in development mode:

```bash
pnpm run dev -- [command] [options]
```

Build the project:

```bash
pnpm run build
```

Run the compiled version:

```bash
pnpm start -- [command] [options]
```

Watch mode (auto-compile on changes):

```bash
pnpm run watch
```

## Usage

### 🎭 Interactive Mode (Default)

Simply run the CLI without any arguments to enter interactive mode:

```bash
pnpm run dev
```

**What you'll see:**

1. A beautiful ASCII art banner with the app name
2. An interactive menu with colorful icons
3. Arrow-key navigation through available commands
4. Contextual prompts for each command's inputs
5. The ability to execute multiple commands in a loop

You can also explicitly start interactive mode:

```bash
pnpm run dev -- interactive
# or use the alias
pnpm run dev -- i
```

**Interactive mode features:**

- ✨ Beautiful styled output with colors and emojis
- ⌨️ Navigate with arrow keys, select with Enter
- 🔄 Execute multiple commands without restarting
- ❓ Helpful prompts guide you through options
- ✅ Input validation for required fields

### 📟 Command Line Mode

Run specific commands directly without entering interactive mode:

#### Available Commands

#### `hello [name]`

Say hello to someone.

```bash
pnpm run dev -- hello
pnpm run dev -- hello John
pnpm run dev -- hello John --uppercase
```

Options:

- `-u, --uppercase`: Output in uppercase

#### `create <type> <name>`

Create a new resource.

```bash
pnpm run dev -- create project my-app
pnpm run dev -- create file index.ts --template basic
```

Options:

- `-t, --template <template>`: Template to use

#### `list`

List all resources.

```bash
pnpm run dev -- list
pnpm run dev -- list --all
pnpm run dev -- list --sort date
```

Options:

- `-a, --all`: Show all resources including hidden ones
- `-s, --sort <field>`: Sort by field (default: "name")

### General Options

- `-V, --version`: Output the version number
- `-h, --help`: Display help for command

## Project Structure

```
AgFactory/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── interactive.ts        # Interactive mode logic
│   ├── commands/
│   │   └── index.ts          # Command handlers
│   └── utils/
│       └── banner.ts         # ASCII art banner
├── dist/                     # Compiled JavaScript (generated)
├── package.json              # Project config (specifies pnpm)
├── pnpm-lock.yaml            # pnpm lockfile (commit this!)
├── .npmrc                    # pnpm configuration
├── tsconfig.json
├── .gitignore
├── .eslintrc.json
├── .prettierrc
└── README.md
```

## Dependencies

### Core

- **commander** - CLI framework for building command-line tools
- **chalk** - Terminal string styling with colors
- **inquirer** - Interactive command-line prompts
- **figlet** - ASCII art text generator

### Development

- **typescript** - TypeScript compiler
- **ts-node** - TypeScript execution for development
- **@types/node** - Node.js type definitions
- **@types/inquirer** - Inquirer type definitions
- **@types/figlet** - Figlet type definitions

## Adding New Commands

### 1. Create a command handler in `src/commands/index.ts`:

```typescript
export function handleYourCommand(
  arg: string,
  options: { flag?: boolean }
): void {
  console.log(chalk.green(`\n✨ Executing your command with ${arg}\n`));
  // Your command logic here
}
```

### 2. Add the command to `src/index.ts`:

```typescript
program
  .command("your-command")
  .description("Description of your command")
  .argument("<required-arg>", "Description of required argument")
  .option("-f, --flag", "Description of flag")
  .action((requiredArg, options) => {
    handleYourCommand(requiredArg, options);
  });
```

### 3. Add interactive mode support in `src/interactive.ts`:

```typescript
// Add to the menu choices
{
  name: chalk.blue('🎯 Your Command'),
  value: 'your-command',
}

// Add the case in the switch statement
case 'your-command':
  await handleYourCommandInteractive();
  break;

// Create the interactive handler function
async function handleYourCommandInteractive(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'arg',
      message: chalk.yellow('Enter argument:'),
    },
    {
      type: 'confirm',
      name: 'flag',
      message: chalk.yellow('Enable flag?'),
      default: false,
    },
  ]);

  handleYourCommand(answers.arg, { flag: answers.flag });
}
```

## Publishing

To use this CLI globally on your system:

1. Build the project:

   ```bash
   pnpm run build
   ```

2. Link it globally:

   ```bash
   pnpm link --global
   ```

3. Now you can use it anywhere:
   ```bash
   agfactory hello
   ```

To publish to npm:

1. Update version in `package.json`
2. Login to npm: `pnpm login` or `npm login`
3. Publish: `pnpm publish`

## License

ISC
