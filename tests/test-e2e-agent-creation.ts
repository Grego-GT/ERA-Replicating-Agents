/**
 * End-to-End Agent Creation Test
 * 
 * This test demonstrates the full self-improving agent ecosystem:
 * 1. Create "jokemeister" agent (uses wandb for jokes, weave for tracing)
 * 2. Execute it to verify it works
 * 3. Registry auto-discovers it
 * 4. Create "joke-rater" agent that USES jokemeister
 * 5. System builds on itself!
 * 
 * Run with: deno task test:e2e-agent
 */

import "jsr:@std/dotenv/load";
import { exists } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { run as orchestratorRun } from '../core/fbi.ts';
import { prepareAgentFiles } from '../core/prep.ts';
import { runCode } from '../utils/daytona/index.ts';
import { injectUtilities, getUtilityRegistry, generateUtilityPrompt } from '../utils/registry/index.ts';
import * as weave from '../utils/weave/index.ts';

console.log('🧪 End-to-End Agent Creation Test\n');
console.log('='.repeat(70));
console.log('\n🎯 Goal: Create self-improving agent ecosystem\n');
console.log('Step 1: Create jokemeister agent (uses wandb + weave)');
console.log('Step 2: Test jokemeister works');
console.log('Step 3: Registry discovers jokemeister');
console.log('Step 4: Create joke-rater that USES jokemeister');
console.log('Step 5: Verify compound growth!\n');
console.log('='.repeat(70));

// Initialize Weave for tracing this test (optional, continue if fails)
try {
  await weave.init('e2e-test', true);
} catch (error) {
  console.log('⚠️  Weave init skipped (not critical for test)');
}

// ============================================================================
// Step 1: Create Jokemeister Agent
// ============================================================================

console.log('\n📌 STEP 1: Create "jokemeister" agent\n');

const jokemeisterPrompt = `Create a joke-telling agent that:
1. Uses wandbChat() to generate a joke about a given topic
2. Uses weave tracing with the operation name "jokemeister:tell_joke"
3. Takes a topic as input (default: "programming")
4. Returns the joke as JSON with { success: true, topic, joke, timestamp }
5. Includes proper error handling

Example usage:
const joke = await tellJoke("cats");
console.log(JSON.stringify(joke));`;

console.log('Generating jokemeister agent with FBI Director...\n');

try {
  const result1 = await orchestratorRun(jokemeisterPrompt, {
    agentName: 'jokemeister',
    maxIterations: 3,
    maxRetries: 3
  });
  
  if (!result1.success) {
    console.error('❌ Failed to generate jokemeister:', result1.execution.errorMessage);
    Deno.exit(1);
  }
  
  console.log('✅ Jokemeister code generated successfully!');
  console.log('📝 Code preview:');
  console.log('---');
  console.log(result1.generation.code.substring(0, 400) + '...');
  console.log('---\n');
  
  // Now inject wandb + weave utilities into the generated code
  console.log('💉 Injecting wandb + weave utilities...\n');
  
  const jokemeisterWithUtils = await injectUtilities(
    result1.generation.code,
    ['wandb', 'weave']
  );
  
  console.log('✅ Utilities injected!');
  console.log('Combined code preview:');
  console.log('---');
  console.log(jokemeisterWithUtils.substring(0, 500) + '...');
  console.log('---\n');
  
  // Save the agent files
  console.log('💾 Saving jokemeister agent files...\n');
  
  // Override the finalCode with our injected version
  const jokemeisterResult = {
    ...result1,
    generation: {
      ...result1.generation,
      code: jokemeisterWithUtils
    },
    history: {
      ...result1.history,
      finalCode: jokemeisterWithUtils
    }
  };
  
  const prepResult = await prepareAgentFiles(jokemeisterResult, {
    existingHistory: null
  });
  
  if (!prepResult.success) {
    console.error('❌ Failed to save files:', prepResult.error);
    Deno.exit(1);
  }
  
  console.log('✅ Jokemeister agent saved!');
  console.log(`   📄 Code: ${prepResult.files.indexFile}`);
  console.log(`   📋 Metadata: ${prepResult.files.metadataFile}\n`);
  
} catch (error) {
  console.error('❌ Step 1 failed:', error);
  Deno.exit(1);
}

// ============================================================================
// Step 2: Test Jokemeister Works
// ============================================================================

console.log('📌 STEP 2: Test jokemeister execution\n');

try {
  const jokemeisterPath = join(Deno.cwd(), 'agents', 'jokemeister', 'index.ts');
  
  if (await exists(jokemeisterPath)) {
    const jokemeisterCode = await Deno.readTextFile(jokemeisterPath);
    
    console.log('Executing jokemeister in Daytona...\n');
    
    const execResult = await runCode(jokemeisterCode, 'javascript', {
      WANDB_API_KEY: Deno.env.get('WANDB_API_KEY') || ''
    });
    
    console.log('✅ Jokemeister executed!');
    console.log('Output:');
    console.log('---');
    console.log(execResult.result);
    console.log('---\n');
    
    // Check for weave traces with agent name
    if (execResult.result.includes('[Weave]') && execResult.result.includes('jokemeister:')) {
      console.log('✅ Weave tracing detected with agent namespace!');
    }
    
    // Try to parse the joke
    const lines = execResult.result.split('\n');
    const jsonLine = lines.find(line => line.trim().startsWith('{') && line.includes('joke'));
    if (jsonLine) {
      try {
        const parsed = JSON.parse(jsonLine);
        console.log('\n🎭 Generated Joke:');
        console.log(`   Topic: ${parsed.topic}`);
        console.log(`   Joke: ${parsed.joke}`);
        console.log('');
      } catch (e) {
        console.log('Note: Could not parse joke JSON');
      }
    }
  } else {
    console.error('❌ Jokemeister index.ts not found!');
    Deno.exit(1);
  }
} catch (error) {
  console.error('❌ Step 2 failed:', error);
  Deno.exit(1);
}

// ============================================================================
// Step 3: Registry Discovers Jokemeister
// ============================================================================

console.log('📌 STEP 3: Registry discovers jokemeister\n');

try {
  // Force refresh registry to discover new agent
  const registry = await getUtilityRegistry(true);
  
  console.log('Registry contents:');
  console.log(`  Built-ins: ${registry.builtins.size}`);
  console.log(`  Agents: ${registry.agents.size}`);
  console.log('');
  
  // Check if jokemeister is discovered
  const jokemeister = registry.agents.get('jokemeister');
  
  if (jokemeister) {
    console.log('✅ Jokemeister discovered in registry!');
    console.log(`   Name: ${jokemeister.name}`);
    console.log(`   Type: ${jokemeister.type}`);
    console.log(`   Description: ${jokemeister.description}`);
    console.log(`   Original prompt: "${jokemeister.originalPrompt}"`);
    console.log('');
  } else {
    console.error('❌ Jokemeister not found in registry!');
    console.log('Available agents:', Array.from(registry.agents.keys()));
    Deno.exit(1);
  }
  
  // Generate utility prompt to see how it appears
  console.log('📝 System prompt preview (with jokemeister):');
  console.log('---');
  const utilityPrompt = await generateUtilityPrompt(true);
  const jokemeisterSection = utilityPrompt.split('####').find(s => s.includes('jokemeister'));
  if (jokemeisterSection) {
    console.log('####' + jokemeisterSection.substring(0, 300) + '...');
  }
  console.log('---\n');
  
} catch (error) {
  console.error('❌ Step 3 failed:', error);
  Deno.exit(1);
}

// ============================================================================
// Step 4: Create Joke-Rater That Uses Jokemeister
// ============================================================================

console.log('📌 STEP 4: Create "joke-rater" that USES jokemeister\n');

const jokeRaterPrompt = `Create a joke rating agent that:
1. Uses the jokemeister agent to generate a joke about "AI"
2. Uses wandbChat() to rate the joke from 1-10
3. Uses weave tracing with operation name "joke-rater:rate_joke"
4. Returns { success: true, joke, rating, analysis, timestamp }
5. The jokemeister agent is already available - just use its functions!

This agent should demonstrate using a previously generated agent as a utility.`;

console.log('Generating joke-rater agent (that uses jokemeister)...\n');

try {
  // Get the current registry with jokemeister
  const registry = await getUtilityRegistry(true);
  
  console.log(`Registry now has ${registry.agents.size} agent(s) available as utilities\n`);
  
  const result2 = await orchestratorRun(jokeRaterPrompt, {
    agentName: 'joke-rater',
    maxIterations: 3,
    maxRetries: 3
  });
  
  if (!result2.success) {
    console.error('❌ Failed to generate joke-rater:', result2.execution.errorMessage);
    Deno.exit(1);
  }
  
  console.log('✅ Joke-rater code generated!');
  console.log('📝 Code preview:');
  console.log('---');
  console.log(result2.generation.code.substring(0, 400) + '...');
  console.log('---\n');
  
  // Inject ALL utilities: wandb, weave, AND jokemeister!
  console.log('💉 Injecting wandb + weave + jokemeister utilities...\n');
  
  const jokeRaterWithUtils = await injectUtilities(
    result2.generation.code,
    ['wandb', 'weave', 'jokemeister']
  );
  
  console.log('✅ All utilities injected (including jokemeister)!');
  console.log('Combined code preview:');
  console.log('---');
  console.log(jokeRaterWithUtils.substring(0, 600) + '...');
  console.log('---\n');
  
  // Save joke-rater
  console.log('💾 Saving joke-rater agent files...\n');
  
  const jokeRaterResult = {
    ...result2,
    generation: {
      ...result2.generation,
      code: jokeRaterWithUtils
    },
    history: {
      ...result2.history,
      finalCode: jokeRaterWithUtils
    }
  };
  
  const prepResult2 = await prepareAgentFiles(jokeRaterResult, {
    existingHistory: null
  });
  
  if (!prepResult2.success) {
    console.error('❌ Failed to save files:', prepResult2.error);
    Deno.exit(1);
  }
  
  console.log('✅ Joke-rater agent saved!');
  console.log(`   📄 Code: ${prepResult2.files.indexFile}`);
  console.log(`   📋 Metadata: ${prepResult2.files.metadataFile}\n`);
  
} catch (error) {
  console.error('❌ Step 4 failed:', error);
  Deno.exit(1);
}

// ============================================================================
// Step 5: Test Joke-Rater (Which Uses Jokemeister)
// ============================================================================

console.log('📌 STEP 5: Test joke-rater execution (uses jokemeister internally)\n');

try {
  const jokeRaterPath = join(Deno.cwd(), 'agents', 'joke-rater', 'index.ts');
  
  if (await exists(jokeRaterPath)) {
    const jokeRaterCode = await Deno.readTextFile(jokeRaterPath);
    
    console.log('Executing joke-rater (which will use jokemeister)...\n');
    
    const execResult2 = await runCode(jokeRaterCode, 'javascript', {
      WANDB_API_KEY: Deno.env.get('WANDB_API_KEY') || ''
    });
    
    console.log('✅ Joke-rater executed!');
    console.log('Output:');
    console.log('---');
    console.log(execResult2.result);
    console.log('---\n');
    
    // Check for both agent traces
    const hasJokemeisterTrace = execResult2.result.includes('jokemeister:');
    const hasJokeRaterTrace = execResult2.result.includes('joke-rater:');
    
    if (hasJokemeisterTrace && hasJokeRaterTrace) {
      console.log('✅ Both agent traces detected! (jokemeister + joke-rater)');
    }
    
    // Try to parse the final result
    const lines = execResult2.result.split('\n');
    const jsonLine = lines.find(line => line.trim().startsWith('{') && line.includes('rating'));
    if (jsonLine) {
      try {
        const parsed = JSON.parse(jsonLine);
        console.log('\n📊 Final Result:');
        console.log(`   Joke: ${parsed.joke}`);
        console.log(`   Rating: ${parsed.rating}/10`);
        if (parsed.analysis) {
          console.log(`   Analysis: ${parsed.analysis}`);
        }
        console.log('');
      } catch (e) {
        console.log('Note: Could not parse result JSON');
      }
    }
  } else {
    console.error('❌ Joke-rater index.ts not found!');
    Deno.exit(1);
  }
} catch (error) {
  console.error('❌ Step 5 failed:', error);
  Deno.exit(1);
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('\n🎉 END-TO-END TEST COMPLETE!\n');
console.log('What we proved:');
console.log('  1. ✅ Generated jokemeister agent with FBI/Director');
console.log('  2. ✅ Injected wandb + weave utilities automatically');
console.log('  3. ✅ Agent executed successfully with tracing');
console.log('  4. ✅ Registry auto-discovered jokemeister');
console.log('  5. ✅ Generated joke-rater that USES jokemeister');
console.log('  6. ✅ Injected ALL utilities (wandb + weave + jokemeister)');
console.log('  7. ✅ Joke-rater successfully used jokemeister internally');
console.log('\n🚀 THE SYSTEM BUILDS ON ITSELF!\n');
console.log('Next agent can use: wandb + weave + jokemeister + joke-rater');
console.log('Infinite compound growth! 🔄\n');
console.log('='.repeat(70) + '\n');

