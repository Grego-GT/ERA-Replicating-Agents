/**
 * Test: Agent Promotion System
 * 
 * This test demonstrates promoting agents to utils/ with AI-generated examples.ts
 * 
 * Run with: deno task test:promotion
 */

import "jsr:@std/dotenv/load";
import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';

console.log('🧪 Test: Agent Promotion System\n');
console.log('='.repeat(70));

console.log('\n📚 This test demonstrates:');
console.log('1. AI-powered generation of examples.ts from Deno code');
console.log('2. Dry-run mode to preview before promoting');
console.log('3. Safe promotion workflow (manual verification)\n');

console.log('='.repeat(70));

console.log('\n🎯 The Promotion Workflow:\n');

console.log('Step 1: Create an agent in agents/');
console.log('  deno task cli:create my-helper --prompt "useful helper functions"');
console.log('');

console.log('Step 2: Test it thoroughly');
console.log('  deno run --allow-all agents/my-helper/index.ts');
console.log('  # Make sure it works!');
console.log('');

console.log('Step 3: Preview promotion (dry-run)');
console.log('  deno task cli:promote my-helper --dry-run');
console.log('  # AI generates examples.ts, shows preview');
console.log('');

console.log('Step 4: Manual verification (SAFE APPROACH)');
console.log('  # Review the generated code from dry-run');
console.log('  # If it looks good, manually move:');
console.log('  mv agents/my-helper utils/my-helper');
console.log('  # Then create examples.ts manually or run promotion again');
console.log('');

console.log('Alternative Step 4: Auto-promote (if confident)');
console.log('  deno task cli:promote my-helper');
console.log('  # AI generates examples.ts and moves to utils/');
console.log('  # Review after: cat utils/my-helper/examples.ts');
console.log('');

console.log('Step 5: Verify registry discovers it');
console.log('  deno task test:registry');
console.log('');

console.log('='.repeat(70));

// Check existing agents that could be promoted
console.log('\n🔍 Agents Available for Promotion:\n');

const agentsDir = join(Deno.cwd(), 'agents');
if (await exists(agentsDir)) {
  const agents = [];
  for await (const entry of Deno.readDir(agentsDir)) {
    if (entry.isDirectory) {
      agents.push(entry.name);
    }
  }
  
  if (agents.length > 0) {
    for (const agent of agents) {
      const agentJsonPath = join(agentsDir, agent, 'agent.json');
      let description = 'No description';
      
      try {
        const json = JSON.parse(await Deno.readTextFile(agentJsonPath));
        description = json.agentDescription || 'No description';
      } catch {
        // ignore
      }
      
      console.log(`  • ${agent}: ${description}`);
      console.log(`    Preview: deno task cli:promote ${agent} --dry-run`);
      console.log(`    Promote: deno task cli:promote ${agent}`);
      console.log('');
    }
  } else {
    console.log('  ℹ️  No agents found in agents/ directory');
  }
} else {
  console.log('  ℹ️  agents/ directory not found');
}

console.log('='.repeat(70));

console.log('\n📋 What the AI Generates:\n');

console.log('The AI analyzes your Deno code and creates examples.ts with:');
console.log('');
console.log('1. **AGENT_NAME_NODE_UTIL** (string):');
console.log('   - Converts Deno imports to Node.js require()');
console.log('   - Adds proper TypeScript types');
console.log('   - Makes it injectable (standalone function)');
console.log('   - Handles errors with proper typing');
console.log('');
console.log('2. **AGENT_NAME_NPM_DEPS** (array):');
console.log('   - Lists all npm packages needed');
console.log('   - Example: [\'node-fetch@2\', \'lodash\']');
console.log('');
console.log('3. **AGENT_NAME_API_DOCS** (string):');
console.log('   - Function signature with TypeScript types');
console.log('   - Description of what it does');
console.log('   - Usage examples');
console.log('   - Important notes');

console.log('\n' + '='.repeat(70));

console.log('\n🛡️  Safety Features:\n');

console.log('1. **--dry-run**: Preview before making changes');
console.log('   Shows exactly what examples.ts will look like');
console.log('');

console.log('2. **Manual Review**: You control the promotion');
console.log('   Review AI-generated code before accepting');
console.log('');

console.log('3. **--force**: Overwrite if utility exists');
console.log('   Use when updating an existing utility');
console.log('');

console.log('4. **Git Safety**: Keep agents/ in git');
console.log('   Easy to rollback if something goes wrong');

console.log('\n' + '='.repeat(70));

console.log('\n💡 Best Practices:\n');

console.log('1. **Always dry-run first**:');
console.log('   deno task cli:promote my-agent --dry-run');
console.log('');

console.log('2. **Test before promoting**:');
console.log('   Make sure the agent works in agents/ first');
console.log('');

console.log('3. **Review AI output**:');
console.log('   Check that examples.ts looks correct');
console.log('   Verify npm dependencies are right');
console.log('');

console.log('4. **Keep agent.json**:');
console.log('   It has the full history and metadata');
console.log('   Useful for understanding the utility later');

console.log('\n' + '='.repeat(70));

console.log('\n📦 Example: Promoting jokemeister\n');

console.log('# Preview what will be generated');
console.log('deno task cli:promote jokemeister --dry-run');
console.log('');

console.log('# If it looks good, promote it');
console.log('deno task cli:promote jokemeister');
console.log('');

console.log('# Review the generated examples.ts');
console.log('cat utils/jokemeister/examples.ts');
console.log('');

console.log('# Verify registry discovers it');
console.log('deno task test:registry');

console.log('\n' + '='.repeat(70));
console.log('\n✅ Test complete!\n');

