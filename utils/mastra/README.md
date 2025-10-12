# Mastra Agent Framework Utility 🤖

TypeScript agent framework utility for ERA agents using [Mastra](https://docs.mastra.ai/).

## Overview

Mastra is an open-source TypeScript agent framework that provides primitives for building AI applications: agents with memory and tool calling, deterministic workflows, RAG, integrations, and evals.

**Key Features:**
- 🤖 **AI Agents**: Create agents with memory and tool/function calling
- 🔄 **Workflows**: Deterministic LLM chains with branching and control flow
- 🧠 **Memory**: Persist and retrieve agent context (recency, semantic similarity, threads)
- 🛠️ **Tools**: Give agents functions they can call autonomously
- 📊 **Evals**: Automated evaluation metrics for LLM outputs
- 🔍 **RAG**: Retrieval-augmented generation with vector stores
- 🎮 **Dev Playground**: Local chat interface for agent development
- 🌐 **Model Routing**: Uses Vercel AI SDK for unified LLM provider access

## Prerequisites

Mastra requires:
- **Node.js** (TypeScript framework)
- **LLM API Key** - OpenAI, Anthropic, or Google Gemini

## Installation

Add to your `.env` file:

```env
OPENAI_API_KEY=sk-your_openai_key_here

# Or use other providers:
# ANTHROPIC_API_KEY=your_anthropic_key_here
# GOOGLE_API_KEY=your_google_key_here
```

## Quick Start

### CLI Quick Start

```bash
# Interactive mode - choose "Multi-Agent System" template
deno task cli

# Or direct command
deno task start:mastra
```

### Testing the Utility

```bash
# Test the utility structure
deno task test:mastra

# View API documentation
deno run --allow-read utils/mastra/examples.ts

# Test Deno index (shows configuration)
deno task test:mastra-index
```

## Core Functions

### `createMastra(config)`

Initialize a Mastra instance.

```typescript
const mastra = createMastra();
```

### `createAgent(options)`

Create an AI agent with memory and tool calling.

```typescript
const { mastra, agent } = await createAgent({
  name: 'assistant',
  model: 'gpt-4',
  instructions: 'You are a helpful coding assistant',
  memory: true,
  tools: [] // optional function tools
});
```

**Options:**
- `name` (string) - Agent identifier
- `model` (string) - LLM model (default: 'gpt-4')
- `instructions` (string) - System prompt/instructions
- `tools` (array) - Functions the agent can call
- `memory` (boolean) - Enable conversation memory (default: true)

### `executeAgent(agent, message, context)`

Execute an agent with a user message.

```typescript
const response = await executeAgent(agent, 'Help me debug this code');
console.log(response);
```

### `createWorkflow(options)`

Create a deterministic workflow with steps.

```typescript
const workflow = createWorkflow({
  name: 'data-pipeline',
  steps: [
    { id: 'fetch', execute: async (input) => { /* fetch */ } },
    { id: 'process', execute: async (input) => { /* process */ } }
  ]
});
```

### `executeWorkflow(workflow, input)`

Execute a workflow with input data.

```typescript
const result = await executeWorkflow(workflow, { query: 'user data' });
```

## Usage Examples

### Example 1: Simple Agent

```typescript
const { mastra, agent } = await createAgent({
  name: 'helper',
  model: 'gpt-4',
  instructions: 'You answer questions concisely'
});

const response = await executeAgent(agent, 'What is TypeScript?');
console.log(response);
```

### Example 2: Agent with Memory

```typescript
const { mastra, agent } = await createAgent({
  name: 'chatbot',
  model: 'gpt-4',
  instructions: 'You are a friendly chatbot. Remember context.',
  memory: true
});

// First message
await executeAgent(agent, 'My name is Alice');

// Agent remembers!
const response = await executeAgent(agent, 'What is my name?');
console.log(response); // "Your name is Alice"
```

### Example 3: Agent with Tools

```typescript
// Define a tool
const weatherTool = {
  name: 'getWeather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name' }
    },
    required: ['location']
  },
  execute: async (params) => {
    return `Weather in ${params.location}: Sunny, 72°F`;
  }
};

const { mastra, agent } = await createAgent({
  name: 'weather-agent',
  model: 'gpt-4',
  instructions: 'Help users check weather. Use getWeather tool when needed.',
  tools: [weatherTool]
});

const response = await executeAgent(
  agent,
  'What\\'s the weather in San Francisco?'
);
console.log(response); // Agent calls weatherTool autonomously
```

### Example 4: Multi-Agent System

```typescript
// Create specialized agents
const { agent: researcher } = await createAgent({
  name: 'researcher',
  model: 'gpt-4',
  instructions: 'Research topics and provide detailed information'
});

const { agent: summarizer } = await createAgent({
  name: 'summarizer',
  model: 'gpt-4',
  instructions: 'Summarize long text into concise bullet points'
});

// Use them in sequence
const topic = 'quantum computing';
const research = await executeAgent(researcher, `Research: ${topic}`);
const summary = await executeAgent(summarizer, `Summarize: ${research}`);

console.log('Research:', research);
console.log('Summary:', summary);
```

### Example 5: Workflow with Steps

```typescript
const workflow = createWorkflow({
  name: 'greet-and-analyze',
  steps: [
    {
      id: 'greet',
      execute: async (input) => ({
        ...input,
        greeting: `Hello, ${input.name}!`
      })
    },
    {
      id: 'analyze',
      execute: async (input) => ({
        ...input,
        analysis: `Name length: ${input.name.length} characters`
      })
    }
  ]
});

const result = await executeWorkflow(workflow, { name: 'Alice' });
console.log(result);
// { name: 'Alice', greeting: 'Hello, Alice!', analysis: '...' }
```

### Example 6: LLM Workflow with Classification

```typescript
const { mastra, agent } = await createAgent({
  name: 'classifier',
  model: 'gpt-4',
  instructions: 'Classify user intent as: question, command, or statement'
});

const workflow = createWorkflow({
  name: 'intent-handler',
  steps: [
    {
      id: 'classify',
      execute: async (input) => {
        const intent = await executeAgent(
          agent,
          `Classify: "${input.message}"`
        );
        return { ...input, intent };
      }
    },
    {
      id: 'route',
      execute: async (input) => {
        if (input.intent.includes('question')) {
          return { ...input, response: 'Routing to Q&A' };
        } else if (input.intent.includes('command')) {
          return { ...input, response: 'Executing command' };
        } else {
          return { ...input, response: 'Acknowledged' };
        }
      }
    }
  ]
});

const result = await executeWorkflow(workflow, {
  message: 'What is AI?'
});
console.log(result);
```

## Integration with ERA

This utility is automatically registered in the ERA system and can be injected into generated agents:

```bash
# The AI will use Mastra when appropriate
deno task cli:create research-bot --prompt "Create a research agent with memory that can cite sources"
```

The FBI Director will:
1. Detect the need for agent framework capabilities
2. Inject the Mastra utility code
3. Install NPM dependencies (`@mastra/core`)
4. Generate code using pre-loaded functions

## Advanced Features

### Custom Tool Definition

```typescript
const calculatorTool = {
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'Math expression' }
    }
  },
  execute: async (params) => {
    try {
      return eval(params.expression);
    } catch (error) {
      return 'Invalid expression';
    }
  }
};
```

### Agent with Multiple Tools

```typescript
const { agent } = await createAgent({
  name: 'multi-tool-agent',
  model: 'gpt-4',
  instructions: 'You help with weather and calculations',
  tools: [weatherTool, calculatorTool]
});
```

### Error Handling

```typescript
try {
  const { agent } = await createAgent({
    name: 'test-agent',
    model: 'gpt-4',
    instructions: 'Test agent'
  });
  
  const response = await executeAgent(agent, 'Hello');
  console.log(response);
} catch (error) {
  console.error('Agent failed:', error.message);
}
```

## Key Concepts

### Agents vs Workflows

- **Agents**: Autonomous AI entities with memory and tool calling
  - Use when you need adaptive, context-aware responses
  - Can call functions based on conversation context
  - Maintain memory across interactions

- **Workflows**: Deterministic step-by-step processes
  - Use for repeatable, predictable LLM chains
  - Good for data pipelines and structured tasks
  - Can include branching logic

### Memory

Agents with `memory: true` automatically:
- Store conversation history
- Retrieve relevant context
- Maintain thread continuity
- Support semantic similarity search

### Tools

Tools are functions agents can autonomously call:
- Define with JSON schema
- Agent decides when to use them
- Results are integrated into responses
- Supports multiple tools per agent

## Comparison with Other Frameworks

| Feature | Mastra | LangChain | CrewAI |
|---------|--------|-----------|--------|
| TypeScript-first | ✅ | ❌ | ❌ |
| Agent Memory | ✅ | ✅ | ✅ |
| Workflows | ✅ | ✅ | ✅ |
| Dev Playground | ✅ | ❌ | ❌ |
| RAG Support | ✅ | ✅ | ❌ |
| Evals | ✅ | ❌ | ❌ |

## Limitations

- **Node.js Only**: Mastra requires Node.js runtime (not Deno compatible)
- **API Costs**: LLM API calls have usage-based pricing
- **Memory Storage**: Default in-memory storage (consider external DB for production)

## Resources

- [Mastra Documentation](https://docs.mastra.ai/)
- [GitHub Repository](https://github.com/mastra-ai/mastra)
- [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction)

## Files

- `index.ts` - Deno placeholder (documentation only)
- `examples.ts` - Node.js injection code for agents
- `README.md` - This file

## Next Steps

1. Set up environment variables in `.env`
2. Try the quick start: `deno task start:mastra`
3. Create custom agents with `deno task cli`
4. Explore multi-agent patterns
5. Learn more at https://docs.mastra.ai/

---

**Questions?** Check the [API documentation](./examples.ts) or run:
```bash
deno run --allow-read utils/mastra/examples.ts
```
