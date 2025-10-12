# Mastra Agent Framework Utility 🤖

TypeScript agent framework utility for ERA agents using [Mastra](https://mastra.ai).

## Overview

Mastra is a modern TypeScript framework for building AI applications with agents, workflows, RAG (Retrieval Augmented Generation), and evaluation tools. Perfect for creating sophisticated AI systems with memory, tool calling, and multi-step processes.

**Key Features:**
- 🤖 **AI Agents**: Create intelligent agents with memory and tool calling
- 🔄 **Workflows**: Build multi-step AI workflows
- 📚 **RAG Support**: Retrieval Augmented Generation built-in
- 🧪 **Evals**: Test and evaluate your AI systems
- 🛠️ **Tool Calling**: Extend agents with custom tools
- 💾 **Memory**: Persistent conversation memory
- 🔌 **Integrations**: Works with OpenAI, Anthropic, and more

## Prerequisites

Mastra requires:
1. Node.js environment (not compatible with Deno)
2. OpenAI API key

## Installation

Add to your `.env` file:

```env
# OpenAI API key (required)
OPENAI_API_KEY=sk-your-openai-key-here
```

Get your API key from: https://platform.openai.com/api-keys

## Quick Start

### CLI Quick Start

```bash
# Interactive mode - create a Mastra agent
deno task cli

# Or use existing test
deno task test:mastra
```

### Testing the Utility

```bash
# Run tests (shows configuration examples)
deno run --allow-read --allow-env --allow-net utils/mastra/test.ts

# Or directly
deno run --allow-read --allow-env --allow-net utils/mastra/index.ts
```

## Core Functions

### `createMastra(config)`

Initialize a Mastra instance.

```typescript
const mastra = createMastra({
  // Configuration options
});
```

### `createAgent(options)`

Create an AI agent with memory and tool calling.

```typescript
const { mastra, agent } = await createAgent({
  name: 'research-assistant',
  model: 'gpt-4',
  instructions: 'You are a helpful research assistant',
  memory: true,
  tools: []  // Optional: add custom tools
});
```

**Parameters:**
- `name` (string) - Agent name
- `model` (string, optional) - Model to use (default: 'gpt-4')
  - OpenAI: `'gpt-4'`, `'gpt-4-turbo'`, `'gpt-3.5-turbo'`
  - Anthropic: `'claude-3-5-sonnet-latest'`, `'claude-3-opus-latest'`
- `instructions` (string) - System instructions for the agent
- `tools` (array, optional) - Array of tool definitions
- `memory` (boolean, optional) - Enable conversation memory (default: true)

### `executeAgent(agent, message, context)`

Execute an agent with a user message.

```typescript
const response = await executeAgent(
  agent,
  'What is the capital of France?',
  { userId: 'user123' }
);

console.log(response.text);
```

**Parameters:**
- `agent` - The agent instance
- `message` (string) - User's message
- `context` (object, optional) - Additional context for the agent

### `createWorkflow(options)`

Create a multi-step workflow.

```typescript
const workflow = createWorkflow({
  name: 'data-processing',
  steps: [
    {
      id: 'fetch',
      execute: async (input) => {
        // Fetch data
        return fetchedData;
      }
    },
    {
      id: 'process',
      execute: async (input) => {
        // Process data
        return processedData;
      }
    }
  ]
});
```

### `executeWorkflow(workflow, input)`

Execute a workflow with input data.

```typescript
const result = await executeWorkflow(workflow, {
  source: 'api',
  query: 'latest data'
});
```

## Usage Examples

### Example 1: Simple Agent

```typescript
(async () => {
  // Create agent
  const { mastra, agent } = await createAgent({
    name: 'assistant',
    model: 'gpt-4',
    instructions: 'You are a helpful assistant'
  });
  
  // Execute
  const response = await executeAgent(
    agent,
    'Explain quantum computing in simple terms'
  );
  
  console.log(response.text);
})();
```

### Example 2: Agent with Memory

```typescript
(async () => {
  const { mastra, agent } = await createAgent({
    name: 'conversation-bot',
    model: 'gpt-4',
    instructions: 'You are a friendly chatbot',
    memory: true
  });
  
  // First message
  const response1 = await executeAgent(
    agent,
    'My name is Alice',
    { userId: 'user123' }
  );
  console.log(response1.text);
  
  // Second message - agent remembers
  const response2 = await executeAgent(
    agent,
    'What is my name?',
    { userId: 'user123' }
  );
  console.log(response2.text);  // "Your name is Alice"
})();
```

### Example 3: Agent with Custom Tools

```typescript
(async () => {
  // Define custom tools
  const weatherTool = {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      }
    },
    execute: async ({ location }) => {
      // Fetch weather data
      return { temp: 72, condition: 'sunny' };
    }
  };
  
  const { mastra, agent } = await createAgent({
    name: 'weather-assistant',
    model: 'gpt-4',
    instructions: 'Help users with weather information',
    tools: [weatherTool]
  });
  
  const response = await executeAgent(
    agent,
    'What is the weather in San Francisco?'
  );
  
  console.log(response.text);
})();
```

### Example 4: Multi-Step Workflow

```typescript
(async () => {
  const workflow = createWorkflow({
    name: 'research-pipeline',
    steps: [
      {
        id: 'search',
        execute: async (input) => {
          // Search for information
          return { results: [...] };
        }
      },
      {
        id: 'analyze',
        execute: async (input) => {
          // Analyze results
          return { analysis: '...' };
        }
      },
      {
        id: 'summarize',
        execute: async (input) => {
          // Summarize findings
          return { summary: '...' };
        }
      }
    ]
  });
  
  const result = await executeWorkflow(workflow, {
    query: 'AI trends 2025'
  });
  
  console.log(result.summary);
})();
```

### Example 5: Using Claude Model

```typescript
(async () => {
  const { mastra, agent } = await createAgent({
    name: 'code-reviewer',
    model: 'claude-3-5-sonnet-latest',
    instructions: 'You are an expert code reviewer'
  });
  
  const response = await executeAgent(
    agent,
    'Review this code: function add(a, b) { return a + b; }'
  );
  
  console.log(response.text);
})();
```

### Example 6: RAG (Retrieval Augmented Generation)

```typescript
(async () => {
  const { mastra, agent } = await createAgent({
    name: 'documentation-assistant',
    model: 'gpt-4',
    instructions: 'Answer questions using the provided documentation',
    memory: true
  });
  
  // Add knowledge base
  await mastra.addKnowledge({
    source: 'documentation',
    content: 'Your documentation content here...'
  });
  
  // Query with RAG
  const response = await executeAgent(
    agent,
    'How do I configure authentication?'
  );
  
  console.log(response.text);
})();
```

## Integration with ERA

This utility is automatically registered in the ERA system and can be injected into generated agents:

```bash
# The AI will automatically use Mastra when appropriate
deno task cli:create smart-agent --prompt "Create an AI agent with memory that can answer questions"
```

The FBI Director will:
1. Detect keywords like "agent", "workflow", "memory", "tools"
2. Inject the Mastra utility code
3. Install NPM dependencies (`@mastra/core`)
4. Generate code using Mastra functions

## Advanced Usage

### Custom Configuration

```typescript
const mastra = createMastra({
  // Custom configuration
  logLevel: 'debug',
  timeout: 30000
});
```

### Error Handling

```typescript
try {
  const { mastra, agent } = await createAgent({
    name: 'assistant',
    model: 'gpt-4',
    instructions: 'You are helpful'
  });
  
  const response = await executeAgent(agent, 'Hello!');
  console.log(response.text);
} catch (error) {
  console.error('Agent failed:', error.message);
  // Handle error
}
```

### Combining Agents and Workflows

```typescript
(async () => {
  // Create specialized agents
  const { agent: researcher } = await createAgent({
    name: 'researcher',
    instructions: 'Research topics thoroughly'
  });
  
  const { agent: writer } = await createAgent({
    name: 'writer',
    instructions: 'Write clear summaries'
  });
  
  // Combine in a workflow
  const workflow = createWorkflow({
    name: 'research-and-write',
    steps: [
      {
        id: 'research',
        execute: async (input) => {
          return await executeAgent(researcher, input.topic);
        }
      },
      {
        id: 'write',
        execute: async (input) => {
          return await executeAgent(writer, `Summarize: ${input.text}`);
        }
      }
    ]
  });
  
  const result = await executeWorkflow(workflow, {
    topic: 'Latest AI developments'
  });
  
  console.log(result);
})();
```

## Important Notes

1. **Node.js Only**: Mastra requires Node.js (not compatible with Deno)
2. **API Keys Required**: Must have API keys for your chosen LLM provider
3. **Memory Persistence**: Memory is persisted across conversations
4. **Tool Calling**: Tools must be properly defined with schemas
5. **Error Handling**: Wrap calls in try-catch for API/network errors

## Limitations

- **Node.js Requirement**: Cannot run in Deno or browser environments
- **API Costs**: LLM API usage incurs costs
- **Rate Limits**: Respect provider rate limits
- **Memory Storage**: May require external storage for large-scale applications

## Resources

- [Mastra Website](https://mastra.ai)
- [Mastra Documentation](https://docs.mastra.ai)
- [GitHub Repository](https://github.com/mastra-ai/mastra)
- [Examples](https://docs.mastra.ai/examples)

## Files

- `index.ts` - Deno placeholder (documentation only)
- `examples.ts` - Node.js injection code for generated agents
- `test.ts` - Test runner (imports from index.ts)
- `README.md` - This file

## Next Steps

1. Set up LLM API keys in `.env`
2. Test the utility: `deno task test:mastra`
3. Create Mastra agents: `deno task cli`
4. Explore examples at https://docs.mastra.ai/examples

---

**Questions?** Check the [API documentation](./examples.ts) or visit:
- https://docs.mastra.ai/
- https://github.com/mastra-ai/mastra

