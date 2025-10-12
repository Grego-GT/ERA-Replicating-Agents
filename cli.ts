#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

/**
 * ERA CLI - Deno Version
 * Create AI agents with custom prompts (with optional AI code generation)
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { Input } from "@cliffy/prompt";
import { run as orchestratorRun } from "./core/fbi.ts";
import { prepareAgentFiles } from "./core/prep.ts";
import { simpleChat } from "./utils/wandb/index.ts";
import * as weave from "./utils/weave/index.ts";

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
  ███████╗██████╗  █████╗ 
  ██╔════╝██╔══██╗██╔══██╗
  █████╗  ██████╔╝███████║
  ██╔══╝  ██╔══██╗██╔══██║
  ███████╗██║  ██║██║  ██║
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝`;

  console.clear();
  console.log(colorize(banner, "cyan"));
  console.log(colorize("  ERA Replicating Agents", "gray"));
  console.log(colorize("  Version: 1.0.0\n", "gray"));
}

// ============================================================================
// Input Utilities (replacing inquirer)
// ============================================================================

async function prompt(message: string, defaultValue?: string): Promise<string> {
  if (defaultValue) {
    console.log(colorize(`${message} ${colorize(`(default: ${defaultValue})`, "gray")}`, "yellow"));
  } else {
    console.log(colorize(message, "yellow"));
  }
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return defaultValue || "";
  const input = new TextDecoder().decode(buf.subarray(0, n)).trim();
  return input || defaultValue || "";
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

/**
 * Number-based selection with name/value pairs (like Cliffy's Select)
 * Returns either the selected value OR "__custom__:<user input>" if they typed text
 */
async function selectWithValue(
  message: string,
  options: Array<{ name: string; value: string }>,
  allowCustomInput: boolean = false
): Promise<string> {
  console.log(colorize(`\n? ${message}`, "cyan"));
  options.forEach((option, idx) => {
    console.log(colorize(`  ${idx + 1}. ${option.name}`, "cyan"));
  });
  
  const hint = allowCustomInput 
    ? `${colorize("[default: 1, or type your prompt]", "gray")}`
    : `${colorize("[default: 1]", "gray")}`;
  console.log(colorize(`\n  Enter choice (1-${options.length}) ${hint}: `, "yellow"), "");
  
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return options[0].value;
  
  const input = new TextDecoder().decode(buf.subarray(0, n)).trim();
  
  // Default to first option if empty input
  if (input === "") {
    return options[0].value;
  }
  
  const idx = parseInt(input) - 1;
  
  // Valid number choice
  if (!isNaN(idx) && idx >= 0 && idx < options.length) {
    return options[idx].value;
  }
  
  // If custom input is allowed and they typed something that's not a valid number
  if (allowCustomInput && input.length > 0) {
    console.log(colorize(`  ✨ Using custom prompt: "${input.substring(0, 50)}${input.length > 50 ? "..." : ""}"`, "green"));
    return `__custom__:${input}`;
  }
  
  console.log(colorize("  ❌ Invalid choice, please try again.", "red"));
  return await selectWithValue(message, options, allowCustomInput);
}

// ============================================================================
// Agent Selection
// ============================================================================

/**
 * Get list of existing agents
 */
async function getExistingAgents(): Promise<string[]> {
  const agentsDir = join(Deno.cwd(), "agents");

  if (!(await exists(agentsDir))) {
    return [];
  }

  const agents: string[] = [];
  for await (const entry of Deno.readDir(agentsDir)) {
    if (entry.isDirectory) {
      agents.push(entry.name);
    }
  }

  return agents.sort();
}

/**
 * Get list of existing utilities
 */
async function getExistingUtils(): Promise<string[]> {
  const utilsDir = join(Deno.cwd(), "utils");

  if (!(await exists(utilsDir))) {
    return [];
  }

  const utils: string[] = [];
  for await (const entry of Deno.readDir(utilsDir)) {
    if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "registry") {
      utils.push(entry.name);
    }
  }

  return utils.sort();
}

/**
 * Detect if an entity exists and where
 */
async function detectEntityLocation(name: string): Promise<"agent" | "util" | null> {
  const agentPath = join(Deno.cwd(), "agents", name);
  const utilPath = join(Deno.cwd(), "utils", name);

  if (await exists(agentPath)) {
    return "agent";
  }
  if (await exists(utilPath)) {
    return "util";
  }
  return null;
}

/**
 * Interactive entity name prompt with autocomplete from existing agents & utils
 */
async function promptAgentName(suggestedName: string): Promise<string> {
  const existingAgents = await getExistingAgents();
  const existingUtils = await getExistingUtils();

  if (existingAgents.length === 0 && existingUtils.length === 0) {
    // No existing entities, use simple input
    return await Input.prompt({
      message: "Name:",
      default: suggestedName,
      hint: "Press Enter to use suggested name",
    });
  }

  // Combine agents and utils with visual distinction
  const suggestions = [
    suggestedName,
    ...existingAgents.map((a) => `🧪 ${a}`),
    ...existingUtils.map((u) => `🏗️ ${u}`),
  ];

  const result = await Input.prompt({
    message: "Name:",
    default: suggestedName,
    suggestions: suggestions,
    list: true,
    info: true,
    hint: "↑↓ for suggestions (🧪=agent 🏗️=util), or type custom name",
  });

  // Strip emoji prefix if user selected from list
  return result.replace(/^[🧪🏗️]\s+/, "");
}

// ============================================================================
// AI-Powered Slug Generation
// ============================================================================

async function generateSlugFromPrompt(promptText: string): Promise<string> {
  try {
    console.log(colorize("   🤖 Generating agent name...", "gray"));

    const slugPrompt =
      `Convert this task description into a short, URL-friendly slug (lowercase, hyphens only, 2-4 words max):

Task: "${promptText}"

Return ONLY the slug, nothing else. Examples:
- "Create a calculator" -> "calculator"
- "Fetch weather data from API" -> "weather-fetcher"
- "Generate random jokes" -> "joke-generator"

Slug:`;

    const slug = await simpleChat(slugPrompt, {
      model: Deno.env.get("AI_MODEL_SLUGGEN") || "meta-llama/Llama-3.1-8B-Instruct",
      component: "sluggen",  // Use component-specific URL if configured
    });

    // Clean up the response - remove quotes, extra spaces, ensure it's a valid slug
    const cleanSlug = slug
      .replace(/['"]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");

    return cleanSlug || "my-agent";
  } catch (error) {
    console.log(colorize("   ⚠️  Could not generate slug, using default", "gray"));
    // Fallback: create a simple slug from the prompt
    return promptText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .substring(0, 30)
      .replace(/^-+|-+$/g, "") ||
      "my-agent";
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
  ${promptText ? `console.log('Prompt: ${promptText}');` : ""}
}

main();
`;
}

async function createAgentWithAI(
  name: string,
  promptText: string,
  maxIterations: number = 3,
  previousResult?: any,
  isUtility: boolean = false,
): Promise<any> {
  // Determine base directory: utils/ for utilities, agents/ for agents
  const baseDir = isUtility ? "utils" : "agents";
  const agentDir = join(Deno.cwd(), baseDir, name);
  const agentJsonPath = join(agentDir, "agent.json");
  const indexTsPath = join(agentDir, "index.ts");

  let existingHistory: any = null;
  let existingCode = "";
  let isContinuation = false;

  if (await exists(agentDir) && await exists(agentJsonPath)) {
    try {
      // Load existing agent context
      const jsonContent = await Deno.readTextFile(agentJsonPath);
      existingHistory = JSON.parse(jsonContent);

      if (await exists(indexTsPath)) {
        existingCode = await Deno.readTextFile(indexTsPath);
      }

      isContinuation = true;
      console.log(colorize(`\n📂 Found existing agent: ${colorize(name, "bold")}`, "cyan"));
      console.log(colorize(`   Previous attempts: ${existingHistory.attempts?.length || 0}`, "gray"));
      console.log(colorize(`   Continuing with new iteration...\n`, "cyan"));
    } catch (error) {
      console.log(colorize(`   ⚠️  Could not load existing agent, creating fresh`, "yellow"));
    }
  }

  const entityType = isUtility ? "utility" : "agent";
  const emoji = isUtility ? "🏗️" : "🧪";
  const themeColor = isUtility ? "green" : "cyan";

  console.log(
    colorize(
      `\n${emoji} ${isContinuation ? "Continuing" : "Creating"} ${entityType}: ${colorize(name, "bold")}`,
      themeColor,
    ),
  );
  console.log(colorize(`📁 Location: ${colorize(baseDir + "/" + name, "bold")}`, themeColor));
  console.log(colorize(`💬 Prompt: ${colorize(promptText, "bold")}`, "blue"));
  console.log(colorize(`🔄 Max iterations: ${colorize(maxIterations.toString(), "bold")}`, "gray"));
  console.log(
    colorize("\n⏳ Calling ERA orchestrator (AI code generation + execution)...\n", "cyan"),
  );

  try {
    // Build context for continuation if agent exists
    let contextualPrompt = promptText;
    let previousAttemptContext: any = undefined;

    if (isContinuation && existingHistory && existingCode) {
      // Build rich context from existing agent
      contextualPrompt = `
# Agent Continuation Context

## Original Agent
Name: ${name}
Original Prompt: ${existingHistory.ogprompt}
Description: ${existingHistory.agentDescription || "N/A"}
Total Previous Attempts: ${existingHistory.attempts?.length || 0}

## Current Working Code
The agent currently has working code that successfully executes.

## Latest Successful Version
\`\`\`typescript
${existingCode.substring(0, 1000)}${existingCode.length > 1000 ? "\n... (truncated for context)" : ""}
\`\`\`

## New User Request
${promptText}

## Task
Generate an improved version of this agent that:
1. Maintains all existing functionality that works
2. Addresses the new user request: "${promptText}"
3. Builds upon the previous successful code
4. Preserves the core purpose: "${existingHistory.ogprompt}"

Please generate the complete, improved agent code.
`;

      // Get the last successful attempt for Director context
      const lastAttempt = existingHistory.attempts?.[existingHistory.attempts.length - 1];
      if (lastAttempt && lastAttempt.execution?.success) {
        previousAttemptContext = {
          prompt: lastAttempt.prompt || existingHistory.ogprompt,
          code: existingCode,
          executionOutput: lastAttempt.execution.output,
          executionError: undefined,
          errorType: undefined,
        };
      }
    }

    // Call the ERA orchestrator (generation + execution with retry/refinement)
    const result = await orchestratorRun(isContinuation ? contextualPrompt : promptText, {
      maxRetries: 3,
      maxIterations,
      agentName: name,
      logCallback: (log) => {
        // Show important log messages
        if (log.level === "error" || log.level === "warning") {
          const icon = log.level === "error" ? "❌" : "⚠️";
          console.log(
            colorize(`   ${icon} ${log.message}`, log.level === "error" ? "red" : "yellow"),
          );
        }
      },
    });

    if (!result.success) {
      // Show clear failure message
      console.log(colorize("\n" + "=".repeat(60), "red"));
      console.log(colorize("❌ AGENT CREATION FAILED", "red"));
      console.log(colorize("=".repeat(60), "red"));
      
      if (result.execution.hasError) {
        console.log(colorize(`\n💥 Error Type: ${result.execution.errorType}`, "red"));
        if (result.execution.errorMessage) {
          // Ensure error is properly stringified
          const errorText = typeof result.execution.errorMessage === 'string'
            ? result.execution.errorMessage
            : JSON.stringify(result.execution.errorMessage, null, 2);
          console.log(colorize(`📝 Details: ${errorText}`, "yellow"));
        }
      } else if (result.generation && !result.generation.success) {
        console.log(colorize("\n💥 Code generation failed", "red"));
        if (result.generation.error) {
          console.log(colorize(`📝 Details: ${result.generation.error}`, "yellow"));
        }
      }
      
      console.log(colorize(`\n📊 Attempts: ${result.history.attempts?.length || 0} iterations`, "gray"));
      console.log(colorize(`⏱️  Duration: ${result.duration.total}ms`, "gray"));
      
      if (result.history.error) {
        console.log(colorize(`\n🔍 Last Error: ${result.history.error}`, "yellow"));
      }
      
      console.log(colorize("\n" + "=".repeat(60) + "\n", "red"));
      
      throw new Error(
        result.execution.hasError ? `Execution failed: ${result.execution.errorType}` : "Code generation failed",
      );
    }

    console.log(colorize("\n✅ AI code generation and validation successful!", "green"));
    console.log(colorize("📝 Generated code preview:", "gray"));
    console.log(colorize("─".repeat(60), "gray"));
    console.log(
      result.generation.code.substring(0, 300) + (result.generation.code.length > 300 ? "..." : ""),
    );
    console.log(colorize("─".repeat(60), "gray"));

    if (result.execution.parsedOutput) {
      console.log(colorize("✅ Execution validated:", "green"));
      console.log(colorize(`   ${JSON.stringify(result.execution.parsedOutput, null, 2)}`, "gray"));
    }

    // Prepare agent files using FBI prep module
    console.log(colorize(`\n📦 Preparing ${entityType} files...`, "gray"));
    const prepResult = await prepareAgentFiles(result, {
      baseDir, // Use utils/ or agents/ based on flag
      existingHistory: existingHistory, // Pass existing history for merging if continuation
    });

    if (!prepResult.success) {
      throw new Error(`Failed to prepare files: ${prepResult.error}`);
    }

    console.log(
      colorize(
        `\n   ✨ AI-generated ${entityType} created at: ${colorize(prepResult.files.indexFile, "bold")}`,
        "green",
      ),
    );

    // Show agent description if available
    if (result.history.agentDescription) {
      console.log(
        colorize(
          `   📝 Description: ${colorize(result.history.agentDescription, "bold")}`,
          "cyan",
        ),
      );
    }

    console.log(
      colorize(
        `   📋 Metadata saved at: ${colorize(prepResult.files.metadataFile, "bold")}`,
        "gray",
      ),
    );
    console.log(
      colorize(
        `   ⏱️  Duration: ${result.duration.total}ms (gen: ${result.duration.generation}ms, exec: ${result.duration.execution}ms)`,
        "gray",
      ),
    );
    console.log(
      colorize(`\n   Run it with: ${colorize(`deno run ${prepResult.files.indexFile}`, "bold")}`, "gray"),
    );
    console.log(colorize("\n   Done! ✨\n", "green"));

    // Preview execution: Run the generated agent to show its output
    if (result.execution.success && result.execution.output) {
      console.log(colorize("─".repeat(60), "gray"));
      console.log(colorize("🎬 Live Preview - Agent Output:", "cyan"));
      console.log(colorize("─".repeat(60), "gray"));
      
      // Filter out infrastructure noise (weave errors, netrc warnings, etc)
      let output = result.execution.output.trim();
      
      // Remove common infrastructure error patterns
      const noisyPatterns = [
        /Error parsing netrc file[\s\S]*?path: '\/home\/daytona\/\.netrc'\s*}/g,
        /\[Weave\] Failed to initialize:[\s\S]*?(?=\n\n|\n[A-Z]|$)/g,
        /wandb API key not found\.[\s\S]*?(?=\n\n|\n[A-Z]|$)/g,
        /npm.*added.*packages.*in.*s/g,
        /WARNING: Weave is not initialized[\s\S]*?safely ignore this warning\./g,
        /\[Weave\] Starting: [^\n]+\n/g,  // Remove all "Starting:" logs
        /\[Weave\] Completed: [^\n]+\n/g, // Remove all "Completed:" logs
        /\[Weave\] Failed: [^\n]+\n/g,    // Remove all "Failed:" logs
        /\[Weave\] Initialized project: [^\n]+\n/g, // Remove initialization logs
      ];
      
      for (const pattern of noisyPatterns) {
        output = output.replace(pattern, '');
      }
      
      // Clean up extra whitespace
      output = output.replace(/\n{3,}/g, '\n\n').trim();
      
      if (output.length > 0) {
        // Show full output (no truncation)
        console.log(output);
      } else {
        console.log(colorize("   (Agent executed successfully but produced no visible output)", "gray"));
      }
      
      console.log(colorize("─".repeat(60), "gray"));
      console.log(colorize("💡 This is what your agent produced during validation\n", "gray"));
    }

    return result; // Return for potential refinement
  } catch (error) {
    const err = error as Error;
    console.log(colorize(`\n❌ AI code generation failed: ${err.message}`, "red"));
    console.log(
      colorize(
        "\n💡 Tip: Make sure you have set WANDB_API_KEY and DAYTONA_API_KEY in .env",
        "yellow",
      ),
    );
    console.log(colorize("💡 Tip: Some models (like Groq) may struggle with complex prompts.", "yellow"));
    console.log(colorize("    Try using a different model or simplifying your prompt.\n", "yellow"));
    
    // Don't create a fallback - let the user see the failure and fix it
    throw error;
  }
}

/**
 * Interactive refinement loop - allows user to provide improvement feedback
 * after successful generation
 */
async function refineAgentInteractive(
  name: string,
  previousResult: any,
): Promise<void> {
  console.log(colorize("\n💡 Refinement Mode", "cyan"));
  console.log(colorize("   You can now improve the generated code based on your feedback.", "gray"));
  console.log(colorize("   Press Enter to skip, or Ctrl+C to exit.\n", "gray"));

  // Get improvement prompt from user
  const improvementPrompt = await prompt(
    "What would you like to improve? (describe your refinement goals, or press Enter to skip):",
  );

  if (!improvementPrompt.trim()) {
    console.log(colorize("\n✅ Agent finalized!\n", "green"));
    return;
  }

  // Build refinement context from previous result
  const refinementContext = `
Original goal: ${previousResult.prompt}
Previous code successfully generated and executed.

User feedback for improvement:
${improvementPrompt}

Please generate an improved version of the code that addresses this feedback while maintaining the core functionality.
`;

  console.log(colorize("\n🔄 Refining agent with your feedback...\n", "cyan"));

  // Call orchestrator again with refinement context
  const refinedResult = await createAgentWithAI(
    name,
    refinementContext,
    3, // Allow iterations for refinement
    previousResult,
  );

  if (refinedResult) {
    // Ask if they want to refine again
    await refineAgentInteractive(name, refinedResult);
  }
}

async function createAgentSimple(name: string, promptText?: string): Promise<void> {
  console.log(colorize(`\n✅ Creating simple agent: ${colorize(name, "bold")}`, "green"));

  if (promptText) {
    console.log(colorize(`💬 Prompt: ${colorize(promptText, "bold")}`, "blue"));
  }

  try {
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

    // Generate simple agent code
    const agentCode = generateSimpleAgentCode(name, promptText);
    const indexPath = join(agentDir, "index.ts");
    await Deno.writeTextFile(indexPath, agentCode);

    console.log(
      colorize(`   ✨ Agent created at: ${colorize(`agents/${name}/index.ts`, "bold")}`, "green"),
    );
    console.log(
      colorize(`\n   Run it with: ${colorize(`deno run agents/${name}/index.ts`, "bold")}`, "gray"),
    );
    console.log(colorize("\n   Done! ✨\n", "green"));
  } catch (error) {
    const err = error as Error;
    console.log(colorize(`\n❌ Failed to create simple agent: ${err.message}`, "red"));
  }
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function startInteractiveMode(): Promise<void> {
  displayBanner();

  console.log(colorize("🚀 Welcome to ERA CLI!\n", "cyan"));
  console.log(colorize("Create AI agents with custom prompts\n", "gray"));

  // Initialize Weave for tracing (completely silent)
  try {
    // Temporarily suppress console output during weave init
    const originalLog = console.log;
    console.log = () => {}; // Suppress output
    await weave.init("era", true); // Silent mode
    console.log = originalLog; // Restore console.log
  } catch (error) {
    // Silently fail - tracing is optional
  }

  let continueLoop = true;

  while (continueLoop) {
    console.log(colorize("\n✨ Create an Agent", "cyan"));
    console.log(); // Empty line for spacing

    // First: Show quick start menu with examples
    const quickStartChoice = await selectWithValue(
      "Choose a template or define your own:",
      [
        {
          name: "🔢 FizzBuzz Solver (Simple Demo)",
          value: "fizzbuzz",
        },
        {
          name: "🎭 Joke Generator (WandbChat Demo)",
          value: "jokemeister",
        },
        {
          name: "🔍 Web Search Agent (Tavily Demo)",
          value: "tavily-search",
        },
        {
          name: "🌐 AI Web Browser (Browserbase/Stagehand Demo)",
          value: "browserbase-browser",
        },
        {
          name: "🤖 Multi-Agent System (Mastra Framework Demo)",
          value: "mastra-agents",
        },
        {
          name: "✨ Define Your Own Agent",
          value: "custom",
        },
      ],
      true // Allow custom input
    );

    let promptText = "";
    let suggestedName = "";

    // Check if user typed custom input directly
    if (quickStartChoice.startsWith("__custom__:")) {
      promptText = quickStartChoice.substring("__custom__:".length);
      // Skip template handling, go straight to name generation
    } else if (quickStartChoice === "fizzbuzz") {
      promptText =
        "Create a FizzBuzz solver that prints numbers 1 to 100, replacing multiples of 3 with 'Fizz', multiples of 5 with 'Buzz', and multiples of both with 'FizzBuzz'. Output each result on a new line.";
      suggestedName = "fizzbuzz-solver";
      console.log(colorize("\n🔢 FizzBuzz Solver Template", "cyan"));
      console.log(colorize("   Demonstrates: Basic code generation and execution", "gray"));
      console.log(colorize(`   Prompt: "${promptText.substring(0, 80)}..."`, "gray"));
    } else if (quickStartChoice === "jokemeister") {
      promptText =
        "Create a joke-telling agent that uses wandbChat to generate jokes with step-by-step reasoning and weave tracing with operation jokemeister:tell_joke";
      suggestedName = "jokemeister";
      console.log(colorize("\n🎭 Jokemeister Template", "cyan"));
      console.log(colorize("   Demonstrates: WandbChat for LLM calls, Weave tracing", "gray"));
      console.log(colorize(`   Prompt: "${promptText.substring(0, 80)}..."`, "gray"));
    } else if (quickStartChoice === "tavily-search") {
      promptText =
        'Create a web search agent that uses tavilySearch to search for information about a topic (e.g., "Who is Leo Messi?") and displays the AI-generated answer plus top 3 sources with titles and URLs';
      suggestedName = "web-researcher";
      console.log(colorize("\n🔍 Web Search Template", "cyan"));
      console.log(colorize("   Demonstrates: Tavily web search with results", "gray"));
      console.log(colorize(`   Prompt: "${promptText.substring(0, 80)}..."`, "gray"));
    } else if (quickStartChoice === "browserbase-browser") {
      promptText =
        'Create an AI web browser agent using Stagehand that navigates to docs.stagehand.dev, uses observePage to find navigation elements, and uses extractFromPage with Zod schema to extract the page heading, description, and installation command';
      suggestedName = "ai-browser";
      console.log(colorize("\n🌐 AI Web Browser Template", "cyan"));
      console.log(colorize("   Demonstrates: Browserbase/Stagehand for AI-powered web browsing", "gray"));
      console.log(colorize(`   Prompt: "${promptText.substring(0, 80)}..."`, "gray"));
    } else if (quickStartChoice === "mastra-agents") {
      promptText =
        'Create a multi-agent system using Mastra that has a researcher agent and a summarizer agent. The researcher gathers information about a topic, then the summarizer condenses it into bullet points. Include memory for context retention.';
      suggestedName = "research-team";
      console.log(colorize("\n🤖 Multi-Agent System Template", "cyan"));
      console.log(colorize("   Demonstrates: Mastra framework with agents, memory, and workflows", "gray"));
      console.log(colorize(`   Prompt: "${promptText.substring(0, 80)}..."`, "gray"));
    } else {
      // Custom - ask user
      promptText = await prompt("What do you want the agent to do?");
      if (promptText.trim().length === 0) {
        console.log(colorize("❌ Prompt cannot be empty!", "red"));
        const tryAgain = await prompt("Try again? (y/n)");
        if (tryAgain.toLowerCase() !== "y") {
          console.log(colorize("\n👋 Thanks for using ERA CLI! Goodbye!\n", "cyan"));
          break;
        }
        continue;
      }
    }

    // Second: Generate suggested agent name using AI (or use template name)
    console.log(); // Empty line for spacing
    const suggestedSlug = suggestedName || (await generateSlugFromPrompt(promptText));

    // Get agent name with interactive selector (shows existing agents)
    const name = await promptAgentName(suggestedSlug);
    if (!name || name.trim().length === 0) {
      console.log(colorize("❌ Name cannot be empty!", "red"));
      continue;
    }

    // Third: Detect if this is a continuation or new entity
    const existingLocation = await detectEntityLocation(name);
    let isUtility = false;

    if (existingLocation) {
      // Continuing existing entity - use its current location
      isUtility = existingLocation === "util";
      const locationLabel = isUtility ? "🏗️ utils/" : "🧪 agents/";
      console.log(
        colorize(`\n📍 Continuing existing ${isUtility ? "utility" : "agent"}: ${locationLabel}${name}`, "cyan"),
      );
    } else {
      // New entity - ask where to create it
      console.log(); // Empty line for spacing
      const typeChoice = await selectWithValue(
        "Where should this be created?",
        [
          { name: "🧪 Experimental (agents/) - Test & iterate", value: "agent" },
          { name: "🏗️ Stable Utility (utils/) - Production-ready, reusable", value: "util" },
        ]
      );
      isUtility = typeChoice === "util";
    }

    // Create the entity with the determined location
    const result = await createAgentWithAI(name, promptText, undefined, undefined, isUtility);

    // If successful, offer refinement
    if (result && result.success) {
      await refineAgentInteractive(name, result);

      // If this is an agent (not util) and it's working, offer to promote
      if (!isUtility) {
        console.log(colorize("\n─".repeat(60), "gray"));
        const shouldPromote = await prompt("\n🎉 Agent works! Promote to utility now? (y/n)");
        if (shouldPromote.toLowerCase() === "y") {
          try {
            const { promoteAgent } = await import("./core/promoter.ts");
            console.log(colorize("\n🚀 Promoting agent to utility...", "cyan"));
            const promoteResult = await promoteAgent({
              agentName: name,
              dryRun: false,
              force: false,
            });

            if (promoteResult.success) {
              console.log(colorize(`✅ Successfully promoted ${name} to utils/!`, "green"));
              console.log(colorize(`📝 Generated examples.ts with API documentation`, "gray"));
            } else {
              console.log(colorize(`⚠️ Promotion completed with warnings`, "yellow"));
            }
          } catch (error) {
            const err = error as Error;
            console.log(colorize(`❌ Promotion failed: ${err.message}`, "red"));
          }
        }
      }
    }

    // Ask if user wants to create another agent
    console.log(colorize("─".repeat(60), "gray"));
    const createAnother = await prompt("\nCreate another agent? (y/n)");
    if (createAnother.toLowerCase() !== "y") {
      console.log(colorize("\n👋 Thanks for using ERA CLI! Goodbye!\n", "cyan"));
      continueLoop = false;
    }
  }
}

// ============================================================================
// Command Line Handler
// ============================================================================

async function handleCommandLine(args: string[]): Promise<void> {
  // Get default iterations from .env or use 3
  const envMaxIterations = Deno.env.get("MAX_ITERATIONS");
  const defaultIterations = envMaxIterations ? envMaxIterations : "3";

  const flags = parse(args, {
    string: ["prompt", "p", "iterations", "i"],
    boolean: ["ai", "simple", "util", "utility", "dry-run", "force"],
    alias: { p: "prompt", i: "iterations" },
    default: {
      ai: false,
      simple: false,
      iterations: defaultIterations,
      util: false,
      utility: false,
      "dry-run": false,
      force: false,
    },
  });

  const command = flags._[0]?.toString();

  if (command === "promote") {
    // Import promoter dynamically
    const { promoteAgent } = await import("./core/promoter.ts");

    const name = flags._[1]?.toString();
    if (!name) {
      console.log(colorize("❌ Error: Agent name is required", "red"));
      console.log(colorize("Usage: deno task cli:promote <agent-name> [--dry-run] [--force]", "gray"));
      Deno.exit(1);
    }

    const dryRun = flags["dry-run"] || false;
    const force = flags.force || false;

    const result = await promoteAgent({ agentName: name, dryRun, force });

    if (!result.success) {
      console.log(colorize(`\n❌ Promotion failed: ${result.error}`, "red"));
      Deno.exit(1);
    }

    if (!dryRun) {
      console.log(colorize("💡 Next steps:", "cyan"));
      console.log(colorize(`   1. Review: cat utils/${name}/examples.ts`, "gray"));
      console.log(colorize(`   2. Test: deno task test:registry`, "gray"));
      console.log(colorize(`   3. Use in agents: The utility is now discoverable!\n`, "gray"));
    }
  } else if (command === "create") {
    const name = flags._[1]?.toString();

    if (!name) {
      console.log(colorize("❌ Error: Agent name is required", "red"));
      console.log(
        colorize(
          'Usage: deno task cli:create <name> --prompt "Your prompt" [--ai|--simple] [--iterations N]',
          "gray",
        ),
      );
      Deno.exit(1);
    }

    const promptText = flags.prompt?.toString();

    if (!promptText) {
      console.log(colorize("❌ Error: Prompt is required", "red"));
      console.log(colorize('Usage: deno task cli:create <name> --prompt "Your prompt"', "gray"));
      Deno.exit(1);
    }

    // Parse iterations (from --iterations flag or .env MAX_ITERATIONS)
    const maxIterations = parseInt(flags.iterations || defaultIterations, 10);

    // Check if this should be a utility (saved to utils/ instead of agents/)
    const isUtility = flags.util || flags.utility;

    // Always use AI generation
    await createAgentWithAI(name, promptText, maxIterations, undefined, isUtility);
  } else if (command === "help" || command === "--help" || command === "-h") {
    displayHelp();
  } else {
    // No command or unknown command - start interactive mode
    await startInteractiveMode();
  }
}

function displayHelp(): void {
  console.log(colorize("\nERA CLI - AI-Powered Agent Factory\n", "cyan"));
  console.log(colorize("Usage:", "yellow"));
  console.log("  deno task cli                           # Interactive mode (recommended)");
  console.log('  deno task cli:create <name> -p "prompt" # Command line mode\n');
  console.log(colorize("Interactive Mode Features:", "yellow"));
  console.log("  • Streamlined UX - describe what you want first");
  console.log("  • AI-powered agent name suggestions using Llama-3.1-8B");
  console.log("  • Smart defaults - just press Enter to accept suggestions");
  console.log("  • 🆕 Interactive refinement - improve generated code with natural language\n");
  console.log(colorize("Commands:", "yellow"));
  console.log("  create <name>           Create a new agent or utility");
  console.log("  promote <name>          Promote agent to utility (AI generates examples.ts)");
  console.log("  help                    Show this help message\n");
  console.log(colorize("Options:", "yellow"));
  console.log("  -p, --prompt <text>     Agent prompt/instructions (required)");
  console.log("  -i, --iterations <N>    Max refinement iterations (default: 3)");
  console.log("  --util, --utility       Save to utils/ instead of agents/ (promotes to stdlib)\n");
  console.log(colorize("Examples:", "yellow"));
  console.log("  # Interactive mode (recommended) - with quick-start templates!");
  console.log("  deno task cli");
  console.log("  # → Choose from: FizzBuzz, Joke Generator, Web Search, AI Browser, Multi-Agent, or Custom\n");

  console.log(colorize("Quick Start:", "yellow"));
  console.log("  # Create FizzBuzz solver (simple demo)");
  console.log("  deno task start:fizzbuzz\n");
  console.log("  # Create joke-telling agent (WandbChat + Weave demo)");
  console.log("  deno task start:jokemeister\n");
  console.log("  # Create web search agent (Tavily demo)");
  console.log("  deno task start:tavily\n");
  console.log("  # Create AI web browser agent (Browserbase/Stagehand demo)");
  console.log("  deno task start:browserbase\n");
  console.log("  # Create multi-agent system (Mastra framework demo)");
  console.log("  deno task start:mastra\n");

  console.log(colorize("Custom Agent Creation:", "yellow"));
  console.log("  # AI-powered generation (default, 3 iterations)");
  console.log('  deno task cli:create calculator -p "Create a calculator that adds two numbers"\n');
  console.log("  # With custom iterations (refinement retries)");
  console.log('  deno task cli:create factorial -p "Calculate factorial" --iterations 5\n');
  console.log("  # Create as utility (saves to utils/ instead of agents/)");
  console.log('  deno task cli:create my-http-client -p "HTTP client utility" --util\n');

  console.log(colorize("Promotion:", "yellow"));
  console.log("  # Promote agent to utility (AI generates examples.ts)");
  console.log("  deno task cli:promote jokemeister           # Move to utils/ with AI-generated examples.ts");
  console.log("  deno task cli:promote jokemeister --dry-run # Preview what will be generated\n");
  console.log(colorize("About Iterations & Refinement:", "yellow"));
  console.log("  The FBI Director will retry code generation + execution up to N times.");
  console.log("  Each retry refines the prompt based on previous errors.");
  console.log("  After successful generation, you can interactively refine the code");
  console.log('  with natural language feedback (e.g., "add error handling", "make it faster").\n');
  console.log(colorize("File Organization:", "yellow"));
  console.log("  agents/<name>/");
  console.log("    ├── index.ts              # Latest/best version (run this)");
  console.log("    ├── agent.json            # Metadata with full history");
  console.log("    └── iterations/           # Timestamped snapshots of each attempt");
  console.log("          ├── iteration-1-[timestamp].ts");
  console.log("          └── iteration-2-[timestamp].ts\n");
  console.log(colorize("Requirements for AI generation:", "yellow"));
  console.log("  - WANDB_API_KEY in .env (for code generation & name suggestions)");
  console.log("  - DAYTONA_API_KEY in .env (for code validation)\n");
}

// ============================================================================
// Main Entry Point
// ============================================================================

if (import.meta.main) {
  const args = Deno.args;
  await handleCommandLine(args);
}
