/**
 * Daytona.io Integration
 * 
 * This module provides Daytona sandbox functionality for code execution.
 * 
 * Usage:
 * - Import { initDaytona, runDaytonaTest } from this file
 * - Make sure DAYTONA_API_KEY and DAYTONA_API_URL are set in .env
 */

import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { Daytona } from 'npm:@daytonaio/sdk';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Daytona sandbox instance with process execution capabilities
 */
interface DaytonaSandbox {
  id: string;
  process: {
    codeRun: (code: string) => Promise<CodeRunResponse>;
  };
  remove?: () => Promise<void>;
  delete?: () => Promise<void>;
  destroy?: () => Promise<void>;
  [key: string]: unknown;
}

/**
 * Response from code execution
 */
export interface CodeRunResponse {
  result: string;
  [key: string]: unknown;
}

/**
 * Options for creating a Daytona sandbox
 */
interface CreateSandboxOptions {
  language?: string;
  envVars?: Record<string, string>;
}

/**
 * Math operation result
 */
interface MathResult {
  success: boolean;
  operation: string;
  answer: number;
  timestamp: string;
  raw: string;
}

/**
 * Math operation test case
 */
interface MathOperation {
  a: number;
  b: number;
  op: string;
  desc: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Initialize Daytona client with credentials from environment
 * 
 * @returns Configured Daytona instance
 */
export function initDaytona(): Daytona {
  const apiKey = Deno.env.get('DAYTONA_API_KEY');
  const apiUrl = Deno.env.get('DAYTONA_API_URL');
  
  if (!apiKey) {
    throw new Error('DAYTONA_API_KEY not found in environment');
  }
  
  console.log(`✅ Daytona initialized with API URL: ${apiUrl || 'default'}`);
  
  return new Daytona({
    apiKey,
    ...(apiUrl && { baseUrl: apiUrl })
  });
}

/**
 * Run code in a Daytona sandbox and get the console output
 * 
 * @param code - The JavaScript/TypeScript code to run
 * @param language - The language (default: 'typescript')
 * @param envVars - Optional environment variables to pass to the sandbox
 * @returns The execution result with stdout/stderr
 */
export async function runCode(
  code: string, 
  language: string = 'typescript',
  envVars?: Record<string, string>
): Promise<CodeRunResponse> {
  try {
    const daytona = initDaytona();
    
    // Create a sandbox with optional env vars
    const options: CreateSandboxOptions = { language };
    if (envVars) {
      options.envVars = envVars;
    }
    
    const sandbox = await daytona.create(options) as unknown as DaytonaSandbox;
    console.log(`✅ Sandbox created: ${sandbox.id}`);
    
    // Run the code
    const response = await sandbox.process.codeRun(code);
    
    // Clean up (try different methods)
    try {
      if (typeof sandbox.remove === 'function') {
        await sandbox.remove();
      } else if (typeof sandbox.delete === 'function') {
        await sandbox.delete();
      } else if (typeof sandbox.destroy === 'function') {
        await sandbox.destroy();
      }
      console.log('✅ Sandbox cleaned up');
    } catch (cleanupError) {
      const err = cleanupError as Error;
      console.warn('⚠️ Sandbox cleanup skipped:', err.message);
    }
    
    return response;
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ Code execution failed:', err);
    throw error;
  }
}

/**
 * Run a math operation in Daytona sandbox
 * 
 * @param a - First number
 * @param b - Second number
 * @param operator - Math operator (+, -, *, /, **, %)
 * @returns Result with answer and details
 */
export async function runMath(a: number, b: number, operator: string = '+'): Promise<MathResult> {
  try {
    const daytona = initDaytona();
    
    // Create a TypeScript sandbox
    const sandbox = await daytona.create({ language: 'typescript' }) as unknown as DaytonaSandbox;
    console.log(`✅ Sandbox created: ${sandbox.id}`);
    
    // Build the math code
    const code = `
      const calculate = (a: number, b: number, op: string): number => {
        switch(op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return a / b;
          case '**': return a ** b;
          case '%': return a % b;
          default: throw new Error('Invalid operator');
        }
      };
      
      const result = calculate(${a}, ${b}, '${operator}');
      console.log(JSON.stringify({
        operation: '${a} ${operator} ${b}',
        answer: result,
        timestamp: new Date().toISOString()
      }));
    `;
    
    // Run the code
    const response = await sandbox.process.codeRun(code);
    
    // Clean up (try different methods)
    try {
      if (typeof sandbox.remove === 'function') {
        await sandbox.remove();
      } else if (typeof sandbox.delete === 'function') {
        await sandbox.delete();
      } else if (typeof sandbox.destroy === 'function') {
        await sandbox.destroy();
      }
      console.log('✅ Sandbox cleaned up');
    } catch (cleanupError) {
      const err = cleanupError as Error;
      console.warn('⚠️ Sandbox cleanup skipped:', err.message);
    }
    
    // Parse the result
    const resultText = response.result;
    const parsed = JSON.parse(resultText) as { operation: string; answer: number; timestamp: string };
    
    return {
      success: true,
      ...parsed,
      raw: resultText
    };
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ Math calculation failed:', err);
    throw error;
  }
}

/**
 * Run a basic Daytona test with math operations
 * 
 * @returns Promise that resolves when tests complete
 */
export async function runDaytonaTest(): Promise<void> {
  console.log('🚀 Starting Daytona Math Test...\n');
  
  try {
    // Test different operations
    const operations: MathOperation[] = [
      { a: 10, b: 5, op: '+', desc: 'Addition' },
      { a: 20, b: 7, op: '-', desc: 'Subtraction' },
      { a: 6, b: 8, op: '*', desc: 'Multiplication' },
      { a: 100, b: 4, op: '/', desc: 'Division' },
      { a: 2, b: 10, op: '**', desc: 'Exponentiation' },
      { a: 17, b: 5, op: '%', desc: 'Modulo' }
    ];
    
    for (const { a, b, op, desc } of operations) {
      console.log(`🔧 ${desc}: ${a} ${op} ${b}`);
      const result = await runMath(a, b, op);
      console.log(`📝 Answer: ${result.answer}`);
      console.log(`⏰ Timestamp: ${result.timestamp}`);
      console.log('');
    }
    
    console.log('✅ All math tests completed successfully!\n');
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ Daytona test failed:', err);
    throw error;
  }
}

