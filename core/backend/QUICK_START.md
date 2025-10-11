# Quick Start: Wandb Inference + Weave Tracing

## 1. Setup Environment

Create `.env` in project root:
```bash
WANDB_API_KEY=your_wandb_api_key
```

## 2. Basic Usage

```javascript
import * as weave from './backend/weave.js';
import { simpleChat } from './backend/wandb.js';

// Initialize Weave (once at startup)
await weave.init('my-project');

// Make a chat request (automatically traced)
const response = await simpleChat('Hello!');
console.log(response);
```

## 3. Run Example

```bash
deno run --allow-net --allow-env core/backend/wandb-weave-example.js
```

## 4. View Traces

Visit: **https://wandb.ai/** → Navigate to your project

---

## Common Patterns

### Simple Chat
```javascript
const response = await simpleChat('Your question here');
```

### Chat with Options
```javascript
const response = await chat({
  systemPrompt: 'You are a helpful assistant.',
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7
});
```

### Conversation with Memory
```javascript
let history = [];

const turn1 = await chatWithHistory(history, 'My name is Alice');
history = turn1.updatedHistory;

const turn2 = await chatWithHistory(history, 'What is my name?');
// Will remember "Alice"
```

### Custom Traced Function
```javascript
async function myAIFunction(input) {
  // your logic
  return result;
}

const tracedAI = weave.op(myAIFunction);

// Use it
const result = await tracedAI('input');
```

---

## That's It!

All functions are automatically traced. Check your Weave dashboard to see:
- ✅ Function calls
- ✅ Inputs/outputs
- ✅ Performance metrics
- ✅ Token usage
- ✅ Error tracking

For more details, see [README.md](./README.md)

