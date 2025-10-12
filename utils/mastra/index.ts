/**
 * Mastra Agent Framework Utility - Deno Version
 * 
 * This is the local Deno-compatible version for use in ERA's core codebase.
 * For Node.js injection into generated agents, see examples.ts
 */

import "jsr:@std/dotenv/load"; // Load .env for Deno

export interface MastraAgentOptions {
  name?: string;
  model?: string;
  instructions?: string;
  tools?: any[];
  memory?: boolean;
}

export interface MastraWorkflowOptions {
  name?: string;
  steps?: any[];
}

/**
 * Note: This is a placeholder for Deno environments.
 * Mastra is primarily a Node.js/TypeScript framework.
 * For full functionality, use the Node.js version in examples.ts
 */
export async function createMastraAgent(options: MastraAgentOptions = {}) {
  console.warn('⚠️  Mastra is a Node.js/TypeScript framework. Use the Node.js version for full functionality.');
  
  return {
    name: options.name || 'default-agent',
    model: options.model || 'gpt-4',
    notice: 'Mastra is a Node.js framework. Please use examples.ts for injection into agents.'
  };
}

// ============================================================================
// Test runner (if this file is executed directly)
// ============================================================================

if (import.meta.main) {
  console.log('🤖 Mastra Agent Framework Utility (Deno)\n');
  console.log('⚠️  Note: Mastra is a Node.js/TypeScript framework.');
  console.log('    This Deno version is a placeholder for documentation.');
  console.log('    Use the Node.js injection code in examples.ts for agents.\n');
  
  try {
    const agent = await createMastraAgent({
      name: 'test-agent',
      model: 'gpt-4',
      instructions: 'You are a helpful assistant'
    });
    
    console.log('✅ Configuration example:');
    console.log('   Agent Name:', agent.name);
    console.log('   Model:', agent.model);
    console.log('\n📚 For full examples, see: utils/mastra/examples.ts');
    console.log('💡 Get started: https://docs.mastra.ai/');
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    console.error('\n💡 Visit https://docs.mastra.ai/ for documentation');
  }
}

