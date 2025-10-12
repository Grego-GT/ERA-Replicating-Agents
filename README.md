# ERA 🚀

**Era of Rapid Agents** - Create AI agents with custom prompts using Deno.

A comprehensive Deno-native project featuring:

- 🤖 **CLI Tool** - Create and manage AI agents with custom prompts
- 🧠 **FBI System** - AI-powered agent orchestration with prompt improvement
- 🌐 **Web Server** - Hono-based server with Alpine.js frontend
- ☁️ **Integrations** - Daytona sandbox, Wandb AI, and Weave tracing

> **📢 Note**: Project structure organized as `core/` (orchestration) & `utils/` (helpers)  
> See [ARCHITECTURE.md](ARCHITECTURE.md) for complete documentation.

---

## 🚀 Quick Start

### Prerequisites

Install Deno (if not already installed):

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows
irm https://deno.land/install.ps1 | iex
```

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ERA

# No installation needed! Deno downloads dependencies automatically.
```

---

## 📦 Project Structure

```
AgFactory/
├── core/                    # 🧠 Core FBI Orchestration System
│   ├── fbi.ts              # Main orchestrator
│   ├── director.ts         # AI decision maker & prompt improvement
│   ├── prep.ts             # File preparation
│   └── test-prep-integration.ts
├── utils/                   # 🔧 Utility Functions
│   ├── codegen/            # AI code generation
│   ├── daytona/            # Sandbox execution
│   ├── wandb/              # AI API wrapper
│   └── weave/              # Tracing
├── tests/                   # 🧪 Test Files
├── frontend/                # 🎨 UI Assets
│   └── index.html          # Alpine.js frontend
├── agents/                  # 🤖 Generated Agents
│   └── <agent-name>/
│       ├── index.ts         # Latest/best version
│       ├── agent.json       # Full metadata & history
│       └── iterations/      # Timestamped snapshots
├── cli.ts                   # 💻 CLI Interface
├── main.ts                  # 🌐 Hono Web Server
├── history.ts               # 📝 Type Definitions
├── deno.json               # Deno configuration & tasks
├── ARCHITECTURE.md         # 📚 Architecture documentation
├── MIGRATION-GUIDE.md      # 🔄 Migration guide
└── README.md
```

---

## 🔧 Usage

### CLI Tool - Create Agents

#### Interactive Mode (Recommended) 🆕

```bash
deno task cli
```

This starts an interactive prompt with the following workflow:

1. **Describe** what you want the agent to do
2. **AI suggests** an agent name (or provide your own)
3. **Generate** code using FBI Director + AI code generation
4. **Refine** (optional) - improve the code with natural language feedback
5. **Iterate** - keep refining until you're satisfied

**New: Interactive Refinement** 💡  
After successful generation, you can refine the code by describing improvements:
- "Add error handling"
- "Make it faster with async/await"
- "Add more test cases"
- "Simplify the logic"

Each refinement creates a new iteration while preserving history.

**New: Agent Continuation** 🔄  
Using an existing agent name automatically continues development:
- Loads previous code and history
- Builds upon existing functionality
- Preserves all previous attempts
- Tracks sessions across CLI invocations

#### Command Line Mode

```bash
# Create an agent with a prompt
deno task cli:create my-agent --prompt "You are a helpful coding assistant"

# Or use the full command
deno run --allow-read --allow-write --allow-env cli.ts create my-agent -p "You are helpful"
```

#### Generated Files Structure

When you create an agent, the following structure is created:

```
agents/my-agent/
├── index.ts                    # Latest/best version (run this!)
├── agent.json                  # Full metadata with ALL attempts
└── iterations/                 # Historical snapshots
    ├── iteration-1-1760237068655.ts
    ├── iteration-2-1760237123456.ts
    └── iteration-3-1760237178901.ts
```

- **`index.ts`** - Always contains the latest/best version to run
- **`agent.json`** - Complete history of all attempts, prompts, execution results, and **sessions** (CLI invocations)
- **`iterations/`** - Timestamped snapshots so you can review or rollback

**Sessions** track each time you continue the agent with a new prompt, making it easy to see the development timeline.

#### Running Your Agents

After creating an agent, run it with:

```bash
deno run agents/my-agent/index.ts
```

Each agent is a self-contained TypeScript file that you can customize and extend.

---

### Web Server - Hono Application

#### Development Mode (with hot reload)

```bash
deno task dev
```

This starts the Hono server at `http://localhost:8000` with watch mode enabled.

#### Production Server

```bash
deno task serve
```

Runs the server on port 9995 with all necessary permissions.

#### Deploy to Deno Deploy

```bash
deno task prod
```

---

### Backend Modules

#### Test Daytona Integration

```bash
deno task test:daytona
```

Runs Daytona sandbox tests for code execution.

#### Test Wandb Integration

```bash
deno task test:wandb
```

Tests Wandb Inference API with Weave tracing.

#### Test Weave Integration

```bash
deno task test:weave
```

Tests Weave tracing functionality.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Daytona Configuration
DAYTONA_API_KEY=your_api_key
DAYTONA_API_URL=https://api.daytona.io

# Wandb Configuration
WANDB_API_KEY=your_wandb_key
WANDB_PROJECT=your-team/your-project

# Groq Configuration (for core/main.js)
GROQ_API_KEY=your_groq_key

# Zoom RTMS Configuration (for core/main.js)
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_SECRET_TOKEN=your_zoom_secret_token
WEBHOOK_PATH=/webhook

# Salesforce MCP Configuration (for core/main.js)
SALESFORCE_MCP_URL=your_salesforce_mcp_url
PARALLEL_API_KEY=your_parallel_api_key
```

### Deno Configuration

The `deno.json` file contains:

- **Tasks** - Predefined commands for common operations
- **Imports** - Dependency mapping (npm and jsr packages)
- **Compiler Options** - TypeScript configuration
- **Deploy Settings** - Deno Deploy configuration

---

## 📚 Available Tasks

| Task                     | Description                    |
| ------------------------ | ------------------------------ |
| `deno task cli`          | Run CLI in interactive mode    |
| `deno task cli:create`   | Create an agent (with args)    |
| `deno task dev`          | Run web server with watch mode |
| `deno task serve`        | Run production web server      |
| `deno task prod`         | Deploy to Deno Deploy          |
| `deno task test:daytona` | Test Daytona integration       |
| `deno task test:wandb`   | Test Wandb integration         |
| `deno task test:weave`   | Test Weave integration         |
| `deno task git`          | Quick git commit and push      |

---

## 🧪 Tech Stack

### CLI

- **Deno Standard Library** - File operations, path handling
- **Custom ANSI Colors** - Terminal styling (no external deps)
- **Custom Banner** - ASCII art generation

### Web Server

- **Hono** - Fast web framework for Deno
- **Alpine.js** - Lightweight reactive framework
- **Tailwind CSS** - Utility-first CSS framework

### Backend

- **Daytona SDK** - Code sandbox execution
- **Wandb** - AI experiment tracking and inference
- **Weave** - AI operation tracing
- **OpenAI** - LLM inference (via Wandb and Groq)

---

## 🧠 How It Works: The FBI Director System

ERA uses an intelligent "FBI Director" system that orchestrates code generation:

### Workflow

1. **Director Reviews** - Analyzes your prompt and improves it with:
   - Specific technical requirements
   - Expected input/output behavior
   - Error handling considerations
   - Best practices

2. **Code Generation** - Creates code using improved prompt via Wandb AI

3. **Sandbox Execution** - Tests code in Daytona sandbox environment

4. **Director Verdict** - Analyzes results and decides:
   - ✅ Success - code works, stop here
   - 🔄 Retry - has errors, refine and try again
   - 🛑 Stop - no progress, accept current version

5. **Iteration** - If verdict is retry, Director refines the prompt based on errors and repeats

### Interactive Refinement

After successful generation, you can provide natural language feedback:

```
Would you like to refine/improve this agent? (y/n): y

What would you like to improve?: Add input validation and better error messages
```

The Director will:
- Understand your feedback
- Build context from previous successful code
- Generate an improved version
- Test it in the sandbox
- Ask if you want to refine further

### Iteration History

Every attempt is preserved:
- `agent.json` contains ALL attempts with prompts, code, and results
- `iterations/` folder has timestamped snapshots of each version
- `index.ts` always has the latest/best version

This means:
- ✅ Never lose work
- ✅ Review what changed between iterations
- ✅ Rollback if needed
- ✅ Learn from the progression

---

## 🎯 Examples

### Example 1: Create and Refine an Agent

```bash
$ deno task cli

🚀 Welcome to ERA CLI!

What do you want the agent to do?: Create a function that reverses a string

🤖 Generating agent name...
Agent name: (default: string-reverser) [press Enter]

🤖 Creating agent: string-reverser
💬 Prompt: Create a function that reverses a string

⏳ Calling ERA orchestrator...
✅ Success! Code generated and validated

Would you like to refine/improve this agent? (y/n): y

What would you like to improve?: Add unicode emoji support and handle edge cases

🔄 Refining agent with your feedback...
✅ Refinement complete!

Would you like to refine/improve this agent? (y/n): n

✅ Agent finalized!
```

**Result:**
- `agents/string-reverser/index.ts` - Your refined agent
- `agents/string-reverser/agent.json` - Full history of both attempts
- `agents/string-reverser/iterations/` - Snapshots of each version

### Example 2: Review Iteration History

```bash
# Run the latest version
deno run agents/string-reverser/index.ts

# Compare iterations
cat agents/string-reverser/iterations/iteration-1-*.ts
cat agents/string-reverser/iterations/iteration-2-*.ts

# View complete metadata
cat agents/string-reverser/agent.json
```

### Example 3: Agent Continuation (Returning Later)

```bash
# Session 1: Create initial agent
$ deno task cli
What to do?: Create a calculator
Agent name: calculator
✅ Created!

# ... Later (hours, days, weeks) ...

# Session 2: Continue development
$ deno task cli
What to do?: Add division and modulo operations
Agent name: calculator  # Same name!

📂 Found existing agent: calculator
   Previous attempts: 1
   Continuing with new iteration...

✅ Updated! Now has division and modulo

# View session history
$ cat agents/calculator/agent.json | jq '.sessions'
[
  {
    "timestamp": "2025-10-12T02:00:00.000Z",
    "prompt": "Create a calculator",
    "attemptCount": 1
  },
  {
    "timestamp": "2025-10-12T03:30:00.000Z",
    "prompt": "Add division and modulo operations",
    "attemptCount": 1
  }
]
```

### Example 4: Start the Web Server

```bash
deno task dev
# Visit http://localhost:8000
```

---

## 🔐 Permissions

Deno is secure by default. This project requires:

- `--allow-net` - Network access (for web server and API calls)
- `--allow-read` - File system reads (for HTML, config files)
- `--allow-write` - File system writes (for creating agents)
- `--allow-env` - Environment variable access (for API keys)
- `--allow-import` - Dynamic imports (for modules)

These are pre-configured in `deno.json` tasks.

---

## 🚢 Deployment

### Deno Deploy

```bash
# Deploy to production
deno task prod
```

The deploy configuration is in `deno.json` under the `deploy` key.

### Other Platforms

The project also supports:

- **Val.town** - Set `valtown` env var
- **Smallweb** - Compatible out of the box
- **Self-hosted** - Use `deno task serve`

---

## 📝 Development

### Project Philosophy

- **Deno-Native** - No Node.js, no npm, pure Deno
- **Zero Config** - Works out of the box
- **Type Safe** - Full TypeScript support
- **Minimal Dependencies** - Leverage Deno standard library

### Adding New Features

1. **Backend Modules** - Add to `core/backend/`
2. **Frontend Pages** - Add to `core/frontend/`
3. **CLI Commands** - Extend `cli.ts`

### Code Style

- Use Deno fmt: `deno fmt`
- Use Deno lint: `deno lint`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `deno fmt` and `deno lint`
5. Submit a pull request

---

## 📄 License

ISC

---

## 🙏 Acknowledgments

- Built with [Deno](https://deno.land/)
- Powered by [Hono](https://hono.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI with [Alpine.js](https://alpinejs.dev/)

---

## 📞 Support

- Open an issue on GitHub
- Check the [Deno documentation](https://deno.land/manual)
- Visit [Hono documentation](https://hono.dev/)

---

**Made with ❤️ using Deno**
