# FBI - Agent Workflow Orchestrator 🕵️

> FBI = "Federal Bureau of Intelligence" (it's a joke because these are "agents")

## Overview

The FBI orchestrator is the core workflow engine that coordinates AI agent creation from prompt to execution. It keeps atomic operations separate while orchestrating them together with full observability through Wandb Weave tracing.

## Key Features

- **Atomic Operations**: Keeps code generation, execution, and chat functions separate
- **Weave Tracing**: Full observability of all operations via Wandb Weave
- **History Tracking**: Comprehensive session metadata using `AgentCreationHistory` data model
- **Error Handling**: Tracks Daytona errors, compilation errors, and runtime errors
- **Session Management**: Each agent creation is a unique session with version ID

## Architecture

```
FBI Field Office: Agent Dispatch 🕵️
    ├── Agent: Code Generator 🤖 (Wandb Inference API)
    │   └── Track attempts in session data
    ├── Agent: Code Executor 🔬 (Daytona Sandbox)
    │   └── Track execution results
    └── Return Complete Case File (AgentCreationHistory)
```

Think of it like an FBI operation:
- **Field Office** = The orchestrator that coordinates everything
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
- `agentGenerateCode`: FBI Agent that interrogates AI to generate code
- `agentExecuteCode`: FBI Agent that runs code in secure sandbox
- `dispatchAgents`: FBI Field Office that coordinates all agents

These show up in your Weave dashboard as:
- `generateCodeWithAgent` 🤖
- `executeCodeInSandbox` 🔬
- `orchestrate` (dispatchAgents) 🎯

### Logged Events (visible in Weave)
1. **Generation Attempt Recorded**: After each code generation attempt
   - Attempt number, success status, code presence, version ID
2. **Execution Result Recorded**: After code execution
   - Success status, output presence, error type, version ID
3. **Session Data Summary**: At completion
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
    generation: 2500,
    execution: 1200,
    total: 3700
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

