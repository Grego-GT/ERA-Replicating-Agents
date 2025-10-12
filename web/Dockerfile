# Use official Deno image
FROM denoland/deno:1.45.5

# Set working directory
WORKDIR /app

# Copy web directory files
COPY . .

# Copy CLI and backend files from parent directory
COPY ../cli.ts ./cli.ts
COPY ../history.ts ./history.ts
COPY ../backend ./backend
COPY ../.env ./.env 2>/dev/null || true

# Cache dependencies
RUN deno cache server.ts cli.ts

# Expose port
EXPOSE 8080

# Run the server with all necessary permissions
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--allow-sys", "--allow-run", "server.ts"]

