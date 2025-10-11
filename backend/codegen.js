/**
 * AI Code Generation and Execution Module
 * 
 * This module generates code from user prompts using an LLM,
 * then executes the generated code in a Daytona sandbox.
 */

import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { runCode } from './daytona.js';
import { chat } from './wandb.js';
import * as weave from './weave.js';

/**
 * Extract code from LLM response between <code></code> tags
 * 
 * @param {string} response - LLM response text
 * @returns {string|null} Extracted code or null
 */
function extractCode(response) {
  // Try to find code between <code></code> tags
  const codeMatch = response.match(/<code>([\s\S]*?)<\/code>/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  
  // Try to find code between ```language and ``` markdown blocks
  const markdownMatch = response.match(/```(?:javascript|typescript|js|ts)?\n?([\s\S]*?)```/);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }
  
  return null;
}

/**
 * Generate code using Wandb Inference API
 * 
 * @param {string} userPrompt - What the user wants the code to do
 * @param {number} maxRetries - Maximum number of extraction retry attempts
 * @param {string} model - Model to use (default: Qwen3-Coder)
 * @returns {Promise<object>} Generated code and metadata
 */
export async function generateCode(userPrompt, maxRetries = 3, model = "Qwen/Qwen3-Coder-480B-A35B-Instruct") {
  const systemPrompt = `You are a code generation assistant. Generate TypeScript/JavaScript code based on user requests.

CRITICAL: Your code will be executed in a TypeScript sandbox. It MUST be valid TypeScript and produce reliable output.

MANDATORY REQUIREMENTS:
1. Wrap ALL code in <code></code> tags
2. ALWAYS output results using console.log() with structured JSON
3. Use ONLY standard JavaScript/TypeScript - no external imports or Node.js modules
4. MUST include proper TypeScript error handling
5. Output format MUST be valid JSON

REQUIRED ERROR HANDLING PATTERN:
Always wrap your code in a try-catch block with proper TypeScript error typing:

<code>
try {
  // Your code here
  const result = yourLogic();
  
  // REQUIRED: Always output as JSON
  console.log(JSON.stringify({
    success: true,
    result: result,
    timestamp: new Date().toISOString()
  }));
  
} catch (error: unknown) {
  // REQUIRED: Proper TypeScript error casting
  const err = error as Error;
  console.log(JSON.stringify({
    success: false,
    error: err.message,
    timestamp: new Date().toISOString()
  }));
}
</code>

EXAMPLES OF VALID OUTPUT:

✅ CORRECT - Math operation:
<code>
try {
  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };
  const result = factorial(5);
  console.log(JSON.stringify({ success: true, result, timestamp: new Date().toISOString() }));
} catch (error: unknown) {
  const err = error as Error;
  console.log(JSON.stringify({ success: false, error: err.message, timestamp: new Date().toISOString() }));
}
</code>

✅ CORRECT - Data manipulation:
<code>
try {
  const data = { name: "John", age: 30, email: "john@example.com" };
  console.log(JSON.stringify({ success: true, result: data, timestamp: new Date().toISOString() }));
} catch (error: unknown) {
  const err = error as Error;
  console.log(JSON.stringify({ success: false, error: err.message, timestamp: new Date().toISOString() }));
}
</code>

❌ WRONG - Missing error typing:
catch (error) { // This will fail TypeScript compilation!
  console.log(error.message);
}

❌ WRONG - No structured output:
console.log("The result is: " + result); // Not JSON!

❌ WRONG - Multiple console.logs without JSON:
console.log(result);
console.log(timestamp);

REMEMBER:
- Every output MUST be JSON with success/result/error/timestamp
- Every catch block MUST type error as "error: unknown"
- Every error MUST be cast: "const err = error as Error"
- No plain text outputs - only JSON
- Test your logic mentally before outputting

Generate clean, TypeScript-compliant code that will execute without errors.`;

  let lastResponse = null;
  let attempts = 0;
  let currentPrompt = userPrompt;
  
  while (attempts < maxRetries) {
    attempts++;
    console.log(`🤖 Generating code with Wandb (attempt ${attempts}/${maxRetries})...`);
    
    try {
      const response = await chat({
        model,
        systemPrompt,
        messages: [
          { role: 'user', content: currentPrompt }
        ],
        temperature: 0.7,
        maxTokens: 2000
      });
      
      lastResponse = response.choices[0].message.content;
      
      console.log('📝 LLM Response received');
      console.log('---');
      console.log(lastResponse);
      console.log('---\n');
      
      // Try to extract code
      const code = extractCode(lastResponse);
      
      if (code) {
        console.log('✅ Code extracted successfully\n');
        return {
          success: true,
          code,
          rawResponse: lastResponse,
          attempts,
          model
        };
      }
      
      console.log(`⚠️ Could not extract code from response (attempt ${attempts}/${maxRetries})`);
      
      // If not last attempt, modify prompt to be more explicit
      if (attempts < maxRetries) {
        currentPrompt = `${userPrompt}\n\nIMPORTANT: Please wrap your code in <code></code> tags.`;
      }
      
    } catch (error) {
      console.error(`❌ Error generating code (attempt ${attempts}):`, error.message);
      if (attempts >= maxRetries) {
        throw error;
      }
    }
  }
  
  // If we exhausted retries
  throw new Error(`Failed to extract code after ${maxRetries} attempts. Last response: ${lastResponse}`);
}

/**
 * Generate and execute code from a user prompt (internal implementation)
 * 
 * @param {string} userPrompt - What the user wants the code to do
 * @param {object} options - Options for generation and execution
 * @returns {Promise<object>} Complete result with code, execution, and logs
 */
async function generateAndExecuteImpl(userPrompt, options = {}) {
  const {
    maxRetries = 3,
    language = 'typescript',
    logCallback = null,
    model = "Qwen/Qwen3-Coder-480B-A35B-Instruct"
  } = options;
  
  const log = (message, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      ...data
    };
    console.log(`[${logEntry.timestamp}] ${message}`);
    if (logCallback) {
      logCallback(logEntry);
    }
    return logEntry;
  };
  
  const logs = [];
  
  try {
    logs.push(log('🚀 Starting code generation and execution'));
    logs.push(log('📋 User prompt', { prompt: userPrompt }));
    
    // Step 1: Generate code
    logs.push(log('🤖 Generating code from prompt...'));
    const generated = await generateCode(userPrompt, maxRetries, model);
    logs.push(log('✅ Code generated', { 
      attempts: generated.attempts,
      model: generated.model,
      codeLength: generated.code.length 
    }));
    
    // Step 2: Execute in Daytona
    logs.push(log('🏃 Executing code in Daytona sandbox...'));
    const execution = await runCode(generated.code, language);
    
    // Check for execution errors (TypeScript compilation errors or runtime errors)
    const hasCompilationError = execution.result && (
      execution.result.includes('error TS') || 
      execution.result.includes('Error:') ||
      execution.result.includes('SyntaxError:')
    );
    
    // Try to parse JSON output to check for success flag
    let parsedOutput = null;
    let hasRuntimeError = false;
    try {
      if (execution.result && execution.result.trim().startsWith('{')) {
        parsedOutput = JSON.parse(execution.result);
        hasRuntimeError = parsedOutput.success === false;
      }
    } catch (e) {
      // Not JSON or invalid JSON, that's okay
    }
    
    const hasError = hasCompilationError || hasRuntimeError;
    
    if (hasError) {
      logs.push(log('⚠️ Code executed with errors', { 
        errorType: hasCompilationError ? 'compilation' : 'runtime',
        error: execution.result,
        code: generated.code,
        parsedOutput
      }));
    } else {
      logs.push(log('✅ Code executed successfully', { 
        hasResult: !!execution.result,
        parsedOutput
      }));
    }
    
    // Step 3: Parse and return results
    const result = {
      success: !hasError,
      prompt: userPrompt,
      generated: {
        code: generated.code,
        rawResponse: generated.rawResponse,
        attempts: generated.attempts,
        model: generated.model
      },
      execution: {
        result: execution.result,
        parsedOutput,
        raw: execution,
        hasError,
        errorType: hasError ? (hasCompilationError ? 'compilation' : 'runtime') : null
      },
      logs
    };
    
    logs.push(log(hasError ? '⚠️ Complete with errors' : '🎉 Complete!'));
    
    return result;
    
  } catch (error) {
    logs.push(log('❌ Error', { 
      error: error.message,
      stack: error.stack 
    }));
    throw error;
  }
}

/**
 * Generate and execute code from a user prompt
 * Traced with Weave for observability
 */
export const generateAndExecute = weave.op(generateAndExecuteImpl);

/**
 * Run tests for code generation and execution
 */
export async function testCodeGen() {
  console.log('🚀 Starting Code Generation Tests with Wandb + Daytona...\n');
  
  // Initialize Weave for tracing
  console.log('🔍 Initializing Weave tracing...');
  await weave.init();
  console.log('');
  
  const tests = [
    {
      name: 'Simple Math',
      prompt: 'Create a function that calculates the factorial of 5 and returns the result'
    },
    {
      name: 'Array Operations',
      prompt: 'Generate code that creates an array of numbers 1-10, filters even numbers, and sums them'
    },
    {
      name: 'String Manipulation',
      prompt: 'Write code that takes the string "hello world" and returns it reversed and capitalized'
    },
    {
      name: 'Data Structure',
      prompt: 'Create an object with user data (name, age, email) and format it as JSON'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔧 Test: ${test.name}`);
    console.log(`📋 Prompt: ${test.prompt}`);
    console.log('='.repeat(60) + '\n');
    
    try {
      const result = await generateAndExecute(test.prompt, {
        logCallback: (log) => {
          // Additional logging if needed
        }
      });
      
      console.log('\n📊 RESULT:');
      console.log('---');
      console.log('Generated Code:');
      console.log(result.generated.code);
      console.log('\n---');
      console.log('Execution Output:');
      console.log(result.execution.result);
      console.log('---\n');
      
      results.push({
        test: test.name,
        success: true,
        result
      });
      
    } catch (error) {
      console.error(`❌ Test "${test.name}" failed:`, error.message);
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(60));
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  results.forEach((r, i) => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${i + 1}. ${r.test}`);
  });
  
  console.log('\n✅ Code generation tests complete!\n');
  
  return results;
}

// If run directly, execute tests
if (import.meta.main) {
  testCodeGen();
}

