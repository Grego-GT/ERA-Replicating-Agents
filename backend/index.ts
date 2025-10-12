/**
 * Backend Module Index
 * 
 * This file serves as the main entry point for all backend functionality.
 * Import and export all backend modules from here.
 */

// Weave integration for AI tracing
import { 
  weave, 
  op, 
  init as initWeave,
  exampleTracedFunction,
  createTracedAICall 
} from './weave.ts';

// Daytona integration for code sandboxing
import {
  initDaytona,
  runCode,
  runMath,
  runDaytonaTest
} from './daytona.ts';

// Code generation (execution moved to FBI orchestrator)
import {
  generateCode
} from './codegen.ts';

// Wandb inference
import {
  chat,
  simpleChat,
  chatWithHistory,
  runWandbTest
} from './wandb.ts';

// FBI orchestrator - Agent workflow orchestration
import {
  orchestrate,
  run as orchestratorRun,
  testOrchestrator,
  type OrchestratorOptions,
  type OrchestratorResult
} from './fbi.ts';

// Session/Run data model (each run creates one AgentCreationHistory)
import type {
  AgentCreationHistory,
  GenerationAttempt,
  ExecutionResult as SessionExecutionResult,
  AgentFiles
} from '../history.ts';

// Export all backend modules
export {
  // Weave tracing
  weave,
  op,
  initWeave,
  exampleTracedFunction,
  createTracedAICall,
  // Daytona sandboxing
  initDaytona,
  runCode,
  runMath,
  runDaytonaTest,
  // Code generation
  generateCode,
  // Wandb inference
  chat,
  simpleChat,
  chatWithHistory,
  runWandbTest,
  // FBI orchestrator
  orchestrate,
  orchestratorRun,
  testOrchestrator,
  type OrchestratorOptions,
  type OrchestratorResult,
  // Session/Run data model types
  type AgentCreationHistory,
  type GenerationAttempt,
  type SessionExecutionResult,
  type AgentFiles
};

// Legacy backend object for backward compatibility
export const backend = {
  weave: {
    init: initWeave,
    op,
    createTracedAICall,
    example: exampleTracedFunction
  },
  daytona: {
    init: initDaytona,
    run: runCode,
    math: runMath,
    test: runDaytonaTest
  },
  codegen: {
    generate: generateCode
  },
  wandb: {
    chat,
    simpleChat,
    chatWithHistory,
    test: runWandbTest
  },
  fbi: {
    orchestrate,
    run: orchestratorRun,
    test: testOrchestrator
  },
  placeholder: () => {
    console.log('Backend module placeholder');
  }
};

