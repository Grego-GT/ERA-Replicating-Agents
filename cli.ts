#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

/**
 * ERA CLI - Deno Version
 * Create AI agents with custom prompts (with optional AI code generation)
 */

import { parse } from 'https://deno.land/std@0.208.0/flags/mod.ts';
import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { run as orchestratorRun } from './core/fbi.ts';
import { prepareAgentFiles } from './core/prep.ts';
import { simpleChat } from './utils/wandb/index.ts';
import * as weave from './utils/weave/index.ts';

// ============================================================================
// ANSI Colors (replacing chalk)
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

// ============================================================================
// Banner (replacing figlet)
// ============================================================================

function displayBanner(): void {
  const banner = `
  ███████╗██████╗  █████╗ 
  ██╔════╝██╔══██╗██╔══██╗
  █████╗  ██████╔╝███████║
  ██╔══╝  ██╔══██╗██╔══██║
  ███████╗██║  ██║██║  ██║
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝`;

  console.clear();
  console.log(colorize(banner, 'cyan'));
  console.log(colorize('  ERA Replicating Agents', 'gray'));
  console.log(colorize('  Version: 1.0.0\n', 'gray'));
}

// ============================================================================
// Input Utilities (replacing inquirer)
// ============================================================================

async function prompt(message: string, defaultValue?: string): Promise<string> {
  if (defaultValue) {
    console.log(colorize(`${message} ${colorize(`(default: ${defaultValue})`, 'gray')}`, 'yellow'));
  } else {
    console.log(colorize(message, 'yellow'));
  }
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return defaultValue || '';
  const input = new TextDecoder().decode(buf.subarray(0, n)).trim();
  return input || defaultValue || '';
}

async function select(message: string, choices: string[]): Promise<string> {
  console.log(colorize(`\n${message}`, 'yellow'));
  choices.forEach((choice, idx) => {
    console.log(colorize(`  ${idx + 1}. ${choice}`, 'blue'));
  });
  const answer = await prompt(colorize('Enter your choice (number): ', 'yellow'));
  const idx = parseInt(answer) - 1;
  if (idx >= 0 && idx < choices.length) {
    return choices[idx];
  }
  console.log(colorize('Invalid choice, please try again.', 'red'));
  return await select(message, choices);
}

// ============================================================================
// AI-Powered Slug Generation
// ============================================================================

async function generateSlugFromPrompt(promptText: string): Promise<string> {
  try {
    console.log(colorize('   🤖 Generating agent name...', 'gray'));
    
    const slugPrompt = `Convert this task description into a short, URL-friendly slug (lowercase, hyphens only, 2-4 words max):

Task: "${promptText}"

Return ONLY the slug, nothing else. Examples:
- "Create a calculator" -> "calculator"
- "Fetch weather data from API" -> "weather-fetcher"
- "Generate random jokes" -> "joke-generator"

Slug:`;

    const slug = await simpleChat(slugPrompt, {
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      temperature: 0.3,
      maxTokens: 50
    });

    // Clean up the response - remove quotes, extra spaces, ensure it's a valid slug
    const cleanSlug = slug
      .replace(/['"]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');

    return cleanSlug || 'my-agent';
  } catch (error) {
    console.log(colorize('   ⚠️  Could not generate slug, using default', 'gray'));
    // Fallback: create a simple slug from the prompt
    return promptText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 30)
      .replace(/^-+|-+$/g, '')
      || 'my-agent';
  }
}

// ============================================================================
// Simple Agent Generation (Fallback)
// ============================================================================
// Used when AI generation fails - CLI-only functionality

function generateSimpleAgentCode(name: string, promptText?: string): string {
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

async function createAgentWithAI(
  name: string,
  promptText: string,
  maxIterations: number = 3
): Promise<void> {
  console.log(colorize(`\n🤖 Creating agent: ${colorize(name, 'bold')}`, 'green'));
  console.log(colorize(`💬 Prompt: ${colorize(promptText, 'bold')}`, 'blue'));
  console.log(colorize(`🔄 Max iterations: ${colorize(maxIterations.toString(), 'bold')}`, 'gray'));
  console.log(
    colorize('\n⏳ Calling FBI orchestrator (AI code generation + execution)...\n', 'cyan')
  );

  try {
    // Call the FBI orchestrator (generation + execution with retry/refinement)
    const result = await orchestratorRun(promptText, {
      maxRetries: 3,
      maxIterations,
      agentName: name,
      logCallback: (log) => {
        // Show important log messages
        if (log.level === 'error' || log.level === 'warning') {
          const icon = log.level === 'error' ? '❌' : '⚠️';
          console.log(
            colorize(`   ${icon} ${log.message}`, log.level === 'error' ? 'red' : 'yellow')
          );
        }
      },
    });

    if (!result.success) {
      throw new Error(
        result.execution.hasError
          ? `Execution failed: ${result.execution.errorType}`
          : 'Code generation failed'
      );
    }

    console.log(colorize('\n✅ AI code generation and validation successful!', 'green'));
    console.log(colorize('📝 Generated code preview:', 'gray'));
    console.log(colorize('─'.repeat(60), 'gray'));
    console.log(
      result.generation.code.substring(0, 300) + (result.generation.code.length > 300 ? '...' : '')
    );
    console.log(colorize('─'.repeat(60), 'gray'));

    if (result.execution.parsedOutput) {
      console.log(colorize('✅ Execution validated:', 'green'));
      console.log(colorize(`   ${JSON.stringify(result.execution.parsedOutput, null, 2)}`, 'gray'));
    }

    // Prepare agent files using FBI prep module
    console.log(colorize('\n📦 Preparing agent files...', 'gray'));
    const prepResult = await prepareAgentFiles(result);

    if (!prepResult.success) {
      throw new Error(`Failed to prepare files: ${prepResult.error}`);
    }

    console.log(
      colorize(
        `\n   ✨ AI-generated agent created at: ${colorize(prepResult.files.indexFile, 'bold')}`,
        'green'
      )
    );
    
    // Show agent description if available
    if (result.history.agentDescription) {
      console.log(
        colorize(
          `   📝 Description: ${colorize(result.history.agentDescription, 'bold')}`,
          'cyan'
        )
      );
    }
    
    console.log(
      colorize(
        `   📋 Metadata saved at: ${colorize(prepResult.files.metadataFile, 'bold')}`,
        'gray'
      )
    );
    console.log(
      colorize(
        `   ⏱️  Duration: ${result.duration.total}ms (gen: ${result.duration.generation}ms, exec: ${result.duration.execution}ms)`,
        'gray'
      )
    );
    console.log(
      colorize(`\n   Run it with: ${colorize(`deno run ${prepResult.files.indexFile}`, 'bold')}`, 'gray')
    );
    console.log(colorize('\n   Done! ✨\n', 'green'));
  } catch (error) {
    const err = error as Error;
    console.log(colorize(`\n❌ AI code generation failed: ${err.message}`, 'red'));
    console.log(
      colorize(
        '\n💡 Tip: Make sure you have set WANDB_API_KEY and DAYTONA_API_KEY in .env',
        'yellow'
      )
    );
    console.log(colorize('    Falling back to simple template...\n', 'gray'));

    // Fallback to simple generation
    await createAgentSimple(name, promptText);
  }
}

async function createAgentSimple(name: string, promptText?: string): Promise<void> {
  console.log(colorize(`\n✅ Creating simple agent: ${colorize(name, 'bold')}`, 'green'));

  if (promptText) {
    console.log(colorize(`💬 Prompt: ${colorize(promptText, 'bold')}`, 'blue'));
  }

  try {
    // Create agents directory if it doesn't exist
    const agentsDir = join(Deno.cwd(), 'agents');
    if (!(await exists(agentsDir))) {
      await Deno.mkdir(agentsDir, { recursive: true });
      console.log(colorize(`   📁 Created agents directory`, 'gray'));
    }

    // Create agent-specific directory
    const agentDir = join(agentsDir, name);
    if (await exists(agentDir)) {
      console.log(colorize(`   ⚠️  Agent "${name}" already exists, overwriting...`, 'yellow'));
    } else {
      await Deno.mkdir(agentDir, { recursive: true });
    }

    // Generate simple agent code
    const agentCode = generateSimpleAgentCode(name, promptText);
    const indexPath = join(agentDir, 'index.ts');
    await Deno.writeTextFile(indexPath, agentCode);

    console.log(
      colorize(`   ✨ Agent created at: ${colorize(`agents/${name}/index.ts`, 'bold')}`, 'green')
    );
    console.log(
      colorize(`\n   Run it with: ${colorize(`deno run agents/${name}/index.ts`, 'bold')}`, 'gray')
    );
    console.log(colorize('\n   Done! ✨\n', 'green'));
  } catch (error) {
    const err = error as Error;
    console.log(colorize(`\n❌ Failed to create simple agent: ${err.message}`, 'red'));
  }
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function startInteractiveMode(): Promise<void> {
  displayBanner();

  console.log(colorize('🚀 Welcome to ERA CLI!\n', 'cyan'));
  console.log(colorize('Create AI agents with custom prompts\n', 'gray'));

  // Initialize Weave for tracing (silently)
  try {
    await weave.init('era', true); // Silent mode
  } catch (error) {
    // Silently fail - tracing is optional
  }

  let continueLoop = true;

  while (continueLoop) {
    console.log(colorize('━'.repeat(60), 'gray'));
    console.log(colorize('\n✨ Create an Agent', 'cyan'));
    console.log(); // Empty line for spacing

    // First: Get what the agent should do
    const promptText = await prompt('What do you want the agent to do?');
    if (promptText.trim().length === 0) {
      console.log(colorize('❌ Prompt cannot be empty!', 'red'));
      const tryAgain = await prompt('Try again? (y/n)');
      if (tryAgain.toLowerCase() !== 'y') {
        console.log(colorize('\n👋 Thanks for using ERA CLI! Goodbye!\n', 'cyan'));
        break;
      }
      continue;
    }

    // Second: Generate suggested agent name using AI
    console.log(); // Empty line for spacing
    const suggestedSlug = await generateSlugFromPrompt(promptText);
    
    // Get agent name with AI-generated suggestion
    const name = await prompt('Agent name:', suggestedSlug);
    if (name.trim().length === 0) {
      console.log(colorize('❌ Agent name cannot be empty!', 'red'));
      continue;
    }

    // Create the agent
    await createAgentWithAI(name, promptText);
    
    // Ask if user wants to create another agent
    console.log(colorize('─'.repeat(60), 'gray'));
    const createAnother = await prompt('\nCreate another agent? (y/n)');
    if (createAnother.toLowerCase() !== 'y') {
      console.log(colorize('\n👋 Thanks for using ERA CLI! Goodbye!\n', 'cyan'));
      continueLoop = false;
    }
  }
}

// ============================================================================
// Command Line Handler
// ============================================================================

async function handleCommandLine(args: string[]): Promise<void> {
  const flags = parse(args, {
    string: ['prompt', 'p', 'iterations', 'i'],
    boolean: ['ai', 'simple'],
    alias: { p: 'prompt', i: 'iterations' },
    default: { ai: false, simple: false, iterations: '3' },
  });

  const command = flags._[0]?.toString();

  if (command === 'create') {
    const name = flags._[1]?.toString();

    if (!name) {
      console.log(colorize('❌ Error: Agent name is required', 'red'));
      console.log(
        colorize(
          'Usage: deno task cli:create <name> --prompt "Your prompt" [--ai|--simple] [--iterations N]',
          'gray'
        )
      );
      Deno.exit(1);
    }

    const promptText = flags.prompt?.toString();

    if (!promptText) {
      console.log(colorize('❌ Error: Prompt is required', 'red'));
      console.log(colorize('Usage: deno task cli:create <name> --prompt "Your prompt"', 'gray'));
      Deno.exit(1);
    }

    // Always use AI generation
    await createAgentWithAI(name, promptText);
  } else if (command === 'help' || command === '--help' || command === '-h') {
    displayHelp();
  } else {
    // No command or unknown command - start interactive mode
    await startInteractiveMode();
  }
}

function displayHelp(): void {
  console.log(colorize('\nERA CLI - AI-Powered Agent Factory\n', 'cyan'));
  console.log(colorize('Usage:', 'yellow'));
  console.log('  deno task cli                           # Interactive mode (recommended)');
  console.log('  deno task cli:create <name> -p "prompt" # Command line mode\n');
  console.log(colorize('Interactive Mode Features:', 'yellow'));
  console.log('  • Streamlined UX - describe what you want first');
  console.log('  • AI-powered agent name suggestions using Llama-3.1-8B');
  console.log('  • Smart defaults - just press Enter to accept suggestions\n');
  console.log(colorize('Commands:', 'yellow'));
  console.log('  create <name>           Create a new agent');
  console.log('  help                    Show this help message\n');
  console.log(colorize('Options:', 'yellow'));
  console.log('  -p, --prompt <text>     Agent prompt/instructions (required)\n');
  console.log(colorize('Examples:', 'yellow'));
  console.log('  # Interactive mode (recommended) - with AI name suggestions');
  console.log('  deno task cli\n');
  console.log('  # AI-powered generation (default, 3 iterations)');
  console.log('  deno task cli:create calculator -p "Create a calculator that adds two numbers"\n');
  console.log('  # With custom iterations (refinement retries)');
  console.log('  deno task cli:create factorial -p "Calculate factorial" --iterations 5\n');
  console.log(colorize('About Iterations:', 'yellow'));
  console.log('  The FBI Director will retry code generation + execution up to N times.');
  console.log('  Each retry refines the prompt based on previous errors.\n');
  console.log(colorize('Requirements for AI generation:', 'yellow'));
  console.log('  - WANDB_API_KEY in .env (for code generation & name suggestions)');
  console.log('  - DAYTONA_API_KEY in .env (for code validation)\n');
}

// ============================================================================
// Main Entry Point
// ============================================================================

if (import.meta.main) {
  const args = Deno.args;
  await handleCommandLine(args);
}
