# Utils Injection Pattern

## Overview

This system allows AI-generated agents to use utility libraries (wandb, weave) in Daytona sandboxes **without the AI having to regenerate the utility code**. Instead, we inject pre-tested, working utility code as string literals.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Code Generation                        │
│  (Director + FBI) - Generates simple code that USES utils   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Utility Injection                           │
│  Pre-tested utility code (strings) gets wrapped around      │
│  AI-generated code before execution                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Daytona Sandbox Execution                     │
│  Complete code (utils + user code) runs in Node.js          │
└─────────────────────────────────────────────────────────────┘
```

## Available Utilities

### 1. Wandb (LLM Inference)
**Location**: `utils/wandb/examples.ts`

**Purpose**: Make LLM calls from generated agents

**Key Exports**:
- `WANDB_NODE_UTIL` - Pre-tested wandb chat utility (string)
- `WANDB_API_DOCS` - API documentation for teaching AI
- `WANDB_NPM_DEPS` - Dependencies to install (`['node-fetch@2']`)
- `injectWandbUtility()` - Helper to wrap user code

**Usage in Generated Code**:
```javascript
// AI generates this simple code:
const joke = await wandbChat('Tell me a joke');
console.log(joke);

// We inject the wandbChat utility automatically!
```

**Test**: `deno task test:wandb-injection`

### 2. Weave (Observability/Tracing)
**Location**: `utils/weave/examples.ts`

**Purpose**: Add observability and tracing to generated agents

**Key Exports**:
- `WEAVE_NODE_UTIL` - Pre-tested weave tracing utility (string)
- `WEAVE_API_DOCS` - API documentation for teaching AI
- `WEAVE_NPM_DEPS` - Dependencies to install (`['weave']`)
- `injectWeaveUtility()` - Helper to wrap user code

**Usage in Generated Code**:
```javascript
// AI generates this traced code:
await initWeave('my-agent');

const processData = createTracedOp('agent:process_data', async (data) => {
  // processing logic
  return result;
});

const result = await processData(input);
```

**Important**: Use **namespaced operation names** for clarity in traces:
- ✅ Good: `'joke-agent:fetch_joke'`, `'agent:transform_data'`
- ❌ Bad: `'process'`, `'handle'`, `'run'` (too generic)

**Test**: `deno task test:weave-injection`

### 3. Combined (Wandb + Weave)
**Test**: `deno task test:agent-utils`

Demonstrates using both utilities together in a joke-telling agent.

## How It Works

### 1. AI Learning Phase
The system prompt includes `WANDB_API_DOCS` and `WEAVE_API_DOCS` which teach the AI:
- That utilities exist and are already defined
- How to call them (API signatures)
- **NOT** how to implement them (that's our job!)

### 2. Code Generation Phase
AI generates simple code like:
```javascript
const answer = await wandbChat('What is 2+2?');
console.log(answer);
```

### 3. Injection Phase
We wrap the AI code with utilities:
```javascript
(async () => {
  const { execSync } = require('child_process');
  
  // Install dependencies
  execSync('npm install node-fetch@2', { stdio: 'pipe' });
  
  // === Wandb Chat Utility (Auto-injected) ===
  async function wandbChat(userMessage, options = {}) {
    // ... proven, tested code ...
  }
  // === End Wandb Utility ===
  
  // === User's Generated Code ===
  const answer = await wandbChat('What is 2+2?');
  console.log(answer);
  // === End User Code ===
})();
```

### 4. Execution Phase
Complete code runs in Daytona Node.js sandbox with 100% confidence it works.

## Key Benefits

1. **Zero Risk** - Using proven, tested utility code
2. **AI Simplicity** - AI only needs to know the API, not implementation
3. **Consistency** - Same utilities across all generated agents
4. **Updatable** - Fix once, all future generations benefit
5. **Composable** - Can inject multiple utils (wandb + weave + future)

## File Structure

```
utils/
├── wandb/
│   ├── index.ts           # Deno version (for local ERA system)
│   ├── examples.ts        # Node.js STRING TEMPLATES (for injection)
│   └── test.ts
├── weave/
│   ├── index.ts           # Deno version (for local ERA system)
│   ├── examples.ts        # Node.js STRING TEMPLATES (for injection)
│   └── test.ts
└── codegen/
    └── index.ts           # Will import examples for system prompt

tests/
├── test-wandb-injection.ts    # Test wandb utility injection
├── test-weave-injection.ts    # Test weave utility injection
└── test-agent-with-utils.ts   # Test both together (joke agent)
```

## Integration with FBI/Director

### Current State
✅ Utilities exist as injectable string templates
✅ Tests prove they work in Daytona
✅ Documentation ready for AI learning

### Next Steps (To Complete Integration)

1. **Update `utils/codegen/index.ts`**:
   ```typescript
   import { WANDB_API_DOCS } from '../wandb/examples.ts';
   import { WEAVE_API_DOCS } from '../weave/examples.ts';
   
   const systemPrompt = `... existing prompt ...
   
   ## Available Utilities
   
   ${WANDB_API_DOCS}
   
   ${WEAVE_API_DOCS}
   
   These utilities are pre-loaded. Just use them!
   `;
   ```

2. **Update `core/fbi.ts` or `core/director.ts`**:
   - After code generation, wrap with utilities:
   ```typescript
   import { injectWandbUtility } from '../utils/wandb/examples.ts';
   import { injectWeaveUtility } from '../utils/weave/examples.ts';
   
   // After AI generates code:
   let finalCode = generatedCode;
   
   // Optionally inject weave for tracing
   finalCode = injectWeaveUtility(finalCode, agentName);
   
   // Always inject wandb if needed
   if (codeUsesWandbd(finalCode)) {
     finalCode = injectWandbUtility(finalCode);
   }
   ```

3. **Test with CLI**:
   ```bash
   deno task cli:create joke-agent --prompt "Tell jokes using LLM and trace with weave"
   ```

## Node.js Compatibility Notes

### Why node-fetch@2?
Node.js v24+ uses ES modules by default where `require('node-fetch')` returns an object with `.default`. Using `node-fetch@2` ensures CommonJS compatibility.

### IIFE Wrapper Pattern
All Daytona code must be wrapped in `(async () => { ... })()` to support `require()` in Node.js v24+.

### Environment Variables
Pass env vars from Deno to Daytona:
```typescript
await runCode(code, 'javascript', {
  WANDB_API_KEY: Deno.env.get('WANDB_API_KEY')
});
```

## Weave Tracing Best Practices

### Namespacing Operations
Use clear, descriptive, namespaced names for traced operations:

```javascript
// ✅ GOOD - Clear, namespaced, descriptive
const fetchJoke = createTracedOp('joke-agent:fetch_joke', async (topic) => {
  // ...
});

const rateJoke = createTracedOp('joke-agent:rate_joke', async (joke) => {
  // ...
});

// ❌ BAD - Generic, hard to trace in dashboard
const process = createTracedOp('process', async (data) => {
  // ...
});
```

### Why Namespacing Matters
When you have multiple agents or operations, traces like:
- `joke-agent:fetch_joke`
- `joke-agent:rate_joke`
- `translator-agent:translate_text`

Are much easier to understand than:
- `process`
- `handle`
- `run`

## Testing

Run all tests:
```bash
# Individual utility tests
deno task test:wandb-injection
deno task test:weave-injection

# Combined integration test
deno task test:agent-utils
```

## Future Extensions

Potential utilities to add following this pattern:
- `utils/daytona/examples.ts` - For meta-coding (agents that create agents)
- `utils/http/examples.ts` - For API calls
- `utils/filesystem/examples.ts` - For file operations (if Daytona supports)
- `utils/database/examples.ts` - For data persistence

Each would follow the same pattern:
1. `UTIL_NODE_UTIL` - Working code as string
2. `UTIL_API_DOCS` - Documentation for AI
3. `UTIL_NPM_DEPS` - Dependencies to install
4. `injectUtilUtility()` - Injection helper
5. Test file proving it works

## Summary

This injection pattern allows us to:
1. **Ship working code** instead of hoping AI regenerates it correctly
2. **Teach AI simple APIs** instead of complex implementations
3. **Maintain consistency** across all generated agents
4. **Enable advanced features** (LLM calls, tracing) in generated code
5. **Scale easily** by adding more utility templates

The key insight: **AI doesn't need to know HOW to implement utilities, only HOW to USE them.**

