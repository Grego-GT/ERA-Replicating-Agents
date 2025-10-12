/**
 * AI Code Generation and Execution Module
 * 
 * This module generates code from user prompts using an LLM,
 * then executes the generated code in a Daytona sandbox.
 */

import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { runCode } from '../daytona/index.ts';
import { chat } from '../wandb/index.ts';
import * as weave from '../weave/index.ts';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Options for generating code
 */
interface GenerateCodeOptions {
  maxRetries?: number;
  model?: string;
}

/**
 * Result from code generation
 */
interface GeneratedCodeResult {
  success: boolean;
  code: string;
  rawResponse: string;
  attempts: number;
  model: string;
}

/**
 * Parsed JSON output from code execution
 */
interface ParsedExecutionOutput {
  success: boolean;
  result?: unknown;
  error?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Execution result details
 */
interface ExecutionResult {
  result: string;
  parsedOutput: ParsedExecutionOutput | null;
  raw: unknown;
  hasError: boolean;
  errorType: 'compilation' | 'runtime' | null;
}

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  message: string;
  [key: string]: unknown;
}

/**
 * Options for generateAndExecute function
 */
interface GenerateAndExecuteOptions {
  maxRetries?: number;
  language?: string;
  logCallback?: ((log: LogEntry) => void) | null;
  model?: string;
}

/**
 * Complete result from code generation and execution
 */
interface GenerateAndExecuteResult {
  success: boolean;
  prompt: string;
  generated: {
    code: string;
    rawResponse: string;
    attempts: number;
    model: string;
  };
  execution: ExecutionResult;
  logs: LogEntry[];
}

/**
 * Test definition
 */
interface TestCase {
  name: string;
  prompt: string;
}

/**
 * Test result
 */
interface TestResult {
  test: string;
  success: boolean;
  result?: GenerateAndExecuteResult;
  error?: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Extract code from LLM response between <code></code> tags
 * 
 * @param response - LLM response text
 * @returns Extracted code or null
 */
function extractCode(response: string): string | null {
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
 * @param userPrompt - What the user wants the code to do
 * @param maxRetries - Maximum number of extraction retry attempts
 * @param model - Model to use (default: Qwen3-Coder)
 * @returns Generated code and metadata
 */
export async function generateCode(
  userPrompt: string, 
  maxRetries: number = 3, 
  model: string = "Qwen/Qwen3-Coder-480B-A35B-Instruct"
): Promise<GeneratedCodeResult> {
  const systemPrompt = `You are a code generation assistant. Generate TypeScript/JavaScript code based on user requests.

CRITICAL: Your code will be executed in a TypeScript sandbox. It MUST be valid TypeScript and produce reliable output.

MANDATORY REQUIREMENTS:
1. Wrap ALL code in <code></code> tags
2. Use ONLY standard JavaScript/TypeScript - no external imports or Node.js modules
3. MUST include proper TypeScript error handling
4. Output results using console.log() - structured JSON is recommended but not required

REQUIRED ERROR HANDLING PATTERN:
Always wrap your code in a try-catch block with proper TypeScript error typing:

<code>
try {
  // Your code here
  const result = yourLogic();
  
  // Output the result (JSON recommended for structured data)
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

✅ CORRECT - Structured JSON output (recommended):
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

✅ ALSO CORRECT - Plain text output (when appropriate):
<code>
try {
  const text = "hello world";
  const reversed = text.split('').reverse().join('');
  console.log(reversed); // Simple output is fine
} catch (error: unknown) {
  const err = error as Error;
  console.log(\`Error: \${err.message}\`);
}
</code>

✅ ALSO CORRECT - Multiple operations:
<code>
try {
  const items = [1, 2, 3, 4, 5];
  console.log('Processing items...');
  items.forEach(item => console.log(\`Item: \${item}\`));
  console.log('Done!');
} catch (error: unknown) {
  const err = error as Error;
  console.log(\`Error: \${err.message}\`);
}
</code>

❌ WRONG - Missing error typing:
catch (error) { // This will fail TypeScript compilation!
  console.log(error.message);
}

❌ WRONG - No output at all:
<code>
const result = calculate(); // No console.log!
</code>

REMEMBER:
- Every catch block MUST type error as "error: unknown"
- Every error MUST be cast: "const err = error as Error"
- Always produce SOME output so we can verify execution
- Use JSON for structured data, plain text for simple outputs
- Test your logic mentally before outputting

Generate clean, TypeScript-compliant code that will execute without errors.`;

  let lastResponse: string | null = null;
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
      const err = error as Error;
      console.error(`❌ Error generating code (attempt ${attempts}):`, err.message);
      if (attempts >= maxRetries) {
        throw error;
      }
    }
  }
  
  // If we exhausted retries
  throw new Error(`Failed to extract code after ${maxRetries} attempts. Last response: ${lastResponse}`);
}

// NOTE: generateAndExecute and testCodeGen have been removed
// Use FBI orchestrator instead: import { orchestrate } from '../core/fbi.ts'
// Run tests with: deno task test


