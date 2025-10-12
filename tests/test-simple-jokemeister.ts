/**
 * Simple Jokemeister Test
 * 
 * Simpler version that just tests if we can create jokemeister properly
 * using the actual CLI flow.
 * 
 * Run with: deno task test:jokemeister
 */

import "jsr:@std/dotenv/load";
import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';

console.log('🧪 Simple Jokemeister Creation Test\n');
console.log('='.repeat(70));

// This test will:
// 1. Use the actual CLI to create jokemeister
// 2. Verify the agent folder is created
// 3. Check that the code includes utilities
// 4. Test that registry can discover it

console.log('\n📌 Creating jokemeister agent via CLI...\n');
console.log('Command: deno task cli:create jokemeister --prompt "tell jokes about a topic"\n');
console.log('This will use FBI + Director with utility awareness!\n');
console.log('='.repeat(70));

// Check what gets created
console.log('\n📋 After running the command above, verify:\n');
console.log('1. ✅ agents/jokemeister/ directory exists');
console.log('2. ✅ agents/jokemeister/index.ts has code');
console.log('3. ✅ agents/jokemeister/agent.json has metadata');
console.log('4. ✅ Code uses wandbChat() and weave tracing');
console.log('5. ✅ Registry discovers it: deno task test:registry');

console.log('\n💡 To test manually:\n');
console.log('Step 1: Create agent');
console.log('  deno task cli:create jokemeister --prompt "Create a joke-telling agent that uses wandbChat to generate jokes about a topic and uses weave tracing with operation name jokemeister:tell_joke"');
console.log('');
console.log('Step 2: Check it was created');
console.log('  ls -la agents/jokemeister/');
console.log('');
console.log('Step 3: Check registry discovered it');
console.log('  deno task test:registry');
console.log('');
console.log('Step 4: Run the agent');
console.log('  deno run --allow-all agents/jokemeister/index.ts');
console.log('');

// Automated check
console.log('\n🔍 Automated Check:\n');

const jokemeisterPath = join(Deno.cwd(), 'agents', 'jokemeister');
const indexPath = join(jokemeisterPath, 'index.ts');
const jsonPath = join(jokemeisterPath, 'agent.json');

if (await exists(jokemeisterPath)) {
  console.log('✅ agents/jokemeister/ exists');
  
  if (await exists(indexPath)) {
    console.log('✅ agents/jokemeister/index.ts exists');
    const code = await Deno.readTextFile(indexPath);
    
    if (code.includes('wandbChat')) {
      console.log('✅ Code includes wandbChat utility');
    } else {
      console.log('❌ Code does NOT include wandbChat - utilities not injected');
    }
    
    if (code.includes('weave')) {
      console.log('✅ Code includes weave tracing');
    } else {
      console.log('⚠️  Code does not include weave tracing');
    }
    
    if (code.includes('jokemeister:')) {
      console.log('✅ Code uses namespaced weave operations');
    } else {
      console.log('⚠️  Code does not use namespaced operations');
    }
  } else {
    console.log('❌ agents/jokemeister/index.ts NOT found');
  }
  
  if (await exists(jsonPath)) {
    console.log('✅ agents/jokemeister/agent.json exists');
    const json = await Deno.readTextFile(jsonPath);
    const metadata = JSON.parse(json);
    console.log(`   Description: ${metadata.agentDescription || 'N/A'}`);
    console.log(`   Original prompt: "${metadata.ogprompt}"`);
  } else {
    console.log('❌ agents/jokemeister/agent.json NOT found');
  }
  
} else {
  console.log('❌ agents/jokemeister/ does NOT exist yet');
  console.log('\n💡 Run the CLI command first:');
  console.log('   deno task cli:create jokemeister --prompt "tell jokes with wandbChat and weave"');
}

console.log('\n' + '='.repeat(70));
console.log('\n📝 Summary:\n');
console.log('This test checks if the jokemeister agent was created properly.');
console.log('If it doesn\'t exist yet, create it with the CLI command above.');
console.log('\nThe key test is: Does the generated code USE the utilities');
console.log('instead of trying to mock or reimplement them?');
console.log('\nWith the Director update, it should now tell the code generator');
console.log('about available utilities (wandb, weave, existing agents).\n');

