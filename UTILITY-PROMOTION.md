# Utility Promotion System

## Overview

The ERA factory supports creating code in two locations:
- **`agents/`** - Experimental AI-generated code (default)
- **`utils/`** - Stable utilities (with `--util` flag)

Both have the same structure, so you can move between them freely!

## Creating a Utility

### Option 1: Create Directly as Utility
```bash
deno task cli:create my-util --prompt "HTTP client" --util
```

Creates in `utils/my-util/`:
```
utils/my-util/
├── index.ts          # Deno version (with injected wandb/weave)
├── agent.json        # Metadata & history
└── iterations/       # Snapshots of each attempt
```

### Option 2: Promote from Agent (Recommended - Safer)
```bash
# 1. Create as agent first
deno task cli:create my-util --prompt "HTTP client"

# 2. Test it thoroughly in agents/my-util/
deno run --allow-all agents/my-util/index.ts

# 3. Preview AI-generated examples.ts (dry-run)
deno task cli:promote my-util --dry-run

# 4. If it looks good, manually move
mv agents/my-util utils/my-util

# 5. (Optional) Generate examples.ts with AI
deno task cli:promote my-util
# OR write examples.ts manually
```

## Making it Injectable (Advanced)

If you want your utility to be **injectable** into other agents (like wandb/weave are), add `examples.ts`:

```typescript
// utils/my-util/examples.ts

/**
 * Node.js version for injection into Daytona sandboxes
 */
export const MY_UTIL_NODE_UTIL = `
// === My Util (Auto-injected) ===
async function myUtilFunction(param: string): Promise<string> {
  // Your utility code here (TypeScript typed!)
  return param.toUpperCase();
}
// === End My Util ===
`.trim();

/**
 * NPM dependencies
 */
export const MY_UTIL_NPM_DEPS = ['package-name'];

/**
 * API documentation for the AI
 */
export const MY_UTIL_API_DOCS = `
### Available Utility: myUtilFunction()

Description of what it does.

**Function Signature:**
\`\`\`typescript
async function myUtilFunction(param: string): Promise<string>
\`\`\`

**Usage Example:**
\`\`\`typescript
const result = await myUtilFunction("hello");
console.log(result); // "HELLO"
\`\`\`
`.trim();
```

Then update the registry to discover it:
```typescript
// utils/registry/index.ts
// Add your utility to the discovery logic
```

## When to Use What

### Use `agents/` (default) for:
- ✅ Experimental code
- ✅ Domain-specific agents
- ✅ Quick prototypes
- ✅ Composable building blocks
- ✅ Code that uses other agents

### Use `utils/` (with `--util`) for:
- ✅ Stable, reusable utilities
- ✅ Foundation libraries
- ✅ Code you want to maintain long-term
- ✅ Utilities that will be used by many agents
- ✅ Code you might want to inject (add examples.ts later)

## The Promotion Path

```
┌─────────────────────────────────┐
│ 1. Generate in agents/          │
│    deno task cli:create foo     │
│    - Quick prototyping           │
│    - Test & iterate              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. Test thoroughly              │
│    deno run agents/foo/index.ts │
│    - Verify it works             │
│    - Refine with feedback        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 3. Promote to utils/            │
│    Method A: Recreate with      │
│      --util flag                 │
│    Method B: mv agents/ utils/  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 4. (Optional) Make Injectable   │
│    - Add examples.ts             │
│    - Define Node.js version      │
│    - Add API docs for AI         │
│    - Update registry             │
└─────────────────────────────────┘
```

## Key Benefits

### No Manual Copying Required!
- Both folders have the same structure
- `--util` flag automatically saves to `utils/`
- Move files between folders anytime (they're compatible!)

### Progressive Enhancement
1. Start in `agents/` (experimental)
2. Promote to `utils/` with `--util` (stable)
3. Add `examples.ts` if needed (injectable)

### Clear Intent
- `agents/` = "I'm experimenting"
- `utils/` = "This is stable and reusable"
- `examples.ts` exists = "This can be injected into other agents"

## Examples

### Create Date Formatter as Utility
```bash
deno task cli:create date-formatter \
  --prompt "Format dates with various patterns" \
  --util \
  --iterations 1
```

Result: `utils/date-formatter/index.ts` ✨

### Create Agent, Then Promote
```bash
# 1. Create and test
deno task cli:create auth-helper --prompt "JWT authentication helper"
deno run agents/auth-helper/index.ts
# ... test it ...

# 2. Promote to utils
mv agents/auth-helper utils/auth-helper

# 3. (Optional) Make injectable
# Add utils/auth-helper/examples.ts manually
```

### Recreate Agent as Utility
```bash
# If you already have agents/my-thing and want it as a utility
deno task cli:create my-thing \
  --prompt "same prompt as before" \
  --util
# Overwrites into utils/my-thing/
```

## Summary

**The `--util` flag gives you control over intent without manual file management:**

- `agents/` = User space (experimental, composable)
- `utils/` = Standard library (stable, reusable)
- Both work with the registry
- Both can be used by other agents
- Same structure, different meaning

**You decide when code is "promoted" from experimentation to foundation!** 🎯

