# AgFactory Web Interface

A modern web interface for the AgFactory CLI tool, featuring a terminal emulator and file browser.

## 🚀 Quick Start

### Local Development

```bash
# Start the development server
deno task dev

# Or from parent directory
cd ..
deno task web
```

Open http://localhost:3000

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Fly.io deployment instructions.

Quick deploy:

```bash
fly launch
fly deploy
```

## 📦 Features

### Terminal Interface

- ✅ Full interactive terminal
- ✅ ANSI color support
- ✅ Copy/paste friendly
- ✅ WebSocket-based real-time communication
- ✅ Ctrl+C and Ctrl+D support

### File Explorer

- ✅ Browse project files
- ✅ Navigate directories
- ✅ Preview file contents
- ✅ File type icons
- ✅ Auto-refresh on changes

### Production Ready

- ✅ Docker containerized
- ✅ Fly.io optimized
- ✅ Security hardened
- ✅ Auto-scaling
- ✅ HTTPS enabled

## 🎯 Usage

### Local Development Mode

- Full CLI functionality
- File system access
- Agent creation
- Code execution

### Production Demo Mode

- Read-only interface
- Browse files (web directory only)
- No CLI execution
- Safe for public access

## 📁 Project Structure

```
web/
├── server.ts           # Deno HTTP server + WebSocket
├── index.html          # Single-page app
├── deno.json           # Deno configuration
├── Dockerfile          # Production container
├── fly.toml            # Fly.io configuration
├── DEPLOYMENT.md       # Deployment guide
└── README.md           # This file
```

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `DENO_ENV` - Set to "production" for production mode
- `FLY_APP_NAME` - Automatically set by Fly.io
- `ENABLE_CLI` - Enable CLI execution (unsafe in production)

### API Endpoints

- `GET /` - Web interface
- `GET /api/health` - Health check
- `GET /api/files?path=<path>` - List directory contents
- `GET /api/file-content?path=<path>` - Read file contents
- `WS /ws` - WebSocket terminal connection

## 🛡️ Security

### Production Mode (Default)

- CLI execution disabled
- File browsing restricted to web directory
- No write access
- Safe for public deployment

### Development Mode

- Full CLI access
- Unrestricted file browsing
- Local use only

## 🎨 Tech Stack

- **Runtime**: Deno 1.40+
- **Server**: Deno native HTTP server
- **WebSocket**: Native WebSocket API
- **Frontend**: Vanilla JavaScript (no framework)
- **Styling**: Tailwind CSS (CDN)
- **Deployment**: Fly.io + Docker

## 📊 Performance

- **Bundle size**: ~15KB (HTML + JS)
- **Dependencies**: None (vanilla JS)
- **Load time**: <100ms
- **Memory**: ~50MB base + CLI process
- **Cost**: Free tier eligible on Fly.io

## 🐛 Troubleshooting

### Port already in use

```bash
lsof -ti:3000 | xargs kill -9
```

### WebSocket connection failed

- Check server is running
- Verify port is correct
- Look for firewall issues

### ANSI codes visible

- Refresh the page
- Check browser console for errors
- ANSI parser handles most codes

## 📝 Development

### Adding Features

1. Edit `index.html` for UI changes
2. Edit `server.ts` for API changes
3. Test locally with `deno task dev`
4. Deploy with `fly deploy`

### Debugging

Enable console logging in browser DevTools:

```javascript
// Already enabled in the code
console.log('Debug message');
```

Server logs:

```bash
# Local
deno task dev

# Production
fly logs
```

## 🤝 Contributing

This is part of the AgFactory project. See parent README for contribution guidelines.

## 📄 License

Same as parent project (ISC)

## 🔗 Links

- [AgFactory Main Repo](../)
- [Fly.io Docs](https://fly.io/docs)
- [Deno Docs](https://deno.land/manual)
