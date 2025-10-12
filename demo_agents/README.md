# Demo Agents

This directory contains example agents that are used to seed new deployments.

## Purpose

- **Read-only templates**: These agents demonstrate ERA capabilities
- **Auto-seeding**: On first deployment, these are copied to `/app/agents/`
- **Examples included**:
  - `jannn/` - Example agent
  - `poo/` - Example agent
  - `tryhard/` - Example agent

## Structure

```
demo_agents/          ← Template agents (committed to git)
  ├── jannn/
  ├── poo/
  └── tryhard/

agents/               ← Working directory (gitignored)
  └── .gitkeep        ← (agents created here during development)
```

## Local Development

When you run `deno task cli` locally, new agents are created in `../agents/` directory.

## Production Deployment

On Fly.io:

1. First deployment: `demo_agents/` copied to persistent volume at `/app/agents/`
2. Subsequent deployments: Existing agents in volume are preserved
3. New agents created via web terminal are saved to the persistent volume

## Adding New Demo Agents

To add a new demo agent:

1. Create it using the CLI locally
2. Copy it from `agents/` to `demo_agents/`
3. Commit to git
4. Deploy - it will be available on first run of new volumes
