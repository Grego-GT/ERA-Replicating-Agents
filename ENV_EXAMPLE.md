# Environment Variables

Copy these to your `.env` file:

```bash
# ============================================================================
# ERA Agent Factory - Environment Configuration
# ============================================================================

# ============================================================================
# API Keys (Required)
# ============================================================================

# Wandb API Key - Get from https://wandb.ai/authorize
WANDB_API_KEY=your_wandb_api_key_here

# Daytona API Key - Get from https://app.daytona.io
DAYTONA_API_KEY=your_daytona_api_key_here

# ============================================================================
# System Configuration (Optional)
# ============================================================================

# Maximum iterations for FBI Director refinement loop
# Default: 3
# - Set to 1 for testing (skip retries when you know they'll fail)
# - Set higher (e.g., 5) for complex tasks that need more refinement
# - Can also override with: deno task cli:create agent --iterations 1
MAX_ITERATIONS=3
```

## Usage

### For Testing (Skip Retries)
```bash
# In .env
MAX_ITERATIONS=1
```

Then run:
```bash
deno task cli:create test-agent --prompt "your prompt"
```

### Override Per Command
```bash
# Override .env setting
deno task cli:create test-agent --prompt "your prompt" --iterations 5
```

## Priority

CLI flag `--iterations` > `.env` `MAX_ITERATIONS` > default (3)

