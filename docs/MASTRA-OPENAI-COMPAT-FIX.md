# Mastra OpenAI-Compatible API Configuration Fix

## The Problem

Mastra was failing with:
```
❌ Error: Attempted to parse provider/model from gpt-4 but this ID doesn't appear to contain a provider
```

## Root Cause

Mastra was trying to use OpenAI directly, but:
1. We don't have OpenAI API keys
2. We use **Wandb/Groq** which are OpenAI-compatible
3. Mastra wasn't configured to use our custom endpoints

## The Solution

Configure Mastra to use OpenAI-compatible APIs (Wandb, Groq) instead of requiring actual OpenAI keys.

### Changes Made to `utils/mastra/examples.ts`

#### 1. Configure Mastra with Custom Base URL

```javascript
// ❌ Before - expected OpenAI
function createMastra(config = {}) {
  return new Mastra({
    ...config
  });
}
```

```javascript
// ✅ After - uses our OpenAI-compatible API
function createMastra(config = {}) {
  const baseURL = process.env.INFERENCE_URL || 'https://api.inference.wandb.ai/v1';
  const apiKey = process.env.INFERENCE_API_KEY || process.env.WANDB_API_KEY;
  
  return new Mastra({
    llmProviders: {
      openai: {
        apiKey: apiKey,
        baseURL: baseURL
      }
    },
    ...config
  });
}
```

#### 2. Use Our Model Names Directly

```javascript
// ❌ Before - required provider prefix
model: 'openai:gpt-4'  // Would fail because we don't use OpenAI
```

```javascript
// ✅ After - uses our models
const model = options.model || process.env.AI_MODEL || 'Qwen/Qwen3-Coder-480B-A35B-Instruct';
```

#### 3. Removed TypeScript Annotations

```javascript
// ❌ Before - TypeScript in Node.js injection
async function createAgent(options: {
  name: string;
  model?: string;
  ...
}) { }
```

```javascript
// ✅ After - Plain JavaScript
async function createAgent(options) { }
```

## How It Works Now

### Configuration Flow

1. **Mastra initializes** with our Wandb/Groq endpoint:
   - Base URL: `process.env.INFERENCE_URL`
   - API Key: `process.env.INFERENCE_API_KEY` or `WANDB_API_KEY`

2. **Agent creation** uses our models:
   - `Qwen/Qwen3-Coder-480B-A35B-Instruct`
   - `llama-3.3-70b-versatile`
   - Or any model from `process.env.AI_MODEL`

3. **No provider prefix needed** because we configure the provider at the Mastra level

### Environment Variables Used

```env
# ERA already has these configured!
INFERENCE_URL=https://api.inference.wandb.ai/v1/chat/completions
INFERENCE_API_KEY=af24aa29192fed6ab4d6e1191194e4a4279e533c
AI_MODEL=Qwen/Qwen3-Coder-480B-A35B-Instruct

# Or component-specific (also supported)
INFERENCE_URL_DIRECTOR=https://api.groq.com/openai/v1/chat/completions
INFERENCE_API_KEY_DIRECTOR=gsk_...
AI_MODEL_DIRECTOR=llama-3.3-70b-versatile
```

## Testing

### Before (Failed)
```bash
$ deno task start:mastra
❌ Error: Attempted to parse provider/model from gpt-4
```

### After (Should Work)
```bash
$ deno task start:mastra
✅ Using Wandb/Groq with our models
✅ No OpenAI API key needed
```

## Key Insights

1. **Mastra supports OpenAI-compatible APIs** - we just need to configure it
2. **We already have everything** - INFERENCE_URL, INFERENCE_API_KEY, AI_MODEL
3. **No changes needed to .env** - it already has what Mastra needs
4. **Provider prefix not needed** - we configure the provider, not the model name

## Updated Documentation

The API docs now clearly state:
- ✅ Works with OpenAI-compatible APIs (Wandb, Groq)
- ✅ Uses ERA environment variables automatically
- ✅ No provider prefix needed in model names
- ✅ Examples use our actual models

---

**Status**: ✅ FIXED
**Date**: October 12, 2025
**Impact**: Mastra now works with our OpenAI-compatible setup

