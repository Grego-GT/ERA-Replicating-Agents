/**
 * FBI - Agent Workflow Orchestrator
 * (FBI = "Federal Bureau of Intelligence" - a joke because these are "agents" 🕵️)
 * 
 * This module orchestrates the complete workflow of:
 * 0. FBI Director reviews and improves user prompts
 * 1. Taking user prompts
 * 2. Generating code via AI
 * 3. Executing code in sandbox
 * 
 * Each step is traced with Wandb Weave for observability.
 * This replaces the combined generateAndExecute function in codegen.ts,
 * keeping atomic operations separate while orchestrating them together.
 */

import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown
import { generateCode } from '../utils/codegen/index.ts';
import { runCode, type CodeRunResponse } from '../utils/daytona/index.ts';
import * as weave from '../utils/weave/index.ts';
import { improvePromptWithAI, getDirectorVerdict, generateAgentDescription, type PromptImprovementResult, type DirectorVerdict } from './director.ts';
import type { AgentCreationHistory, GenerationAttempt, ExecutionResult as SessionExecutionResult, AgentFiles } from '../history.ts';
import { injectUtilities } from '../utils/registry/index.ts';

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
  maxIterations?: number; // Max retry iterations for full generation+execution loop
  language?: string;
  model?: string;
  logCallback?: ((log: LogEntry) => void) | null;
  agentName?: string;
  systemPrompt?: string;
  judgingCriteria?: string;
}

/**
 * Complete orchestration result
 */
export interface OrchestratorResult {
  success: boolean;
  prompt: string;
  promptImprovement?: PromptImprovementResult;
  generation: GenerationResult;
  execution: ExecutionResult;
  logs: LogEntry[];
  duration: {
    director: number;
    generation: number;
    execution: number;
    total: number;
  };
  history: AgentCreationHistory;
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
 * 
 * Intelligently assesses both JSON and plain text outputs:
 * - If JSON with {"success": false}, treats as runtime error
 * - If contains compilation/syntax errors, treats as compilation error
 * - If Daytona errors, treats as sandbox error
 * - Otherwise, lets Director assess if output meets user intent (plain text or JSON)
 * 
 * Note: Empty/null output is not automatically an error - Director will judge based on context
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
  
  // Try to parse JSON output to check for runtime errors (if JSON is used)
  // But JSON is optional - plain text outputs are also valid
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
            // Only treat as error if JSON explicitly has success: false
            hasRuntimeError = parsedOutput.success === false;
            break;
          } catch {
            // Not valid JSON on this line, continue
          }
        }
      }
    }
  } catch (e) {
    // Not JSON or invalid JSON - that's okay, plain text is valid too
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
 * FBI Director: Prompt Strategist 🎯
 * Reviews and improves user prompts before sending to code generation
 * 
 * Uses AI to:
 * - Analyze prompt quality and clarity
 * - Add context and specificity
 * - Include examples and constraints
 * - Apply best practices for code generation
 * - Incorporate system prompt and judging criteria
 */
async function directorImprovePrompt(
  userPrompt: string,
  options?: {
    agentName?: string;
    systemPrompt?: string;
    judgingCriteria?: string;
    language?: string;
    previousAttempt?: {
      prompt?: string;
      code?: string;
      executionOutput?: string;
      executionError?: string;
      errorType?: string;
    };
  }
): Promise<PromptImprovementResult> {
  // Use the AI-powered prompt improvement from director.ts
  return await improvePromptWithAI(userPrompt, {
    agentName: options?.agentName,
    systemPrompt: options?.systemPrompt,
    judgingCriteria: options?.judgingCriteria,
    language: options?.language || 'typescript',
    previousAttempt: options?.previousAttempt
  });
}

/**
 * FBI Director Prompt Strategist (tracing handled at orchestrator level)
 */
const improvePromptWithDirector = directorImprovePrompt;

/**
 * FBI Agent: Code Generator 🤖
 * Interrogates the AI to generate code from user prompts
 */
async function agentGenerateCode(
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
 * FBI Agent Code Generator (tracing handled at orchestrator level)
 */
const generateCodeWithAgent = agentGenerateCode;

/**
 * FBI Agent: Code Executor 🔬
 * Runs suspect code in a secure sandbox for forensic analysis
 */
async function agentExecuteCode(
  code: string,
  language: string
): Promise<ExecutionResult> {
  try {
    // Code already has utilities injected at the orchestrator level
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
 * FBI Agent Code Executor (tracing handled at orchestrator level)
 */
const executeCodeInSandbox = agentExecuteCode;

/**
 * Generate a unique version ID for this agent creation session
 */
function generateVersionID(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `agent-${timestamp}-${random}`;
}

/**
 * FBI Field Office: Agent Dispatch 🕵️
 * The main case handler that coordinates all field agents
 * (Director reviews prompt, generates code, executes it, builds the case file)
 */
async function dispatchAgents(
  userPrompt: string,
  options: OrchestratorOptions = {}
): Promise<OrchestratorResult> {
  const {
    maxRetries = 3, // Retries for code generation extraction
    maxIterations = 3, // Full refinement iterations (director -> generate -> execute)
    language = 'typescript',
    model = Deno.env.get('AI_MODEL_FBI') || Deno.env.get('AI_MODEL') || "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    logCallback = null,
    agentName = 'unnamed-agent',
    systemPrompt = undefined,
    judgingCriteria = undefined
  } = options;
  
  const logs: LogEntry[] = [];
  const startTime = Date.now();
  const versionID = generateVersionID();
  
  // Initialize session/run data object (this ONE run creates ONE AgentCreationHistory)
  const sessionData: AgentCreationHistory = {
    versionID,
    agentName,
    ogprompt: userPrompt,
    timestamp: new Date().toISOString(),
    attempts: [],
    systemPrompt,
    judgingCriteria,
    wasExecuted: false,
    files: {
      indexFile: `agents/${agentName}/index.ts`,
      metadataFile: `agents/${agentName}/agent.json`
    },
    finalCode: ''
  };
  
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
    log('ERA orchestrator started', 'info', { 
      prompt: userPrompt,
      model,
      language,
      maxRetries,
      maxIterations,
      versionID 
    });
    
    // Track all iterations
    let totalDirectorDuration = 0;
    let totalGenDuration = 0;
    let totalExecDuration = 0;
    
    let lastPromptImprovement: PromptImprovementResult | undefined;
    let lastGeneration: GenerationResult | undefined;
    let lastExecution: ExecutionResult | undefined;
    
    // Main refinement loop
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const isFirstIteration = iteration === 1;
      const isLastIteration = iteration === maxIterations;
      
      log(`\n${'='.repeat(60)}`, 'info');
      log(`📍 Iteration ${iteration}/${maxIterations}`, 'info', { iteration, maxIterations });
      log(`${'='.repeat(60)}\n`, 'info');
      
      // Step 0: FBI Director reviews/refines the prompt
      log(`FBI Director ${isFirstIteration ? 'reviewing' : 'refining'} prompt...`, 'info');
      const directorStartTime = Date.now();
      
      const promptImprovement = await improvePromptWithDirector(userPrompt, {
        agentName,
        systemPrompt,
        judgingCriteria,
        language,
        // Pass previous attempt info for refinement (if not first iteration)
        previousAttempt: !isFirstIteration && lastExecution && lastGeneration ? {
          prompt: lastPromptImprovement?.improvedPrompt,
          code: lastGeneration.code,
          executionOutput: lastExecution.output,
          executionError: lastExecution.errorMessage,
          errorType: lastExecution.errorType || undefined
        } : undefined
      });
      const directorDuration = Date.now() - directorStartTime;
      totalDirectorDuration += directorDuration;
    
      if (!promptImprovement.success) {
        log('Prompt improvement failed, using original prompt', 'warning', {
          error: promptImprovement.error,
          iteration
        });
      } else {
        log(`FBI Director ${isFirstIteration ? 'reviewed' : 'refined'} prompt`, 'success', {
          originalLength: promptImprovement.originalPrompt.length,
          improvedLength: promptImprovement.improvedPrompt.length,
          hasImprovements: promptImprovement.improvements && promptImprovement.improvements.length > 0,
          hasRecommendation: !!promptImprovement.recommendation,
          duration: directorDuration,
          iteration
        });
        
        const feedback = promptImprovement.criticalFeedback || promptImprovement.recommendation;
        if (feedback) {
          log(`🔴 CRITICAL FEEDBACK: ${feedback.substring(0, 150)}...`, 'info');
        }
      }
      
      // Use the improved prompt (or original if improvement failed)
      const finalPrompt = promptImprovement.success ? promptImprovement.improvedPrompt : userPrompt;
      
      // Step 1: Generate code
      log('Generating code from prompt...', 'info');
      const genStartTime = Date.now();
      
      const generation = await generateCodeWithAgent(finalPrompt, maxRetries, model);
      const genDuration = Date.now() - genStartTime;
      totalGenDuration += genDuration;
      
      // Record generation attempt in session data
      const genAttempt: GenerationAttempt = {
        attemptNumber: iteration,
        timestamp: new Date().toISOString(),
        extractionSuccess: generation.success,
        rawResponse: generation.rawResponse,
        extractedCode: generation.code,
        error: generation.error,
        prompt: finalPrompt,
        recommendation: promptImprovement.criticalFeedback || promptImprovement.recommendation
      };
      sessionData.attempts?.push(genAttempt);
      
      // Log attempt to Weave for tracking
      log('Generation attempt recorded', 'info', {
        iteration,
        attemptNumber: genAttempt.attemptNumber,
        extractionSuccess: genAttempt.extractionSuccess,
        hasCode: !!genAttempt.extractedCode,
        versionID: sessionData.versionID
      });
      
      if (!generation.success) {
        log('Code generation failed', 'error', { 
          error: generation.error,
          attempts: generation.attempts,
          iteration
        });
        
        sessionData.error = generation.error || 'Code generation failed';
        
        // If this is the last iteration, return the failure
        if (isLastIteration) {
          return {
            success: false,
            prompt: userPrompt,
            promptImprovement,
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
              director: totalDirectorDuration,
              generation: totalGenDuration,
              execution: totalExecDuration,
              total: Date.now() - startTime
            },
            history: sessionData
          };
        }
        
        // Continue to next iteration
        lastPromptImprovement = promptImprovement;
        lastGeneration = generation;
        continue;
      }
      
      log('Code generated successfully', 'success', {
        attempts: generation.attempts,
        model: generation.model,
        codeLength: generation.code.length,
        iteration
      });
      
      // Auto-detect which utilities are used in the generated code
      const detectedUtilities: string[] = [];
      
      // Check for wandb usage
      if (generation.code.includes('wandbChat') || generation.code.includes('simpleChat')) {
        detectedUtilities.push('wandb');
      }
      
      // Check for weave usage (or always include for tracing)
      if (generation.code.includes('initWeave') || generation.code.includes('createTracedOp') || detectedUtilities.length > 0) {
        detectedUtilities.push('weave');
      }
      
      // Check for tavily usage
      if (generation.code.includes('tavilySearch') || generation.code.includes('tavilyQuickSearch')) {
        detectedUtilities.push('tavily');
      }
      
      // Check for browserbase/stagehand usage
      if (generation.code.includes('createStagehand') || generation.code.includes('Stagehand') || 
          generation.code.includes('extractFromPage') || generation.code.includes('observePage') || generation.code.includes('actOnPage')) {
        detectedUtilities.push('browserbase');
      }
      
      // Check for mastra usage
      if (generation.code.includes('createMastra') || generation.code.includes('createAgent') || 
          generation.code.includes('createWorkflow') || generation.code.includes('executeAgent') || generation.code.includes('executeWorkflow')) {
        detectedUtilities.push('mastra');
      }
      
      // Always include weave if we have any utilities (for tracing)
      if (detectedUtilities.length > 0 && !detectedUtilities.includes('weave')) {
        detectedUtilities.push('weave');
      }
      
      // Inject detected utilities into generated code before execution
      if (detectedUtilities.length > 0) {
        log(`Injecting utilities: ${detectedUtilities.join(', ')}`, 'info');
      }
      const codeWithUtils = await injectUtilities(generation.code, detectedUtilities);
      
      // Store the injected code in session data (this is what gets saved to disk)
      sessionData.finalCode = codeWithUtils;
      
      // Update the generation object to include injected code
      generation.code = codeWithUtils;
      
      // Step 2: Execute code (now with injected utilities)
      log('Executing code in Daytona sandbox...', 'info');
      const execStartTime = Date.now();
      
      const execution = await executeCodeInSandbox(codeWithUtils, language);
      const execDuration = Date.now() - execStartTime;
      totalExecDuration += execDuration;
      
      // Mark that execution was attempted
      sessionData.wasExecuted = true;
      
      // Record execution results in the current attempt
      const execResult: SessionExecutionResult = {
        success: execution.success,
        output: execution.output,
        error: execution.errorMessage
      };
      
      if (sessionData.attempts && sessionData.attempts.length > 0) {
        sessionData.attempts[sessionData.attempts.length - 1].execution = execResult;
      }
      
      // Log execution result to Weave for tracking
      log('Execution result recorded', 'info', {
        iteration,
        executionSuccess: execResult.success,
        hasOutput: !!execResult.output,
        errorType: execution.errorType,
        versionID: sessionData.versionID
      });
      
      // Store results for verdict and potential next iteration
      lastPromptImprovement = promptImprovement;
      lastGeneration = generation;
      lastExecution = execution;
      
      // Log execution status
      if (execution.hasError) {
        log(`Code execution failed: ${execution.errorType} error`, 'error', {
          errorType: execution.errorType,
          errorMessage: execution.errorMessage,
          output: execution.output.substring(0, 500),
          iteration
        });
        
        sessionData.error = execution.errorMessage || `Execution failed: ${execution.errorType}`;
      } else {
        log('Code executed successfully', 'success', {
          hasOutput: !!execution.output,
          parsedSuccess: execution.parsedOutput?.success,
          iteration
        });
      }
      
      // Ask FBI Director for verdict: Should we continue or stop?
      log('Consulting FBI Director for verdict...', 'info');
      
      // Build attempt history for Director's review
      const attemptHistory = (sessionData.attempts || []).map(att => ({
        iteration: att.attemptNumber,
        prompt: att.prompt || userPrompt,
        code: att.extractedCode || '',
        executionSuccess: att.execution?.success || false,
        executionOutput: att.execution?.output,
        executionError: att.execution?.error,
        errorType: execution.errorType || undefined
      }));
      
      const verdict = await getDirectorVerdict(userPrompt, attemptHistory, {
        maxIterations,
        currentIteration: iteration,
        language,
        model
      });
      
      log(`Director verdict: ${verdict.shouldRetry ? 'RETRY' : 'STOP'}`, verdict.shouldRetry ? 'info' : 'success', {
        shouldRetry: verdict.shouldRetry,
        reasoning: verdict.reasoning.substring(0, 100)
      });
      
      // If execution succeeded and Director says stop, or Director says stop regardless
      if (!verdict.shouldRetry) {
        if (execution.success) {
          log(`✅ Success achieved on iteration ${iteration}/${maxIterations}`, 'success');
        } else {
          log(`🛑 Director decided to stop despite errors (${verdict.reasoning.substring(0, 80)}...)`, 'warning');
        }
        break;
      }
      
      // If this is the last iteration, we must stop regardless of verdict
      if (isLastIteration) {
        log('Max iterations reached, returning last attempt', 'warning', { maxIterations });
        break;
      }
      
      // Director says retry - continue to next iteration
      log(`🔄 Director recommends another iteration (${verdict.reasoning.substring(0, 80)}...)`, 'info');
      continue;
    } // End of iteration loop
    
    // Step 3: Generate Agent Description
    log('Generating agent description...', 'info');
    const descriptionResult = await generateAgentDescription(
      agentName,
      userPrompt,
      sessionData.finalCode
    );
    
    if (descriptionResult.success) {
      sessionData.agentDescription = descriptionResult.description;
      log(`Agent description: "${descriptionResult.description}"`, 'success');
    } else {
      // Still save the fallback description
      sessionData.agentDescription = descriptionResult.description;
      log('Using fallback description', 'warning', { error: descriptionResult.error });
    }
    
    // Step 4: Complete
    const totalDuration = Date.now() - startTime;
    
    // Use the last attempt's results
    const finalPromptImprovement = lastPromptImprovement!;
    const finalGeneration = lastGeneration!;
    const finalExecution = lastExecution!;
    const overallSuccess = finalGeneration.success && finalExecution.success;
    
    log(
      overallSuccess ? 'Orchestration completed successfully' : 'Orchestration completed with errors',
      overallSuccess ? 'success' : 'warning',
      {
        success: overallSuccess,
        duration: totalDuration,
        versionID: sessionData.versionID,
        totalAttempts: sessionData.attempts?.length || 0,
        wasExecuted: sessionData.wasExecuted,
        hasDescription: !!sessionData.agentDescription
      }
    );
    
    // Log complete session data to Weave for analysis
    log('Session data summary', 'info', {
      versionID: sessionData.versionID,
      agentName: sessionData.agentName,
      totalAttempts: sessionData.attempts?.length || 0,
      finalCodeLength: sessionData.finalCode.length,
      wasExecuted: sessionData.wasExecuted,
      hasError: !!sessionData.error,
      overallSuccess
    });
    
    const result = {
      success: overallSuccess,
      prompt: userPrompt,
      promptImprovement: finalPromptImprovement,
      generation: finalGeneration,
      execution: finalExecution,
      logs,
      duration: {
        director: totalDirectorDuration,
        generation: totalGenDuration,
        execution: totalExecDuration,
        total: totalDuration
      },
      history: sessionData
    };
    
    // Log the complete session data to Weave as the trace output
    // This creates ONE trace with all session data visible
    console.log('📊 Trace complete - all session data logged to Weave');
    
    return result;
    
  } catch (error) {
    const err = error as Error;
    log('Orchestration failed with exception', 'error', {
      error: err.message,
      stack: err.stack
    });
    
    // Record error in session data
    sessionData.error = err.message;
    sessionData.stackTrace = err.stack;
    
    throw error;
  }
}

/**
 * FBI Case Handler: Orchestrate Mission 🎯
 * 
 * ⭐ SINGLE TRACE POINT - This is the ONLY function wrapped with weave.op()
 * 
 * Creates ONE trace per agent creation session containing:
 * - All iteration attempts with prompts, code, and execution results
 * - Director verdicts and recommendations
 * - Complete error information (500s, timeouts, Daytona errors, etc.)
 * - Full session metadata (AgentCreationHistory)
 * - Duration metrics for each phase
 * 
 * Workflow:
 * 0. FBI Director reviews and improves the prompt
 * 1. Agent generates code from improved prompt
 * 2. Agent executes code in secure sandbox
 * 3. Director makes verdict (retry or stop)
 * 4. Repeat or return complete case file
 * 
 * @param userPrompt - The user's prompt describing what they want
 * @param options - Configuration options
 * @returns Complete case file with all evidence in ONE trace
 */
export const orchestrate = weave.op(dispatchAgents);

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
 * Test the orchestrator with simple prompts (single iteration expected)
 */
export async function testOrchestratorSimple(): Promise<void> {
  console.log('🚀 Starting ERA orchestrator Simple Test (no refinement expected)...\n');
  
  // Initialize Weave for tracing
  console.log('🔍 Initializing Weave tracing...');
  await weave.init();
  console.log('');
  
  const simplePrompts = [
    'Create a function that calculates the factorial of 5 and outputs the result',
    'Generate code that reverses the string "hello world" and prints it',
    'Write code that sums all numbers from 1 to 100 and displays the total'
  ];
  
  console.log(`📋 Testing ${simplePrompts.length} simple prompt(s)\n`);
  
  for (let i = 0; i < simplePrompts.length; i++) {
    const prompt = simplePrompts[i];
    console.log('\n' + '='.repeat(60));
    console.log(`📋 Test ${i + 1}/${simplePrompts.length}: ${prompt}`);
    console.log('='.repeat(60) + '\n');
    
    try {
      const result = await orchestrate(prompt, {
        agentName: `simple-test-${i + 1}`,
        maxIterations: 1, // Only one iteration for simple tests
        logCallback: (log) => {
          // Additional logging if needed - these are already being logged
        }
      });
      
      console.log('\n📊 RESULT:');
      console.log('---');
      console.log(`Success: ${result.success}`);
      console.log(`Version ID: ${result.history.versionID}`);
      console.log(`Agent Name: ${result.history.agentName}`);
      console.log(`Total iterations: ${result.history.attempts?.length || 0}`);
      console.log(`Execution status: ${result.execution.success ? 'OK' : 'ERROR'}`);
      if (result.execution.errorType) {
        console.log(`Error type: ${result.execution.errorType}`);
      }
      
      console.log(`\n⏱️  Duration:`);
      console.log(`  - Director: ${result.duration.director}ms`);
      console.log(`  - Generation: ${result.duration.generation}ms`);
      console.log(`  - Execution: ${result.duration.execution}ms`);
      console.log(`  - Total: ${result.duration.total}ms`);
      
      if (result.promptImprovement) {
        console.log('\n🎯 Prompt Review:');
        console.log(`  - Original prompt length: ${result.promptImprovement.originalPrompt.length} chars`);
        console.log(`  - Improved prompt length: ${result.promptImprovement.improvedPrompt.length} chars`);
        if (result.promptImprovement.improvements && result.promptImprovement.improvements.length > 0) {
          console.log(`  - Improvements applied: ${result.promptImprovement.improvements.length}`);
        }
        const testFeedback = result.promptImprovement.criticalFeedback || result.promptImprovement.recommendation;
        if (testFeedback) {
          console.log(`  - Critical Feedback: ${testFeedback.substring(0, 80)}...`);
        }
      }
      
      console.log('\n📝 Session Data:');
      console.log(`  - Total attempts: ${result.history.attempts?.length || 0}`);
      console.log(`  - Was executed: ${result.history.wasExecuted}`);
      console.log(`  - Final code length: ${result.history.finalCode.length} chars`);
      console.log(`  - Has error: ${!!result.history.error}`);
      
      if (result.execution.parsedOutput) {
        console.log('\n✨ Parsed Output:');
        console.log(JSON.stringify(result.execution.parsedOutput, null, 2));
      }
      
      console.log('---\n');
      
    } catch (error) {
      const err = error as Error;
      console.error(`❌ Test failed: ${err.message}\n`);
    }
  }
  
  console.log('\n✅ Simple tests complete!\n');
  console.log('🔍 Check your Weave dashboard for traces: https://wandb.ai/\n');
}

/**
 * Test the orchestrator with complex/error-prone prompts (refinement expected)
 */
export async function testOrchestratorRefinement(): Promise<void> {
  console.log('🚀 Starting ERA orchestrator Refinement Test (errors expected, refinement should fix)...\n');
  
  // Initialize Weave for tracing
  console.log('🔍 Initializing Weave tracing...');
  await weave.init();
  console.log('');
  
  // These prompts are deliberately vague/error-prone to trigger refinement
  const complexPrompts = [
    'Sort an array', // Vague - should fail first, then refine to be more specific
    'Parse JSON from a string and handle errors', // Missing details about output format
    'Calculate fibonacci' // Missing which number, output format, etc.
  ];
  
  console.log(`📋 Testing ${complexPrompts.length} complex/vague prompt(s)\n`);
  console.log('💡 These prompts are intentionally vague to test refinement capabilities\n');
  
  for (let i = 0; i < complexPrompts.length; i++) {
    const prompt = complexPrompts[i];
    console.log('\n' + '='.repeat(80));
    console.log(`📋 Refinement Test ${i + 1}/${complexPrompts.length}: "${prompt}"`);
    console.log('='.repeat(80) + '\n');
    
    try {
      const result = await orchestrate(prompt, {
        agentName: `refinement-test-${i + 1}`,
        maxIterations: 3, // Allow up to 3 refinement iterations
        logCallback: (log) => {
          // Additional logging if needed - these are already being logged
        }
      });
      
      console.log('\n📊 RESULT:');
      console.log('---');
      console.log(`Success: ${result.success}`);
      console.log(`Version ID: ${result.history.versionID}`);
      console.log(`Agent Name: ${result.history.agentName}`);
      console.log(`Total iterations: ${result.history.attempts?.length || 0}`);
      console.log(`Execution status: ${result.execution.success ? 'OK' : 'ERROR'}`);
      if (result.execution.errorType) {
        console.log(`Error type: ${result.execution.errorType}`);
      }
      
      console.log(`\n⏱️  Duration:`);
      console.log(`  - Director: ${result.duration.director}ms`);
      console.log(`  - Generation: ${result.duration.generation}ms`);
      console.log(`  - Execution: ${result.duration.execution}ms`);
      console.log(`  - Total: ${result.duration.total}ms`);
      
      console.log('\n📝 Session Data:');
      console.log(`  - Total attempts: ${result.history.attempts?.length || 0}`);
      console.log(`  - Was executed: ${result.history.wasExecuted}`);
      console.log(`  - Final code length: ${result.history.finalCode.length} chars`);
      console.log(`  - Has error: ${!!result.history.error}`);
      
      if (result.history.attempts && result.history.attempts.length > 0) {
        console.log('\n🔄 Refinement Iterations:');
        result.history.attempts.forEach((attempt, idx) => {
          console.log(`\n  Iteration ${idx + 1}:`);
          console.log(`    - Extraction success: ${attempt.extractionSuccess}`);
          console.log(`    - Timestamp: ${attempt.timestamp}`);
          
          if (attempt.recommendation) {
            console.log(`    - 🔴 Critical Feedback: ${attempt.recommendation.substring(0, 100)}...`);
          }
          
          if (attempt.execution) {
            console.log(`    - Execution success: ${attempt.execution.success}`);
            if (!attempt.execution.success && attempt.execution.error) {
              console.log(`    - ❌ Error: ${attempt.execution.error.substring(0, 100)}...`);
            }
            console.log(`    - Output length: ${attempt.execution.output?.length || 0} chars`);
          }
          
          if (attempt.prompt) {
            console.log(`    - Prompt length: ${attempt.prompt.length} chars`);
          }
        });
      }
      
      console.log('\n💻 Final Generated Code (preview):');
      console.log(result.generation.code.substring(0, 300) + '...');
      
      console.log('\n📤 Final Execution Output:');
      console.log(result.execution.output.substring(0, 500));
      
      if (result.execution.parsedOutput) {
        console.log('\n✨ Parsed Output:');
        console.log(JSON.stringify(result.execution.parsedOutput, null, 2));
      }
      
      console.log('---\n');
      
    } catch (error) {
      const err = error as Error;
      console.error(`❌ Test failed: ${err.message}\n`);
    }
  }
  
  console.log('\n✅ Refinement tests complete!\n');
  console.log('🔍 Check your Weave dashboard for traces: https://wandb.ai/\n');
}

/**
 * Test the orchestrator (legacy function - runs simple tests)
 * 
 * @param customPrompts - Optional array of custom prompts to test
 */
export async function testOrchestrator(customPrompts?: string[]): Promise<void> {
  if (customPrompts && customPrompts.length > 0) {
    console.log('🚀 Starting ERA orchestrator Test with custom prompts...\n');
    
    // Initialize Weave for tracing
    console.log('🔍 Initializing Weave tracing...');
    await weave.init();
    console.log('');
    
    console.log(`📋 Testing ${customPrompts.length} custom prompt(s)\n`);
    
    for (let i = 0; i < customPrompts.length; i++) {
      const prompt = customPrompts[i];
      console.log('\n' + '='.repeat(60));
      console.log(`📋 Test ${i + 1}/${customPrompts.length}: ${prompt}`);
      console.log('='.repeat(60) + '\n');
      
      try {
        const result = await orchestrate(prompt, {
          agentName: `test-agent-${i + 1}`,
          maxIterations: 3,
          logCallback: (log) => {
            // Additional logging if needed - these are already being logged
          }
        });
        
        console.log('\n📊 RESULT:');
        console.log('---');
        console.log(`Success: ${result.success}`);
        console.log(`Total iterations: ${result.history.attempts?.length || 0}`);
        console.log(`Execution status: ${result.execution.success ? 'OK' : 'ERROR'}`);
        console.log('---\n');
        
      } catch (error) {
        const err = error as Error;
        console.error(`❌ Test failed: ${err.message}\n`);
      }
    }
    
    console.log('\n✅ Custom tests complete!\n');
  } else {
    // No custom prompts - run simple tests
    await testOrchestratorSimple();
  }
}

// If run directly, execute tests
if (import.meta.main) {
  // Check for command-line arguments
  const args = Deno.args;
  
  // Check for test type flag
  const testType = args[0];
  
  if (testType === 'refinement' || testType === '--refinement') {
    // Run refinement tests (vague prompts that require iteration)
    console.log('🔧 Running refinement tests (error-prone prompts)\n');
    testOrchestratorRefinement();
  } else if (testType === 'simple' || testType === '--simple') {
    // Run simple tests (clear prompts that should work first try)
    console.log('🔧 Running simple tests (clear prompts)\n');
    testOrchestratorSimple();
  } else if (args.length > 0 && !testType.startsWith('--')) {
    // Use provided prompts from command line
    console.log('🔧 Running with custom prompts from command line\n');
    testOrchestrator(args);
  } else {
    // Default: run simple tests
    console.log('🔧 Running default simple tests\n');
    console.log('💡 Use: deno task test:fbi refinement  - for refinement tests');
    console.log('💡 Use: deno task test:fbi simple      - for simple tests');
    console.log('💡 Use: deno task test:fbi "prompt"    - for custom prompts\n');
    testOrchestrator();
  }
}

