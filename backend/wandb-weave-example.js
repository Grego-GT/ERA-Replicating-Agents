/**
 * Example: Using Wandb Inference with Weave Tracing
 * 
 * This demonstrates how to use the Wandb chat functions with automatic
 * Weave tracing for observability.
 * 
 * Prerequisites:
 * - Set WANDB_API_KEY in your .env file
 * - Optionally set WANDB_PROJECT (format: "team/project")
 * 
 * Run with: deno run --allow-net --allow-env wandb-weave-example.js
 */

import * as weave from "./weave.js";
import { chat, simpleChat, chatWithHistory } from "./wandb.js";

/**
 * Example 1: Simple chat with Weave tracing
 */
async function example1() {
  console.log('\n=== Example 1: Simple Chat ===\n');
  
  const response = await simpleChat('Tell me a fun fact about AI.');
  console.log('Response:', response);
}

/**
 * Example 2: Chat with custom parameters
 */
async function example2() {
  console.log('\n=== Example 2: Chat with System Prompt ===\n');
  
  const response = await chat({
    systemPrompt: 'You are a helpful coding assistant that explains concepts clearly.',
    messages: [
      { role: 'user', content: 'Explain what Weave tracing is in one sentence.' }
    ],
    temperature: 0.7
  });
  
  console.log('Response:', response.choices[0].message.content);
  console.log('Usage:', response.usage);
}

/**
 * Example 3: Multi-turn conversation with history
 */
async function example3() {
  console.log('\n=== Example 3: Conversation with History ===\n');
  
  let history = [];
  
  // Turn 1
  const turn1 = await chatWithHistory(
    history,
    'I am building an AI agent factory. What should I name it?'
  );
  console.log('User: I am building an AI agent factory. What should I name it?');
  console.log('Assistant:', turn1.assistantMessage.content);
  history = turn1.updatedHistory;
  
  // Turn 2
  const turn2 = await chatWithHistory(
    history,
    'What features should it have?'
  );
  console.log('\nUser: What features should it have?');
  console.log('Assistant:', turn2.assistantMessage.content);
  history = turn2.updatedHistory;
  
  // Turn 3
  const turn3 = await chatWithHistory(
    history,
    'Can you remind me what we are building?'
  );
  console.log('\nUser: Can you remind me what we are building?');
  console.log('Assistant:', turn3.assistantMessage.content);
}

/**
 * Example 4: Using Weave op directly for custom functions
 */
async function extractDinos(input) {
  const response = await chat({
    systemPrompt: 'You are an expert at extracting structured data.',
    messages: [
      {
        role: 'user',
        content: `In JSON format extract a list of 'dinosaurs', with their 'name', their 'common_name', and whether its 'diet' is a herbivore or carnivore: ${input}`
      }
    ]
  });
  return response.choices[0].message.content;
}

// Wrap the custom function with Weave tracing
const extractDinosOp = weave.op(extractDinos);

async function example4() {
  console.log('\n=== Example 4: Custom Traced Function ===\n');
  
  const result = await extractDinosOp(
    'I watched as a Tyrannosaurus rex (T. rex) chased after a Triceratops (Trike), both carnivore and herbivore locked in an ancient dance. Meanwhile, a gentle giant Brachiosaurus (Brachi) calmly munched on treetops, blissfully unaware of the chaos below.'
  );
  console.log('Extracted dinosaurs:', result);
}

/**
 * Main function - Initialize Weave and run examples
 */
async function main() {
  console.log('🚀 Wandb Inference + Weave Tracing Examples\n');
  
  // Initialize Weave tracing
  console.log('🔍 Initializing Weave...');
  await weave.init();
  console.log('✅ Weave initialized\n');
  
  // Run examples
  try {
    await example1();
    await example2();
    await example3();
    await example4();
    
    console.log('\n✅ All examples completed!');
    console.log('🔍 Check your Weave dashboard: https://wandb.ai/');
    console.log('   Navigate to your project to see traces and metrics\n');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

