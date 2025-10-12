/**
 * Browserbase/Stagehand Utility - Deno Version
 * 
 * This is the local Deno-compatible version for use in ERA's core codebase.
 * For Node.js injection into generated agents, see examples.ts
 */

import "jsr:@std/dotenv/load"; // Load .env for Deno

export interface StagehandOptions {
  apiKey?: string;
  projectId?: string;
  modelName?: 'gpt-4o' | 'claude-3-5-sonnet-latest';
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

export interface ExtractSchema {
  instruction: string;
  schema: any; // Zod schema object
}

export interface ObserveResult {
  action: string;
  selector?: string;
  description: string;
}

/**
 * Note: This is a placeholder for Deno environments.
 * Stagehand is primarily a Node.js library using Playwright.
 * For full functionality, use the Node.js version in examples.ts
 */
export async function createStagehandSession(options: StagehandOptions = {}) {
  const apiKey = options.apiKey || Deno.env.get('BROWSERBASE_API_KEY');
  const projectId = options.projectId || Deno.env.get('BROWSERBASE_PROJECT_ID');
  
  if (!apiKey || !projectId) {
    throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required');
  }

  console.warn('⚠️  Stagehand requires Node.js and Playwright. Use the Node.js version for full functionality.');
  
  return {
    apiKey,
    projectId,
    notice: 'Stagehand is a Node.js library. Please use examples.ts for injection into agents.'
  };
}

// ============================================================================
// Test runner (if this file is executed directly)
// ============================================================================

if (import.meta.main) {
  console.log('🌐 Browserbase/Stagehand Utility (Deno)\n');
  console.log('⚠️  Note: Stagehand is a Node.js library using Playwright.');
  console.log('    This Deno version is a placeholder for documentation.');
  console.log('    Use the Node.js injection code in examples.ts for agents.\n');
  
  try {
    const session = await createStagehandSession();
    console.log('✅ Configuration loaded:');
    console.log('   API Key:', session.apiKey ? '✓ Set' : '✗ Missing');
    console.log('   Project ID:', session.projectId ? '✓ Set' : '✗ Missing');
    console.log('\n📚 For full examples, see: utils/browserbase/examples.ts');
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    console.error('\n💡 Make sure BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are set in .env');
    console.error('💡 Get your credentials from: https://www.browserbase.com/overview');
  }
}

