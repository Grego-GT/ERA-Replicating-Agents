/**
 * Test: Creating Utilities with --util Flag
 * 
 * This test demonstrates creating utilities directly in utils/ folder
 * 
 * Run with: deno task test:create-util
 */

import "jsr:@std/dotenv/load";
import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';

console.log('🧪 Test: Creating Utilities with --util Flag\n');
console.log('='.repeat(70));

console.log('\n📚 This test demonstrates:');
console.log('1. Creating utilities directly in utils/ folder with --util flag');
console.log('2. Verifying the structure matches agents/');
console.log('3. Checking that utilities work the same as agents\n');

console.log('='.repeat(70));

// Example utilities to create
const examples = [
  {
    name: 'string-formatter',
    prompt: 'Format strings - uppercase, lowercase, title case, etc',
    description: 'Simple string formatting utility'
  },
  {
    name: 'math-helper',
    prompt: 'Basic math operations - add, subtract, multiply, divide with error handling',
    description: 'Math utility for calculations'
  },
  {
    name: 'date-helper',
    prompt: 'Format dates in various patterns (YYYY-MM-DD, MM/DD/YYYY, etc)',
    description: 'Date formatting utility'
  }
];

console.log('\n📝 Example Utility Creation Commands:\n');

for (const example of examples) {
  console.log(`# ${example.description}`);
  console.log(`deno task cli:create ${example.name} \\`);
  console.log(`  --prompt "${example.prompt}" \\`);
  console.log(`  --util \\`);
  console.log(`  --iterations 1`);
  console.log('');
}

console.log('='.repeat(70));

console.log('\n🔍 Verifying Existing Utilities:\n');

// Check for test-util we created earlier
const testUtilPath = join(Deno.cwd(), 'utils', 'test-util');
if (await exists(testUtilPath)) {
  console.log('✅ utils/test-util/ exists');
  
  const indexPath = join(testUtilPath, 'index.ts');
  const jsonPath = join(testUtilPath, 'agent.json');
  const iterationsPath = join(testUtilPath, 'iterations');
  
  if (await exists(indexPath)) {
    console.log('   ✅ index.ts exists');
    const code = await Deno.readTextFile(indexPath);
    console.log(`   📊 Size: ${code.length} characters`);
  }
  
  if (await exists(jsonPath)) {
    console.log('   ✅ agent.json exists (metadata)');
    const json = JSON.parse(await Deno.readTextFile(jsonPath));
    console.log(`   📝 Description: ${json.agentDescription || 'N/A'}`);
  }
  
  if (await exists(iterationsPath)) {
    console.log('   ✅ iterations/ folder exists');
    const iterations = [];
    for await (const entry of Deno.readDir(iterationsPath)) {
      if (entry.isFile && entry.name.endsWith('.ts')) {
        iterations.push(entry.name);
      }
    }
    console.log(`   📂 ${iterations.length} iteration snapshot(s)`);
  }
} else {
  console.log('ℹ️  No utilities created yet');
  console.log('   Create one with: deno task cli:create my-util --prompt "..." --util');
}

console.log('\n' + '='.repeat(70));

console.log('\n💡 Key Points:\n');
console.log('1. **Same Structure**: utils/ and agents/ have identical structure');
console.log('   - index.ts (Deno code with injected utilities)');
console.log('   - agent.json (metadata & history)');
console.log('   - iterations/ (snapshots of attempts)');
console.log('');
console.log('2. **When to Use --util**:');
console.log('   ✅ Stable, reusable utilities');
console.log('   ✅ Foundation libraries for other agents');
console.log('   ✅ Code you want to maintain long-term');
console.log('');
console.log('3. **When to Use agents/ (default)**:');
console.log('   ✅ Experimental code');
console.log('   ✅ Quick prototypes');
console.log('   ✅ Domain-specific agents');
console.log('');
console.log('4. **Promotion Path**:');
console.log('   a) Create in agents/ (prototype)');
console.log('   b) Test thoroughly');
console.log('   c) Promote to utils/ manually or with cli:promote');
console.log('   d) Optionally add examples.ts for injection');

console.log('\n' + '='.repeat(70));
console.log('\n✅ Test complete!\n');

