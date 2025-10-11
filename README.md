# AgFactory

Agentic agent factory - create AI agents with custom prompts.

## ✨ Features

- 🤖 **Agent Creation** - Create AI agents with custom prompts
- 📁 **File Generation** - Generates working TypeScript files for each agent
- 🤝 **Interactive Mode** - User-friendly prompts with Inquirer.js
- 📦 **Single File** - Simple, consolidated codebase
- 🚀 **pnpm** - Fast, efficient package manager

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in interactive mode
pnpm run dev

# Or create an agent directly
pnpm run dev -- create my-agent -p "You are a helpful assistant"
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

### Interactive Mode (Default)

Simply run the CLI without any arguments to enter interactive mode:

```bash
pnpm run dev
```

You'll be guided through:

1. Agent name input (with validation)
2. Prompt/instructions input (with validation)

Each agent is created in the `agents/` folder with a working TypeScript file that you can run immediately.

### Command Line Mode

Create an agent directly from the command line:

```bash
# Create an agent with a prompt
pnpm run dev -- create my-agent --prompt "You are a helpful coding assistant"

# Create without a prompt
pnpm run dev -- create simple-agent
```

**Options:**

- `-p, --prompt <prompt>` - Agent prompt/instructions (optional)

### Running Your Agents

After creating an agent, you can run it with:

```bash
# Run with ts-node
ts-node agents/my-agent/index.ts

# Or with pnpm
pnpm exec ts-node agents/my-agent/index.ts
```

Each agent is a self-contained TypeScript file that prints "Hello World" and identifies itself

## Project Structure

```
AgFactory/
├── src/
│   └── index.ts              # Single file with all functionality
├── agents/                   # Generated agents (gitignored)
│   ├── my-agent/
│   │   └── index.ts          # Generated agent file
│   └── another-agent/
│       └── index.ts          # Generated agent file
├── dist/                     # Compiled JavaScript (generated)
├── package.json              # Project config (uses pnpm)
├── pnpm-lock.yaml            # pnpm lockfile
├── .npmrc                    # pnpm configuration
├── tsconfig.json
├── .gitignore
└── README.md
```

**Note:** The `agents/` folder is gitignored by default. Generated agents are meant to be customized locally.

## Extending the CLI

All code is in `src/index.ts` organized in sections:

- **Banner** - ASCII art and welcome message
- **Command Handler** - Logic for creating agents
- **Interactive Mode** - Inquirer prompts and flow
- **CLI Setup** - Commander.js configuration

To add functionality, simply edit the relevant section in `src/index.ts`.

## Publishing

To use this CLI globally on your system:

```bash
# Build the project
pnpm run build

# Link it globally
pnpm link --global

# Use it anywhere
agfactory create my-agent -p "You are helpful"
```

To publish to npm:

```bash
# Update version in package.json
pnpm version patch

# Publish
pnpm publish
```

## License

ISC
