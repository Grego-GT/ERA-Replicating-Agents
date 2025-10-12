# AgFactory Architecture

## Directory Structure

```
AgFactory/
├── core/                    # 🧠 Core Orchestration (FBI System)
│   ├── fbi.ts              # Main orchestrator
│   ├── director.ts         # AI decision maker & prompt improvement
│   ├── prep.ts             # File preparation
│   └── README-prep.md
├── utils/                   # 🔧 Utility Functions (Swappable Helpers)
│   ├── codegen/
│   │   └── index.ts        # AI code generation
│   ├── daytona/
│   │   ├── index.ts        # Sandbox execution
│   │   └── test.ts         # Daytona tests
│   ├── wandb/
│   │   ├── index.ts        # AI API wrapper
│   │   └── test.ts         # Wandb tests
│   └── weave/
│       └── index.ts        # Tracing
├── tests/                   # 🧪 Test Files
│   ├── test-prep-integration.ts
│   └── test-weave-integration.ts
├── agents/                  # 🤖 Generated Agents
├── frontend/                # 🎨 UI Assets
├── cli.ts                   # 💻 CLI Interface
├── main.ts                  # 🌐 Server/API Entry Point
└── history.ts               # 📝 Type Definitions
```

## Key Principles

- **core/** = Essential orchestration logic (FBI system)
- **utils/** = Helper utilities (can be swapped/replaced)
  - Each utility has its own directory with `index.ts` and optional `test.ts`
- **tests/** = Integration test files
- **Root files** = Interfaces (CLI, server)

## Module Responsibilities

### Core (`core/`)
**Pure orchestration logic - NO file I/O**

- `fbi.ts` - Main orchestrator, coordinates workflow
- `director.ts` - AI-powered prompt improvement and decision making
- `prep.ts` - File preparation (separate from orchestration)

### Utils (`utils/`)
**Helper utilities that can be swapped**

Each utility is self-contained in its own directory:

- `codegen/` - AI code generation
- `daytona/` - Sandbox execution (with tests)
- `wandb/` - AI API calls (with tests)
- `weave/` - Tracing integration

### Tests (`tests/`)
**Test files for integration testing**

- `test-prep-integration.ts` - Tests FBI prep module
- `test-weave-integration.ts` - Tests Weave tracing

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   CLI    │  │   API    │  │  Tests   │  │  Other  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼─────────────┼─────────────┼─────────────┼──────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
        ┌─────────────────▼─────────────────┐
        │     FBI Orchestrator (Core)        │
        │  ┌──────────────────────────────┐  │
        │  │ 0. Director (Prompt Review)  │  │
        │  │ 1. Code Generation (AI)      │  │
        │  │ 2. Code Execution (Sandbox)  │  │
        │  │ 3. Director Verdict          │  │
        │  │ 4. Refinement Loop           │  │
        │  └──────────────────────────────┘  │
        │   Returns: OrchestratorResult      │
        └─────────────┬──────────────────────┘
                      │
        ┌─────────────▼─────────────────┐
        │     FBI Prep (Optional)        │
        │  - Format code                 │
        │  - Create directories          │
        │  - Write files                 │
        └────────────────────────────────┘
```

## Benefits

1. **Semantic Clarity**: Clear distinction between core vs utilities vs tests
2. **Better Organization**: Files grouped by purpose
3. **Modularity**: Utils can be replaced without touching core
4. **Testability**: Tests separate from source code
5. **Clean Structure**: No legacy directories

## Usage

See `tests/test-prep-integration.ts` for complete examples:
- Separate orchestration and file prep
- API-style usage (no files)
- Custom base directories
- Multiple agents in parallel

Run tests:
```bash
# Integration tests
deno task test:prep
deno task test:weave

# Utility tests
deno task test:wandb
deno task test:daytona

# Core tests
deno task test:fbi
deno task test:director
```

