# ERA Agent Factory - Architecture

## Directory Structure

```
AgFactory/
├── core/              # System Orchestration
│   ├── fbi.ts         # FBI orchestrator (generation + execution loop)
│   ├── director.ts    # FBI Director (prompt improvement & verdicts)
│   └── prep.ts        # File preparation & agent persistence
│
├── utils/             # Standard Library (hand-crafted, stable)
│   ├── wandb/         # LLM inference via Wandb
│   ├── weave/         # Observability & tracing
│   ├── codegen/       # Code generation with LLM
│   ├── daytona/       # Sandbox execution
│   └── registry/      # Utility discovery & injection
│
├── agents/            # Generated Agents (AI-created, composable)
│   ├── jokemeister/   # Example: joke-telling agent
│   ├── joke-rater/    # Example: uses jokemeister as utility
│   └── fizzbuzz-solver/
│
├── tests/             # Test suites
├── cli.ts             # Command-line interface
└── history.ts         # Type definitions for agent history
```

## Conceptual Model

### Core (The Factory)
The machinery that runs the agent factory:
- **FBI Orchestrator**: Manages the generation → execution → refinement loop
- **Director**: Reviews prompts, provides verdicts, generates descriptions
- **Prep**: Handles file I/O, merges histories, saves iterations

These are **NOT** utilities - they're the system itself.

### Utils (Standard Library)
Hand-crafted, stable, foundational utilities:
- **wandb**: LLM inference calls
- **weave**: Tracing and observability
- **codegen**: AI code generation
- **daytona**: Sandbox execution
- **registry**: Discovers and manages utilities

These are **stable APIs** that change rarely and are thoroughly tested.

### Agents (User Space)
AI-generated code that:
1. **Uses** stdlib utilities (wandb, weave)
2. **Uses** other agents as utilities (composable)
3. **Becomes** a utility for future agents (self-improving)

These are **experimental** and evolve through AI generation.

## The Self-Improving Loop

```
┌─────────────────────────────────────┐
│ Generate Agent (uses stdlib)       │
│  - wandb, weave, codegen, daytona   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Registry Discovers Agent            │
│  - Scans agents/ directory          │
│  - Extracts metadata & description  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Agent Becomes Utility               │
│  - Available to Director            │
│  - Included in system prompt        │
│  - Can be injected into new agents  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Generate Next Agent                 │
│  - Uses stdlib (wandb, weave)       │
│  - Uses previous agents (composable)│
└─────────────────────────────────────┘
              │
              ▼
          ♾️ GROWTH
```

## Key Design Principles

### 1. Separation of Concerns
- **core/** = System machinery (not accessible to agents)
- **utils/** = Stable foundation (hand-crafted, tested)
- **agents/** = Dynamic growth (AI-generated, composable)

### 2. Everything is a Utility (Eventually)
- stdlib utilities are immediately available
- Generated agents become utilities after creation
- Registry treats both uniformly for injection

### 3. Clear Boundaries
- **core/** should never be imported by generated code
- **utils/** has stable APIs with examples.ts for injection
- **agents/** can use utils/ and other agents/

### 4. Self-Improvement
- Each agent can use all previous agents
- System capabilities grow with each generation
- No manual library management needed

## Why Not Merge utils/ and agents/?

### They Serve Different Purposes:

**utils/ (Standard Library):**
- Hand-crafted by developers
- Stable, well-tested APIs
- Examples for AI to learn from
- Foundational capabilities
- Always committed to git
- Rarely changes

**agents/ (User Space):**
- AI-generated code
- Experimental, evolving
- Built on stdlib
- Domain-specific capabilities
- May be gitignored
- Changes frequently

### Analogy:
Think of it like a programming language:
- **core/** = The compiler/runtime (Python interpreter, Rust compiler)
- **utils/** = Standard library (Python's `os`, `json`; Rust's `std::`)
- **agents/** = Your application code (uses stdlib, composes with other code)

## Future Evolution

### Possible Additions:
```
AgFactory/
├── core/
├── utils/
│   ├── wandb/
│   ├── weave/
│   ├── http/          # Future: HTTP client utility
│   └── db/            # Future: Database utility
├── agents/
│   ├── jokemeister/
│   ├── joke-rater/
│   └── data-analyzer/ # Future: uses db utility
└── plugins/           # Future: User-provided utilities
    └── custom-llm/
```

### Registry Expansion:
The registry can discover from multiple sources:
- `utils/` - built-in standard library
- `agents/` - AI-generated agents
- `plugins/` - user-provided utilities (future)
- External packages (future)

## Summary

**Current structure is correct!**

The separation between `utils/` (stdlib) and `agents/` (user space) is intentional and valuable:
- Clear distinction between stable foundation and dynamic growth
- Easy to understand what's hand-crafted vs AI-generated
- Natural boundaries for testing, gitignore, and API stability
- Mirrors successful patterns from programming language design

The registry already treats them uniformly for the AI, so the conceptual unification happens at the system prompt level, not the file system level.

