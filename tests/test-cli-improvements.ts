#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

/**
 * Test CLI Improvements
 *
 * This test demonstrates the new CLI features:
 * 1. Interactive type selection (agents/ vs utils/)
 * 2. Smart defaults for continuation
 * 3. Visual distinction with color-coding
 * 4. Post-creation promotion prompt
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";

console.log("🧪 Testing CLI Improvements\n");

// Test 1: Verify helper functions exist in CLI
console.log("Test 1: Verify new helper functions are available");
try {
  // Read cli.ts and check for new functions
  const cliPath = join(Deno.cwd(), "cli.ts");
  const cliContent = await Deno.readTextFile(cliPath);

  const requiredFunctions = [
    "getExistingUtils",
    "detectEntityLocation",
  ];

  const missingFunctions = requiredFunctions.filter((fn) => !cliContent.includes(`function ${fn}`));

  if (missingFunctions.length === 0) {
    console.log("✅ All helper functions present\n");
  } else {
    console.log(`❌ Missing functions: ${missingFunctions.join(", ")}\n`);
  }
} catch (error) {
  console.log(`❌ Error reading cli.ts: ${error}\n`);
}

// Test 2: Verify interactive mode has type selection
console.log("Test 2: Verify interactive mode has type selection");
try {
  const cliPath = join(Deno.cwd(), "cli.ts");
  const cliContent = await Deno.readTextFile(cliPath);

  const hasTypeSelection = cliContent.includes("Where should this be created?");
  const hasSmartDetection = cliContent.includes("detectEntityLocation");
  const hasPromotionPrompt = cliContent.includes("Promote to utility now?");

  if (hasTypeSelection && hasSmartDetection && hasPromotionPrompt) {
    console.log("✅ Interactive mode has all new features");
    console.log("   - Type selection: ✓");
    console.log("   - Smart detection: ✓");
    console.log("   - Promotion prompt: ✓\n");
  } else {
    console.log("❌ Some features missing:");
    console.log(`   - Type selection: ${hasTypeSelection ? "✓" : "✗"}`);
    console.log(`   - Smart detection: ${hasSmartDetection ? "✓" : "✗"}`);
    console.log(`   - Promotion prompt: ${hasPromotionPrompt ? "✓" : "✗"}\n`);
  }
} catch (error) {
  console.log(`❌ Error verifying interactive mode: ${error}\n`);
}

// Test 3: Verify visual distinction with emojis
console.log("Test 3: Verify visual distinction with emojis");
try {
  const cliPath = join(Deno.cwd(), "cli.ts");
  const cliContent = await Deno.readTextFile(cliPath);

  const hasAgentEmoji = cliContent.includes("🧪");
  const hasUtilEmoji = cliContent.includes("🏗️");
  const hasColorCoding = cliContent.includes("themeColor");

  if (hasAgentEmoji && hasUtilEmoji && hasColorCoding) {
    console.log("✅ Visual distinction implemented");
    console.log("   - Agent emoji (🧪): ✓");
    console.log("   - Util emoji (🏗️): ✓");
    console.log("   - Color coding: ✓\n");
  } else {
    console.log("❌ Visual distinction incomplete\n");
  }
} catch (error) {
  console.log(`❌ Error verifying visual distinction: ${error}\n`);
}

// Test 4: Verify command-line flags
console.log("Test 4: Verify command-line flags support");
try {
  const cliPath = join(Deno.cwd(), "cli.ts");
  const cliContent = await Deno.readTextFile(cliPath);

  const hasUtilFlag = cliContent.includes("--util") || cliContent.includes("flags.util");
  const hasDryRunFlag = cliContent.includes("dry-run");
  const hasForceFlag = cliContent.includes("force");

  if (hasUtilFlag && hasDryRunFlag && hasForceFlag) {
    console.log("✅ All command-line flags supported");
    console.log("   - --util/--utility: ✓");
    console.log("   - --dry-run: ✓");
    console.log("   - --force: ✓\n");
  } else {
    console.log("❌ Some flags missing\n");
  }
} catch (error) {
  console.log(`❌ Error verifying flags: ${error}\n`);
}

console.log("═".repeat(60));
console.log("\n📋 Manual Testing Instructions:\n");
console.log("To fully test the interactive features, run:");
console.log("  deno task cli\n");
console.log("Expected workflow:");
console.log('  1. Enter a prompt (e.g., "create a greeting agent")');
console.log("  2. AI suggests a name");
console.log("  3. Choose between:");
console.log("     🧪 Experimental (agents/) - Test & iterate");
console.log("     🏗️ Stable Utility (utils/) - Production-ready\n");
console.log("  4. If successful agent:");
console.log("     → Offer refinement");
console.log("     → Offer promotion to utility\n");
console.log("  5. If continuing existing entity:");
console.log("     → Auto-detect location (agents/ or utils/)");
console.log("     → Skip type selection\n");
console.log("═".repeat(60));
