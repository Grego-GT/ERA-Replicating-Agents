# AgFactory 🏭

**Agentic agent factory** - Create AI agents with custom prompts using Deno.

A comprehensive Deno-native project featuring:

- 🤖 **CLI Tool** - Create and manage AI agents with custom prompts
- 🌐 **Web Server** - Hono-based server with Alpine.js frontend
- ☁️ **Backend Integrations** - Daytona, Wandb, and Weave modules

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
cd AgFactory

# No installation needed! Deno downloads dependencies automatically.
```

---

## 📦 Project Structure

```
AgFactory/
├── cli.ts                   # CLI tool for creating agents
├── core/
│   ├── main.js              # Hono web server (main app)
│   ├── frontend/
│   │   └── index.html       # Alpine.js frontend
│   ├── backend/
│   │   ├── index.js         # Backend module exports
│   │   ├── daytona.js       # Daytona sandbox integration
│   │   ├── wandb.js         # Wandb Inference API
│   │   └── weave.js         # Weave tracing
│   ├── styles.js            # Tailwind config
│   └── inspiration.js       # Inspiration module
├── agents/                  # Generated agents (gitignored)
├── deno.json                # Deno configuration
└── README.md
```

---

## 🔧 Usage

### CLI Tool - Create Agents

#### Interactive Mode (Recommended)

```bash
deno task cli
```

This starts an interactive prompt where you can:

1. Enter agent name
2. Enter agent prompt/instructions
3. Generate a ready-to-run TypeScript agent

#### Command Line Mode

```bash
# Create an agent with a prompt
deno task cli:create my-agent --prompt "You are a helpful coding assistant"

# Or use the full command
deno run --allow-read --allow-write --allow-env cli.ts create my-agent -p "You are helpful"
```

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

## 🎯 Examples

### Create a Simple Agent

```bash
deno task cli
# Choose "Create an Agent"
# Name: hello-world
# Prompt: You greet users warmly
```

### Run the Agent

```bash
deno run agents/hello-world/index.ts
```

### Start the Web Server

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
