#!/usr/bin/env -S deno run --allow-read --allow-env

/**
 * Test Quick Start Templates
 *
 * This verifies that the quick-start templates are properly configured:
 * 1. Jokemeister template (WandbChat + Weave)
 * 2. Tavily Search template (Tavily web search)
 * 3. Custom agent option
 */

console.log("🚀 Testing Quick Start Templates\n");

// Test 1: Verify quick-start tasks exist in deno.json
console.log("Test 1: Verify quick-start tasks in deno.json");
try {
  const denoJsonPath = "./deno.json";
  const denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath));

  const requiredTasks = ["start:jokemeister", "start:tavily"];
  const missingTasks = requiredTasks.filter((task) => !denoJson.tasks[task]);

  if (missingTasks.length === 0) {
    console.log("✅ All quick-start tasks present");
    console.log("   - start:jokemeister: ✓");
    console.log("   - start:tavily: ✓");
  } else {
    console.log(`❌ Missing tasks: ${missingTasks.join(", ")}`);
  }
  console.log();
} catch (error) {
  console.log(`❌ Error reading deno.json: ${error}`);
  console.log();
}

// Test 2: Verify CLI has quick-start menu
console.log("Test 2: Verify CLI has quick-start menu");
try {
  const cliPath = "./cli.ts";
  const cliContent = await Deno.readTextFile(cliPath);

  const hasJokemeisterOption = cliContent.includes("Joke Generator") || cliContent.includes("jokemeister");
  const hasTavilyOption = cliContent.includes("Web Search Agent") || cliContent.includes("tavily-search");
  const hasCustomOption = cliContent.includes("Define Your Own");

  if (hasJokemeisterOption && hasTavilyOption && hasCustomOption) {
    console.log("✅ Quick-start menu implemented");
    console.log("   - Joke Generator option: ✓");
    console.log("   - Web Search option: ✓");
    console.log("   - Custom option: ✓");
  } else {
    console.log("❌ Some options missing:");
    console.log(`   - Joke Generator: ${hasJokemeisterOption ? "✓" : "✗"}`);
    console.log(`   - Web Search: ${hasTavilyOption ? "✓" : "✗"}`);
    console.log(`   - Custom: ${hasCustomOption ? "✓" : "✗"}`);
  }
  console.log();
} catch (error) {
  console.log(`❌ Error reading cli.ts: ${error}`);
  console.log();
}

// Test 3: Verify template configurations
console.log("Test 3: Verify template configurations");
try {
  const cliPath = "./cli.ts";
  const cliContent = await Deno.readTextFile(cliPath);

  // Check for template prompts
  const hasWandbChatMention = cliContent.includes("wandbChat");
  const hasTavilySearchMention = cliContent.includes("tavilySearch");
  const hasWeaveTracingMention = cliContent.includes("weave tracing");

  if (hasWandbChatMention && hasTavilySearchMention && hasWeaveTracingMention) {
    console.log("✅ Template utilities configured");
    console.log("   - WandbChat integration: ✓");
    console.log("   - Tavily search integration: ✓");
    console.log("   - Weave tracing integration: ✓");
  } else {
    console.log("❌ Some utilities not mentioned in templates");
  }
  console.log();
} catch (error) {
  console.log(`❌ Error verifying templates: ${error}`);
  console.log();
}

console.log("═".repeat(60));
console.log("\n📋 Usage Instructions:\n");
console.log("Interactive Mode:");
console.log("  deno task cli");
console.log("  → Choose from menu: Joke Generator, Web Search, or Custom\n");
console.log("Quick-Start Commands:");
console.log("  deno task start:jokemeister  # WandbChat + Weave demo");
console.log("  deno task start:tavily       # Tavily web search demo\n");
console.log("═".repeat(60));

console.log("\n✅ Quick-start templates test complete!\n");
console.log("💡 The templates demonstrate:");
console.log("   • 🎭 Jokemeister - AI chat with LLM observability");
console.log("   • 🔍 Web Researcher - Real-time web search with results");
console.log("   • ✨ Custom - Full flexibility with AI assistance");
