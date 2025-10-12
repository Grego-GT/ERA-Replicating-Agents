/**
 * Browserbase/Stagehand Utility - Node.js Examples for Daytona Injection
 * 
 * This file provides Node.js-compatible Stagehand utilities
 * that can be injected into AI-generated agents running in Daytona sandboxes.
 */

// ============================================================================
// Node.js-Compatible Stagehand Utility (for injection into generated code)
// ============================================================================

export const STAGEHAND_NODE_UTIL = `
// Stagehand/Browserbase Utility - requires npm install @browserbasehq/stagehand zod
const { Stagehand } = require('@browserbasehq/stagehand');
const { z } = require('zod');

async function createStagehand(options: {
  apiKey?: string;
  projectId?: string;
  modelName?: 'gpt-4o' | 'claude-3-5-sonnet-latest';
  openaiApiKey?: string;
  anthropicApiKey?: string;
} = {}): Promise<any> {
  const apiKey = options.apiKey || process.env.BROWSERBASE_API_KEY;
  const projectId = options.projectId || process.env.BROWSERBASE_PROJECT_ID;
  const modelName = options.modelName || 'gpt-4o';
  
  if (!apiKey || !projectId) {
    throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required');
  }
  
  // Determine AI model API key
  let modelClientOptions: any = {};
  if (modelName === 'claude-3-5-sonnet-latest') {
    const anthropicKey = options.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY required for Claude model');
    }
    modelClientOptions.apiKey = anthropicKey;
  } else {
    const openaiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY required for GPT model');
    }
    modelClientOptions.apiKey = openaiKey;
  }
  
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey,
    projectId,
    modelName,
    modelClientOptions,
  });
  
  await stagehand.init();
  return stagehand;
}

// Helper to extract data from a page using AI
async function extractFromPage(stagehand: any, instruction: string, schema: any): Promise<any> {
  const result = await stagehand.page.extract({
    instruction,
    schema,
  });
  return result;
}

// Helper to observe possible actions on a page
async function observePage(stagehand: any, instruction: string): Promise<any[]> {
  const suggestions = await stagehand.page.observe(instruction);
  return suggestions;
}

// Helper to perform an action on a page
async function actOnPage(stagehand: any, action: string): Promise<void> {
  await stagehand.page.act(action);
}
`;

// ============================================================================
// NPM Dependencies for Stagehand
// ============================================================================

export const STAGEHAND_NPM_DEPS = ['@browserbasehq/stagehand', 'zod'];

// ============================================================================
// API Documentation for AI (teaches the AI how to use this utility)
// ============================================================================

export const STAGEHAND_API_DOCS = `
# Browserbase/Stagehand Utility

Stagehand is an AI web browsing framework built on Playwright, allowing you to interact with web pages using natural language. It runs on Browserbase's cloud browser infrastructure.

## Pre-loaded Functions

### createStagehand(options)
Creates and initializes a Stagehand session with Browserbase.

**Parameters:**
- \`options\` (object, optional):
  - \`apiKey\` (string): Browserbase API key (defaults to process.env.BROWSERBASE_API_KEY)
  - \`projectId\` (string): Browserbase Project ID (defaults to process.env.BROWSERBASE_PROJECT_ID)
  - \`modelName\` ('gpt-4o' | 'claude-3-5-sonnet-latest'): AI model for web actions (default: 'gpt-4o')
  - \`openaiApiKey\` (string): OpenAI API key for GPT models
  - \`anthropicApiKey\` (string): Anthropic API key for Claude models

**Returns:** Promise<Stagehand> - Initialized Stagehand instance with \`page\` property

**Example:**
\`\`\`typescript
const stagehand = await createStagehand({
  modelName: 'gpt-4o'
});
await stagehand.page.goto('https://example.com');
\`\`\`

### extractFromPage(stagehand, instruction, schema)
Extract structured data from a page using AI and Zod schema validation.

**Parameters:**
- \`stagehand\` (Stagehand): Initialized Stagehand instance
- \`instruction\` (string): Natural language instruction for what to extract
- \`schema\` (ZodObject): Zod schema defining the expected data structure

**Returns:** Promise<object> - Extracted data matching the schema

**Example:**
\`\`\`typescript
const { z } = require('zod');

const result = await extractFromPage(
  stagehand,
  "Extract the main heading and description",
  z.object({
    heading: z.string(),
    description: z.string()
  })
);
console.log(result.heading, result.description);
\`\`\`

### observePage(stagehand, instruction)
Preview possible actions on the page before executing them.

**Parameters:**
- \`stagehand\` (Stagehand): Initialized Stagehand instance
- \`instruction\` (string): Natural language description of what to look for

**Returns:** Promise<Array> - List of suggested actions with selectors

**Example:**
\`\`\`typescript
const suggestions = await observePage(stagehand, "find all clickable links");
console.log(suggestions); // [{ action: "click", selector: "a.nav-link", ... }]
\`\`\`

### actOnPage(stagehand, action)
Perform an action on the page using natural language or a suggested action.

**Parameters:**
- \`stagehand\` (Stagehand): Initialized Stagehand instance
- \`action\` (string | object): Natural language action or suggestion from observePage

**Returns:** Promise<void>

**Example:**
\`\`\`typescript
// Natural language action
await actOnPage(stagehand, "click the 'Get Started' button");

// Or use a suggestion
const suggestions = await observePage(stagehand, "find login button");
await actOnPage(stagehand, suggestions[0]);
\`\`\`

## Environment Variables Required

\`\`\`env
BROWSERBASE_API_KEY=bb_your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here
OPENAI_API_KEY=sk-your_openai_key_here
# OR for Claude:
ANTHROPIC_API_KEY=your_anthropic_key_here
\`\`\`

Get credentials from: https://www.browserbase.com/overview

## Usage Examples

### Basic Page Navigation and Extraction
\`\`\`typescript
const { z } = require('zod');

(async () => {
  const stagehand = await createStagehand({ modelName: 'gpt-4o' });
  
  // Navigate to a page
  await stagehand.page.goto('https://docs.stagehand.dev');
  
  // Extract information
  const { title, description } = await extractFromPage(
    stagehand,
    "Extract the page title and main description",
    z.object({
      title: z.string(),
      description: z.string()
    })
  );
  
  console.log('Title:', title);
  console.log('Description:', description);
  
  await stagehand.close();
})();
\`\`\`

### Observe Before Acting
\`\`\`typescript
(async () => {
  const stagehand = await createStagehand();
  await stagehand.page.goto('https://docs.browserbase.com');
  
  // Preview actions
  const suggestions = await observePage(stagehand, "find navigation links");
  console.log('Available actions:', suggestions);
  
  // Take action
  await actOnPage(stagehand, suggestions[0]);
  
  await stagehand.close();
})();
\`\`\`

### Complex Workflow: Search and Extract
\`\`\`typescript
const { z } = require('zod');

(async () => {
  const stagehand = await createStagehand({ modelName: 'gpt-4o' });
  
  // Navigate to search page
  await stagehand.page.goto('https://github.com');
  
  // Perform search
  await actOnPage(stagehand, "type 'stagehand' in the search box and press enter");
  
  // Wait for results
  await stagehand.page.waitForTimeout(2000);
  
  // Extract search results
  const results = await extractFromPage(
    stagehand,
    "Extract the top 3 repository names and descriptions",
    z.object({
      repositories: z.array(z.object({
        name: z.string(),
        description: z.string(),
        stars: z.string()
      }))
    })
  );
  
  console.log('Search Results:', results.repositories);
  
  await stagehand.close();
})();
\`\`\`

### Using Claude for AI Actions
\`\`\`typescript
(async () => {
  const stagehand = await createStagehand({
    modelName: 'claude-3-5-sonnet-latest'
  });
  
  await stagehand.page.goto('https://example.com');
  await actOnPage(stagehand, "click the contact button");
  
  await stagehand.close();
})();
\`\`\`

### Form Filling and Submission
\`\`\`typescript
(async () => {
  const stagehand = await createStagehand();
  await stagehand.page.goto('https://example.com/contact');
  
  // Fill form with natural language
  await actOnPage(stagehand, "fill in the name field with 'John Doe'");
  await actOnPage(stagehand, "fill in the email field with 'john@example.com'");
  await actOnPage(stagehand, "fill in the message with 'Hello, this is a test'");
  await actOnPage(stagehand, "click the submit button");
  
  // Wait and extract confirmation
  await stagehand.page.waitForTimeout(2000);
  const { confirmationMessage } = await extractFromPage(
    stagehand,
    "Extract the confirmation message",
    z.object({ confirmationMessage: z.string() })
  );
  
  console.log('Confirmation:', confirmationMessage);
  
  await stagehand.close();
})();
\`\`\`

## Important Notes

1. **API Keys**: Requires Browserbase credentials + OpenAI or Anthropic API key
2. **Cloud Browsers**: Runs in Browserbase's cloud infrastructure (no local Chrome needed)
3. **Session Inspector**: View all sessions at https://www.browserbase.com/overview
4. **Costs**: Both Browserbase and AI model APIs have usage costs
5. **Error Handling**: Always wrap in try-catch and call \`stagehand.close()\`
6. **Timeouts**: Use \`stagehand.page.waitForTimeout()\` or \`waitForSelector()\` for dynamic content
7. **Zod Schemas**: Use Zod for type-safe data extraction

## Complete Example

\`\`\`typescript
const { execSync } = require('child_process');
const { z } = require('zod');

// Install dependencies
execSync('npm install @browserbasehq/stagehand zod', { stdio: 'inherit' });

${STAGEHAND_NODE_UTIL}

// Example: Extract documentation from a website
(async () => {
  try {
    console.log('🌐 Starting Stagehand session...');
    const stagehand = await createStagehand({ modelName: 'gpt-4o' });
    
    console.log('📄 Navigating to documentation...');
    await stagehand.page.goto('https://docs.stagehand.dev');
    
    // Observe available actions
    console.log('\\n👀 Observing page actions...');
    const suggestions = await observePage(stagehand, "find main navigation sections");
    console.log('Available sections:', suggestions.slice(0, 3));
    
    // Extract installation instructions
    console.log('\\n📦 Extracting installation info...');
    const { npmCommand, description } = await extractFromPage(
      stagehand,
      "Extract the NPM installation command and quick description",
      z.object({
        npmCommand: z.string(),
        description: z.string()
      })
    );
    
    console.log('\\n✅ Results:');
    console.log('Install:', npmCommand);
    console.log('Description:', description);
    
    console.log('\\n🎉 Session complete!');
    await stagehand.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\\n💡 Check your API keys:');
    console.error('   - BROWSERBASE_API_KEY');
    console.error('   - BROWSERBASE_PROJECT_ID');
    console.error('   - OPENAI_API_KEY (or ANTHROPIC_API_KEY)');
  }
})();
\`\`\`
`;

// ============================================================================
// Complete Standalone Example (for testing in Daytona)
// ============================================================================

export const STAGEHAND_COMPLETE_EXAMPLE = `
// Complete Browserbase/Stagehand Example for Daytona
// This code can be run directly in a Daytona sandbox

const { execSync } = require('child_process');

// Install Stagehand and Zod
console.log('📦 Installing @browserbasehq/stagehand and zod...');
execSync('npm install @browserbasehq/stagehand zod', { stdio: 'inherit' });

${STAGEHAND_NODE_UTIL}

const { z } = require('zod');

// Example: Search and extract information from a documentation site
(async () => {
  try {
    console.log('\\n🌐 Starting Browserbase/Stagehand Demo...\\n');
    
    // Initialize Stagehand
    console.log('Step 1: Creating Stagehand session...');
    const stagehand = await createStagehand({
      modelName: 'gpt-4o'
    });
    console.log('✓ Session created');
    
    // Navigate to page
    console.log('\\nStep 2: Navigating to docs.stagehand.dev...');
    await stagehand.page.goto('https://docs.stagehand.dev');
    console.log('✓ Page loaded');
    
    // Observe possible actions
    console.log('\\nStep 3: Observing page for clickable elements...');
    const suggestions = await observePage(stagehand, "find navigation menu items");
    console.log(\`✓ Found \${suggestions.length} suggestions\`);
    suggestions.slice(0, 3).forEach((s, i) => {
      console.log(\`   \${i + 1}. \${JSON.stringify(s)}\`);
    });
    
    // Extract content
    console.log('\\nStep 4: Extracting page content...');
    const pageData = await extractFromPage(
      stagehand,
      "Extract the main heading, description, and installation command",
      z.object({
        heading: z.string(),
        description: z.string(),
        installCommand: z.string().optional()
      })
    );
    console.log('✓ Content extracted:');
    console.log('   Heading:', pageData.heading);
    console.log('   Description:', pageData.description.substring(0, 100) + '...');
    if (pageData.installCommand) {
      console.log('   Install:', pageData.installCommand);
    }
    
    // Clean up
    console.log('\\nStep 5: Closing session...');
    await stagehand.close();
    console.log('✓ Session closed');
    
    console.log('\\n\\n✅ Stagehand demo complete!');
    console.log('💡 View your session at: https://www.browserbase.com/overview');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\\n💡 Troubleshooting:');
    console.error('   1. Check BROWSERBASE_API_KEY is set');
    console.error('   2. Check BROWSERBASE_PROJECT_ID is set');
    console.error('   3. Check OPENAI_API_KEY is set (or ANTHROPIC_API_KEY for Claude)');
    console.error('   4. Get credentials from: https://www.browserbase.com/overview');
  }
})();
`;

// ============================================================================
// Test runner (if this file is executed directly)
// ============================================================================

if (import.meta.main) {
  console.log("Browserbase/Stagehand Utility - Examples and Documentation");
  console.log("=".repeat(60));
  console.log("\n📦 NPM Dependencies:");
  console.log(STAGEHAND_NPM_DEPS.map(dep => `  - ${dep}`).join("\n"));
  console.log("\n📚 API Documentation:");
  console.log(STAGEHAND_API_DOCS);
  console.log("\n" + "=".repeat(60));
}

