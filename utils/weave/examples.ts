/**
 * Weave Utility Examples for Code Generation
 * 
 * This module provides:
 * 1. Pre-tested Node.js weave tracing code (as strings) for Daytona sandboxes
 * 2. API documentation for teaching the AI how to use weave tracing
 * 3. Dependency lists for npm installation
 * 
 * Focus: weave.op() decorator for observability in generated code
 */

// ============================================================================
// Node.js Utility Code (Proven, Working, Ready to Inject)
// ============================================================================

/**
 * Weave tracing utility for Node.js (Daytona sandboxes)
 * This is WORKING CODE that gets injected directly into generated code.
 */
export const WEAVE_NODE_UTIL = `
// === Weave Tracing Utility (Auto-injected) ===
// Try to load .env file if it exists (for local runs)
// Look for .env in current dir, parent dir, and grandparent dir
try {
  require('dotenv').config({ silent: true, path: '.env' }) || 
  require('dotenv').config({ silent: true, path: '../.env' }) ||
  require('dotenv').config({ silent: true, path: '../../.env' });
} catch (e) {
  // dotenv not available or .env doesn't exist - that's okay
}

const weave = require('weave');

// Track initialization state
let weaveInitialized = false;

/**
 * Initialize Weave tracing
 * Call this once at the start of your code
 */
async function initWeave(projectName) {
  if (!projectName) projectName = 'agent-code';
  
  if (weaveInitialized) {
    return;
  }
  
  try {
    await weave.init(projectName);
    weaveInitialized = true;
    // Silent init - only log failures
  } catch (error) {
    // Silent fail - continue without tracing
  }
}

/**
 * Wrap a function with Weave tracing
 * This creates a traced version of your function
 */
function traceFunction(fn, name) {
  if (!name) name = fn.name || 'anonymous';
  
  try {
    return weave.op(fn);
  } catch (error) {
    // Silent fail - return original function if tracing fails
    return fn;
  }
}

/**
 * Create a traced async operation
 * Use this for important operations you want to observe
 * 
 * IMPORTANT: Use descriptive, namespaced operation names for clarity in traces
 * Good examples: 'agent:fetch_joke', 'agent:generate_response', 'agent:validate_input'
 * Bad examples: 'process', 'handle', 'run'
 */
function createTracedOp(operationName, fn) {
  const namedFn = {
    [operationName]: async function(...args) {
      // Silent execution - no logging to keep output clean
      try {
        const result = await fn(...args);
        return result;
      } catch (error) {
        // Re-throw without logging
        throw error;
      }
    }
  }[operationName];
  
  return traceFunction(namedFn, operationName);
}
// === End Weave Utility ===
`.trim();

/**
 * NPM dependencies required for the weave utility
 * Using dotenv for loading .env files when running locally
 */
export const WEAVE_NPM_DEPS = ['weave', 'dotenv'];

/**
 * API documentation for teaching AI how to use the utility
 * This goes into the system prompt
 */
export const WEAVE_API_DOCS = `
### Available Utility: Weave Tracing

⚠️ IMPORTANT: These functions are PRE-LOADED and ready to use!
DO NOT import or require 'weave' - just call the functions directly!

**Initialization:**
\`\`\`javascript
// Initialize weave at the start of your code (NO import needed!)
await initWeave('my-project-name');
\`\`\`

**Function Signatures:**
\`\`\`javascript
// Wrap any function with automatic tracing
function traceFunction(fn: Function, name?: string): Function

// Create a named traced operation
function createTracedOp(
  operationName: string, 
  fn: Function
): Function
\`\`\`

**Usage Examples:**
\`\`\`javascript
// Example 1: Initialize weave
await initWeave('joke-agent');

// Example 2: Trace a simple function
async function processData(data) {
  // your logic here
  return processed;
}
const tracedProcess = traceFunction(processData, 'agent:process_data');
const result = await tracedProcess(myData);

// Example 3: Create a traced operation inline with NAMESPACED name
// IMPORTANT: Use 'agent:operation_name' format for clarity in traces
const analyzeText = createTracedOp('agent:analyze_text', async (text) => {
  // analysis logic
  return { score: 0.95, sentiment: 'positive' };
});
const analysis = await analyzeText('Hello world');

// Example 4: Trace multiple steps with clear namespacing
await initWeave('joke-agent');

const fetchJoke = createTracedOp('agent:fetch_joke', async (topic: string) => {
  // Use wandbChat to get a joke from LLM
  const joke = await wandbChat(\`Tell me a joke about \${topic}\`);
  return joke;
});

const rateJoke = createTracedOp('agent:rate_joke', async (joke: string) => {
  // Ask LLM to rate the joke
  const rating = await wandbChat(\`Rate this joke 1-10: \${joke}\`);
  return rating;
});

const formatOutput = createTracedOp('agent:format_output', async (joke: string, rating: string) => {
  return {
    joke: joke,
    rating: rating,
    timestamp: new Date().toISOString()
  };
});

// Execute pipeline with clear traced operations
const joke = await fetchJoke('programming');
const rating = await rateJoke(joke);
const output = await formatOutput(joke, rating);
\`\`\`

**Important Notes:**
- Call \`initWeave()\` once at the start of your code
- The utility functions are already defined - just use them
- Tracing is optional - code works without it if init fails
- All traced operations are logged to console and Weave dashboard
- **CRITICAL: Use namespaced operation names like 'agent:operation_name' for clarity**
  - Good: 'joke-agent:fetch_joke', 'joke-agent:rate_joke', 'agent:transform_data'
  - Bad: 'process', 'handle', 'run', 'main' (too generic, hard to trace)
- Namespace helps identify operations in complex multi-agent traces
`.trim();

/**
 * Complete example for testing/demo purposes
 */
export const WEAVE_COMPLETE_EXAMPLE = `
(async () => {
  const { execSync } = require('child_process');
  
  // Install dependencies
  execSync('npm install weave', { stdio: 'pipe' });
  
  ${WEAVE_NODE_UTIL}
  
  // === Example Usage ===
  try {
    // Initialize weave
    await initWeave('weave-demo');
    
    // Create a traced function
    const calculateFactorial = createTracedOp('calculate_factorial', async (n) => {
      if (n <= 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) {
        result *= i;
      }
      return result;
    });
    
    // Use the traced function
    const result = await calculateFactorial(5);
    
    console.log(JSON.stringify({
      success: true,
      operation: 'factorial',
      input: 5,
      result: result,
      timestamp: new Date().toISOString()
    }));
    
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
})();
`.trim();

// ============================================================================
// Utility Injection Helper
// ============================================================================

/**
 * Wrap user-generated code with the weave utility
 * 
 * @param userCode - The code generated by AI
 * @param projectName - Weave project name (default: 'agent-code')
 * @param includeErrorHandling - Whether to wrap in try-catch (default: true)
 * @returns Complete code ready for Daytona execution
 */
export function injectWeaveUtility(
  userCode: string, 
  projectName: string = 'agent-code',
  includeErrorHandling: boolean = true
): string {
  // Inject initialization at the start of user code if not present
  const needsInit = !userCode.includes('initWeave');
  const initCode = needsInit ? `await initWeave('${projectName}');\n  ` : '';
  
  const wrappedCode = includeErrorHandling 
    ? `
  try {
    ${initCode}${userCode}
  } catch (error) {
    const err = error;
    console.log(JSON.stringify({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    }));
  }
`.trim()
    : `${initCode}${userCode}`;

  return `
(async () => {
  const { execSync } = require('child_process');
  
  // Install dependencies
  execSync('npm install ${WEAVE_NPM_DEPS.join(' ')}', { stdio: 'pipe' });
  
  ${WEAVE_NODE_UTIL}
  
  // === Generated Code ===
  ${wrappedCode}
  // === End Generated Code ===
})();
`.trim();
}

