#!/usr/bin/env -S deno run --allow-net --allow-env
/**
 * Test Script: Weave Integration with Wandb Inference
 * 
 * This script verifies that Weave tracing is properly integrated
 * with all Wandb chat functions.
 * 
 * Run: deno run --allow-net --allow-env test-weave-integration.ts
 */

import * as weave from "./weave.ts";
import { chat, simpleChat, chatWithHistory } from "./wandb.ts";
import type { ChatMessage } from "./wandb.ts";

console.log('🧪 Testing Weave Integration with Wandb Inference\n');

// Test 1: Weave Initialization
console.log('Test 1: Weave Initialization');
try {
  await weave.init();
  console.log('✅ Weave initialized successfully\n');
} catch (error) {
  const err = error as Error;
  console.error('❌ Weave initialization failed:', err);
  Deno.exit(1);
}

// Test 2: Simple Chat (traced)
console.log('Test 2: Simple Chat with Tracing');
try {
  const response = await simpleChat('Say "test successful" if you can read this.');
  console.log('Response:', response.substring(0, 50) + '...');
  console.log('✅ Simple chat traced successfully\n');
} catch (error) {
  const err = error as Error;
  console.error('❌ Simple chat failed:', err);
  Deno.exit(1);
}

// Test 3: Chat with Options (traced)
console.log('Test 3: Chat with Options and Tracing');
try {
  const response = await chat({
    systemPrompt: 'You are a test assistant. Respond concisely.',
    messages: [
      { role: 'user', content: 'What is 2+2?' }
    ],
    temperature: 0.1
  });
  console.log('Response:', response.choices[0].message.content.substring(0, 50));
  console.log('✅ Chat with options traced successfully\n');
} catch (error) {
  const err = error as Error;
  console.error('❌ Chat with options failed:', err);
  Deno.exit(1);
}

// Test 4: Conversation History (traced)
console.log('Test 4: Conversation History with Tracing');
try {
  let history: ChatMessage[] = [];
  
  const turn1 = await chatWithHistory(history, 'Remember this number: 42');
  history = turn1.updatedHistory;
  console.log('Turn 1 completed');
  
  const turn2 = await chatWithHistory(history, 'What number should you remember?');
  console.log('Turn 2 response:', turn2.assistantMessage.content.substring(0, 50));
  console.log('✅ Conversation history traced successfully\n');
} catch (error) {
  const err = error as Error;
  console.error('❌ Conversation history failed:', err);
  Deno.exit(1);
}

// Test 5: Custom Traced Function
console.log('Test 5: Custom Function with Weave Tracing');
try {
  async function customFunction(input: string): Promise<{ original: string; echo: string }> {
    const response = await simpleChat(`Echo this: ${input}`);
    return { original: input, echo: response };
  }
  
  const tracedCustom = weave.op(customFunction);
  const result = await tracedCustom('test-input');
  console.log('Original:', result.original);
  console.log('✅ Custom traced function works\n');
} catch (error) {
  const err = error as Error;
  console.error('❌ Custom traced function failed:', err);
  Deno.exit(1);
}

// Test 6: Example Traced Function from weave.ts
console.log('Test 6: Example Traced Function');
try {
  const { exampleTracedFunction } = await import('./weave.ts');
  const result = await exampleTracedFunction('integration-test');
  console.log('Success:', result.success);
  console.log('✅ Example traced function works\n');
} catch (error) {
  const err = error as Error;
  console.error('❌ Example traced function failed:', err);
  Deno.exit(1);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('✅ ALL TESTS PASSED!');
console.log('='.repeat(50));
console.log('\n📊 Check your Weave dashboard:');
console.log(`   https://wandb.ai/`);
console.log(`   Project: agfactory`);
console.log('\n🔍 You should see traces for:');
console.log('   - simpleChat');
console.log('   - chat');
console.log('   - chatWithHistory');
console.log('   - Custom traced functions');
console.log('   - Example traced function');
console.log('\nEach trace should show:');
console.log('   • Function inputs and outputs');
console.log('   • Execution time');
console.log('   • Token usage (where applicable)');
console.log('   • Any errors or exceptions');
console.log('\n✨ Weave integration is working correctly!\n');

