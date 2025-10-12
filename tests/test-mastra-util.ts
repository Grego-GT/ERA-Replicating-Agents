/**
 * Test Mastra Agent Framework Utility Integration
 * 
 * This test verifies that the Mastra utility documentation and examples
 * are properly structured for injection into generated agents.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  MASTRA_API_DOCS,
  MASTRA_COMPLETE_EXAMPLE,
  MASTRA_NODE_UTIL,
  MASTRA_NPM_DEPS,
} from "../utils/mastra/examples.ts";

console.log("🧪 Testing Mastra Agent Framework Utility Integration\n");

// ============================================================================
// Test 1: Verify NPM dependencies are defined
// ============================================================================

console.log("Test 1: NPM Dependencies");
assertExists(MASTRA_NPM_DEPS, "MASTRA_NPM_DEPS should be defined");
assertEquals(
  Array.isArray(MASTRA_NPM_DEPS),
  true,
  "MASTRA_NPM_DEPS should be an array"
);
assertEquals(
  MASTRA_NPM_DEPS.length > 0,
  true,
  "MASTRA_NPM_DEPS should contain at least one dependency"
);
console.log(`✓ Found ${MASTRA_NPM_DEPS.length} NPM dependencies`);
console.log(`  Dependencies: ${MASTRA_NPM_DEPS.join(", ")}\n`);

// ============================================================================
// Test 2: Verify Node.js utility code is valid
// ============================================================================

console.log("Test 2: Node.js Utility Code");
assertExists(MASTRA_NODE_UTIL, "MASTRA_NODE_UTIL should be defined");
assertEquals(
  typeof MASTRA_NODE_UTIL,
  "string",
  "MASTRA_NODE_UTIL should be a string"
);

// Should contain key functions
const requiredFunctions = [
  "createMastra",
  "createAgent",
  "executeAgent",
  "createWorkflow",
  "executeWorkflow",
];

for (const fn of requiredFunctions) {
  assertEquals(
    MASTRA_NODE_UTIL.includes(fn),
    true,
    `MASTRA_NODE_UTIL should contain ${fn} function`
  );
}

console.log(`✓ Node.js utility code contains all required functions`);
console.log(`  Functions: ${requiredFunctions.join(", ")}\n`);

// ============================================================================
// Test 3: Verify API documentation is comprehensive
// ============================================================================

console.log("Test 3: API Documentation");
assertExists(MASTRA_API_DOCS, "MASTRA_API_DOCS should be defined");
assertEquals(
  typeof MASTRA_API_DOCS,
  "string",
  "MASTRA_API_DOCS should be a string"
);

// Should document all key functions
const requiredDocSections = [
  "createMastra",
  "createAgent",
  "executeAgent",
  "createWorkflow",
  "executeWorkflow",
  "Environment Variables",
  "Usage Examples",
  "Parameters:",
  "Returns:",
];

for (const section of requiredDocSections) {
  assertEquals(
    MASTRA_API_DOCS.includes(section),
    true,
    `API docs should document ${section}`
  );
}

console.log(`✓ API documentation is comprehensive`);
console.log(`  Sections: ${requiredDocSections.length}\n`);

// ============================================================================
// Test 4: Verify complete example is runnable
// ============================================================================

console.log("Test 4: Complete Example");
assertExists(
  MASTRA_COMPLETE_EXAMPLE,
  "MASTRA_COMPLETE_EXAMPLE should be defined"
);
assertEquals(
  typeof MASTRA_COMPLETE_EXAMPLE,
  "string",
  "MASTRA_COMPLETE_EXAMPLE should be a string"
);

// Should include npm install
assertEquals(
  MASTRA_COMPLETE_EXAMPLE.includes("npm install"),
  true,
  "Complete example should include npm install"
);

// Should include all utility functions
assertEquals(
  MASTRA_COMPLETE_EXAMPLE.includes(MASTRA_NODE_UTIL),
  true,
  "Complete example should include utility code"
);

// Should have example usage
assertEquals(
  MASTRA_COMPLETE_EXAMPLE.includes("async () => {"),
  true,
  "Complete example should have async example"
);

console.log(`✓ Complete example is properly structured\n`);

// ============================================================================
// Test 5: Verify core features are documented
// ============================================================================

console.log("Test 5: Core Features Documentation");

const coreFeatures = [
  "Agent",
  "Workflow",
  "memory",
  "tools",
];

for (const feature of coreFeatures) {
  assertEquals(
    MASTRA_API_DOCS.includes(feature),
    true,
    `API docs should document ${feature}`
  );
}

console.log(`✓ All core features are documented`);
console.log(`  Features: ${coreFeatures.join(", ")}\n`);

// ============================================================================
// Test 6: Verify code injection readiness
// ============================================================================

console.log("Test 6: Code Injection Readiness");

// Check that the utility can be extracted and injected
const utilityLines = MASTRA_NODE_UTIL.split("\n");
const hasAsyncFunction = utilityLines.some((line) =>
  line.includes("async function")
);
const hasRequire = utilityLines.some((line) =>
  line.includes("require(")
);

assertEquals(hasAsyncFunction, true, "Utility should have async functions");
assertEquals(hasRequire, true, "Utility should use require() for Node.js");

console.log(`✓ Utility code is ready for Daytona injection`);
console.log(`  - Uses Node.js require(): ${hasRequire}`);
console.log(`  - Contains async functions: ${hasAsyncFunction}\n`);

// ============================================================================
// Test 7: Verify agent and workflow patterns
// ============================================================================

console.log("Test 7: Agent and Workflow Patterns");

// Should demonstrate agent creation
assertEquals(
  MASTRA_API_DOCS.includes("createAgent"),
  true,
  "Should document agent creation"
);

// Should demonstrate workflow creation
assertEquals(
  MASTRA_API_DOCS.includes("createWorkflow"),
  true,
  "Should document workflow creation"
);

// Should show memory feature
assertEquals(
  MASTRA_API_DOCS.includes("memory"),
  true,
  "Should document memory feature"
);

// Should show tool calling
assertEquals(
  MASTRA_API_DOCS.includes("tools"),
  true,
  "Should document tool calling"
);

console.log(`✓ Agent and workflow patterns are documented\n`);

// ============================================================================
// Summary
// ============================================================================

console.log("=".repeat(60));
console.log("✅ All Mastra Agent Framework utility tests passed!");
console.log("=".repeat(60));
console.log("\n💡 Next steps:");
console.log("   1. Set OPENAI_API_KEY in .env (or other LLM provider key)");
console.log("   2. Try: deno task start:mastra");
console.log("   3. Or: deno task cli (and select Multi-Agent System template)");
console.log("   4. Learn more: https://docs.mastra.ai/\n");

