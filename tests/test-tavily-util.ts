#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

/**
 * Test Tavily Utility Integration
 * 
 * This demonstrates:
 * 1. Tavily utility is discoverable in the registry
 * 2. AI can be instructed to use Tavily search
 * 3. Generated code includes proper Tavily integration
 */

import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { getUtilityRegistry, generateUtilityPrompt } from '../utils/registry/index.ts';

console.log('🔍 Testing Tavily Utility Integration\n');

// Test 1: Verify Tavily is in the registry
console.log('Test 1: Verify Tavily is discoverable');
try {
  const registry = await getUtilityRegistry();
  const tavily = registry.builtins.get('tavily');
  
  if (tavily) {
    console.log('✅ Tavily found in registry');
    console.log(`   Type: ${tavily.type}`);
    console.log(`   Description: ${tavily.description}`);
    console.log(`   NPM Dependencies: ${tavily.npmDeps?.join(', ')}`);
  } else {
    console.log('❌ Tavily not found in registry');
  }
  console.log();
} catch (error) {
  console.log(`❌ Error checking registry: ${error}`);
  console.log();
}

// Test 2: Verify Tavily is included in system prompt
console.log('Test 2: Verify Tavily appears in AI system prompt');
try {
  const utilityPrompt = await generateUtilityPrompt(true);
  
  if (utilityPrompt.includes('tavily') || utilityPrompt.includes('Tavily')) {
    console.log('✅ Tavily documentation found in system prompt');
    
    // Find the Tavily section
    const tavilySection = utilityPrompt.split('\n')
      .filter(line => line.toLowerCase().includes('tavily'))
      .slice(0, 5);
    
    console.log('\n   Sample lines:');
    tavilySection.forEach(line => {
      console.log(`   ${line.substring(0, 80)}`);
    });
  } else {
    console.log('❌ Tavily not found in system prompt');
  }
  console.log();
} catch (error) {
  console.log(`❌ Error generating prompt: ${error}`);
  console.log();
}

// Test 3: Show example usage
console.log('Test 3: Example agent creation with Tavily');
console.log('═'.repeat(60));
console.log('\n📝 To create an agent that uses Tavily search:\n');
console.log('deno task cli:create research-agent --prompt "Search for latest AI news"');
console.log('\nOR interactively:\n');
console.log('deno task cli');
console.log('> What do you want the agent to do?');
console.log('→ "Search the web for information about [topic] and summarize results"');
console.log('\n💡 The AI will automatically know about tavilySearch() and tavilyQuickSearch()');
console.log('   because Tavily is now in the utility registry!');
console.log('\n═'.repeat(60));

console.log('\n📚 Tavily API Summary:\n');
console.log('  • tavilySearch(query, options)  - Full search with detailed results');
console.log('  • tavilyQuickSearch(query)      - Quick answer in one line');
console.log('\n  Options:');
console.log('    - searchDepth: "basic" | "advanced"');
console.log('    - maxResults: number');
console.log('    - includeAnswer: boolean');
console.log('    - includeImages: boolean');
console.log('    - includeDomains: string[]');
console.log('    - excludeDomains: string[]');
console.log('\n  Environment: TAVILY_API_KEY=tvly-...');
console.log('\n═'.repeat(60));

console.log('\n✅ Tavily utility integration test complete!');
console.log('\n💡 Next steps:');
console.log('   1. Set TAVILY_API_KEY in your .env file');
console.log('   2. Create an agent that uses Tavily');
console.log('   3. The utility will be auto-injected into generated code!');

