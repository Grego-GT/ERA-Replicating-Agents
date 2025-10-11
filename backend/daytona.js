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

/**
 * Initialize Daytona client with credentials from environment
 * 
 * @returns {Daytona} Configured Daytona instance
 */
export function initDaytona() {
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
 * @param {string} code - The JavaScript/TypeScript code to run
 * @param {string} language - The language (default: 'typescript')
 * @returns {Promise<object>} The execution result with stdout/stderr
 */
export async function runCode(code, language = 'typescript') {
  try {
    const daytona = initDaytona();
    
    // Create a sandbox
    const sandbox = await daytona.create({ language });
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
      console.warn('⚠️ Sandbox cleanup skipped:', cleanupError.message);
    }
    
    return response;
    
  } catch (error) {
    console.error('❌ Code execution failed:', error);
    throw error;
  }
}

/**
 * Run a math operation in Daytona sandbox
 * 
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {string} operator - Math operator (+, -, *, /, **, %)
 * @returns {Promise<object>} Result with answer and details
 */
export async function runMath(a, b, operator = '+') {
  try {
    const daytona = initDaytona();
    
    // Create a TypeScript sandbox
    const sandbox = await daytona.create({ language: 'typescript' });
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
      console.warn('⚠️ Sandbox cleanup skipped:', cleanupError.message);
    }
    
    // Parse the result
    const resultText = response.result;
    const parsed = JSON.parse(resultText);
    
    return {
      success: true,
      ...parsed,
      raw: resultText
    };
    
  } catch (error) {
    console.error('❌ Math calculation failed:', error);
    throw error;
  }
}

/**
 * Run a basic Daytona test with math operations
 * 
 * @returns {Promise<void>}
 */
export async function runDaytonaTest() {
  console.log('🚀 Starting Daytona Math Test...\n');
  
  try {
    // Test different operations
    const operations = [
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
    console.error('❌ Daytona test failed:', error);
    throw error;
  }
}

// If run directly, execute the test
if (import.meta.main) {
  runDaytonaTest();
}

