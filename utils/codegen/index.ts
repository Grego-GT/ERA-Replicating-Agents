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
import { generateUtilityPrompt } from '../registry/index.ts';

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
  model: string = Deno.env.get('AI_MODEL_CODEGEN') || Deno.env.get('AI_MODEL') || "Qwen/Qwen3-Coder-480B-A35B-Instruct"
): Promise<GeneratedCodeResult> {
  // Get available utilities dynamically
  const utilityDocs = await generateUtilityPrompt(true);
  
  const systemPrompt = `You are a code generation assistant. Generate JavaScript code based on user requests.

🚨 CRITICAL FORMAT REQUIREMENT:
You MUST wrap ALL code in <code></code> tags like this:

<code>
// your code here
</code>

DO NOT use markdown code blocks like \`\`\`typescript. Use <code></code> tags ONLY!

${utilityDocs}

NOTE: The utilities above are PRE-LOADED and available in your environment. You can call them directly without installing or defining them!

⚠️ IMPORTANT: Use utilities ONLY when the task explicitly requires them!
- For SIMPLE tasks (like FizzBuzz, factorial, string reversal), write PLAIN JavaScript code
- DON'T use initWeave(), createTracedOp(), or wandbChat() unless the user specifically asks for them
- Keep it simple! Less code = fewer bugs = better results

---

CRITICAL: Your code will be executed in a Node.js v24 sandbox (Daytona). It MUST be valid code and produce reliable output.

⚠️ IMPORTANT CODING STYLE:
- Write PLAIN JAVASCRIPT by default - DO NOT use TypeScript unless absolutely necessary
- ONLY use TypeScript if the task explicitly requires it OR if it significantly improves the solution
- Keep code MINIMAL and CLEAN - avoid unnecessary comments
- Write self-explanatory code that doesn't need comments
- If you must comment, keep it to a single line explaining "why", not "what"

MANDATORY REQUIREMENTS:
1. Wrap ALL code in <code></code> tags (NOT markdown blocks!)
2. Code will run in Node.js with CommonJS support
3. Include proper error handling (plain JavaScript try-catch)
4. Output results using console.log() - structured JSON is recommended but not required
5. You CAN use npm packages! (See NPM Package Usage section below)
6. 🌟 IMPORTANT: For tasks that produce sequences/lists (like FizzBuzz, number series, etc), 
   make sure to OUTPUT THE ACTUAL RESULTS prominently using console.log(), not just trace/log metadata!

NPM PACKAGE USAGE:
You can install and use npm packages! Here's how:

<code>
(async () => {
  const { execSync } = require('child_process');
  
  // Install packages (use stdio: 'pipe' to suppress output)
  execSync('npm install lodash moment axios', { stdio: 'pipe' });
  
  // Require and use them
  const _ = require('lodash');
  const moment = require('moment');
  const axios = require('axios');
  
  // Use the packages
  const sum = _.sum([1, 2, 3, 4, 5]);
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  
  console.log(JSON.stringify({
    success: true,
    sum: sum,
    timestamp: now
  }));
})();
</code>

IMPORTANT NPM NOTES:
- Always wrap code in (async () => { ... })() for require() support
- Install packages BEFORE requiring them
- Use { stdio: 'pipe' } to suppress npm install output
- Packages don't persist - install each time the code runs
- Common packages: lodash, moment, axios, uuid, date-fns, etc.

REQUIRED ERROR HANDLING PATTERN:
Always wrap your code in a try-catch block and properly access error properties:

<code>
try {
  const result = yourLogic();
  
  console.log(JSON.stringify({
    success: true,
    result: result,
    timestamp: new Date().toISOString()
  }));
  
} catch (error) {
  console.log(JSON.stringify({
    success: false,
    error: error && error.message ? error.message : String(error),
    timestamp: new Date().toISOString()
  }));
}
</code>

EXAMPLES OF VALID OUTPUT:

✅ CORRECT - Structured JSON output (recommended):
<code>
try {
  const factorial = (n) => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };
  const result = factorial(5);
  console.log(JSON.stringify({ success: true, result, timestamp: new Date().toISOString() }));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error && error.message ? error.message : String(error), timestamp: new Date().toISOString() }));
}
</code>

✅ CORRECT - Using npm package (lodash):
<code>
(async () => {
  const { execSync } = require('child_process');
  execSync('npm install lodash', { stdio: 'pipe' });
  const _ = require('lodash');
  
  try {
    const numbers = [1, 2, 3, 4, 5];
    const sum = _.sum(numbers);
    const avg = _.mean(numbers);
    const shuffled = _.shuffle(numbers);
    
    console.log(JSON.stringify({ 
      success: true, 
      sum, 
      average: avg,
      shuffled 
    }));
  } catch (error) {
    console.log(JSON.stringify({ success: false, error: error && error.message ? error.message : String(error) }));
  }
})();
</code>

✅ CORRECT - Multiple npm packages (moment + axios):
<code>
(async () => {
  const { execSync } = require('child_process');
  execSync('npm install moment axios', { stdio: 'pipe' });
  const moment = require('moment');
  const axios = require('axios');
  
  try {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const relative = moment().subtract(5, 'days').fromNow();
    const response = await axios.get('https://api.github.com/users/github');
    
    console.log(JSON.stringify({ 
      success: true, 
      timestamp: now,
      relative: relative,
      github: {
        name: response.data.name,
        followers: response.data.followers
      }
    }));
  } catch (error) {
    console.log(JSON.stringify({ success: false, error: error && error.message ? error.message : String(error) }));
  }
})();
</code>

✅ ALSO CORRECT - Plain text output (when appropriate):
<code>
try {
  const text = "hello world";
  const reversed = text.split('').reverse().join('');
  console.log(reversed);
} catch (error) {
  console.log(\`Error: \${error && error.message ? error.message : String(error)}\`);
}
</code>

✅ ALSO CORRECT - Multiple operations:
<code>
try {
  const items = [1, 2, 3, 4, 5];
  console.log('Processing items...');
  items.forEach(item => console.log(\`Item: \${item}\`));
  console.log('Done!');
} catch (error) {
  console.log(\`Error: \${error && error.message ? error.message : String(error)}\`);
}
</code>

✅ PERFECT EXAMPLE - FizzBuzz (outputs actual results clearly):
<code>
try {
  // Generate FizzBuzz for 1-100
  for (let i = 1; i <= 100; i++) {
    if (i % 15 === 0) {
      console.log('FizzBuzz');
    } else if (i % 3 === 0) {
      console.log('Fizz');
    } else if (i % 5 === 0) {
      console.log('Buzz');
    } else {
      console.log(i);
    }
  }
} catch (error) {
  console.log(\`Error: \${error && error.message ? error.message : String(error)}\`);
}
</code>

❌ WRONG - No output at all:
<code>
const result = calculate();
</code>

❌ WRONG - Requiring before installing:
<code>
const _ = require('lodash');
execSync('npm install lodash');
</code>

❌ WRONG - Forgetting IIFE wrapper for require():
<code>
const { execSync } = require('child_process');
execSync('npm install lodash');
</code>

REMEMBER:
- Write PLAIN JAVASCRIPT - avoid TypeScript unless truly necessary
- Keep code MINIMAL - avoid comments unless explaining complex "why"
- Always produce SOME output so we can verify execution
- Use JSON for structured data, plain text for simple outputs
- For npm packages: wrap in (async () => { ... })() and install BEFORE require
- Common packages available: lodash, moment, axios, uuid, date-fns, ramda, etc.

Generate clean, minimal JavaScript code that will execute without errors.`;

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
        component: 'codegen',  // Use component-specific URL if configured
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
// Use ERA orchestrator instead: import { orchestrate } from '../core/fbi.ts'
// Run tests with: deno task test


