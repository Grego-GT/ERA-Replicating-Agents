/**
 * Dynamic Utility Registry
 * 
 * This module discovers and registers utilities (both built-in and generated agents)
 * so they can be injected into newly generated code.
 * 
 * The key insight: Generated agents ARE utilities that can be used by other agents!
 * 
 * Registry Structure:
 * - Built-in utils: wandb, weave (in utils/)
 * - Generated agents: Any agent in agents/ directory
 */

import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Utility registration entry
 */
export interface UtilityEntry {
  /** Unique name/identifier */
  name: string;
  
  /** Type: built-in utility or generated agent */
  type: 'builtin' | 'agent';
  
  /** Description of what this utility does */
  description: string;
  
  /** Node.js utility code (as string template) */
  nodeUtil: string;
  
  /** NPM dependencies required */
  npmDeps: string[];
  
  /** API documentation for teaching AI */
  apiDocs: string;
  
  /** Path to source (for reference) */
  sourcePath?: string;
  
  /** Original prompt (for agents) */
  originalPrompt?: string;
}

/**
 * Complete registry of all available utilities
 */
export interface UtilityRegistry {
  builtins: Map<string, UtilityEntry>;
  agents: Map<string, UtilityEntry>;
}

// ============================================================================
// Built-in Utilities
// ============================================================================

/**
 * Load built-in utilities (wandb, weave) from their examples.ts files
 */
async function loadBuiltinUtilities(): Promise<Map<string, UtilityEntry>> {
  const builtins = new Map<string, UtilityEntry>();
  
  try {
    // Load wandb utility
    const { WANDB_NODE_UTIL, WANDB_NPM_DEPS, WANDB_API_DOCS } = await import('../wandb/examples.ts');
    builtins.set('wandb', {
      name: 'wandb',
      type: 'builtin',
      description: 'LLM inference via Wandb API - make AI calls from generated code',
      nodeUtil: WANDB_NODE_UTIL,
      npmDeps: WANDB_NPM_DEPS,
      apiDocs: WANDB_API_DOCS,
      sourcePath: 'utils/wandb/examples.ts'
    });
  } catch (error) {
    console.warn('Failed to load wandb utility:', error);
  }
  
  try {
    // Load weave utility
    const { WEAVE_NODE_UTIL, WEAVE_NPM_DEPS, WEAVE_API_DOCS } = await import('../weave/examples.ts');
    builtins.set('weave', {
      name: 'weave',
      type: 'builtin',
      description: 'Observability and tracing for generated code',
      nodeUtil: WEAVE_NODE_UTIL,
      npmDeps: WEAVE_NPM_DEPS,
      apiDocs: WEAVE_API_DOCS,
      sourcePath: 'utils/weave/examples.ts'
    });
  } catch (error) {
    console.warn('Failed to load weave utility:', error);
  }
  
  try {
    // Load tavily utility
    const { TAVILY_NODE_UTIL, TAVILY_NPM_DEPS, TAVILY_API_DOCS } = await import('../tavily/examples.ts');
    builtins.set('tavily', {
      name: 'tavily',
      type: 'builtin',
      description: 'AI-powered web search with real-time results',
      nodeUtil: TAVILY_NODE_UTIL,
      npmDeps: TAVILY_NPM_DEPS,
      apiDocs: TAVILY_API_DOCS,
      sourcePath: 'utils/tavily/examples.ts'
    });
  } catch (error) {
    console.warn('Failed to load tavily utility:', error);
  }
  
  try {
    // Load browserbase utility
    const { STAGEHAND_NODE_UTIL, STAGEHAND_NPM_DEPS, STAGEHAND_API_DOCS } = await import('../browserbase/examples.ts');
    builtins.set('browserbase', {
      name: 'browserbase',
      type: 'builtin',
      description: 'AI-powered web browsing with Stagehand and Playwright',
      nodeUtil: STAGEHAND_NODE_UTIL,
      npmDeps: STAGEHAND_NPM_DEPS,
      apiDocs: STAGEHAND_API_DOCS,
      sourcePath: 'utils/browserbase/examples.ts'
    });
  } catch (error) {
    console.warn('Failed to load browserbase utility:', error);
  }
  
  try {
    // Load mastra utility
    const { MASTRA_NODE_UTIL, MASTRA_NPM_DEPS, MASTRA_API_DOCS } = await import('../mastra/examples.ts');
    builtins.set('mastra', {
      name: 'mastra',
      type: 'builtin',
      description: 'TypeScript agent framework with agents, workflows, RAG, and evals',
      nodeUtil: MASTRA_NODE_UTIL,
      npmDeps: MASTRA_NPM_DEPS,
      apiDocs: MASTRA_API_DOCS,
      sourcePath: 'utils/mastra/examples.ts'
    });
  } catch (error) {
    console.warn('Failed to load mastra utility:', error);
  }

  return builtins;
}

// ============================================================================
// Generated Agent Discovery
// ============================================================================

/**
 * Agent metadata from agent.json
 */
interface AgentMetadata {
  agentName: string;
  agentDescription?: string;
  ogprompt: string;
  finalCode: string;
  attempts?: Array<{
    execution?: {
      success: boolean;
    };
  }>;
}

/**
 * Extract function signatures from TypeScript code
 */
function extractFunctionSignatures(code: string): string[] {
  const signatures: string[] = [];
  
  // Match function declarations with JSDoc
  const functionRegex = /\/\*\*[\s\S]*?\*\/\s*function\s+(\w+)\s*\([^)]*\):\s*[^{]+/g;
  let match;
  
  while ((match = functionRegex.exec(code)) !== null) {
    signatures.push(match[0].trim());
  }
  
  return signatures;
}

/**
 * Convert agent code to injectable utility format
 */
function agentToUtility(agent: AgentMetadata): UtilityEntry {
  const functionSignatures = extractFunctionSignatures(agent.finalCode);
  
  // Generate API docs from function signatures
  const apiDocs = `
### Available Agent: ${agent.agentName}

${agent.agentDescription || 'Generated agent utility'}

**Original Purpose**: ${agent.ogprompt}

**Functions Available**:
\`\`\`typescript
${functionSignatures.slice(0, 3).join('\n\n')}
${functionSignatures.length > 3 ? `\n// ... and ${functionSignatures.length - 3} more functions` : ''}
\`\`\`

**Usage**:
\`\`\`javascript
// The agent's functions are already defined and ready to use
// Just call them directly in your code
\`\`\`

**Note**: This is a generated agent that can be reused as a utility.
`.trim();

  return {
    name: agent.agentName,
    type: 'agent',
    description: agent.agentDescription || agent.ogprompt,
    nodeUtil: `// === Generated Agent: ${agent.agentName} ===\n${agent.finalCode}\n// === End Agent ===`,
    npmDeps: [], // Agents don't have external deps (yet)
    apiDocs,
    sourcePath: `agents/${agent.agentName}/agent.json`,
    originalPrompt: agent.ogprompt
  };
}

/**
 * Discover all generated agents in agents/ directory
 */
async function discoverGeneratedAgents(): Promise<Map<string, UtilityEntry>> {
  const agents = new Map<string, UtilityEntry>();
  const agentsDir = join(Deno.cwd(), 'agents');
  
  if (!(await exists(agentsDir))) {
    return agents;
  }
  
  try {
    for await (const entry of Deno.readDir(agentsDir)) {
      if (!entry.isDirectory) continue;
      
      const agentJsonPath = join(agentsDir, entry.name, 'agent.json');
      
      if (await exists(agentJsonPath)) {
        try {
          const jsonContent = await Deno.readTextFile(agentJsonPath);
          const metadata: AgentMetadata = JSON.parse(jsonContent);
          
          // Only register agents that have successful execution
          const hasSuccess = metadata.attempts?.some(a => a.execution?.success);
          if (hasSuccess && metadata.finalCode) {
            const utilityEntry = agentToUtility(metadata);
            agents.set(metadata.agentName, utilityEntry);
          }
        } catch (error) {
          console.warn(`Failed to load agent ${entry.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to discover agents:', error);
  }
  
  return agents;
}

// ============================================================================
// Registry Management
// ============================================================================

let cachedRegistry: UtilityRegistry | null = null;

/**
 * Build or retrieve the complete utility registry
 * 
 * @param forceRefresh - Force rebuild the registry (discovers new agents)
 * @returns Complete registry of all utilities
 */
export async function getUtilityRegistry(forceRefresh = false): Promise<UtilityRegistry> {
  if (cachedRegistry && !forceRefresh) {
    return cachedRegistry;
  }
  
  const builtins = await loadBuiltinUtilities();
  const agents = await discoverGeneratedAgents();
  
  cachedRegistry = { builtins, agents };
  
  return cachedRegistry;
}

/**
 * Get a specific utility by name
 */
export async function getUtility(name: string): Promise<UtilityEntry | null> {
  const registry = await getUtilityRegistry();
  return registry.builtins.get(name) || registry.agents.get(name) || null;
}

/**
 * Generate system prompt section with all available utilities
 * 
 * @param includeAgents - Whether to include generated agents (default: true)
 * @returns Formatted string for system prompt
 */
export async function generateUtilityPrompt(includeAgents = true): Promise<string> {
  const registry = await getUtilityRegistry();
  
  let prompt = `
## Available Utilities

You have access to pre-loaded utility functions. These are already defined - just use them!

### Built-in Utilities
`;

  // Add built-in utilities
  for (const [name, util] of registry.builtins) {
    prompt += `\n${util.apiDocs}\n`;
  }
  
  // Optionally add generated agents
  if (includeAgents && registry.agents.size > 0) {
    prompt += `\n### Generated Agent Utilities\n`;
    prompt += `\nThese are agents that were previously generated and can now be reused:\n`;
    
    for (const [name, agent] of registry.agents) {
      prompt += `\n#### ${name}\n`;
      prompt += `${agent.description}\n`;
      prompt += `\n${agent.apiDocs}\n`;
    }
  }
  
  return prompt.trim();
}

/**
 * Inject multiple utilities into user code
 * 
 * @param userCode - The code generated by AI
 * @param utilityNames - Names of utilities to inject (default: ['wandb', 'weave'])
 * @returns Complete code with all utilities injected
 */
export async function injectUtilities(
  userCode: string,
  utilityNames: string[] = ['wandb', 'weave']
): Promise<string> {
  const registry = await getUtilityRegistry();
  
  // Collect all utilities
  const utilities: UtilityEntry[] = [];
  const allDeps = new Set<string>();
  
  for (const name of utilityNames) {
    const util = registry.builtins.get(name) || registry.agents.get(name);
    if (util) {
      utilities.push(util);
      util.npmDeps.forEach(dep => allDeps.add(dep));
    }
  }
  
  if (utilities.length === 0) {
    return userCode;
  }
  
  // Build combined injection
  const depsInstall = allDeps.size > 0 
    ? `execSync('npm install ${Array.from(allDeps).join(' ')}', { stdio: 'pipe' });` 
    : '';
  
  const utilityCode = utilities.map(u => u.nodeUtil).join('\n\n');
  
  return `
(async () => {
  const { execSync } = require('child_process');
  
  // Install dependencies
  ${depsInstall}
  
  ${utilityCode}
  
  // === User's Generated Code ===
  ${userCode}
  // === End User Code ===
})();
`.trim();
}

/**
 * List all available utilities
 */
export async function listUtilities(): Promise<void> {
  const registry = await getUtilityRegistry();
  
  console.log('\n📚 Available Utilities Registry\n');
  console.log('='.repeat(70));
  
  console.log('\n🔧 Built-in Utilities:\n');
  for (const [name, util] of registry.builtins) {
    console.log(`  • ${name}: ${util.description}`);
    console.log(`    Dependencies: ${util.npmDeps.join(', ') || 'none'}`);
  }
  
  console.log('\n🤖 Generated Agent Utilities:\n');
  if (registry.agents.size === 0) {
    console.log('  (No agents registered yet)');
  } else {
    for (const [name, agent] of registry.agents) {
      console.log(`  • ${name}: ${agent.description}`);
      console.log(`    Original prompt: "${agent.originalPrompt}"`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`Total: ${registry.builtins.size} built-ins + ${registry.agents.size} agents\n`);
}

// ============================================================================
// CLI Test
// ============================================================================

if (import.meta.main) {
  console.log('🔍 Testing Utility Registry\n');
  
  await listUtilities();
  
  console.log('\n📋 Generating system prompt preview:\n');
  const prompt = await generateUtilityPrompt(true);
  console.log(prompt.substring(0, 1000) + '...\n');
  
  console.log('✅ Registry test complete!\n');
}

