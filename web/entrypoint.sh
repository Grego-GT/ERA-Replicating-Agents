#!/bin/sh
set -e

# This script runs on container startup
# It handles seeding the persistent volume with demo agents if needed

echo "🚀 ERA starting..."

# Check if agents directory is empty (first run with new volume)
if [ -z "$(ls -A /app/agents 2>/dev/null)" ]; then
  echo "📦 Agents directory is empty - ready for new agents"
else
  echo "✅ Agents directory already populated ($(ls -1 /app/agents | wc -l) agents)"
fi

# Ensure proper permissions
chmod -R 755 /app/agents 2>/dev/null || true

# Start the Deno server
echo "🌐 Starting web server on port ${PORT}..."
cd /app/web
exec deno run \
  --allow-net \
  --allow-read \
  --allow-write \
  --allow-env \
  --allow-sys \
  --allow-run \
  server.ts

