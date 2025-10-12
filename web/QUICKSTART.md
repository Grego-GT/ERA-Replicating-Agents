# 🚀 Quick Start - AgFactory Web

## Start the Interactive Web Interface

From the **root** of the AgFactory project:

```bash
deno task web
```

Or from the `web/` directory:

```bash
cd web
deno task dev
```

Open your browser to **http://localhost:3000**

## What You'll See

- 🏭 **Live Interactive Terminal** - Real CLI connection via WebSocket
- 📁 **Sidebar** - Your created agents list (auto-updates)
- 🎨 **Dark Theme** - Optimized for coding
- 🔌 **Live Connection** - Status indicator in top-right

## How It Works

When you open the web interface:

1. **Automatic CLI Launch** - The terminal automatically connects to and runs `deno task cli`
2. **Interactive Prompts** - Type directly in the browser terminal
3. **Real-time Output** - See all CLI output streamed live
4. **Agent Creation** - Follow the prompts to create agents
5. **Sidebar Updates** - See your new agents appear in the sidebar

## Features

✅ **Fully Interactive** - Real terminal, not simulated  
✅ **WebSocket Connection** - Live bidirectional communication  
✅ **Auto-start CLI** - No manual commands needed  
✅ **Real-time Agents List** - Sidebar shows all your agents  
✅ **Keyboard Support** - All terminal shortcuts work

## Keyboard Shortcuts

- `Ctrl+C` - Send interrupt signal
- `Ctrl+D` - Send EOF
- All standard terminal navigation works!

## Creating Your First Agent

1. Open http://localhost:3000
2. Wait for the CLI to start (you'll see the prompts)
3. Follow the interactive prompts:
   - Enter agent name
   - Enter your prompt/description
4. Watch as the AI generates and validates your agent
5. See the new agent appear in the sidebar!

## Architecture

```
Browser Terminal (xterm.js)
    ↕ WebSocket
Web Server (Deno)
    ↕ stdio pipes
AgFactory CLI (deno task cli)
    ↕
FBI Orchestrator + AI Generation
```

The web interface:

1. Spawns the actual CLI process
2. Pipes stdin/stdout through WebSocket
3. Streams everything to your browser terminal
4. Provides a native terminal experience in the browser

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/agents` - List all agents (JSON)
- `GET /api/agents/:name` - Get specific agent code
- `WS /ws` - WebSocket for terminal connection

## Troubleshooting

**Port already in use?**

```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or change the port
PORT=8080 deno task web
```

**Connection issues?**

- Check that the web server is running
- Look for errors in the terminal where you started the server
- Refresh the browser page to reconnect

**Terminal not responding?**

- Check the connection status indicator (top-right)
- Green = connected, Yellow = connecting, Red = disconnected
- Refresh to reconnect

## Next Steps

- [ ] Multi-tab terminal support
- [ ] Agent code viewer/editor
- [ ] Syntax highlighting
- [ ] Session persistence
- [ ] Collaborative sessions

Enjoy your fully interactive AgFactory! 🎉
