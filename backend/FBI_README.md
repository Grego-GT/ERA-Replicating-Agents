# FBI - Agent Workflow Orchestrator 🕵️

> FBI = "Federal Bureau of Intelligence" (it's a joke because these are "agents")

## Overview

The FBI orchestrator is the core workflow engine that coordinates AI agent creation from prompt to execution. It keeps atomic operations separate while orchestrating them together with full observability through Wandb Weave tracing.

## Key Features

- **Prompt Improvement**: FBI Director reviews and enhances prompts before code generation
- **Atomic Operations**: Keeps code generation, execution, and chat functions separate
- **Weave Tracing**: Full observability of all operations via Wandb Weave
- **History Tracking**: Comprehensive session metadata using `AgentCreationHistory` data model
- **Error Handling**: Tracks Daytona errors, compilation errors, and runtime errors
- **Session Management**: Each agent creation is a unique session with version ID

## FBI Director (Prompt Strategist) 🎯

The FBI Director is the first step in the workflow, responsible for reviewing and improving user prompts before they reach code generation.

### Current Status
**Fully implemented** using AI-powered prompt improvement! The Director uses the Qwen coder model to analyze and enhance prompts.

### Capabilities
The Director:
- ✅ Analyzes prompt quality and clarity using AI
- ✅ Adds context and specificity to vague prompts
- ✅ Includes code examples and patterns when helpful
- ✅ Applies best practices for code generation
- ✅ Considers system prompts and judging criteria
- ✅ Provides detailed analysis of improvements made
- ✅ Falls back gracefully if improvement fails

### How It Works
1. Takes the user's prompt and context (language, agent name, criteria)
2. Sends it to the Qwen coder model with a specialized system prompt
3. Receives an enhanced prompt with specific requirements, examples, and constraints
4. Returns both original and improved versions with detailed improvement list

### Example
**Before:** "Create a factorial function"

**After:** "Create a TypeScript function that calculates factorial with input validation, error handling for negative numbers, iterative implementation, example usage, and test cases for edge cases..."

### Tracing
All Director operations are traced through Weave as `improvePromptWithAI`, allowing you to:
- Monitor prompt transformations in real-time
- Compare original vs improved prompts
- Track which improvements lead to better code
- Analyze the Director's decision-making process

See [DIRECTOR_README.md](./DIRECTOR_README.md) for detailed documentation.

## Architecture

```
FBI Field Office: Agent Dispatch 🕵️
    ├── FBI Director: Prompt Strategist 🎯
    │   └── Reviews and improves user prompts
    ├── Agent: Code Generator 🤖 (Wandb Inference API)
    │   └── Track attempts in session data
    ├── Agent: Code Executor 🔬 (Daytona Sandbox)
    │   └── Track execution results
    └── Return Complete Case File (AgentCreationHistory)
```

Think of it like an FBI operation:
- **Field Office** = The orchestrator that coordinates everything
- **Director** = Reviews and strategizes prompts before agent deployment
- **Agents** = Specialized units (Code Generator, Code Executor)
- **Case File** = Session data (AgentCreationHistory)
- **Evidence** = All traces in Weave

## Usage

### Basic Usage

```typescript
import { run as orchestratorRun } from './backend/fbi.ts';

const result = await orchestratorRun('Create a factorial function', {
  agentName: 'factorial-agent',
  maxRetries: 3
});

console.log(result.history); // One AgentCreationHistory object for THIS run
```

### With Options

```typescript
const result = await orchestratorRun('Your prompt here', {
  maxRetries: 3,
  language: 'typescript',
  model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
  agentName: 'my-agent',
  systemPrompt: 'Custom system prompt',
  judgingCriteria: 'What makes this code good',
  logCallback: (log) => {
    console.log(`[${log.level}] ${log.message}`);
  }
});
```

## Session/Run Data Model

**Important:** `AgentCreationHistory` represents ONE complete run/session. Later, you'll collect multiple `AgentCreationHistory` objects to track the actual "history" of multiple runs.

Each session/run creates an `AgentCreationHistory` object that tracks:

```typescript
interface AgentCreationHistory {
  versionID: string;              // Unique session ID
  agentName: string;              // Agent name
  ogprompt: string;               // Original user prompt
  attempts: GenerationAttempt[];  // All generation attempts
  systemPrompt?: string;          // System prompt used
  judgingCriteria?: string;       // Judging criteria
  wasExecuted: boolean;           // Whether code was executed
  files: AgentFiles;              // Generated file paths
  finalCode: string;              // Final generated code
  error?: string;                 // Error message if failed
  stackTrace?: string;            // Stack trace if available
  weaveTraceId?: string;          // Weave trace ID
  wandbProject?: string;          // Wandb project name
}
```

### Generation Attempts

Each attempt includes:

```typescript
interface GenerationAttempt {
  attemptNumber: number;
  timestamp: string;
  extractionSuccess: boolean;
  rawResponse?: string;
  extractedCode?: string;
  error?: string;
  prompt?: string;
  execution?: ExecutionResult;  // Execution results if code ran
}
```

## Testing

Run the FBI orchestrator tests:

```bash
# Run with default test prompts (3 tests)
deno task test:fbi

# Run with custom prompt
deno task test:fbi "Create a function that sorts an array"

# Run with multiple prompts
deno task test:fbi "Prompt 1" "Prompt 2" "Prompt 3"
```

### Test Output

The test script shows comprehensive information for each run:
- ✅ Success status and Version ID
- 🔢 Generation attempts and execution status
- ⏱️ Duration metrics (generation, execution, total)
- 📝 Session data summary (attempts, execution status, code length)
- 🔍 Detailed attempt information (success, timestamp, execution results)
- 💻 Generated code preview
- 📤 Execution output
- ✨ Parsed output (if JSON)

All of this data is also sent to Weave for analysis in the dashboard.

## Integration with CLI

The CLI automatically uses FBI orchestrator for AI-powered agent creation:

```bash
# Interactive mode (recommended)
deno task cli

# Command line mode
deno task cli:create my-agent --prompt "Your prompt here"
```

The CLI saves the complete session data (one `AgentCreationHistory` object) to `agents/<name>/generation-metadata.json`.

## Error Tracking

FBI tracks three types of errors:

1. **Daytona Errors**: Sandbox or API errors
2. **Compilation Errors**: TypeScript compilation failures
3. **Runtime Errors**: Code execution errors

All errors are captured in the session data (`AgentCreationHistory`) and traced through Weave.

## Weave Tracing

Every operation is wrapped with `weave.op()` for automatic tracing, and session data is logged at key points for analysis:

### Traced Operations (FBI Agents)
- `directorImprovePrompt`: FBI Director that reviews and improves prompts
- `agentGenerateCode`: FBI Agent that interrogates AI to generate code
- `agentExecuteCode`: FBI Agent that runs code in secure sandbox
- `dispatchAgents`: FBI Field Office that coordinates all agents

These show up in your Weave dashboard as:
- `improvePromptWithDirector` 🎯
- `generateCodeWithAgent` 🤖
- `executeCodeInSandbox` 🔬
- `orchestrate` (dispatchAgents) 🕵️

### Logged Events (visible in Weave)
1. **Prompt Review**: After FBI Director reviews the prompt
   - Original and improved prompt lengths, improvements applied, duration
2. **Generation Attempt Recorded**: After each code generation attempt
   - Attempt number, success status, code presence, version ID
3. **Execution Result Recorded**: After code execution
   - Success status, output presence, error type, version ID
4. **Session Data Summary**: At completion
   - Version ID, agent name, total attempts, code length, execution status, overall success

### What Gets Traced
- All input parameters (prompt, model, options)
- Each generation attempt with metadata
- Execution results with outputs and errors
- Complete session data (`AgentCreationHistory`)
- Duration metrics for each step
- All errors with stack traces

View traces at: https://wandb.ai/

### Using Weave to Check Outputs

Since all session data is traced, you can:
1. View each attempt and its results in the Weave dashboard
2. Compare outputs across different runs
3. Analyze success/failure patterns
4. Track which prompts produce better code
5. Monitor execution errors by type (Daytona, compilation, runtime)

## Example Result Structure

```typescript
{
  success: true,
  prompt: "Create a factorial function",
  promptImprovement: {
    success: true,
    originalPrompt: "Create a factorial function",
    improvedPrompt: "Create a factorial function",
    improvements: []
  },
  generation: {
    success: true,
    code: "...",
    rawResponse: "...",
    attempts: 1,
    model: "Qwen/Qwen3-Coder-480B-A35B-Instruct"
  },
  execution: {
    success: true,
    output: '{"success":true,"result":120}',
    parsedOutput: { success: true, result: 120 },
    hasError: false,
    errorType: null
  },
  history: {
    versionID: "agent-1234567890-abc123",
    agentName: "factorial-agent",
    ogprompt: "Create a factorial function",
    attempts: [/* ... */],
    wasExecuted: true,
    finalCode: "...",
    files: {
      indexFile: "agents/factorial-agent/index.ts",
      metadataFile: "agents/factorial-agent/generation-metadata.json"
    }
  },
  duration: {
    director: 50,
    generation: 2500,
    execution: 1200,
    total: 3750
  }
}
```

## Benefits

1. **Separation of Concerns**: Each operation (chat, codegen, execution) remains atomic
2. **Full Observability**: Every step is traced and logged
3. **Session Tracking**: Complete data model for each agent creation run
4. **Error Analysis**: Detailed error tracking for debugging
5. **Reproducibility**: Session data can be used to reproduce runs

## Future Enhancements

- Multi-iteration agent refinement loops (multiple runs)
- Judging/validation of generated code
- Collecting multiple `AgentCreationHistory` objects to track full history across runs
- Learning from previous session data
- A/B testing different models or prompts

