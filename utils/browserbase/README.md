# Browserbase/Stagehand Utility 🌐

AI-powered web browsing utility for ERA agents using [Stagehand](https://docs.stagehand.dev) and [Browserbase](https://www.browserbase.com).

## Overview

Stagehand is an AI web browsing framework that enables natural language interaction with web pages. It runs on Browserbase's cloud browser infrastructure, eliminating the need for local Chrome/Playwright setup.

**Key Features:**
- 🤖 **Natural Language Control**: Interact with web pages using plain English
- 🎯 **AI-Powered Actions**: Observe, act, and extract data intelligently
- ☁️ **Cloud Browsers**: No local browser setup required
- 🔍 **Session Inspector**: Debug and inspect all sessions
- 📊 **Structured Extraction**: Use Zod schemas for type-safe data extraction

## Prerequisites

Get your credentials from the [Browserbase Dashboard](https://www.browserbase.com/overview):

1. **Browserbase API Key** - Your authentication key
2. **Browserbase Project ID** - Your project identifier
3. **OpenAI API Key** - For GPT-4o model (or Anthropic for Claude)

## Installation

Add to your `.env` file:

```env
BROWSERBASE_API_KEY=bb_your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here
OPENAI_API_KEY=sk-your_openai_key_here

# Optional: Use Claude instead
# ANTHROPIC_API_KEY=your_anthropic_key_here
```

## Quick Start

### CLI Quick Start

```bash
# Interactive mode - choose "AI Web Browser" template
deno task cli

# Or direct command
deno task start:browserbase
```

### Testing the Utility

```bash
# Test the utility structure
deno task test:browserbase

# View API documentation
deno run --allow-read utils/browserbase/examples.ts

# Test Deno index (shows configuration)
deno task test:browserbase-index
```

## Core Functions

### `createStagehand(options)`

Creates and initializes a Stagehand session.

```typescript
const stagehand = await createStagehand({
  modelName: 'gpt-4o'  // or 'claude-3-5-sonnet-latest'
});

await stagehand.page.goto('https://example.com');
// ... use stagehand.page
await stagehand.close();
```

**Options:**
- `apiKey` - Browserbase API key (default: `process.env.BROWSERBASE_API_KEY`)
- `projectId` - Browserbase Project ID (default: `process.env.BROWSERBASE_PROJECT_ID`)
- `modelName` - AI model: `'gpt-4o'` or `'claude-3-5-sonnet-latest'`
- `openaiApiKey` - OpenAI key for GPT models
- `anthropicApiKey` - Anthropic key for Claude models

### `observePage(stagehand, instruction)`

Preview possible actions before executing.

```typescript
const suggestions = await observePage(
  stagehand,
  "find all navigation links"
);

console.log(suggestions); // List of possible actions
await actOnPage(stagehand, suggestions[0]); // Execute first suggestion
```

### `actOnPage(stagehand, action)`

Perform actions using natural language.

```typescript
await actOnPage(stagehand, "click the 'Get Started' button");
await actOnPage(stagehand, "fill in the email field with 'test@example.com'");
await actOnPage(stagehand, "scroll to the bottom of the page");
```

### `extractFromPage(stagehand, instruction, schema)`

Extract structured data with Zod schema validation.

```typescript
const { z } = require('zod');

const result = await extractFromPage(
  stagehand,
  "Extract the page title and description",
  z.object({
    title: z.string(),
    description: z.string()
  })
);

console.log(result.title, result.description);
```

## Usage Examples

### Example 1: Basic Navigation and Extraction

```typescript
const { z } = require('zod');

(async () => {
  const stagehand = await createStagehand();
  
  await stagehand.page.goto('https://docs.stagehand.dev');
  
  const { heading, installCommand } = await extractFromPage(
    stagehand,
    "Extract the main heading and npm install command",
    z.object({
      heading: z.string(),
      installCommand: z.string()
    })
  );
  
  console.log('Heading:', heading);
  console.log('Install:', installCommand);
  
  await stagehand.close();
})();
```

### Example 2: Search and Extract Results

```typescript
const { z } = require('zod');

(async () => {
  const stagehand = await createStagehand();
  
  await stagehand.page.goto('https://github.com');
  await actOnPage(stagehand, "type 'stagehand' in search and press enter");
  await stagehand.page.waitForTimeout(2000);
  
  const results = await extractFromPage(
    stagehand,
    "Extract top 3 repository names and descriptions",
    z.object({
      repositories: z.array(z.object({
        name: z.string(),
        description: z.string()
      }))
    })
  );
  
  results.repositories.forEach(repo => {
    console.log(`${repo.name}: ${repo.description}`);
  });
  
  await stagehand.close();
})();
```

### Example 3: Form Filling

```typescript
(async () => {
  const stagehand = await createStagehand();
  
  await stagehand.page.goto('https://example.com/contact');
  
  await actOnPage(stagehand, "fill in name with 'John Doe'");
  await actOnPage(stagehand, "fill in email with 'john@example.com'");
  await actOnPage(stagehand, "fill in message with 'Hello!'");
  await actOnPage(stagehand, "click submit button");
  
  await stagehand.page.waitForTimeout(2000);
  
  const { confirmationMessage } = await extractFromPage(
    stagehand,
    "Extract confirmation message",
    z.object({ confirmationMessage: z.string() })
  );
  
  console.log('Confirmed:', confirmationMessage);
  
  await stagehand.close();
})();
```

### Example 4: Observe Before Acting

```typescript
(async () => {
  const stagehand = await createStagehand();
  
  await stagehand.page.goto('https://docs.browserbase.com');
  
  // Preview available actions
  const suggestions = await observePage(
    stagehand,
    "find clickable navigation items"
  );
  
  console.log('Available actions:');
  suggestions.slice(0, 3).forEach((s, i) => {
    console.log(`${i + 1}.`, s);
  });
  
  // Execute suggested action
  await actOnPage(stagehand, suggestions[0]);
  
  await stagehand.close();
})();
```

## Integration with ERA

This utility is automatically registered in the ERA system and can be injected into generated agents:

```bash
# The AI will automatically use this utility when appropriate
deno task cli:create my-scraper --prompt "Create a web scraper that extracts article titles from news sites"
```

The FBI Director will:
1. Detect the need for web browsing
2. Inject the Stagehand utility code
3. Install NPM dependencies (`@browserbasehq/stagehand`, `zod`)
4. Generate code using the pre-loaded functions

## Advanced Usage

### Using Claude Model

```typescript
const stagehand = await createStagehand({
  modelName: 'claude-3-5-sonnet-latest'
});
```

### Complex Extraction Schemas

```typescript
const { z } = require('zod');

const result = await extractFromPage(
  stagehand,
  "Extract all product information",
  z.object({
    products: z.array(z.object({
      name: z.string(),
      price: z.number(),
      rating: z.number().optional(),
      inStock: z.boolean()
    })),
    totalCount: z.number()
  })
);
```

### Error Handling

```typescript
try {
  const stagehand = await createStagehand();
  await stagehand.page.goto('https://example.com');
  
  // ... your operations
  
  await stagehand.close();
} catch (error) {
  console.error('Browser automation failed:', error.message);
  // Stagehand automatically closes on error
}
```

## Debugging

All sessions are recorded and can be inspected:

1. Visit [Browserbase Dashboard](https://www.browserbase.com/overview)
2. Find your session in the recent list
3. Use the Session Inspector to replay and debug

## Limitations

- **Node.js Only**: Stagehand requires Node.js and Playwright (not compatible with Deno)
- **API Costs**: Both Browserbase and OpenAI/Anthropic have usage-based pricing
- **Rate Limits**: Respect API rate limits for both services
- **Cloud Execution**: All browsing happens in Browserbase's cloud (not local)

## Resources

- [Stagehand Documentation](https://docs.stagehand.dev)
- [Browserbase Dashboard](https://www.browserbase.com/overview)
- [Browserbase Documentation](https://docs.browserbase.com)
- [Get API Keys](https://www.browserbase.com/overview)

## Files

- `index.ts` - Deno placeholder (documentation only)
- `examples.ts` - Node.js injection code for agents
- `README.md` - This file

## Next Steps

1. Set up environment variables in `.env`
2. Try the quick start: `deno task start:browserbase`
3. Create custom agents with `deno task cli`
4. View sessions at https://www.browserbase.com/overview

---

**Questions?** Check the [API documentation](./examples.ts) or run:
```bash
deno run --allow-read utils/browserbase/examples.ts
```

