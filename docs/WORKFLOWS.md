# ERA Agent Factory - Complete Workflows

## Quick Reference

```bash
# Create an experimental agent
deno task cli:create my-agent --prompt "do something cool"

# Create a stable utility
deno task cli:create my-util --prompt "format strings" --util

# Preview agent promotion
deno task cli:promote my-agent --dry-run

# Test workflows
deno task test:create-util    # Guide for creating utilities
deno task test:promotion       # Guide for promoting agents
deno task test:registry        # See what's available
```

---

## The Three Workflows

### 1. 🧪 Experimental Agent (Default)

**When to use**: Prototyping, experimentation, quick iteration

```bash
# Create agent in agents/
deno task cli:create weather-bot --prompt "fetch weather from API" --iterations 1

# Test it
deno run --allow-all agents/weather-bot/index.ts

# Iterate if needed
deno task cli:create weather-bot --prompt "add error handling" --iterations 1

# Use in other agents
# The registry will discover it automatically!
```

**Result**: `agents/weather-bot/`
- ✅ index.ts (Deno code with injected utilities)
- ✅ agent.json (metadata & history)
- ✅ iterations/ (snapshots)
- ✅ Discoverable by registry
- ✅ Can be used by other agents

---

### 2. 🏗️ Stable Utility (with --util)

**When to use**: Foundation code, stable APIs, long-term maintenance

```bash
# Create directly in utils/
deno task cli:create http-client \
  --prompt "HTTP client with retry logic" \
  --util \
  --iterations 1

# Test it
deno run --allow-all utils/http-client/index.ts

# It's now a utility!
deno task test:registry
```

**Result**: `utils/http-client/`
- ✅ index.ts (Deno code)
- ✅ agent.json (metadata)
- ✅ iterations/ (history)
- ✅ Lives in utils/ (stable location)
- ❌ Not injectable yet (no examples.ts)

**To make injectable**: Add `examples.ts` manually or use promotion

---

### 3. 🚀 Promoted Utility (AI-Powered)

**When to use**: Agent is proven, ready for stdlib promotion

```bash
# Step 1: Create and test in agents/
deno task cli:create string-tools --prompt "string utilities"
deno run --allow-all agents/string-tools/index.ts
# Test thoroughly!

# Step 2: Preview AI-generated examples.ts
deno task cli:promote string-tools --dry-run
# Review the output carefully

# Step 3: Manual promotion (SAFE - Recommended)
mv agents/string-tools utils/string-tools
# Now add examples.ts manually or with AI

# OR Step 3: Auto-promote (if confident)
deno task cli:promote string-tools
# AI moves to utils/ and generates examples.ts

# Step 4: Review generated code
cat utils/string-tools/examples.ts

# Step 5: Verify registry discovers it
deno task test:registry
```

**Result**: `utils/string-tools/`
- ✅ index.ts (Deno code)
- ✅ agent.json (metadata)
- ✅ iterations/ (history)
- ✅ **examples.ts (AI-generated)** 🎉
- ✅ Discoverable by registry
- ✅ **Injectable into other agents!**

---

## Decision Tree

```
Need to create something?
│
├─ Quick prototype / experiment?
│  └─ deno task cli:create my-agent --prompt "..."
│     → Creates in agents/
│
├─ Stable foundation code?
│  └─ deno task cli:create my-util --prompt "..." --util
│     → Creates in utils/
│
└─ Promote tested agent to stdlib?
   ├─ Preview first:
   │  └─ deno task cli:promote my-agent --dry-run
   │
   └─ Then choose:
      ├─ Manual (safer):
      │  └─ mv agents/my-agent utils/my-agent
      │
      └─ Auto (faster):
         └─ deno task cli:promote my-agent
```

---

## File Structure Comparison

### Agent (agents/my-thing/)
```
agents/my-thing/
├── index.ts          # Deno code (with injected wandb/weave)
├── agent.json        # Metadata & history
└── iterations/       # Snapshots of attempts
    └── iteration-1-*.ts
```

### Utility Without Injection (utils/my-thing/)
```
utils/my-thing/
├── index.ts          # Deno code (with injected wandb/weave)
├── agent.json        # Metadata & history
└── iterations/       # Snapshots
```

### Injectable Utility (utils/my-thing/)
```
utils/my-thing/
├── index.ts          # Deno code (with injected wandb/weave)
├── agent.json        # Metadata & history
├── examples.ts       # AI-generated injection code! 🎉
│   ├── NODE_UTIL     # Node.js version
│   ├── NPM_DEPS      # Dependencies
│   └── API_DOCS      # Documentation
└── iterations/       # Snapshots
```

---

## Testing & Verification

```bash
# Test utility creation workflow
deno task test:create-util

# Test promotion workflow
deno task test:promotion

# See what's available
deno task test:registry

# Test specific agent
deno task test:jokemeister

# End-to-end test (agents using agents)
deno task test:e2e-agent
```

---

## Environment Variables

```bash
# In .env
MAX_ITERATIONS=1        # Skip retries for testing
WANDB_API_KEY=...       # Required
DAYTONA_API_KEY=...     # Required
```

See `ENV_EXAMPLE.md` for details.

---

## Safety Features

### 1. Dry-Run Mode
```bash
deno task cli:promote my-agent --dry-run
# Shows what will be generated
# No files modified
```

### 2. Manual Verification
```bash
# Always review AI-generated code
deno task cli:promote my-agent --dry-run
# If looks good:
mv agents/my-agent utils/my-agent
```

### 3. Git Safety
```bash
# Keep agents/ in git
git add agents/
git commit -m "tested agent before promotion"

# Easy rollback if needed
git checkout -- agents/my-agent
```

### 4. Force Flag
```bash
# Overwrite existing utility
deno task cli:promote my-agent --force
# Use carefully!
```

---

## Best Practices

### ✅ DO

1. **Test in agents/ first**
   ```bash
   deno task cli:create my-thing --prompt "..."
   deno run --allow-all agents/my-thing/index.ts
   ```

2. **Dry-run before promoting**
   ```bash
   deno task cli:promote my-thing --dry-run
   ```

3. **Review AI-generated code**
   ```bash
   # Check examples.ts looks correct
   cat utils/my-thing/examples.ts
   ```

4. **Use MAX_ITERATIONS=1 for testing**
   ```bash
   # In .env
   MAX_ITERATIONS=1
   ```

### ❌ DON'T

1. **Don't promote untested code**
   ```bash
   # BAD: Immediate promotion
   deno task cli:create my-thing --prompt "..." --util
   deno task cli:promote my-thing  # Hasn't been tested!
   ```

2. **Don't skip dry-run on first promotion**
   ```bash
   # BAD: No preview
   deno task cli:promote my-thing
   
   # GOOD: Preview first
   deno task cli:promote my-thing --dry-run
   ```

3. **Don't lose git history**
   ```bash
   # BAD: Delete without committing
   rm -rf agents/my-thing
   
   # GOOD: Keep in git or commit first
   git add agents/my-thing
   git commit -m "before promotion"
   ```

---

## Advanced: Custom examples.ts

If the AI-generated examples.ts isn't quite right, edit it manually:

```typescript
// utils/my-util/examples.ts

export const MY_UTIL_NODE_UTIL = `
// === My Util (Auto-injected) ===
async function myFunction(param: string): Promise<string> {
  // Your custom Node.js code here
  return param.toUpperCase();
}
// === End My Util ===
`.trim();

export const MY_UTIL_NPM_DEPS = ['your-package'];

export const MY_UTIL_API_DOCS = `
### Available Utility: myFunction()

Your custom documentation here.

**Function Signature:**
\`\`\`typescript
async function myFunction(param: string): Promise<string>
\`\`\`
`.trim();
```

Then the registry will discover it automatically!

---

## Summary

| Workflow | Command | Output | Injectable? |
|----------|---------|--------|-------------|
| **Experimental Agent** | `cli:create foo` | `agents/foo/` | ❌ (but usable) |
| **Stable Utility** | `cli:create foo --util` | `utils/foo/` | ❌ (add examples.ts) |
| **Promoted Utility** | `cli:promote foo` | `utils/foo/` + examples.ts | ✅ Yes! |

**The system is self-improving**: Each agent can become a utility, which can be used by future agents! 🚀

