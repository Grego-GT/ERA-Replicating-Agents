/**
 * Mastra Agent Framework Utility - Node.js Examples for Daytona Injection
 * 
 * This file provides Node.js-compatible Mastra utilities
 * that can be injected into AI-generated agents running in Daytona sandboxes.
 */

// ============================================================================
// Node.js-Compatible Mastra Utility (for injection into generated code)
// ============================================================================

export const MASTRA_NODE_UTIL = `
// Mastra Agent Framework Utility - requires npm install @mastra/core
const { Mastra, Agent, Workflow } = require('@mastra/core');

// Initialize Mastra instance with Groq
function createMastra(config = {}) {
  // Mastra configured to use Groq (fast and cost-effective)
  return new Mastra({
    llmProviders: {
      groq: {
        apiKey: process.env.GROQ_API_KEY
      }
    },
    ...config
  });
}

// Create an AI agent with memory and tool calling
async function createAgent(options) {
  const mastra = createMastra();
  
  // Get model from options or default to Groq Llama 3.3
  // Format: provider/model (e.g., 'groq/llama-3.3-70b-versatile')
  let modelName = options.model || 'groq/llama-3.3-70b-versatile';
  
  // If model doesn't have provider prefix, add groq/
  const model = modelName.includes('/') ? modelName : 'groq/' + modelName;
  
  const agent = new Agent({
    name: options.name,
    model: model,
    instructions: options.instructions,
    tools: options.tools || [],
    enableMemory: options.memory !== false
  });
  
  return { mastra, agent };
}

// Execute agent with a user message
async function executeAgent(agent, message, context = {}) {
  const response = await agent.generate(message, context);
  return response;
}

// Create a workflow with steps
function createWorkflow(options) {
  return new Workflow({
    name: options.name,
    steps: options.steps
  });
}

// Execute workflow
async function executeWorkflow(workflow, input) {
  const result = await workflow.execute(input);
  return result;
}
`;

// ============================================================================
// NPM Dependencies for Mastra
// ============================================================================

export const MASTRA_NPM_DEPS = ['@mastra/core'];

// ============================================================================
// API Documentation for AI (teaches the AI how to use this utility)
// ============================================================================

export const MASTRA_API_DOCS = `
# Mastra Agent Framework Utility

Mastra is a TypeScript agent framework for building AI applications with agents, workflows, RAG, and evals.

## ⚠️ Important Requirements

1. **Groq API**: Mastra uses Groq for fast, cost-effective inference
2. **Environment Variables**: Requires \`GROQ_API_KEY\` in your .env file
3. **Model Format**: Use format \`groq/model-name\` (e.g., \`groq/llama-3.3-70b-versatile\`)
4. **Node.js Only**: This framework requires Node.js and cannot run in Deno
5. **Default Model**: Llama 3.3 70B Versatile (fast and capable)

## 🚨 CRITICAL: Model Naming

**Always use the format \`groq/model-name\`** when creating agents:

✅ CORRECT:
\`\`\`javascript
model: 'groq/llama-3.3-70b-versatile'     // Default, recommended
model: 'groq/llama-3.1-8b-instant'        // Faster, smaller model
\`\`\`

❌ WRONG (will fail):
\`\`\`javascript
model: 'llama-3.3-70b-versatile'     // Missing groq/ prefix!
model: 'gpt-4'                        // Wrong provider!
\`\`\`

**Why?** Mastra needs the provider prefix (\`groq/\`) to route requests correctly.

## Configuration

Mastra requires Groq API key:
- API Key: \`process.env.GROQ_API_KEY\` (required)
- Default Model: \`groq/llama-3.3-70b-versatile\`
- Get your key: https://console.groq.com/keys

## Pre-loaded Functions

### createMastra(config)
Initialize a Mastra instance.

**Parameters:**
- \`config\` (object, optional): Configuration options for Mastra

**Returns:** Mastra instance

**Example:**
\`\`\`typescript
const mastra = createMastra();
\`\`\`

### createAgent(options)
Create an AI agent with memory and tool calling capabilities.

**Parameters:**
- \`options\` (object):
  - \`name\` (string): Agent name/identifier
  - \`model\` (string, optional): Groq model name **with \`groq/\` prefix**
    - **CRITICAL**: Must use format \`groq/model-name\`
    - Examples: \`groq/llama-3.3-70b-versatile\`, \`groq/llama-3.1-8b-instant\`
    - Defaults to \`groq/llama-3.3-70b-versatile\` if not specified
  - \`instructions\` (string): System instructions for the agent
  - \`tools\` (array, optional): Functions the agent can call
  - \`memory\` (boolean, optional): Enable agent memory (default: true)

**Returns:** Promise<{ mastra: Mastra, agent: Agent }>

**Example:**
\`\`\`javascript
const { mastra, agent } = await createAgent({
  name: 'assistant',
  model: 'groq/llama-3.3-70b-versatile',  // ⚠️ MUST include groq/ prefix!
  instructions: 'You are a helpful coding assistant',
  memory: true
});
\`\`\`

**⚠️ IMPORTANT**: Mastra requires the \`groq/\` prefix to route requests to Groq.

### executeAgent(agent, message, context)
Execute an agent with a user message.

**Parameters:**
- \`agent\` (Agent): Agent instance from createAgent
- \`message\` (string): User message/prompt
- \`context\` (object, optional): Additional context

**Returns:** Promise<string> - Agent response

**Example:**
\`\`\`typescript
const response = await executeAgent(agent, 'Help me debug this code');
console.log(response);
\`\`\`

### createWorkflow(options)
Create a deterministic workflow with steps.

**Parameters:**
- \`options\` (object):
  - \`name\` (string): Workflow name
  - \`steps\` (array): Array of step definitions with id and execute function

**Returns:** Workflow instance

**Example:**
\`\`\`typescript
const workflow = createWorkflow({
  name: 'data-pipeline',
  steps: [
    { id: 'fetch', execute: async (input) => { /* fetch data */ } },
    { id: 'process', execute: async (input) => { /* process */ } },
    { id: 'store', execute: async (input) => { /* store */ } }
  ]
});
\`\`\`

### executeWorkflow(workflow, input)
Execute a workflow with input data.

**Parameters:**
- \`workflow\` (Workflow): Workflow instance from createWorkflow
- \`input\` (any): Input data for the workflow

**Returns:** Promise<any> - Workflow result

**Example:**
\`\`\`typescript
const result = await executeWorkflow(workflow, { query: 'user data' });
console.log(result);
\`\`\`

## Environment Variables Required

\`\`\`env
GROQ_API_KEY=gsk_your_groq_key_here
\`\`\`

Get your API key from: https://console.groq.com/keys

## Usage Examples

### Basic Agent Creation
\`\`\`typescript
const { mastra, agent } = await createAgent({
  name: 'helper',
  model: 'groq/llama-3.3-70b-versatile',
  instructions: 'You are a helpful assistant that answers questions concisely'
});

const response = await executeAgent(agent, 'What is TypeScript?');
console.log('Agent:', response);
\`\`\`

### Agent with Memory
\`\`\`typescript
const { mastra, agent } = await createAgent({
  name: 'chatbot',
  model: 'groq/llama-3.3-70b-versatile',
  instructions: 'You are a friendly chatbot. Remember context from previous messages.',
  memory: true
});

// First message
await executeAgent(agent, 'My name is Alice');

// Agent remembers the previous context
const response = await executeAgent(agent, 'What is my name?');
console.log(response); // "Your name is Alice"
\`\`\`

### Agent with Tools
\`\`\`typescript
// Define a tool the agent can use
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
  execute: async (params: { location: string }) => {
    // Fetch weather data
    return \`Weather in \${params.location}: Sunny, 72°F\`;
  }
};

const { mastra, agent } = await createAgent({
  name: 'weather-agent',
  model: 'groq/llama-3.3-70b-versatile',
  instructions: 'You help users check the weather. Use the getWeather tool when needed.',
  tools: [weatherTool]
});

const response = await executeAgent(agent, 'What\\'s the weather in San Francisco?');
console.log(response); // Agent will call the weatherTool
\`\`\`

### Simple Workflow
\`\`\`typescript
const workflow = createWorkflow({
  name: 'greet-and-analyze',
  steps: [
    {
      id: 'greet',
      execute: async (input) => {
        return { ...input, greeting: \`Hello, \${input.name}!\` };
      }
    },
    {
      id: 'analyze',
      execute: async (input) => {
        return {
          ...input,
          analysis: \`Name length: \${input.name.length} characters\`
        };
      }
    }
  ]
});

const result = await executeWorkflow(workflow, { name: 'Alice' });
console.log(result);
// { name: 'Alice', greeting: 'Hello, Alice!', analysis: 'Name length: 5 characters' }
\`\`\`

### LLM Workflow with Branching
\`\`\`typescript
const { mastra, agent } = await createAgent({
  name: 'classifier',
  model: 'groq/llama-3.3-70b-versatile',
  instructions: 'Classify user intent as: question, command, or statement'
});

const workflow = createWorkflow({
  name: 'intent-handler',
  steps: [
    {
      id: 'classify',
      execute: async (input) => {
        const intent = await executeAgent(agent, \`Classify: "\${input.message}"\`);
        return { ...input, intent };
      }
    },
    {
      id: 'route',
      execute: async (input) => {
        if (input.intent.includes('question')) {
          return { ...input, response: 'Routing to Q&A system' };
        } else if (input.intent.includes('command')) {
          return { ...input, response: 'Executing command' };
        } else {
          return { ...input, response: 'Acknowledged statement' };
        }
      }
    }
  ]
});

const result = await executeWorkflow(workflow, { message: 'What is AI?' });
console.log(result);
\`\`\`

### Multi-Agent System
\`\`\`typescript
// Create specialized agents
const { agent: researcher } = await createAgent({
  name: 'researcher',
  model: 'groq/llama-3.3-70b-versatile',
  instructions: 'You research topics and provide detailed information'
});

const { agent: summarizer } = await createAgent({
  name: 'summarizer',
  model: 'groq/llama-3.3-70b-versatile',
  instructions: 'You summarize long text into concise bullet points'
});

// Use them in sequence
const topic = 'quantum computing';
const research = await executeAgent(researcher, \`Research: \${topic}\`);
const summary = await executeAgent(summarizer, \`Summarize: \${research}\`);

console.log('Research:', research);
console.log('Summary:', summary);
\`\`\`

## Important Notes

1. **Groq Provider**: Fast, cost-effective inference with Llama 3.3 models via Groq
2. **Memory**: Agents with memory enabled persist conversation context automatically
3. **Tools**: Tools are functions agents can call autonomously based on context
4. **Workflows**: Use workflows for deterministic, repeatable LLM chains
5. **Error Handling**: Always wrap agent/workflow execution in try-catch
6. **API Keys**: Set GROQ_API_KEY in environment variables

## Complete Example

\`\`\`typescript
const { execSync } = require('child_process');

// Install Mastra
console.log('📦 Installing @mastra/core...');
execSync('npm install @mastra/core', { stdio: 'inherit' });

${MASTRA_NODE_UTIL}

// Example: Customer support agent with memory
(async () => {
  try {
    console.log('🤖 Creating customer support agent...\\n');
    
    const { mastra, agent } = await createAgent({
      name: 'support-agent',
      model: 'groq/llama-3.3-70b-versatile',
      instructions: 'You are a helpful customer support agent. Be friendly and professional.',
      memory: true
    });
    
    // Simulate conversation
    console.log('Customer: Hi, I need help with my order');
    let response = await executeAgent(agent, 'Hi, I need help with my order');
    console.log('Agent:', response);
    
    console.log('\\nCustomer: My order number is #12345');
    response = await executeAgent(agent, 'My order number is #12345');
    console.log('Agent:', response);
    
    console.log('\\nCustomer: What was my order number again?');
    response = await executeAgent(agent, 'What was my order number again?');
    console.log('Agent:', response); // Agent remembers: #12345
    
    console.log('\\n✅ Mastra agent demo complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\\n💡 Make sure GROQ_API_KEY is set in your .env file');
    console.error('💡 Get your key from: https://console.groq.com/keys');
  }
})();
\`\`\`
`;

// ============================================================================
// Complete Standalone Example (for testing in Daytona)
// ============================================================================

export const MASTRA_COMPLETE_EXAMPLE = `
// Complete Mastra Agent Framework Example for Daytona
// This code can be run directly in a Daytona sandbox

const { execSync } = require('child_process');

// Install Mastra
console.log('📦 Installing @mastra/core...');
execSync('npm install @mastra/core', { stdio: 'inherit' });

${MASTRA_NODE_UTIL}

// Demo: AI agent with memory and reasoning
(async () => {
  try {
    console.log('\\n🤖 Mastra Agent Framework Demo\\n');
    
    // Example 1: Simple agent
    console.log('Example 1: Basic Agent');
    console.log('=' .repeat(40));
    const { mastra, agent } = await createAgent({
      name: 'coding-assistant',
      model: 'groq/llama-3.3-70b-versatile',
      instructions: 'You are a helpful coding assistant. Provide concise, practical answers.'
    });
    
    const answer = await executeAgent(agent, 'Explain async/await in JavaScript');
    console.log('Question: Explain async/await in JavaScript');
    console.log('Answer:', answer.substring(0, 200) + '...\\n');
    
    // Example 2: Agent with memory
    console.log('\\nExample 2: Agent with Memory');
    console.log('=' .repeat(40));
    const { agent: memoryAgent } = await createAgent({
      name: 'chatbot',
      model: 'groq/llama-3.3-70b-versatile',
      instructions: 'You are a friendly chatbot. Remember context.',
      memory: true
    });
    
    await executeAgent(memoryAgent, 'My favorite color is blue');
    const remembered = await executeAgent(memoryAgent, 'What is my favorite color?');
    console.log('Agent remembers:', remembered, '\\n');
    
    // Example 3: Workflow
    console.log('\\nExample 3: Simple Workflow');
    console.log('=' .repeat(40));
    const workflow = createWorkflow({
      name: 'text-processor',
      steps: [
        {
          id: 'uppercase',
          execute: async (input) => ({
            ...input,
            processed: input.text.toUpperCase()
          })
        },
        {
          id: 'count',
          execute: async (input) => ({
            ...input,
            length: input.processed.length
          })
        }
      ]
    });
    
    const workflowResult = await executeWorkflow(workflow, { text: 'hello mastra' });
    console.log('Input: hello mastra');
    console.log('Output:', workflowResult);
    
    console.log('\\n✅ All examples complete!');
    console.log('💡 Learn more: https://docs.mastra.ai/');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\\n💡 Troubleshooting:');
    console.error('   1. Check GROQ_API_KEY is set in your .env file');
    console.error('   2. Get your key from: https://console.groq.com/keys');
    console.error('   3. Visit https://docs.mastra.ai/ for documentation');
  }
})();
`;

// ============================================================================
// Test runner (if this file is executed directly)
// ============================================================================

if (import.meta.main) {
  console.log("Mastra Agent Framework Utility - Examples and Documentation");
  console.log("=".repeat(60));
  console.log("\n📦 NPM Dependencies:");
  console.log(MASTRA_NPM_DEPS.map(dep => `  - ${dep}`).join("\n"));
  console.log("\n📚 API Documentation:");
  console.log(MASTRA_API_DOCS);
  console.log("\n" + "=".repeat(60));
}

