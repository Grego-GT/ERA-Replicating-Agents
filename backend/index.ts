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

// Code generation and execution
import {
  generateCode,
  generateAndExecute,
  testCodeGen
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
  testOrchestrator
} from './fbi.ts';

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
  generateAndExecute,
  testCodeGen,
  // Wandb inference
  chat,
  simpleChat,
  chatWithHistory,
  runWandbTest,
  // FBI orchestrator
  orchestrate,
  orchestratorRun,
  testOrchestrator
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
    generate: generateCode,
    execute: generateAndExecute,
    test: testCodeGen
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

