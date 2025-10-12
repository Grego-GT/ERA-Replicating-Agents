/**
 * Test: FBI Prep Integration
 * 
 * Demonstrates how the new architecture allows ERA orchestrator
 * to be used from different contexts (tests, APIs, CLI, etc.)
 * without being coupled to file I/O operations.
 */

import { orchestrate } from '../core/fbi.ts';
import { prepareAgentFiles } from '../core/prep.ts';
import * as weave from '../utils/weave/index.ts';

// ============================================================================
// Test 1: Separate Orchestration and File Prep
// ============================================================================

/**
 * Shows how orchestration and file preparation are now separate concerns.
 * This allows you to:
 * - Run orchestrator without saving files (e.g., for validation/testing)
 * - Save to different locations (e.g., different base directories)
 * - Process results before saving (e.g., additional validation)
 */
export async function testSeparateOrchestrateAndPrep(): Promise<void> {
  console.log('🧪 Test 1: Separate Orchestration and File Preparation\n');
  
  // Initialize Weave for tracing
  await weave.init();
  
  // Step 1: Run orchestrator (no file I/O)
  console.log('📍 Step 1: Running ERA orchestrator (no file operations)...');
  const result = await orchestrate('Create a function that calculates fibonacci(10)', {
    agentName: 'test-fibonacci',
    maxIterations: 1
  });
  
  console.log(`✅ Orchestration complete: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   Code length: ${result.generation.code.length} chars`);
  console.log(`   Execution status: ${result.execution.success ? 'OK' : 'ERROR'}`);
  
  // Step 2: Optionally validate/process results
  console.log('\n📍 Step 2: Validating results before saving...');
  if (!result.success) {
    console.log('❌ Validation failed, not saving files');
    return;
  }
  console.log('✅ Validation passed');
  
  // Step 3: Save files (separate operation)
  console.log('\n📍 Step 3: Preparing files...');
  const prepResult = await prepareAgentFiles(result);
  
  if (prepResult.success) {
    console.log(`✅ Files saved:`);
    console.log(`   - ${prepResult.files.indexFile}`);
    console.log(`   - ${prepResult.files.metadataFile}`);
  } else {
    console.log(`❌ File preparation failed: ${prepResult.error}`);
  }
  
  console.log('\n✨ Test 1 complete!\n');
}

// ============================================================================
// Test 2: API-Style Usage (No File I/O)
// ============================================================================

/**
 * Shows how you can use ERA orchestrator in an API context
 * where you want to return results but not save files.
 * 
 * Example: A web API that validates agent code on-demand
 */
export async function testAPIUsage(): Promise<void> {
  console.log('🧪 Test 2: API-Style Usage (No File I/O)\n');
  
  await weave.init();
  
  console.log('📍 Simulating API request to validate agent code...');
  
  const result = await orchestrate('Write code that prints "Hello API"', {
    agentName: 'api-test-agent',
    maxIterations: 1
  });
  
  // In a real API, you'd return this as JSON
  const apiResponse = {
    success: result.success,
    code: result.generation.code,
    executionOutput: result.execution.output,
    executionSuccess: result.execution.success,
    metadata: {
      model: result.generation.model,
      attempts: result.generation.attempts,
      duration: result.duration.total,
      versionID: result.history.versionID
    }
  };
  
  console.log('\n📤 API Response:');
  console.log(JSON.stringify(apiResponse, null, 2));
  
  console.log('\n✅ No files were created - perfect for API usage!');
  console.log('✨ Test 2 complete!\n');
}

// ============================================================================
// Test 3: Batch Processing with Custom Base Directory
// ============================================================================

/**
 * Shows how you can now easily save agents to different directories
 * (e.g., for different users, projects, or environments)
 */
export async function testCustomBaseDirectory(): Promise<void> {
  console.log('🧪 Test 3: Custom Base Directory\n');
  
  await weave.init();
  
  const prompt = 'Create a function that returns the current timestamp';
  
  console.log(`📍 Creating agent in custom directory: test-agents/...`);
  
  const result = await orchestrate(prompt, {
    agentName: 'timestamp-agent',
    maxIterations: 1
  });
  
  // Save to a custom directory
  const prepResult = await prepareAgentFiles(result, {
    baseDir: 'test-agents', // Custom directory instead of 'agents'
    overwrite: true
  });
  
  if (prepResult.success) {
    console.log(`✅ Agent saved to custom directory:`);
    console.log(`   - ${prepResult.files.indexFile}`);
    console.log(`   - ${prepResult.files.metadataFile}`);
  }
  
  console.log('\n✨ Test 3 complete!\n');
}

// ============================================================================
// Test 4: Multiple Agents with Different Configurations
// ============================================================================

/**
 * Shows how you can create multiple agents with different configurations
 */
export async function testMultipleAgents(): Promise<void> {
  console.log('🧪 Test 4: Multiple Agents with Different Configurations\n');
  
  await weave.init();
  
  const agents = [
    { prompt: 'Calculate sum of 1 to 10', name: 'sum-calculator' },
    { prompt: 'Generate random number between 1-100', name: 'random-generator' }
  ];
  
  console.log(`📍 Creating ${agents.length} agents in parallel...\n`);
  
  const results = await Promise.all(
    agents.map(async ({ prompt, name }) => {
      console.log(`   Creating ${name}...`);
      const orchestration = await orchestrate(prompt, {
        agentName: name,
        maxIterations: 1
      });
      
      const preparation = await prepareAgentFiles(orchestration, {
        baseDir: 'test-agents'
      });
      
      return { name, orchestration, preparation };
    })
  );
  
  console.log('\n📊 Results:');
  results.forEach(({ name, orchestration, preparation }) => {
    console.log(`   ${name}:`);
    console.log(`      Orchestration: ${orchestration.success ? '✅' : '❌'}`);
    console.log(`      Files: ${preparation.success ? '✅' : '❌'}`);
  });
  
  console.log('\n✨ Test 4 complete!\n');
}

// ============================================================================
// Run All Tests
// ============================================================================

export async function runAllTests(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 FBI Prep Integration Tests');
  console.log('='.repeat(60) + '\n');
  
  try {
    await testSeparateOrchestrateAndPrep();
    await testAPIUsage();
    await testCustomBaseDirectory();
    await testMultipleAgents();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests complete!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests if called directly
if (import.meta.main) {
  runAllTests();
}

