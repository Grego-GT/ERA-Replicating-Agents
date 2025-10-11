/**
 * History Metadata Generator
 * 
 * Type definitions and utilities for tracking agent creation runs.
 * This module captures comprehensive metadata for each agent creation loop.
 */

// ============================================================================
// Core Types
// ============================================================================
/**
 * Code generation attempt information
 */
export interface GenerationAttempt {
  /** Attempt number (1-indexed) */
  attemptNumber: number;
  /** ISO timestamp of attempt */
  timestamp: string;
  /** Whether code extraction was successful */
  extractionSuccess: boolean;
  /** Raw LLM response */
  rawResponse?: string;
  /** Extracted code (if successful) */
  extractedCode?: string;
  /** Error message (if failed) */
  error?: string;
  /** Recommendation for next run */
  recommendation?: string;
  /** Prompt used */
  prompt?: string;
  /** Execution results from daytona */
  execution?: ExecutionResult;
}

/**
 * Code execution result from Daytona sandbox
 */
export interface ExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  /** Execution output/result */
  output?: string;
  /** Execution error (if failed) */
  error?: string;
  /** Exit code */
  exitCode?: number;
}
/**
 * Agent file information
 */
export interface AgentFiles {
  /** Path to agent index file */
  indexFile: string;
  /** Path to metadata file */
  metadataFile?: string;
}
/**
 * Comprehensive metadata for a single agent creation run
 */
export interface AgentCreationHistory {
  // ========================================
  // Basic Information
  // ========================================
  
  /** Unique identifier for this run */
  versionID: string;
  /** Agent name */
  agentName: string;
  /** User's original prompt */
  ogprompt: string;
  /** When the run started (ISO string) */
  // ========================================
  // AI Generation Details (if applicable)
  // ========================================
  /** All metadata of generation attempts of this agent creation */
  attempts?: GenerationAttempt[];
  /** System prompt used */
  systemPrompt?: string;
  /** Judging Criteria */
  judgingCriteria?: string;
  /** Whether code was executed in sandbox */
  wasExecuted?: boolean;
  // ========================================
  // Output & Files
  // ========================================
  /** Information about generated files */
  files: AgentFiles;
  /** Final code that was saved */
  finalCode: string;
// ========================================
  /** Error message if run failed */
  error?: string;
  /** Stack trace if available */
  stackTrace?: string;
  // ========================================
  // Logging & Tracing
  // ========================================
  /** Weave trace ID (if applicable) */
  weaveTraceId?: string;
  /** Wandb project name (if applicable) */
  wandbProject?: string;
}