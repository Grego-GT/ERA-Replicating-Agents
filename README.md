# AgFactory

Agentic agent factory - create AI agents with custom prompts.

## ✨ Features

- 🤖 **Agent Creation** - Create AI agents with custom prompts and models
- 🎨 **Beautiful UI** - Styled output with Chalk and ASCII art banners
- 🤝 **Interactive Mode** - User-friendly prompts with Inquirer.js
- ⚡ **TypeScript** - Fully typed with TypeScript for better DX
- 📦 **Single File** - Simple, consolidated codebase
- 🚀 **pnpm** - Fast, efficient package manager

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in interactive mode
pnpm run dev

# Or create an agent directly
pnpm run dev -- create my-agent -p "You are a helpful assistant" -m gpt-4
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

1. Agent name selection
2. Prompt/instructions input
3. AI model selection (gpt-4, gpt-3.5-turbo, claude-3-opus, claude-3-sonnet)

### Command Line Mode

Create an agent directly from the command line:

```bash
# Create an agent with a prompt
pnpm run dev -- create my-agent --prompt "You are a helpful coding assistant"

# Specify a model
pnpm run dev -- create my-agent -p "Translate text to Spanish" -m claude-3-opus
```

**Options:**

- `-p, --prompt <prompt>` - Agent prompt/instructions
- `-m, --model <model>` - AI model to use

## Project Structure

```
AgFactory/
├── src/
│   └── index.ts              # Single file with all functionality
├── dist/                     # Compiled JavaScript (generated)
├── package.json              # Project config (uses pnpm)
├── pnpm-lock.yaml            # pnpm lockfile
├── .npmrc                    # pnpm configuration
├── tsconfig.json
├── .gitignore
└── README.md
```

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
agfactory create my-agent -p "You are helpful" -m gpt-4
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
