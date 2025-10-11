/**
 * Wandb Weave Integration
 * 
 * This module provides Weave tracing and decorators for AI operations.
 * 
 * Usage:
 * - Import * as weave from this file
 * - Initialize weave with your project details using weave.init()
 * - Wrap functions with weave.op() for tracing
 * 
 * Example:
 * ```
 * import * as weave from './backend/weave.js';
 * 
 * async function myFunction(input) {
 *   // your code here
 *   return result;
 * }
 * const myFunctionOp = weave.op(myFunction);
 * 
 * async function main() {
 *   await weave.init('my-project');
 *   const result = await myFunctionOp('test input');
 * }
 * ```
 */

import * as weaveLib from "npm:weave";

// Track if Weave has been initialized to prevent multiple initializations
let isInitialized = false;
const DEFAULT_PROJECT = 'agfactory';

/**
 * Initialize Weave client
 * Call this at application startup with your project details
 * Automatically prevents multiple initializations
 * 
 * @param {string} projectName - Your Wandb project name (default: "agfactory")
 * @returns {Promise<void>}
 */
export async function init(projectName = DEFAULT_PROJECT) {
  if (isInitialized) {
    console.log(`⚠️ Weave already initialized for project: ${projectName}`);
    return;
  }
  
  try {
    await weaveLib.init(projectName);
    isInitialized = true;
    console.log(`✅ Weave initialized for project: ${projectName}`);
  } catch (error) {
    console.error('❌ Failed to initialize Weave:', error);
    throw error;
  }
}

/**
 * Ensure Weave is initialized before any operations
 * Call this at the start of any function that needs Weave
 * Safe to call multiple times - only initializes once
 * 
 * @returns {Promise<void>}
 */
export async function ensureInitialized() {
  if (!isInitialized) {
    await init(DEFAULT_PROJECT);
  }
}

/**
 * Weave op wrapper for tracing functions
 * Wrap any function with this to enable Weave tracing
 * 
 * @param {Function} fn - The function to trace
 * @returns {Function} Traced version of the function
 * 
 * Example:
 * ```
 * async function extractData(input) {
 *   // your code here
 *   return result;
 * }
 * const extractDataOp = weave.op(extractData);
 * 
 * // Then call it:
 * await extractDataOp('some input');
 * ```
 */
export const op = weaveLib.op;

/**
 * Export the full weave library for advanced usage
 */
export { weaveLib as weave };

/**
 * Example traced function
 * This demonstrates how to use the op wrapper
 */
async function exampleOperation(input) {
  console.log('Running traced operation with input:', input);
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    success: true,
    input: input,
    output: `Processed: ${input}`,
    timestamp: Date.now()
  };
}
export const exampleTracedFunction = op(exampleOperation);

/**
 * Utility to create a traced AI call
 * Wraps AI model calls with automatic Weave tracing
 * 
 * @param {Function} aiFunction - The AI function to trace
 * @param {string} operationName - Optional name for the operation (defaults to function name)
 * @returns {Function} Traced version of the function
 * 
 * Example:
 * ```
 * async function generateText(prompt) {
 *   const response = await openai.chat.completions.create({
 *     model: 'gpt-4',
 *     messages: [{ role: 'user', content: prompt }]
 *   });
 *   return response.choices[0].message.content;
 * }
 * const generateTextOp = createTracedAICall(generateText, 'generate_text');
 * 
 * // Then use it:
 * await generateTextOp('Tell me a story');
 * ```
 */
export function createTracedAICall(aiFunction, operationName) {
  console.log(`🔍 Creating traced AI operation: ${operationName || aiFunction.name}`);
  return op(aiFunction);
}

