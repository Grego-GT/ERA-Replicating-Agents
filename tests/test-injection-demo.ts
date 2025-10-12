/**
 * Test Injection Demo
 * 
 * Shows what code looks like after injection and tries to run it in Daytona
 */

import "jsr:@std/dotenv/load";
import { injectUtilities } from '../utils/registry/index.ts';
import { runCode } from '../utils/daytona/index.ts';

const simpleTestCode = `
(async () => {
  try {
    // Initialize weave
    await initWeave('test-agent');
    
    // Create traced operation
    const testOp = createTracedOp('test:operation', async (input: string) => {
      const response = await wandbChat(\`Echo this: \${input}\`);
      return {
        success: true,
        input,
        response,
        timestamp: new Date().toISOString()
      };
    });
    
    // Run it
    const result = await testOp("hello");
    console.log(JSON.stringify(result));
  } catch (error: unknown) {
    const err = error as Error;
    console.log(JSON.stringify({ success: false, error: err.message }));
  }
})();
`;

console.log('🧪 Test Injection Demo\n');
console.log('='.repeat(70));

console.log('\n📝 Original Code:');
console.log('---');
console.log(simpleTestCode);
console.log('---\n');

console.log('💉 Injecting wandb + weave utilities...\n');

const injectedCode = await injectUtilities(simpleTestCode, ['wandb', 'weave']);

console.log('✅ Injected Code:');
console.log('---');
console.log(injectedCode);
console.log('---\n');

console.log('📤 Executing in Daytona...\n');

try {
  const result = await runCode(injectedCode, 'typescript');
  
  console.log('✅ Execution Complete!');
  console.log('📊 Result:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Execution failed:');
  console.error(error);
}

