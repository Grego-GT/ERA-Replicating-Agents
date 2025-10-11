/**
 * FBI - Agent Workflow Orchestrator
 * (FBI = "Federal Bureau of Intelligence" - a joke because these are "agents" 🕵️)
 * 
 * This module orchestrates the complete workflow of:
 * 1. Taking user prompts
 * 2. Generating code via AI
 * 3. Executing code in sandbox
 * 
 * Each step is traced with Wandb Weave for observability.
 * This replaces the combined generateAndExecute function in codegen.ts,
 * keeping atomic operations separate while orchestrating them together.
 */

import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { generateCode } from './codegen.ts';
import { runCode, type CodeRunResponse } from './daytona.ts';
import * as weave from './weave.ts';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  [key: string]: unknown;
}

/**
 * Code generation result with metadata
 */
interface GenerationResult {
  success: boolean;
  code: string;
  rawResponse: string;
  attempts: number;
  model: string;
  error?: string;
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
 * Code execution result with analysis
 */
interface ExecutionResult {
  success: boolean;
  output: string;
  parsedOutput: ParsedExecutionOutput | null;
  hasError: boolean;
  errorType: 'compilation' | 'runtime' | 'daytona' | null;
  errorMessage?: string;
  raw: CodeRunResponse;
}

/**
 * Options for orchestrator
 */
export interface OrchestratorOptions {
  maxRetries?: number;
  language?: string;
  model?: string;
  logCallback?: ((log: LogEntry) => void) | null;
}

/**
 * Complete orchestration result
 */
export interface OrchestratorResult {
  success: boolean;
  prompt: string;
  generation: GenerationResult;
  execution: ExecutionResult;
  logs: LogEntry[];
  duration: {
    generation: number;
    execution: number;
    total: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a log entry
 */
function createLog(
  message: string, 
  level: 'info' | 'success' | 'warning' | 'error' = 'info',
  data: Record<string, unknown> = {}
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    message,
    level,
    ...data
  };
}

/**
 * Analyze execution output for errors
 */
function analyzeExecutionOutput(response: CodeRunResponse): ExecutionResult {
  const output = response.result || '';
  
  // Check for Daytona-specific errors
  const isDaytonaError = output.includes('DaytonaError') || 
                         output.includes('Sandbox Error') ||
                         output.includes('API Error');
  
  // Check for TypeScript compilation errors
  const isCompilationError = output.includes('error TS') || 
                             output.includes('SyntaxError:') ||
                             output.includes('Cannot find name');
  
  // Try to parse JSON output to check for runtime errors
  let parsedOutput: ParsedExecutionOutput | null = null;
  let hasRuntimeError = false;
  
  try {
    const trimmed = output.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      // Try to parse JSON
      const lines = trimmed.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          try {
            parsedOutput = JSON.parse(line) as ParsedExecutionOutput;
            hasRuntimeError = parsedOutput.success === false;
            break;
          } catch {
            // Not valid JSON on this line, continue
          }
        }
      }
    }
  } catch (e) {
    // Not JSON or invalid JSON, that's okay
  }
  
  const hasError = isDaytonaError || isCompilationError || hasRuntimeError;
  
  let errorType: 'compilation' | 'runtime' | 'daytona' | null = null;
  let errorMessage: string | undefined;
  
  if (hasError) {
    if (isDaytonaError) {
      errorType = 'daytona';
      errorMessage = output;
    } else if (isCompilationError) {
      errorType = 'compilation';
      errorMessage = output;
    } else if (hasRuntimeError && parsedOutput?.error) {
      errorType = 'runtime';
      errorMessage = parsedOutput.error;
    }
  }
  
  return {
    success: !hasError,
    output,
    parsedOutput,
    hasError,
    errorType,
    errorMessage,
    raw: response
  };
}

// ============================================================================
// Core Orchestration Functions (Internal Implementations)
// ============================================================================

/**
 * Generate code from user prompt (internal implementation)
 */
async function generateCodeStepImpl(
  prompt: string,
  maxRetries: number,
  model: string
): Promise<GenerationResult> {
  try {
    const result = await generateCode(prompt, maxRetries, model);
    return {
      success: result.success,
      code: result.code,
      rawResponse: result.rawResponse,
      attempts: result.attempts,
      model: result.model
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      code: '',
      rawResponse: '',
      attempts: maxRetries,
      model,
      error: err.message
    };
  }
}

/**
 * Generate code step with Weave tracing
 */
const generateCodeStep = weave.op(generateCodeStepImpl);

/**
 * Execute code in sandbox (internal implementation)
 */
async function executeCodeStepImpl(
  code: string,
  language: string
): Promise<ExecutionResult> {
  try {
    const response = await runCode(code, language);
    return analyzeExecutionOutput(response);
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      output: err.message,
      parsedOutput: null,
      hasError: true,
      errorType: 'daytona',
      errorMessage: err.message,
      raw: { result: err.message }
    };
  }
}

/**
 * Execute code step with Weave tracing
 */
const executeCodeStep = weave.op(executeCodeStepImpl);

/**
 * Main orchestrator workflow (internal implementation)
 */
async function orchestrateImpl(
  userPrompt: string,
  options: OrchestratorOptions = {}
): Promise<OrchestratorResult> {
  const {
    maxRetries = 3,
    language = 'typescript',
    model = "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    logCallback = null
  } = options;
  
  const logs: LogEntry[] = [];
  const startTime = Date.now();
  
  const log = (
    message: string, 
    level: 'info' | 'success' | 'warning' | 'error' = 'info',
    data: Record<string, unknown> = {}
  ): void => {
    const logEntry = createLog(message, level, data);
    logs.push(logEntry);
    
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`[${logEntry.timestamp}] ${icons[level]} ${message}`);
    
    if (logCallback) {
      logCallback(logEntry);
    }
  };
  
  try {
    log('FBI orchestrator started', 'info', { 
      prompt: userPrompt,
      model,
      language,
      maxRetries 
    });
    
    // Step 1: Generate code
    log('Generating code from prompt...', 'info');
    const genStartTime = Date.now();
    
    const generation = await generateCodeStep(userPrompt, maxRetries, model);
    const genDuration = Date.now() - genStartTime;
    
    if (!generation.success) {
      log('Code generation failed', 'error', { 
        error: generation.error,
        attempts: generation.attempts 
      });
      
      return {
        success: false,
        prompt: userPrompt,
        generation,
        execution: {
          success: false,
          output: '',
          parsedOutput: null,
          hasError: true,
          errorType: null,
          errorMessage: 'Code generation failed',
          raw: { result: '' }
        },
        logs,
        duration: {
          generation: genDuration,
          execution: 0,
          total: Date.now() - startTime
        }
      };
    }
    
    log('Code generated successfully', 'success', {
      attempts: generation.attempts,
      model: generation.model,
      codeLength: generation.code.length
    });
    
    // Step 2: Execute code
    log('Executing code in Daytona sandbox...', 'info');
    const execStartTime = Date.now();
    
    const execution = await executeCodeStep(generation.code, language);
    const execDuration = Date.now() - execStartTime;
    
    if (execution.hasError) {
      log(`Code execution failed: ${execution.errorType} error`, 'error', {
        errorType: execution.errorType,
        errorMessage: execution.errorMessage,
        output: execution.output.substring(0, 500)
      });
    } else {
      log('Code executed successfully', 'success', {
        hasOutput: !!execution.output,
        parsedSuccess: execution.parsedOutput?.success
      });
    }
    
    // Step 3: Complete
    const totalDuration = Date.now() - startTime;
    const overallSuccess = generation.success && execution.success;
    
    log(
      overallSuccess ? 'Orchestration completed successfully' : 'Orchestration completed with errors',
      overallSuccess ? 'success' : 'warning',
      {
        success: overallSuccess,
        duration: totalDuration
      }
    );
    
    return {
      success: overallSuccess,
      prompt: userPrompt,
      generation,
      execution,
      logs,
      duration: {
        generation: genDuration,
        execution: execDuration,
        total: totalDuration
      }
    };
    
  } catch (error) {
    const err = error as Error;
    log('Orchestration failed with exception', 'error', {
      error: err.message,
      stack: err.stack
    });
    throw error;
  }
}

/**
 * Main orchestrator workflow with Weave tracing
 * 
 * Orchestrates the complete workflow:
 * 1. Generate code from user prompt
 * 2. Execute code in Daytona sandbox
 * 3. Analyze and return results
 * 
 * @param userPrompt - The user's prompt describing what they want
 * @param options - Configuration options
 * @returns Complete orchestration result with all steps traced
 */
export const orchestrate = weave.op(orchestrateImpl);

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Run orchestrator with automatic Weave initialization
 * 
 * @param userPrompt - The user's prompt
 * @param options - Configuration options
 * @returns Complete orchestration result
 */
export async function run(
  userPrompt: string,
  options: OrchestratorOptions = {}
): Promise<OrchestratorResult> {
  // Ensure Weave is initialized
  await weave.ensureInitialized();
  
  // Run orchestration
  return await orchestrate(userPrompt, options);
}

// ============================================================================
// Testing
// ============================================================================

/**
 * Test the orchestrator
 * 
 * @param customPrompts - Optional array of custom prompts to test
 */
export async function testOrchestrator(customPrompts?: string[]): Promise<void> {
  console.log('🚀 Starting FBI Orchestrator Test...\n');
  
  // Initialize Weave for tracing
  console.log('🔍 Initializing Weave tracing...');
  await weave.init();
  console.log('');
  
  const defaultPrompts = [
    'Create a function that calculates the factorial of 5',
    'Generate code that reverses the string "hello world"',
    'Write code that sums all numbers from 1 to 100'
  ];
  
  const testPrompts = customPrompts && customPrompts.length > 0 ? customPrompts : defaultPrompts;
  
  console.log(`📋 Testing ${testPrompts.length} prompt(s)\n`);
  
  for (const prompt of testPrompts) {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 Testing: ${prompt}`);
    console.log('='.repeat(60) + '\n');
    
    try {
      const result = await orchestrate(prompt, {
        logCallback: (log) => {
          // Additional logging if needed
        }
      });
      
      console.log('\n📊 RESULT:');
      console.log('---');
      console.log(`Success: ${result.success}`);
      console.log(`Generation attempts: ${result.generation.attempts}`);
      console.log(`Execution status: ${result.execution.success ? 'OK' : 'ERROR'}`);
      if (result.execution.errorType) {
        console.log(`Error type: ${result.execution.errorType}`);
      }
      console.log(`\nDuration:`);
      console.log(`  - Generation: ${result.duration.generation}ms`);
      console.log(`  - Execution: ${result.duration.execution}ms`);
      console.log(`  - Total: ${result.duration.total}ms`);
      console.log('\nGenerated Code:');
      console.log(result.generation.code.substring(0, 300) + '...');
      console.log('\nExecution Output:');
      console.log(result.execution.output);
      console.log('---\n');
      
    } catch (error) {
      const err = error as Error;
      console.error(`❌ Test failed: ${err.message}\n`);
    }
  }
  
  console.log('\n✅ FBI Orchestrator tests complete!\n');
  console.log('🔍 Check your Weave dashboard for traces: https://wandb.ai/\n');
}

// If run directly, execute tests
if (import.meta.main) {
  // Check for command-line arguments
  const args = Deno.args;
  
  if (args.length > 0) {
    // Use provided prompts from command line
    console.log('🔧 Running with custom prompts from command line\n');
    testOrchestrator(args);
  } else {
    // Use default test prompts
    testOrchestrator();
  }
}

