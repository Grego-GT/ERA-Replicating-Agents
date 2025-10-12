/**
 * Test Browserbase/Stagehand Utility Integration
 * 
 * This test verifies that the Browserbase utility documentation and examples
 * are properly structured for injection into generated agents.
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  STAGEHAND_API_DOCS,
  STAGEHAND_COMPLETE_EXAMPLE,
  STAGEHAND_NODE_UTIL,
  STAGEHAND_NPM_DEPS,
} from "../utils/browserbase/examples.ts";

console.log("🧪 Testing Browserbase/Stagehand Utility Integration\n");

// ============================================================================
// Test 1: Verify NPM dependencies are defined
// ============================================================================

console.log("Test 1: NPM Dependencies");
assertExists(STAGEHAND_NPM_DEPS, "STAGEHAND_NPM_DEPS should be defined");
assertEquals(
  Array.isArray(STAGEHAND_NPM_DEPS),
  true,
  "STAGEHAND_NPM_DEPS should be an array"
);
assertEquals(
  STAGEHAND_NPM_DEPS.length > 0,
  true,
  "STAGEHAND_NPM_DEPS should contain at least one dependency"
);
console.log(`✓ Found ${STAGEHAND_NPM_DEPS.length} NPM dependencies`);
console.log(`  Dependencies: ${STAGEHAND_NPM_DEPS.join(", ")}\n`);

// ============================================================================
// Test 2: Verify Node.js utility code is valid
// ============================================================================

console.log("Test 2: Node.js Utility Code");
assertExists(STAGEHAND_NODE_UTIL, "STAGEHAND_NODE_UTIL should be defined");
assertEquals(
  typeof STAGEHAND_NODE_UTIL,
  "string",
  "STAGEHAND_NODE_UTIL should be a string"
);

// Should contain key functions
const requiredFunctions = [
  "createStagehand",
  "extractFromPage",
  "observePage",
  "actOnPage",
];

for (const fn of requiredFunctions) {
  assertEquals(
    STAGEHAND_NODE_UTIL.includes(fn),
    true,
    `STAGEHAND_NODE_UTIL should contain ${fn} function`
  );
}

console.log(`✓ Node.js utility code contains all required functions`);
console.log(`  Functions: ${requiredFunctions.join(", ")}\n`);

// ============================================================================
// Test 3: Verify API documentation is comprehensive
// ============================================================================

console.log("Test 3: API Documentation");
assertExists(STAGEHAND_API_DOCS, "STAGEHAND_API_DOCS should be defined");
assertEquals(
  typeof STAGEHAND_API_DOCS,
  "string",
  "STAGEHAND_API_DOCS should be a string"
);

// Should document all key functions
const requiredDocSections = [
  "createStagehand",
  "extractFromPage",
  "observePage",
  "actOnPage",
  "Environment Variables",
  "Usage Examples",
  "Parameters:",
  "Returns:",
];

for (const section of requiredDocSections) {
  assertEquals(
    STAGEHAND_API_DOCS.includes(section),
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
  STAGEHAND_COMPLETE_EXAMPLE,
  "STAGEHAND_COMPLETE_EXAMPLE should be defined"
);
assertEquals(
  typeof STAGEHAND_COMPLETE_EXAMPLE,
  "string",
  "STAGEHAND_COMPLETE_EXAMPLE should be a string"
);

// Should include npm install
assertEquals(
  STAGEHAND_COMPLETE_EXAMPLE.includes("npm install"),
  true,
  "Complete example should include npm install"
);

// Should include all utility functions
assertEquals(
  STAGEHAND_COMPLETE_EXAMPLE.includes(STAGEHAND_NODE_UTIL),
  true,
  "Complete example should include utility code"
);

// Should have example usage
assertEquals(
  STAGEHAND_COMPLETE_EXAMPLE.includes("async () => {"),
  true,
  "Complete example should have async example"
);

console.log(`✓ Complete example is properly structured\n`);

// ============================================================================
// Test 5: Verify environment variables are documented
// ============================================================================

console.log("Test 5: Environment Variables Documentation");

const requiredEnvVars = [
  "BROWSERBASE_API_KEY",
  "BROWSERBASE_PROJECT_ID",
  "OPENAI_API_KEY",
];

for (const envVar of requiredEnvVars) {
  assertEquals(
    STAGEHAND_API_DOCS.includes(envVar),
    true,
    `API docs should document ${envVar}`
  );
}

console.log(`✓ All environment variables are documented`);
console.log(`  Env vars: ${requiredEnvVars.join(", ")}\n`);

// ============================================================================
// Test 6: Verify code injection readiness
// ============================================================================

console.log("Test 6: Code Injection Readiness");

// Check that the utility can be extracted and injected
const utilityLines = STAGEHAND_NODE_UTIL.split("\n");
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
// Summary
// ============================================================================

console.log("=".repeat(60));
console.log("✅ All Browserbase/Stagehand utility tests passed!");
console.log("=".repeat(60));
console.log("\n💡 Next steps:");
console.log("   1. Set BROWSERBASE_API_KEY in .env");
console.log("   2. Set BROWSERBASE_PROJECT_ID in .env");
console.log("   3. Set OPENAI_API_KEY in .env (or ANTHROPIC_API_KEY)");
console.log("   4. Try: deno task start:browserbase");
console.log("   5. Or: deno task cli (and select AI Web Browser template)\n");

