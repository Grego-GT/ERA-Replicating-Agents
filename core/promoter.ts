/**
 * Agent Promotion System
 * 
 * Promotes agents from agents/ to utils/ with AI-generated examples.ts
 * 
 * The Promoter:
 * 1. Analyzes existing agent code (Deno version)
 * 2. Uses AI to generate Node.js compatible version
 * 3. Uses AI to generate API documentation
 * 4. Creates examples.ts with proper format
 * 5. Moves agent to utils/
 * 6. Makes it discoverable by registry
 */

import "jsr:@std/dotenv/load";
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { chat } from '../utils/wandb/index.ts';
import * as weave from '../utils/weave/index.ts';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PromoteOptions {
  agentName: string;
  dryRun?: boolean;  // Preview changes without applying
  force?: boolean;   // Overwrite if utility already exists
}

export interface PromoteResult {
  success: boolean;
  agentName: string;
  originalPath: string;
  newPath: string;
  examplesGenerated: boolean;
  examplesPath?: string;
  error?: string;
}

// ============================================================================
// System Prompts
// ============================================================================

const EXAMPLES_GENERATION_PROMPT = `You are a code conversion expert. Your task is to convert Deno/TypeScript code into Node.js injectable utility code.

Given agent code that runs in Deno, you need to create an examples.ts file that:

1. **NODE_UTIL**: Extract core logic into a self-contained Node.js function
   - Remove Deno-specific imports
   - Use require() for Node.js packages
   - Add proper TypeScript types (explicit parameters and return types)
   - Make it injectable (standalone function that can be prepended to code)
   - Handle errors with proper TypeScript error typing (error: unknown, then cast)

2. **NPM_DEPS**: List all npm packages needed (as array of strings)
   - Use specific versions if needed (e.g., 'node-fetch@2')
   - Include all dependencies the function uses

3. **API_DOCS**: Write clear documentation for AI consumers
   - Function signature with TypeScript types
   - Description of what it does
   - Usage examples
   - Important notes (especially about TypeScript typing!)

## Example Input (Deno Agent Code):
\`\`\`typescript
import { serve } from "https://deno.land/std/http/server.ts";

async function fetchJoke(topic: string) {
  const response = await fetch(\`https://api.jokes.com/\${topic}\`);
  return await response.json();
}

console.log(await fetchJoke("programming"));
\`\`\`

## Example Output (examples.ts format):

Return ONLY valid TypeScript code for examples.ts:

\`\`\`typescript
export const AGENT_NAME_NODE_UTIL = \\\`
// === AgentName Utility (Auto-injected) ===
async function fetchJoke(topic: string): Promise<any> {
  const fetch = require('node-fetch');
  const response = await fetch(\\\`https://api.jokes.com/\\\${topic}\\\`);
  return await response.json();
}
// === End AgentName Utility ===
\\\`.trim();

export const AGENT_NAME_NPM_DEPS = ['node-fetch@2'];

export const AGENT_NAME_API_DOCS = \\\`
### Available Utility: fetchJoke()

Fetches jokes from an API about a given topic.

**Function Signature:**
\\\\\`\\\\\`typescript
async function fetchJoke(topic: string): Promise<any>
\\\\\`\\\\\`

**Usage Example:**
\\\\\`\\\\\`typescript
const joke = await fetchJoke('programming');
console.log(joke);
\\\\\`\\\\\`

**Important:**
- Add explicit types to all parameters: \\\\\`topic: string\\\\\`
- Requires node-fetch@2 to be installed
\\\`.trim();
\`\`\`

## Critical Requirements:
- Use template literals with backticks for multi-line strings
- Escape nested backticks properly (\\\`)
- Add explicit TypeScript types to ALL function parameters
- Use "error: unknown" then cast with "as Error" for error handling
- The NODE_UTIL should be standalone (no external imports)
- NPM_DEPS should list all required packages

Return ONLY the examples.ts code, no explanation.`;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Promote an agent to utility with AI-generated examples.ts
 */
export async function promoteAgent(options: PromoteOptions): Promise<PromoteResult> {
  const { agentName, dryRun = false, force = false } = options;

  console.log(`\n🚀 Promoting agent: ${agentName}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE'}\n`);

  // Paths
  const agentPath = join(Deno.cwd(), 'agents', agentName);
  const utilPath = join(Deno.cwd(), 'utils', agentName);
  const agentIndexPath = join(agentPath, 'index.ts');
  const agentJsonPath = join(agentPath, 'agent.json');

  // 1. Verify agent exists
  if (!await exists(agentPath)) {
    return {
      success: false,
      agentName,
      originalPath: agentPath,
      newPath: utilPath,
      examplesGenerated: false,
      error: `Agent not found: agents/${agentName}`
    };
  }

  // 2. Check if utility already exists
  if (await exists(utilPath) && !force) {
    return {
      success: false,
      agentName,
      originalPath: agentPath,
      newPath: utilPath,
      examplesGenerated: false,
      error: `Utility already exists: utils/${agentName} (use --force to overwrite)`
    };
  }

  // 3. Read agent code and metadata
  console.log('📖 Reading agent code...');
  const agentCode = await Deno.readTextFile(agentIndexPath);
  
  let agentDescription = '';
  try {
    const agentJson = JSON.parse(await Deno.readTextFile(agentJsonPath));
    agentDescription = agentJson.agentDescription || '';
  } catch {
    console.log('   ⚠️  Could not read agent description');
  }

  // 4. Generate examples.ts with AI
  console.log('🤖 Generating examples.ts with AI...\n');
  
  const userPrompt = `
Agent Name: ${agentName}
Description: ${agentDescription}

Agent Code (Deno):
\`\`\`typescript
${agentCode}
\`\`\`

Generate the examples.ts file following the format specified in the system prompt.
`;

  try {
    const response = await chat({
      model: Deno.env.get('AI_MODEL') || "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      systemPrompt: EXAMPLES_GENERATION_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      component: 'promoter'  // Use component-specific URL if configured
    });

    console.log('✅ examples.ts generated!\n');
    
    if (dryRun) {
      console.log('📄 Generated examples.ts (preview):');
      console.log('─'.repeat(60));
      console.log(response.choices[0].message.content);
      console.log('─'.repeat(60));
      
      return {
        success: true,
        agentName,
        originalPath: agentPath,
        newPath: utilPath,
        examplesGenerated: true,
        examplesPath: join(utilPath, 'examples.ts')
      };
    }

    // 5. Move agent to utils/
    console.log(`📦 Moving to utils/${agentName}...`);
    
    // Create utils dir if needed
    const utilsDir = join(Deno.cwd(), 'utils');
    if (!await exists(utilsDir)) {
      await Deno.mkdir(utilsDir, { recursive: true });
    }

    // Remove existing util if force mode
    if (await exists(utilPath) && force) {
      await Deno.remove(utilPath, { recursive: true });
    }

    // Move directory
    await Deno.rename(agentPath, utilPath);

    // 6. Write examples.ts
    console.log('📝 Writing examples.ts...');
    const examplesPath = join(utilPath, 'examples.ts');
    await Deno.writeTextFile(examplesPath, response.choices[0].message.content);

    console.log(`\n✅ Promotion complete!`);
    console.log(`   From: agents/${agentName}`);
    console.log(`   To:   utils/${agentName}`);
    console.log(`   Added: examples.ts (AI-generated)\n`);

    return {
      success: true,
      agentName,
      originalPath: agentPath,
      newPath: utilPath,
      examplesGenerated: true,
      examplesPath
    };

  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      agentName,
      originalPath: agentPath,
      newPath: utilPath,
      examplesGenerated: false,
      error: `Failed to generate examples.ts: ${err.message}`
    };
  }
}

// ============================================================================
// CLI Support
// ============================================================================

if (import.meta.main) {
  const args = Deno.args;
  
  if (args.length === 0) {
    console.log('Usage: deno run --allow-all core/promoter.ts <agent-name> [--dry-run] [--force]');
    Deno.exit(1);
  }

  const agentName = args[0];
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  const result = await promoteAgent({ agentName, dryRun, force });

  if (!result.success) {
    console.error(`\n❌ Promotion failed: ${result.error}`);
    Deno.exit(1);
  }

  if (!dryRun) {
    console.log('💡 Next steps:');
    console.log(`   1. Review: cat utils/${agentName}/examples.ts`);
    console.log(`   2. Test: deno task test:registry`);
    console.log(`   3. Use in agents: The utility is now discoverable!\n`);
  }
}

