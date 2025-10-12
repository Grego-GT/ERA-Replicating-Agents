# ERA Backend Modules

This directory contains backend integration modules for the ERA project.

## Modules

### 🔍 Weave (`weave.js`)

Wandb Weave integration for AI operation tracing and observability.

**Key Features:**

- Initialize Weave tracing with `weave.init(projectName)`
- Wrap functions with `weave.op()` for automatic tracing
- Track AI operations, inputs, outputs, and performance

**Basic Usage:**

```javascript
import * as weave from './backend/weave.js';

// Define your function
async function myAIFunction(input) {
  // your AI logic here
  return result;
}

// Wrap it with Weave tracing
const tracedFunction = weave.op(myAIFunction);

// Initialize and use
async function main() {
  await weave.init(); // Defaults to 'era' project
  const result = await tracedFunction('test input');
}
```

**Note:** All ERA modules use a single 'era' Weave project. The `init()` function prevents multiple initializations automatically.

---

### 💬 Wandb Inference (`wandb.js`)

Wandb Inference API integration with built-in Weave tracing.

**Key Features:**

- Multiple chat functions with automatic Weave tracing
- Semaphore-based rate limiting (10 concurrent requests)
- Support for streaming responses
- Conversation history management

**Available Functions:**

#### `chat(options)`

Main chat function with full control over parameters.

```javascript
import { chat } from './backend/wandb.js';
import * as weave from './backend/weave.js';

await weave.init(); // Initialize once for all ERA operations

const response = await chat({
  model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
  messages: [{ role: 'user', content: 'Hello!' }],
  systemPrompt: 'You are a helpful assistant.',
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.choices[0].message.content);
```

#### `simpleChat(userMessage, options)`

Simplified chat that returns just the text response.

```javascript
import { simpleChat } from './backend/wandb.js';
import * as weave from './backend/weave.js';

await weave.init();

const response = await simpleChat('Tell me a joke.');
console.log(response); // Just the text response
```

#### `chatWithHistory(conversationHistory, newMessage, options)`

Maintains conversation context across multiple turns.

```javascript
import { chatWithHistory } from './backend/wandb.js';
import * as weave from './backend/weave.js';

await weave.init();

let history = [];

const turn1 = await chatWithHistory(history, 'My name is Alice.');
history = turn1.updatedHistory;

const turn2 = await chatWithHistory(history, 'What is my name?');
console.log(turn2.assistantMessage.content); // "Your name is Alice."
```

#### `streamChat(options)`

Stream chat completions for real-time responses.

```javascript
import { streamChat } from './backend/wandb.js';
import * as weave from './backend/weave.js';

await weave.init();

const stream = await streamChat({
  model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
  messages: [{ role: 'user', content: 'Tell me a story.' }],
});

// Process the stream
for await (const chunk of stream) {
  console.log(chunk);
}
```

---

### 🤖 Daytona (`daytona.js`)

Daytona workspace management integration.

**Features:**

- Create and manage Daytona workspaces
- List workspaces and get workspace info
- Start/stop/remove workspaces
- SSH into workspaces

---

## Environment Setup

Create a `.env` file in the project root with:

```bash
# Required for Wandb Inference
WANDB_API_KEY=your_api_key_here

# Optional: Wandb project for OpenAI-Project header
WANDB_PROJECT=team/project
```

---

## Complete Example

See `wandb-weave-example.js` for a comprehensive example combining Wandb Inference with Weave tracing.

Run it with:

```bash
deno run --allow-net --allow-env core/backend/wandb-weave-example.js
```

Or test the integration:

```bash
deno run --allow-net --allow-env core/backend/wandb.js
```

---

## Weave Dashboard

After running traced functions, view your traces and metrics at:
**https://wandb.ai/**

Navigate to your project to see:

- Function call traces
- Input/output logs
- Performance metrics
- Error tracking
- Token usage statistics

---

## Best Practices

1. **Always initialize Weave first:**

   ```javascript
   await weave.init(); // Uses 'era' by default
   ```

   Or call `ensureInitialized()` for automatic init:

   ```javascript
   await weave.ensureInitialized(); // Safe to call multiple times
   ```

2. **Single project for all operations:**

   - All ERA modules use the 'era' project
   - No need to specify project names in most cases
   - Prevents multiple project creation

3. **Wrap custom AI functions:**

   ```javascript
   async function myCustomAI(input) {
     // your logic
   }
   const tracedAI = weave.op(myCustomAI);
   ```

4. **Handle errors appropriately:**

   ```javascript
   try {
     const result = await chat({ ... });
   } catch (error) {
     console.error('Chat failed:', error);
     // Handle error
   }
   ```

5. **Monitor your Weave dashboard** regularly to track performance and debug issues.

---

## Architecture

```
┌─────────────────┐
│   Your Code     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐     ┌──────────────┐
│   wandb.js      │────→│  weave.js    │
│  (chat funcs)   │     │  (tracing)   │
└────────┬────────┘     └──────┬───────┘
         │                      │
         ↓                      ↓
┌─────────────────┐     ┌──────────────┐
│ Wandb Inference │     │ Weave API    │
│      API        │     │ (Telemetry)  │
└─────────────────┘     └──────────────┘
```

All chat functions in `wandb.js` are automatically traced with Weave, providing full observability without additional code.

---

## Troubleshooting

**"WANDB_API_KEY not found"**

- Make sure you have a `.env` file with your API key
- The file should be in the project root (not in `core/backend/`)

**"Failed to initialize Weave"**

- Check your network connection
- Verify your WANDB_API_KEY is valid
- Make sure you have permission to create projects

**"503 Service Unavailable"**

- The rate limiter should handle this automatically
- If it persists, reduce concurrent requests in the semaphore

**Traces not appearing in dashboard**

- Wait a few seconds for traces to upload
- Check you're looking at the correct project name
- Verify Weave initialization succeeded

---

## Contributing

When adding new AI functions:

1. Define the implementation function
2. Wrap it with `weave.op()`
3. Export the wrapped version
4. Update this README with usage examples

Example:

```javascript
async function myNewFunctionImpl(input) {
  // implementation
}

export const myNewFunction = weave.op(myNewFunctionImpl);
```

This ensures all AI operations are automatically traced for observability.
