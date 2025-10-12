# 🚀 Deploy AgFactory to Fly.io

## Prerequisites

1. **Install Fly.io CLI**:

   ```bash
   # macOS
   brew install flyctl

   # Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Sign up and login**:
   ```bash
   fly auth signup
   # or if you already have an account
   fly auth login
   ```

## Deploy Steps

### 1. Launch the app (first time only)

```bash
cd web
fly launch --no-deploy
```

When prompted:

- **App name**: Press Enter to use `agfactory-web` (or choose your own)
- **Region**: Choose closest to you (e.g., `sjc` for San Jose)
- **Postgres database**: No
- **Redis**: No

### 2. Set environment variables (optional)

```bash
# If you want to enable CLI execution in production (not recommended)
fly secrets set DENO_ENV=production

# You can also set API keys if needed
fly secrets set WANDB_API_KEY=your_key_here
fly secrets set DAYTONA_API_KEY=your_key_here
```

### 3. Deploy

```bash
fly deploy
```

This will:

- Build the Docker image
- Push it to Fly.io
- Start your application
- Assign a public URL

### 4. Open your app

```bash
fly open
```

Your app will be available at: `https://agfactory-web.fly.dev`

## Production Configuration

### Security Considerations

By default, the production deployment:

- ✅ **Disables CLI execution** (file system write protection)
- ✅ **Restricts file browsing** to the web directory only
- ✅ **No API keys exposed** (set via secrets)
- ✅ **HTTPS enforced** automatically

### Make it Public Demo

To run as a read-only demo:

```bash
# Already configured! Just deploy
fly deploy
```

Users can:

- ✅ View the UI
- ✅ Browse files in the web directory
- ❌ Cannot execute CLI commands
- ❌ Cannot create agents
- ❌ Cannot access parent directories

### Enable Full Functionality (Advanced)

If you want users to create agents:

1. **Add persistent storage**:

   ```bash
   fly volumes create agfactory_data --size 1
   ```

2. **Update fly.toml**:

   ```toml
   [mounts]
     source = "agfactory_data"
     destination = "/data"
   ```

3. **Set environment variable**:

   ```bash
   fly secrets set ENABLE_CLI=true
   ```

4. **Redeploy**:
   ```bash
   fly deploy
   ```

⚠️ **Warning**: This allows anyone to execute code on your server!

## Useful Commands

```bash
# View logs
fly logs

# Check app status
fly status

# Scale resources
fly scale memory 1024

# SSH into the machine
fly ssh console

# Restart the app
fly restart

# Stop the app
fly scale count 0

# Start the app
fly scale count 1

# Delete the app
fly apps destroy agfactory-web
```

## Monitoring

View your app dashboard:

```bash
fly dashboard
```

Or visit: https://fly.io/dashboard

## Costs

- **Free tier**: 3 shared-cpu VMs with 256MB RAM
- **Paid**: ~$0.01/hour for this configuration (512MB RAM)
- **Auto-stop**: Scales to zero when not in use (saves money!)

## Custom Domain

To use your own domain:

```bash
fly certs add yourdomain.com
```

Then add DNS records as instructed.

## Troubleshooting

**App won't start?**

```bash
fly logs
```

**Need more memory?**

```bash
fly scale memory 1024
```

**Want to test locally with Docker?**

```bash
docker build -t agfactory-web .
docker run -p 8080:8080 agfactory-web
```

## Environment Variables

Available environment variables:

- `PORT` - Server port (default: 3000, Fly sets to 8080)
- `DENO_ENV` - Set to "production" for production mode
- `ENABLE_CLI` - Set to "true" to enable CLI execution (unsafe)
- `WANDB_API_KEY` - Weights & Biases API key
- `DAYTONA_API_KEY` - Daytona API key

Set via:

```bash
fly secrets set KEY=VALUE
```

---

**Questions?** Check https://fly.io/docs or run `fly help`
