# Dynamic Utility Registry

## 🤯 The Key Insight

**Generated agents ARE utilities that can be used by other agents.**

This creates a **self-improving, meta-programming system** where:
1. Generate agent → Test → Save
2. Registry discovers it
3. New agents can use it as a utility
4. System builds on itself!

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Utility Registry                            │
│  Dynamically discovers and registers utilities               │
└────────┬────────────────────────────────────────────┬────────┘
         │                                            │
         ▼                                            ▼
┌──────────────────────┐                    ┌──────────────────┐
│  Built-in Utilities  │                    │ Generated Agents │
│  (utils/*/examples)  │                    │  (agents/*/)     │
│                      │                    │                  │
│  • wandb             │                    │  • fizzbuzz      │
│  • weave             │                    │  • conway-game   │
│  • future...         │                    │  • your-agents...|
└──────────────────────┘                    └──────────────────┘
         │                                            │
         └────────────────┬───────────────────────────┘
                          ▼
              ┌──────────────────────────┐
              │  System Prompt Generator │
              │  Teaches AI about ALL    │
              │  available utilities     │
              └────────┬─────────────────┘
                       │
                       ▼
              ┌──────────────────────────┐
              │   Code Generation        │
              │   Uses discovered utils  │
              └──────────────────────────┘
```

## API

### Core Functions

```typescript
// Get the complete registry (cached)
const registry = await getUtilityRegistry();

// Force refresh to discover new agents
const registry = await getUtilityRegistry(true);

// Get a specific utility
const wandb = await getUtility('wandb');
const myAgent = await getUtility('my-generated-agent');

// Generate system prompt with all utilities
const prompt = await generateUtilityPrompt(true); // includes agents

// Inject multiple utilities into code
const code = await injectUtilities(userCode, ['wandb', 'weave', 'fizzbuzz-solver']);

// List all available utilities
await listUtilities();
```

### Data Structures

**UtilityEntry**:
```typescript
{
  name: string;                // 'wandb' or 'fizzbuzz-solver'
  type: 'builtin' | 'agent';  // Where it came from
  description: string;         // What it does
  nodeUtil: string;            // Node.js code (as string)
  npmDeps: string[];           // Dependencies to install
  apiDocs: string;             // API documentation for AI
  sourcePath?: string;         // Path to source
  originalPrompt?: string;     // Original prompt (for agents)
}
```

**UtilityRegistry**:
```typescript
{
  builtins: Map<string, UtilityEntry>;  // wandb, weave, etc.
  agents: Map<string, UtilityEntry>;    // Generated agents
}
```

## How It Works

### 1. Discovery Phase

**Built-ins** (hardcoded import):
```typescript
import { WANDB_NODE_UTIL, WANDB_API_DOCS } from '../wandb/examples.ts';
```

**Agents** (dynamic discovery):
```typescript
for await (const agent of Deno.readDir('agents/')) {
  const metadata = JSON.parse(await readFile('agent.json'));
  if (metadata.attempts.some(a => a.execution.success)) {
    register(agentToUtility(metadata));
  }
}
```

### 2. Registration Phase

Extract function signatures from agent code:
```typescript
function extractFunctionSignatures(code: string) {
  // Find: /** ... */ function name(...): returnType
  return signatures;
}
```

Convert to utility format:
```typescript
{
  name: 'fizzbuzz-solver',
  type: 'agent',
  nodeUtil: '// === Agent ===\n' + agentCode + '\n// === End ===',
  apiDocs: generateDocsFrom(signatures),
  ...
}
```

### 3. System Prompt Generation

```typescript
const prompt = await generateUtilityPrompt(true);
```

Output:
```
## Available Utilities

### Built-in Utilities
- wandbChat() - Make LLM calls
- initWeave() - Add tracing

### Generated Agent Utilities
- fizzBuzzSolver(n) - Solve FizzBuzz
- createGrid(w, h) - Conway's Game of Life
```

AI learns about ALL utilities in one go!

### 4. Code Injection

```typescript
const finalCode = await injectUtilities(aiCode, [
  'wandb',        // Built-in
  'weave',        // Built-in
  'fizzbuzz-solver'  // Generated agent!
]);
```

Wraps code with all requested utilities:
```javascript
(async () => {
  execSync('npm install node-fetch@2 weave');
  
  // wandb utility
  async function wandbChat(...) { ... }
  
  // weave utility
  function initWeave(...) { ... }
  
  // fizzbuzz agent
  function fizzBuzzSolver(...) { ... }
  function createGrid(...) { ... }
  
  // User's code can now use ALL of these!
  const joke = await wandbChat('Tell me a joke');
  const grid = createGrid(10, 10);
})();
```

## Self-Improving System

### Iteration 1: Create Base Agent
```bash
deno task cli:create fizzbuzz --prompt "solve fizzbuzz"
```
→ Generates `agents/fizzbuzz-solver/`

### Iteration 2: Use It!
Registry discovers fizzbuzz-solver automatically.

Create new agent that uses it:
```bash
deno task cli:create validator --prompt "validate fizzbuzz solutions"
```

The AI can now use `fizzBuzzSolver()` in the new agent!

### Iteration 3: Compound Growth
```bash
deno task cli:create analyzer --prompt "analyze fizzbuzz patterns"
```

Now has access to:
- Built-ins: wandb, weave
- Agents: fizzbuzz-solver, validator

System keeps building on itself! 🚀

## Benefits

### 1. **Zero Redundancy**
Don't regenerate common functionality - reuse proven code.

### 2. **Composability**
Mix and match utilities/agents as needed.

### 3. **Knowledge Accumulation**
Each agent adds to the system's capabilities.

### 4. **Meta-Programming**
Agents can create agents that create agents...

### 5. **Automatic Documentation**
Agents self-document through their agent.json files.

## Example: Building a Joke System

### Step 1: Base Joke Generator
```bash
deno task cli:create joke-gen --prompt "generate jokes"
```
Creates: `generateJoke(topic): string`

### Step 2: Joke Rater
```bash
deno task cli:create joke-rater --prompt "rate jokes 1-10"
```
Can use: `generateJoke()` + `wandbChat()`
Creates: `rateJoke(joke): number`

### Step 3: Joke Curator
```bash
deno task cli:create joke-curator --prompt "curate best jokes"
```
Can use: `generateJoke()` + `rateJoke()` + `weave tracing`
Creates complete joke pipeline!

## Integration with FBI/Director

### In `core/director.ts`:
```typescript
import { generateUtilityPrompt } from '../utils/registry/index.ts';

const systemPrompt = `... existing prompt ...

${await generateUtilityPrompt(true)}

Use these utilities when appropriate!
`;
```

### In `core/fbi.ts`:
```typescript
import { injectUtilities, getUtilityRegistry } from '../utils/registry/index.ts';

// After code generation:
const finalCode = await injectUtilities(
  generatedCode,
  ['wandb', 'weave']  // Or auto-detect from code
);
```

## CLI Commands

```bash
# View registry
deno task test:registry

# Force refresh (discovers new agents)
# (Happens automatically in getUtilityRegistry)

# Use in agent generation
deno task cli:create my-agent --prompt "use fizzbuzz"
# → AI knows about fizzbuzz-solver and can use it!
```

## Future Enhancements

### 1. Semantic Search
```typescript
const utils = await searchUtilities("mathematical operations");
// Returns: fizzbuzz-solver, factorial-agent, prime-checker
```

### 2. Dependency Graph
```typescript
const deps = await getUtilityDependencies('joke-curator');
// Returns: [generateJoke, rateJoke, wandb, weave]
```

### 3. Version Control
```typescript
const util = await getUtility('fizzbuzz-solver', { version: '1.0.0' });
```

### 4. Hot Reload
```typescript
watchAgentsDirectory((newAgent) => {
  registry.agents.set(newAgent.name, newAgent);
  console.log(`New utility available: ${newAgent.name}`);
});
```

### 5. Agent Marketplace
```typescript
await publishAgent('fizzbuzz-solver', {
  public: true,
  tags: ['math', 'interview-prep']
});
```

## Testing

```bash
# Test registry discovery
deno task test:registry

# Create a test agent
deno task cli:create test-agent --prompt "test agent"

# Verify it appears in registry
deno task test:registry
# Should show test-agent in "Generated Agent Utilities"
```

## File Structure

```
utils/
└── registry/
    ├── index.ts           # Main registry implementation
    └── README.md          # This file

agents/
├── fizzbuzz-solver/
│   ├── agent.json         # Metadata (auto-discovered)
│   └── index.ts           # Code (auto-registered)
└── your-agents/
    └── ...

Auto-discovered and registered!
```

## Summary

The registry makes ERA a **self-improving meta-system**:

1. ✅ **Dynamic Discovery** - Finds all utilities automatically
2. ✅ **Unified Interface** - Built-ins and agents treated equally
3. ✅ **Self-Documentation** - Agents describe themselves
4. ✅ **Composability** - Mix any utilities together
5. ✅ **Meta-Programming** - System builds on itself
6. ✅ **Zero Configuration** - Just generate agents, they're auto-registered

**The system literally generates code for itself** 🤯

This is not just an agent factory - it's an **evolutionary code ecosystem**!

