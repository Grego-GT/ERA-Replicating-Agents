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
  /** Unique identifier for this run */
  versionID: string;
  /** Agent name */
  agentName: string;
  /** User's original prompt */
  ogprompt: string;
  /** When the run started (ISO string) */
  timestamp: string;
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
  // Error Handling
  // ========================================
  /** Error message if run failed */
  error?: string;
  /** Stack trace if available */
  stackTrace?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique version ID
 */
export function generateVersionId(): string {
  return `v1_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new history entry for the first run
 */
export function createHistoryEntry(
  agentName: string,
  prompt: string,
  systemPrompt?: string,
  judgingCriteria?: string
): AgentCreationHistory {
  return {
    versionID: generateVersionId(),
    agentName,
    ogprompt: prompt,
    timestamp: new Date().toISOString(),
    systemPrompt,
    judgingCriteria,
    attempts: [],
    wasExecuted: false,
    files: {
      indexFile: `agents/${agentName}/index.ts`,
      metadataFile: `agents/${agentName}/history.json`,
    },
    finalCode: "",
  };
}

/**
 * Add a generation attempt to history
 */
export function addAttempt(
  history: AgentCreationHistory,
  attempt: GenerationAttempt
): void {
  if (!history.attempts) {
    history.attempts = [];
  }
  history.attempts.push(attempt);
}

/**
 * Update the final code in history
 */
export function updateFinalCode(
  history: AgentCreationHistory,
  code: string
): void {
  history.finalCode = code;
}

/**
 * Mark execution as complete
 */
export function markExecuted(
  history: AgentCreationHistory,
  wasSuccessful: boolean
): void {
  history.wasExecuted = wasSuccessful;
}

/**
 * Add error information to history
 */
export function addError(
  history: AgentCreationHistory,
  error: Error | string
): void {
  history.error = typeof error === "string" ? error : error.message;
  if (error instanceof Error && error.stack) {
    history.stackTrace = error.stack;
  }
}

/**
 * Convert history to JSON for storage
 */
export function toJSON(history: AgentCreationHistory): string {
  return JSON.stringify(history, null, 2);
}

/**
 * Load history from JSON
 */
export function fromJSON(json: string): AgentCreationHistory {
  return JSON.parse(json) as AgentCreationHistory;
}

/**
 * Save history to a file
 */
export async function saveHistory(
  history: AgentCreationHistory,
  filePath: string
): Promise<void> {
  const json = toJSON(history);
  // Note: This function expects Deno environment
  // @ts-ignore - Deno global
  await Deno.writeTextFile(filePath, json);
}

/**
 * Load history from a file
 */
export async function loadHistory(filePath: string): Promise<AgentCreationHistory | null> {
  try {
    // @ts-ignore - Deno global
    const json = await Deno.readTextFile(filePath);
    return fromJSON(json);
  } catch {
    return null;
  }
}