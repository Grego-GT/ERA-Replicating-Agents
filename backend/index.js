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
  initWeave, 
  exampleTracedFunction,
  createTracedAICall 
} from './weave.js';

// Daytona integration for code sandboxing
import {
  initDaytona,
  runCode,
  runMath,
  runDaytonaTest
} from './daytona.js';

// Code generation and execution
import {
  generateCode,
  generateAndExecute,
  testCodeGen
} from './codegen.js';

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
  testCodeGen
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
  placeholder: () => {
    console.log('Backend module placeholder');
  }
};

