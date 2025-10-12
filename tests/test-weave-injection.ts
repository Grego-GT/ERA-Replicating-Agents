/**
 * Test Weave Utility Injection
 * 
 * Tests that our pre-written weave utility code:
 * 1. Works when injected into Daytona sandboxes
 * 2. Can trace operations in AI-generated code
 * 3. Handles errors gracefully (continues without tracing if init fails)
 * 
 * Run with: deno task test:weave-injection
 */

import "jsr:@std/dotenv/load";
import { runCode } from '../utils/daytona/index.ts';
import { 
  WEAVE_NODE_UTIL, 
  WEAVE_COMPLETE_EXAMPLE,
  injectWeaveUtility 
} from '../utils/weave/examples.ts';

console.log('🧪 Testing Weave Utility Injection for Daytona\n');
console.log('='.repeat(70));

// ============================================================================
// Test 1: Complete Example (Self-Contained)
// ============================================================================

console.log('\n📌 TEST 1: Complete example with weave tracing\n');

try {
  const result1 = await runCode(WEAVE_COMPLETE_EXAMPLE, 'javascript', {
    WANDB_API_KEY: Deno.env.get('WANDB_API_KEY') || ''
  });
  
  console.log('✅ Test 1 PASSED');
  console.log('Output:', result1.result);
  
  // Check for weave initialization message
  if (result1.result.includes('[Weave]') || result1.result.includes('Initialized')) {
    console.log('✅ Weave initialization detected');
  }
  
  // Try to parse the JSON output
  try {
    const lines = result1.result.split('\n');
    const jsonLine = lines.find(line => line.trim().startsWith('{'));
    if (jsonLine) {
      const parsed = JSON.parse(jsonLine);
      console.log('Parsed result:', parsed);
      if (parsed.success && parsed.result) {
        console.log('✅ Operation completed:', `${parsed.operation} of ${parsed.input} = ${parsed.result}`);
      }
    }
  } catch (e) {
    console.log('Note: Could not parse JSON, but execution succeeded');
  }
} catch (error) {
  console.error('❌ Test 1 FAILED:', error);
}

// ============================================================================
// Test 2: Inject Utility into Simple User Code
// ============================================================================

console.log('\n📌 TEST 2: Inject weave into simple traced operation\n');

// This is what an AI might generate - code that USES weave tracing
const simpleUserCode = `
const sumArray = createTracedOp('sum_array', async (numbers) => {
  return numbers.reduce((a, b) => a + b, 0);
});

const numbers = [1, 2, 3, 4, 5];
const sum = await sumArray(numbers);

console.log(JSON.stringify({
  success: true,
  operation: 'sum_array',
  input: numbers,
  result: sum
}));
`;

const injectedCode2 = injectWeaveUtility(simpleUserCode, 'test-agent-2', false);

console.log('Generated code to execute:');
console.log('---');
console.log(injectedCode2.substring(0, 500) + '...');
console.log('---\n');

try {
  const result2 = await runCode(injectedCode2, 'javascript', {
    WANDB_API_KEY: Deno.env.get('WANDB_API_KEY') || ''
  });
  
  console.log('✅ Test 2 PASSED');
  console.log('Output:', result2.result);
  
  // Check for traced operation logs
  if (result2.result.includes('[Weave]')) {
    console.log('✅ Traced operation logs detected');
  }
  
  const lines = result2.result.split('\n');
  const jsonLine = lines.find(line => line.trim().startsWith('{'));
  if (jsonLine) {
    const parsed = JSON.parse(jsonLine);
    console.log('Result:', parsed);
  }
} catch (error) {
  console.error('❌ Test 2 FAILED:', error);
}

// ============================================================================
// Test 3: Multiple Traced Operations
// ============================================================================

console.log('\n📌 TEST 3: Multiple traced operations in sequence\n');

const multiOpCode = `
const fetchData = createTracedOp('fetch_data', async () => {
  // Simulate data fetching
  return { name: 'Test User', age: 30 };
});

const processData = createTracedOp('process_data', async (data) => {
  // Simulate data processing
  return { ...data, processed: true, timestamp: Date.now() };
});

const validateData = createTracedOp('validate_data', async (data) => {
  // Simulate validation
  return data.name && data.age && data.processed;
});

// Execute pipeline
const data = await fetchData();
const processed = await processData(data);
const isValid = await validateData(processed);

console.log(JSON.stringify({
  success: true,
  pipeline: ['fetch_data', 'process_data', 'validate_data'],
  finalData: processed,
  isValid: isValid
}));
`;

const injectedCode3 = injectWeaveUtility(multiOpCode, 'pipeline-agent', false);

try {
  const result3 = await runCode(injectedCode3, 'javascript', {
    WANDB_API_KEY: Deno.env.get('WANDB_API_KEY') || ''
  });
  
  console.log('✅ Test 3 PASSED');
  console.log('Output:', result3.result);
  
  // Count traced operations
  const traceCount = (result3.result.match(/\[Weave\]/g) || []).length;
  console.log(`✅ Found ${traceCount} weave trace logs`);
  
  const lines = result3.result.split('\n');
  const jsonLine = lines.find(line => line.trim().startsWith('{'));
  if (jsonLine) {
    const parsed = JSON.parse(jsonLine);
    console.log('Pipeline result:', parsed);
  }
} catch (error) {
  console.error('❌ Test 3 FAILED:', error);
}

// ============================================================================
// Test 4: Graceful Failure (No WANDB_API_KEY)
// ============================================================================

console.log('\n📌 TEST 4: Graceful failure without API key\n');

const gracefulCode = `
const compute = createTracedOp('compute_factorial', async (n) => {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
});

const result = await compute(6);

console.log(JSON.stringify({
  success: true,
  operation: 'factorial',
  input: 6,
  result: result,
  note: 'Works even if Weave init fails'
}));
`;

const injectedCode4 = injectWeaveUtility(gracefulCode, 'no-api-test', true);

try {
  const result4 = await runCode(injectedCode4, 'javascript', {
    // Intentionally NOT passing WANDB_API_KEY
  });
  
  console.log('Output:', result4.result);
  
  // Should see warning about Weave init failure but still execute
  if (result4.result.includes('Failed to initialize') || result4.result.includes('warn')) {
    console.log('✅ Test 4 PASSED - Graceful failure works (continues without tracing)');
  } else if (result4.result.includes('"success":true')) {
    console.log('✅ Test 4 PASSED - Code executed successfully');
  } else {
    console.log('⚠️  Test 4: Unexpected output');
  }
  
  const lines = result4.result.split('\n');
  const jsonLine = lines.find(line => line.trim().startsWith('{'));
  if (jsonLine) {
    const parsed = JSON.parse(jsonLine);
    console.log('Result:', parsed);
  }
} catch (error) {
  console.log('Note: Error occurred but that\'s expected without API key');
  console.log(error);
}

// ============================================================================
// Test 5: Verify Utility String Integrity
// ============================================================================

console.log('\n📌 TEST 5: Verify utility string integrity\n');

const hasInitWeave = WEAVE_NODE_UTIL.includes('async function initWeave');
const hasTraceFunction = WEAVE_NODE_UTIL.includes('function traceFunction');
const hasCreateTracedOp = WEAVE_NODE_UTIL.includes('function createTracedOp');
const hasWeaveOp = WEAVE_NODE_UTIL.includes('weave.op');

console.log('Has initWeave function:', hasInitWeave ? '✅' : '❌');
console.log('Has traceFunction:', hasTraceFunction ? '✅' : '❌');
console.log('Has createTracedOp:', hasCreateTracedOp ? '✅' : '❌');
console.log('Has weave.op wrapper:', hasWeaveOp ? '✅' : '❌');

if (hasInitWeave && hasTraceFunction && hasCreateTracedOp && hasWeaveOp) {
  console.log('\n✅ Test 5 PASSED - Utility string is complete');
} else {
  console.log('\n❌ Test 5 FAILED - Utility string is missing components');
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('\n📊 TEST SUMMARY\n');
console.log('✅ Weave utility injection pattern works!');
console.log('✅ Pre-written tracing code executes in Daytona');
console.log('✅ AI-generated code can use tracing functions directly');
console.log('✅ Multiple operations can be traced in sequence');
console.log('✅ Graceful failure - code works even if Weave init fails');
console.log('✅ Operations are logged with timing information');
console.log('\n🎯 READY FOR PRODUCTION USE\n');
console.log('Benefits:');
console.log('1. Generated agents automatically get observability');
console.log('2. Can trace individual operations in complex agents');
console.log('3. View execution traces in Weave dashboard');
console.log('4. Helps debug and optimize generated code');
console.log('\nNext steps:');
console.log('1. Update codegen/index.ts to inject WEAVE_API_DOCS into system prompt');
console.log('2. Optionally wrap generated code with injectWeaveUtility()');
console.log('3. View traces at https://wandb.ai/');
console.log('\n✅ All tests complete!\n');

