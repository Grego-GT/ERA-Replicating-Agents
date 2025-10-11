#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * AgFactory CLI - Deno Version
 * Create AI agents with custom prompts
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

// ============================================================================
// ANSI Colors (replacing chalk)
// ============================================================================

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

// ============================================================================
// Banner (replacing figlet)
// ============================================================================

function displayBanner(): void {
  const banner = `
   ___        ______         _                   
  / _ \\      |  ____|       | |                  
 / /_\\ \\ __ _| |__ __ _  ___| |_ ___  _ __ _   _ 
 |  _  |/ _\` |  __/ _\` |/ __| __/ _ \\| '__| | | |
 | | | | (_| | | | (_| | (__| || (_) | |  | |_| |
 \\_| |_/\\__, |_|  \\__,_|\\___|\\__\\___/|_|   \\__, |
         __/ |                              __/ |
        |___/                              |___/ 
  `;
  
  console.clear();
  console.log(colorize(banner, "cyan"));
  console.log(colorize("  Agentic agent factory", "gray"));
  console.log(colorize("  Version: 1.0.0\n", "gray"));
}

// ============================================================================
// Input Utilities (replacing inquirer)
// ============================================================================

async function prompt(message: string): Promise<string> {
  console.log(colorize(message, "yellow"));
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return "";
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

async function select(message: string, choices: string[]): Promise<string> {
  console.log(colorize(`\n${message}`, "yellow"));
  choices.forEach((choice, idx) => {
    console.log(colorize(`  ${idx + 1}. ${choice}`, "blue"));
  });
  const answer = await prompt(colorize("Enter your choice (number): ", "yellow"));
  const idx = parseInt(answer) - 1;
  if (idx >= 0 && idx < choices.length) {
    return choices[idx];
  }
  console.log(colorize("Invalid choice, please try again.", "red"));
  return await select(message, choices);
}

// ============================================================================
// Agent Generation
// ============================================================================

function generateAgentCode(name: string, promptText?: string): string {
  const promptComment = promptText 
    ? `/**
 * Agent: ${name}
 * Prompt: ${promptText}
 */

` 
    : `/**
 * Agent: ${name}
 */

`;

  return `${promptComment}function main(): void {
  console.log('Hello World');
  console.log('Agent "${name}" is running!');
  ${promptText ? `console.log('Prompt: ${promptText}');` : ''}
}

main();
`;
}

async function createAgent(name: string, promptText?: string): Promise<void> {
  console.log(colorize(`\n✅ Creating agent: ${colorize(name, "bold")}`, "green"));
  
  if (promptText) {
    console.log(colorize(`💬 Prompt: ${colorize(promptText, "bold")}`, "blue"));
  }

  // Create agents directory if it doesn't exist
  const agentsDir = join(Deno.cwd(), "agents");
  if (!(await exists(agentsDir))) {
    await Deno.mkdir(agentsDir, { recursive: true });
    console.log(colorize(`   📁 Created agents directory`, "gray"));
  }

  // Create agent-specific directory
  const agentDir = join(agentsDir, name);
  if (await exists(agentDir)) {
    console.log(colorize(`   ⚠️  Agent "${name}" already exists, overwriting...`, "yellow"));
  } else {
    await Deno.mkdir(agentDir, { recursive: true });
  }

  // Generate the agent TypeScript file
  const agentCode = generateAgentCode(name, promptText);
  const agentFilePath = join(agentDir, "index.ts");
  await Deno.writeTextFile(agentFilePath, agentCode);

  console.log(colorize(`   ✨ Agent created at: ${colorize(`agents/${name}/index.ts`, "bold")}`, "green"));
  console.log(colorize(`\n   Run it with: ${colorize(`deno run agents/${name}/index.ts`, "bold")}`, "gray"));
  console.log(colorize('\n   Done! ✨\n', "green"));
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function startInteractiveMode(): Promise<void> {
  displayBanner();

  console.log(colorize('🚀 Welcome to AgFactory CLI!\n', "cyan"));
  console.log(colorize('Create AI agents with custom prompts\n', "gray"));

  let continueLoop = true;

  while (continueLoop) {
    const action = await select(
      'What would you like to do?',
      ['🤖 Create an Agent', '❌ Exit']
    );

    if (action.includes('Create')) {
      console.log(); // Empty line for spacing
      
      // Get agent name
      const name = await prompt('Enter the agent name:');
      if (name.trim().length === 0) {
        console.log(colorize('Agent name cannot be empty!', "red"));
        continue;
      }

      // Get agent prompt
      const promptText = await prompt('Enter the agent prompt:');
      if (promptText.trim().length === 0) {
        console.log(colorize('Prompt cannot be empty!', "red"));
        continue;
      }

      await createAgent(name, promptText);
      console.log(colorize('─'.repeat(50) + '\n', "gray"));
    } else if (action.includes('Exit')) {
      console.log(colorize('\n👋 Thanks for using AgFactory CLI! Goodbye!\n', "cyan"));
      continueLoop = false;
    }
  }
}

// ============================================================================
// Command Line Handler
// ============================================================================

async function handleCommandLine(args: string[]): Promise<void> {
  const flags = parse(args, {
    string: ["prompt", "p"],
    alias: { p: "prompt" },
  });

  const command = flags._[0]?.toString();
  
  if (command === "create") {
    const name = flags._[1]?.toString();
    
    if (!name) {
      console.log(colorize('❌ Error: Agent name is required', "red"));
      console.log(colorize('Usage: deno run cli.ts create <name> --prompt "Your prompt"', "gray"));
      Deno.exit(1);
    }

    const promptText = flags.prompt?.toString();
    await createAgent(name, promptText);
  } else if (command === "help" || command === "--help" || command === "-h") {
    displayHelp();
  } else {
    // No command or unknown command - start interactive mode
    await startInteractiveMode();
  }
}

function displayHelp(): void {
  console.log(colorize('\nAgFactory CLI - Deno Version\n', "cyan"));
  console.log(colorize('Usage:', "yellow"));
  console.log('  deno run --allow-read --allow-write --allow-env cli.ts [command] [options]\n');
  console.log(colorize('Commands:', "yellow"));
  console.log('  create <name>           Create a new agent');
  console.log('  help                    Show this help message\n');
  console.log(colorize('Options:', "yellow"));
  console.log('  -p, --prompt <text>     Agent prompt/instructions\n');
  console.log(colorize('Examples:', "yellow"));
  console.log('  deno run --allow-read --allow-write --allow-env cli.ts');
  console.log('  deno run --allow-read --allow-write --allow-env cli.ts create my-agent -p "You are helpful"\n');
}

// ============================================================================
// Main Entry Point
// ============================================================================

if (import.meta.main) {
  const args = Deno.args;
  await handleCommandLine(args);
}

