# FBI Director - Prompt Improvement System 🎯

## Overview

The FBI Director is an AI-powered prompt improvement system that enhances user prompts before they reach code generation. It analyzes prompts for clarity, adds context and examples, and applies best practices to produce better code outputs.

## Key Features

- **AI-Powered Analysis**: Uses the same Qwen coder model to understand and improve prompts
- **Contextual Enhancement**: Adds specific technical requirements, examples, and constraints
- **Best Practices**: Incorporates code generation best practices automatically
- **Weave Tracing**: Full observability through Wandb Weave
- **Flexible Integration**: Can be used standalone or as part of the FBI workflow

## How It Works

The Director uses a specialized system prompt to:

1. **Analyze** the user's prompt for clarity and completeness
2. **Identify** missing elements (context, constraints, examples, edge cases)
3. **Enhance** the prompt with:
   - Specific technical requirements
   - Code examples or patterns
   - Expected input/output behavior
   - Error handling requirements
   - Best practices to follow
   - Testing considerations

## Usage

### Standalone

```typescript
import { improvePromptWithAI } from './backend/director.ts';

const result = await improvePromptWithAI('Create a factorial function', {
  language: 'typescript',
  agentName: 'factorial-agent'
});

console.log(result.improvedPrompt);
```

### Quick Improvement

```typescript
import { quickImprove } from './backend/director.ts';

const result = await quickImprove('sort an array', 'python');
```

### With Full Options

```typescript
import { improvePromptWithAI } from './backend/director.ts';

const result = await improvePromptWithAI('Create a todo list', {
  language: 'typescript',
  agentName: 'todo-agent',
  systemPrompt: 'You are an expert in building web applications',
  judgingCriteria: 'Code should be clean, well-tested, and maintainable',
  context: 'This is for a React application',
  model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
  temperature: 0.3
});
```

## Options

```typescript
interface PromptImprovementOptions {
  agentName?: string;          // Agent name for context
  systemPrompt?: string;        // System prompt to consider
  judgingCriteria?: string;     // Judging criteria to incorporate
  language?: string;            // Target programming language (default: 'typescript')
  context?: string;             // Additional context or constraints
  model?: string;               // Model to use (default: Qwen coder)
  temperature?: number;         // Temperature for generation (default: 0.3)
}
```

## Result Structure

```typescript
interface PromptImprovementResult {
  success: boolean;             // Whether improvement succeeded
  originalPrompt: string;       // Original user prompt
  improvedPrompt: string;       // Enhanced prompt
  improvements: string[];       // List of improvements made
  analysis?: string;            // Analysis of the original prompt
  error?: string;               // Error message if failed
  model?: string;               // Model used
}
```

## Example Transformation

### Before (Original Prompt)
```
Create a factorial function
```

### After (Improved Prompt)
```
Create a TypeScript function that calculates the factorial of a given number with the following requirements:

1. Function Signature: `function factorial(n: number): number`

2. Input Validation:
   - Accept only non-negative integers
   - Throw a TypeError for non-integer inputs
   - Throw a RangeError for negative numbers

3. Implementation:
   - Use an iterative approach for better performance
   - Handle edge cases: factorial(0) = 1, factorial(1) = 1

4. Output Format:
   - Return the calculated factorial as a number
   - For large numbers, consider BigInt support

5. Example Usage:
   ```typescript
   factorial(5)  // returns 120
   factorial(0)  // returns 1
   factorial(-1) // throws RangeError
   ```

6. Testing:
   - Include test cases for n = 0, 1, 5, 10
   - Test error handling for negative and non-integer inputs
```

## Testing

Run the Director test suite:

```bash
# Run with default test prompts
deno task test:director

# Or directly
deno run --allow-net --allow-env --allow-sys backend/director.ts
```

### Test Output

The test suite shows:
- ✅ Success status and model used
- 📝 Original prompt length
- ✨ Improved prompt length and content
- 🔍 Analysis of what was improved
- 🎯 List of specific improvements applied

## Integration with FBI Workflow

The Director is automatically used in the FBI orchestrator as Step 0:

```typescript
import { run as orchestratorRun } from './backend/fbi.ts';

const result = await orchestratorRun('Create a factorial function', {
  agentName: 'factorial-agent',
  language: 'typescript'
});

// The Director has already improved the prompt before code generation
console.log(result.promptImprovement);
```

## System Prompt

The Director uses a specialized system prompt that instructs it to:
- Preserve the user's core intent
- Add clarity without overcomplicating
- Include concrete examples when beneficial
- Specify output format requirements
- Consider edge cases and error handling
- Be specific about data types and structures
- Mention relevant patterns or best practices

The response must be valid JSON with:
- `improvedPrompt`: The enhanced prompt text
- `improvements`: Array of specific improvements made
- `analysis`: Brief analysis of the original prompt

## Error Handling

The Director is designed to fail gracefully:
- If AI call fails → returns original prompt
- If JSON parsing fails → returns original prompt
- If response is invalid → returns original prompt

This ensures the workflow continues even if prompt improvement fails.

## Weave Tracing

All Director operations are traced as `improvePromptWithAI` in Weave:

```typescript
// Automatically traced when used
const result = await improvePromptWithAI(prompt, options);
```

View traces at: https://wandb.ai/

## Model Configuration

Default model: `Qwen/Qwen3-Coder-480B-A35B-Instruct`
- Same model as code generation for consistency
- Lower temperature (0.3) for more focused improvements
- 2000 max tokens for detailed enhancements

You can override with any model supported by Wandb Inference API.

## Future Enhancements

Potential improvements to the Director:
- **Historical Learning**: Analyze past successful prompts
- **Pattern Recognition**: Identify common prompt patterns
- **A/B Testing**: Compare different improvement strategies
- **Prompt Templates**: Use templates for common tasks
- **Multi-language Optimization**: Language-specific improvements
- **Context Injection**: Automatically add project-specific context

## Benefits

1. **Better Code Quality**: More specific prompts → better code
2. **Consistency**: Standardizes prompt quality across all generations
3. **Learning**: Codifies best practices into the improvement process
4. **Time Saving**: Users don't need to write perfect prompts
5. **Observability**: All improvements are traced and analyzable

## Examples

### Simple Prompt

```typescript
// Input
const result = await quickImprove('sort an array');

// Output
result.improvedPrompt: "Create a TypeScript function that sorts an array..."
result.improvements: [
  "Added function signature specification",
  "Included input validation requirements",
  "Specified sort algorithm preferences",
  "Added example usage with test cases"
]
```

### Complex Prompt

```typescript
// Input
const result = await improvePromptWithAI('Build a todo list', {
  language: 'typescript',
  systemPrompt: 'Build modern web apps',
  judgingCriteria: 'Clean, maintainable code',
  context: 'React application with TypeScript'
});

// Output gets enhanced with:
// - React component structure
// - TypeScript interfaces for todo items
// - State management approach
// - CRUD operations specification
// - Testing requirements
```

## Architecture

```
User Prompt
    ↓
FBI Director (improvePromptWithAI)
    ├── Analyze prompt
    ├── Identify gaps
    ├── Add context & examples
    ├── Apply best practices
    └── Return enhanced prompt
        ↓
Code Generator (uses improved prompt)
    ↓
Better Code Output
```

## Configuration

Required environment variables:
- `WANDB_API_KEY`: Your Wandb API key
- `WANDB_PROJECT`: (Optional) Your Wandb project in format "team/project"

Same as other FBI components - no additional setup needed.

