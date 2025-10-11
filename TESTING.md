# Testing Guide - AgFactory Deno Migration

## Prerequisites

Install Deno:

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows
irm https://deno.land/install.ps1 | iex

# Add to PATH (if needed)
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.zshrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Test Checklist

### ✅ Test 1: Verify Deno Installation

```bash
deno --version
```

**Expected Output:**

```
deno 1.x.x
v8 11.x.x
typescript 5.x.x
```

---

### ✅ Test 2: Check Deno Configuration

```bash
cat deno.json
```

**Expected:** Valid JSON with tasks, imports, and compiler options.

---

### ✅ Test 3: List Available Tasks

```bash
deno task
```

**Expected Output:**

```
Available tasks:
- cli
- cli:create
- dev
- serve
- prod
- test:daytona
- test:wandb
- test:weave
- git
```

---

### ✅ Test 4: CLI Interactive Mode

```bash
deno task cli
```

**Steps:**

1. Choose "Create an Agent"
2. Enter name: `test-agent`
3. Enter prompt: `You are a test agent`

**Expected:**

- Agent created at `agents/test-agent/index.ts`
- Success message displayed

---

### ✅ Test 5: CLI Command Line Mode

```bash
deno run --allow-read --allow-write --allow-env cli.ts create cli-test -p "CLI test agent"
```

**Expected:**

- Agent created at `agents/cli-test/index.ts`
- Success message displayed

---

### ✅ Test 6: Run Generated Agent

```bash
deno run agents/test-agent/index.ts
```

**Expected Output:**

```
Hello World
Agent "test-agent" is running!
Prompt: You are a test agent
```

---

### ✅ Test 7: Web Server (Dev Mode)

```bash
deno task dev
```

**Steps:**

1. Server should start without errors
2. Visit `http://localhost:8000` in browser
3. Should see "AGFACTORY" heading

**Expected:**

- No errors in console
- Port 8000 listening
- HTML loads successfully

---

### ✅ Test 8: Backend Module - Daytona

**Prerequisites:** Set `DAYTONA_API_KEY` in `.env`

```bash
deno task test:daytona
```

**Expected:**

- Daytona client initialized
- Math operations executed
- Results displayed

---

### ✅ Test 9: Backend Module - Wandb

**Prerequisites:** Set `WANDB_API_KEY` in `.env`

```bash
deno task test:wandb
```

**Expected:**

- Weave tracing initialized
- Chat completion received
- Trace logged to Wandb

---

### ✅ Test 10: Backend Module - Weave

```bash
deno task test:weave
```

**Expected:**

- Example operation traced
- Success message

---

### ✅ Test 11: Verify No Node.js Artifacts

```bash
ls -la | grep -E "(package\.json|tsconfig\.json|pnpm-lock|node_modules)"
```

**Expected Output:**

- No matches (or only `.npmrc` which is harmless)

---

### ✅ Test 12: Check Imports

```bash
deno check cli.ts
deno check core/main.js
```

**Expected:**

- No type errors
- All imports resolve

---

### ✅ Test 13: Lint Code

```bash
deno lint
```

**Expected:**

- No linting errors (or only minor warnings)

---

### ✅ Test 14: Format Code

```bash
deno fmt --check
```

**Expected:**

- All files properly formatted

---

## Troubleshooting

### Issue: `deno: command not found`

**Solution:**

```bash
# Make sure Deno is in PATH
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

### Issue: Permission denied errors

**Solution:**

- Deno requires explicit permissions
- Use the pre-configured tasks in `deno.json`
- Or add necessary flags: `--allow-net`, `--allow-read`, etc.

### Issue: Import errors

**Solution:**

```bash
# Clear Deno cache and reload
deno cache --reload cli.ts
deno cache --reload core/main.js
```

### Issue: Module not found

**Solution:**

- Check `deno.json` imports section
- Verify network access: `--allow-net`
- Check jsr.io and deno.land/x availability

---

## Success Criteria

✅ All tests pass  
✅ No Node.js dependencies  
✅ CLI creates and runs agents  
✅ Web server starts and serves content  
✅ Backend modules work with API keys  
✅ Code is properly typed and linted

---

## Post-Migration Checklist

- [ ] Remove `.npmrc` (optional, harmless)
- [ ] Remove `.prettierrc` and `.eslintrc.json` (use Deno fmt/lint)
- [ ] Update CI/CD pipelines to use Deno
- [ ] Update deployment scripts
- [ ] Document API keys needed in `.env.example`

---

## Performance Expectations

### CLI Tool

- Agent creation: < 1 second
- Interactive mode startup: < 500ms

### Web Server

- Dev mode startup: < 2 seconds
- Production mode startup: < 1 second
- Hot reload: < 500ms

### Backend Modules

- Daytona sandbox: 2-5 seconds per operation
- Wandb inference: 1-3 seconds per request
- Weave tracing: < 100ms overhead

---

## Notes

- Deno caches dependencies on first run (may take 5-10 seconds)
- Subsequent runs are faster due to caching
- Use `--reload` flag to force cache refresh
- Set `DENO_DIR` to customize cache location

---

**Testing Date:** _Fill in when running tests_  
**Deno Version:** _Fill in with `deno --version`_  
**OS:** _Fill in with `uname -a`_
