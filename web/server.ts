/**
 * Deno web server for ERA (Emergent Replicating Agents)
 * Serves static files, provides API endpoints, and WebSocket for terminal
 */

import { join, extname, dirname, relative } from "@std/path";
import * as esbuild from "esbuild";

const port = parseInt(Deno.env.get("PORT") || "3000");
const isProduction = Deno.env.get("DENO_ENV") === "production" || Deno.env.get("FLY_APP_NAME");

// Track active WebSocket connections
const activeConnections = new Set<WebSocket>();

// Broadcast user count to all connected clients
function broadcastUserCount() {
  // Clean up closed connections first
  activeConnections.forEach((socket) => {
    if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
      activeConnections.delete(socket);
      console.log(`🧹 Cleaned up closed connection`);
    }
  });
  
  const count = activeConnections.size;
  const message = JSON.stringify({ type: 'user_count', count });
  
  console.log(`📢 Broadcasting user count: ${count} to ${activeConnections.size} connections`);
  
  let successCount = 0;
  activeConnections.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(message);
        successCount++;
      } catch (error) {
        console.error('Error broadcasting user count:', error);
        // Mark for cleanup
        activeConnections.delete(socket);
      }
    }
  });
  
  console.log(`✅ Successfully sent to ${successCount}/${activeConnections.size} connections`);
}

// Periodic heartbeat to keep user count updated and clean up stale connections
setInterval(() => {
  broadcastUserCount();
}, 15000); // Every 15 seconds (Fly.io WebSocket timeout is ~20s)

console.log("⏰ User count heartbeat started (15s interval)");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".ts": "application/javascript",
  ".tsx": "application/javascript",
  ".jsx": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

async function transpileTypeScript(filePath: string): Promise<string> {
  try {
    const source = await Deno.readTextFile(filePath);
    
    const result = await esbuild.transform(source, {
      loader: filePath.endsWith('.tsx') ? 'tsx' : 'ts',
      jsx: 'automatic',
      jsxImportSource: 'https://esm.sh/react@18.2.0',
      format: 'esm',
      target: 'es2020',
    });
    
    return result.code;
  } catch (error) {
    console.error(`Error transpiling ${filePath}:`, error);
    throw error;
  }
}

async function serveFile(filePath: string): Promise<Response> {
  try {
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    
    // Transpile TypeScript/TSX files
    if (ext === '.ts' || ext === '.tsx') {
      const code = await transpileTypeScript(filePath);
      return new Response(code, {
        headers: {
          "content-type": "application/javascript",
          "cache-control": "no-cache",
        },
      });
    }
    
    // Serve other files as-is
    const content = await Deno.readFile(filePath);
    return new Response(content, {
      headers: {
        "content-type": contentType,
        "cache-control": "no-cache",
      },
    });
  } catch (error) {
    console.error(`Error serving ${filePath}:`, error);
    return new Response("Not Found", { status: 404 });
  }
}

// Handle WebSocket connections for terminal
function handleWebSocket(socket: WebSocket) {
  console.log("🔌 WebSocket connecting...");
  
  // Add to active connections
  activeConnections.add(socket);
  console.log(`👥 Active connections: ${activeConnections.size}`);
  
  let currentProcess: Deno.ChildProcess | null = null;
  let processWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  
  // Track current working directory for this session
  let sessionCwd = isProduction 
    ? join(Deno.cwd(), "..")  // /app in production
    : join(Deno.cwd(), "..");  // Parent directory in development
  
  // Wait for socket to open before sending messages
  socket.onopen = () => {
    console.log("🔌 WebSocket fully open");
    try {
      socket.send(JSON.stringify({ type: 'connected' }));
      // Broadcast user count to all connected clients
      broadcastUserCount();
    } catch (error) {
      console.error('Error sending initial messages:', error);
    }
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle heartbeat ping
      if (data.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
        console.log('💓 Heartbeat ping received, pong sent');
        return;
      }
      
      if (data.type === 'start_cli' || data.type === 'run_command') {
        // Close existing process if any
        if (currentProcess) {
          try {
            currentProcess.kill('SIGTERM');
          } catch (e) {
            console.log('Process already terminated:', e);
          }
          currentProcess = null;
          processWriter = null;
        }
        
        // Determine command to run
        let commandArgs: string[];
        const baseDir = isProduction 
          ? join(Deno.cwd(), "..")  // /app in production
          : join(Deno.cwd(), "..");  // Parent directory in development
        
        if (data.type === 'start_cli') {
          // Start the CLI
          const cliPath = isProduction 
            ? join(Deno.cwd(), "..", "cli.ts")
            : join(Deno.cwd(), "..", "cli.ts");
          
          commandArgs = [
            "run",
            "--allow-read",
            "--allow-write",
            "--allow-env",
            "--allow-net",
            "--allow-sys",
            cliPath,
          ];
        } else {
          // Run arbitrary command
          const cmd = data.command.trim();
          
          // Parse the command (simple split by spaces, doesn't handle quotes)
          const parts = cmd.split(/\s+/);
          
          // Handle built-in commands
          if (parts[0] === 'clear') {
            socket.send(JSON.stringify({ type: 'clear' }));
            return;
          }
          
          if (parts[0] === 'cd') {
            // Change directory
            try {
              const targetDir = parts[1] || baseDir;
              const newPath = targetDir === '/' ? baseDir : 
                             targetDir.startsWith('/') ? targetDir :
                             join(sessionCwd, targetDir);
              
              // Resolve and validate path
              const resolvedPath = await Deno.realPath(newPath).catch(() => null);
              if (!resolvedPath) {
                socket.send(JSON.stringify({ 
                  type: 'output', 
                  data: `cd: ${targetDir}: No such file or directory\n` 
                }));
                socket.send(JSON.stringify({ type: 'process_exit', code: 1 }));
                return;
              }
              
              // Security: ensure path is within base directory
              if (!resolvedPath.startsWith(baseDir)) {
                socket.send(JSON.stringify({ 
                  type: 'output', 
                  data: `cd: ${targetDir}: Permission denied\n` 
                }));
                socket.send(JSON.stringify({ type: 'process_exit', code: 1 }));
                return;
              }
              
              // Update session cwd
              sessionCwd = resolvedPath;
              socket.send(JSON.stringify({ 
                type: 'output', 
                data: `Changed directory to: ${sessionCwd}\n` 
              }));
              socket.send(JSON.stringify({ type: 'process_exit', code: 0 }));
              return;
            } catch (error) {
              socket.send(JSON.stringify({ 
                type: 'output', 
                data: `cd: error: ${error.message}\n` 
              }));
              socket.send(JSON.stringify({ type: 'process_exit', code: 1 }));
              return;
            }
          }
          
          if (parts[0] === 'cli') {
            // Redirect to start_cli
            socket.onmessage(new MessageEvent('message', { 
              data: JSON.stringify({ type: 'start_cli' }) 
            }));
            return;
          }
          
          // For deno commands, pass through
          if (parts[0] === 'deno') {
            commandArgs = parts.slice(1);
          } else if (parts[0] === 'ls' || parts[0] === 'cat' || parts[0] === 'pwd') {
            // Shell commands
            commandArgs = ['-c', cmd];
            const command = new Deno.Command('/bin/sh', {
              args: commandArgs,
              stdin: "piped",
              stdout: "piped",
              stderr: "piped",
              cwd: sessionCwd,  // Use session's current directory
            });
            
            currentProcess = command.spawn();
            processWriter = currentProcess.stdin.getWriter();
            
            // Stream output
            (async () => {
              const decoder = new TextDecoder();
              for await (const chunk of currentProcess!.stdout) {
                socket.send(JSON.stringify({ type: 'output', data: decoder.decode(chunk) }));
              }
            })();
            
            (async () => {
              const decoder = new TextDecoder();
              for await (const chunk of currentProcess!.stderr) {
                socket.send(JSON.stringify({ type: 'output', data: decoder.decode(chunk) }));
              }
            })();
            
            currentProcess.status.then((status) => {
              socket.send(JSON.stringify({ 
                type: 'process_exit', 
                code: status.code 
              }));
              currentProcess = null;
              processWriter = null;
            });
            return;
          } else {
            // Unknown command
            socket.send(JSON.stringify({ 
              type: 'output', 
              data: `Command not found: ${parts[0]}\nTry: cli, deno, ls, cat, pwd, cd, clear\n` 
            }));
            socket.send(JSON.stringify({ type: 'process_exit', code: 127 }));
            return;
          }
        }

        const command = new Deno.Command("deno", {
          args: commandArgs,
          stdin: "piped",
          stdout: "piped",
          stderr: "piped",
          cwd: sessionCwd,  // Use session's current directory
        });

        currentProcess = command.spawn();
        processWriter = currentProcess.stdin.getWriter();

        // Stream stdout
        (async () => {
          const decoder = new TextDecoder();
          for await (const chunk of currentProcess!.stdout) {
            const text = decoder.decode(chunk);
            socket.send(JSON.stringify({ type: 'output', data: text }));
          }
        })();

        // Stream stderr
        (async () => {
          const decoder = new TextDecoder();
          for await (const chunk of currentProcess!.stderr) {
            const text = decoder.decode(chunk);
            socket.send(JSON.stringify({ type: 'output', data: text }));
          }
        })();

        // Handle process exit - Keep socket alive!
        currentProcess.status.then((status) => {
          socket.send(JSON.stringify({ 
            type: 'process_exit', 
            code: status.code 
          }));
          currentProcess = null;
          processWriter = null;
        });

      } else if (data.type === 'input') {
        // Send input to the running process
        if (processWriter) {
          const encoder = new TextEncoder();
          await processWriter.write(encoder.encode(data.data));
        }
      } else if (data.type === 'resize') {
        // Handle terminal resize (not implemented yet)
        console.log('Terminal resized:', data.cols, 'x', data.rows);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  };

  socket.onclose = () => {
    console.log("🔌 WebSocket disconnected");
    
    // Remove from active connections
    activeConnections.delete(socket);
    broadcastUserCount();
    
    // Clean up process if still running
    if (currentProcess) {
      try {
        currentProcess.kill();
      } catch (e) {
        console.error('Error killing process:', e);
      }
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let pathname = url.pathname;

  // WebSocket endpoint for terminal
  if (pathname === "/ws") {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(req);
      handleWebSocket(socket);
      return response;
    }
    return new Response("Expected WebSocket upgrade", { status: 400 });
  }

  // API endpoints
  if (pathname.startsWith("/api")) {
    if (pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "content-type": "application/json" },
      });
    }

    // File explorer API
    if (pathname === "/api/files") {
      const searchParams = url.searchParams;
      const requestedPath = searchParams.get("path") || ".";
      
      try {
        // Both dev and prod: show parent directory (/app or project root)
        const basePath = join(Deno.cwd(), "..");
        const targetPath = requestedPath === "." || requestedPath === ".." 
          ? basePath 
          : join(basePath, requestedPath);
        
        // Security: ensure path is within base directory
        const resolvedTarget = await Deno.realPath(targetPath);
        const resolvedBase = await Deno.realPath(basePath);
        
        if (!resolvedTarget.startsWith(resolvedBase)) {
          return new Response(JSON.stringify({ error: "Access denied" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }

        const entries = [];
        for await (const entry of Deno.readDir(resolvedTarget)) {
          // Skip hidden files and common ignore patterns
          if (entry.name.startsWith('.') || 
              entry.name === 'node_modules' || 
              entry.name === 'dist' ||
              entry.name === 'deno.lock') {
            continue;
          }

          const entryPath = join(resolvedTarget, entry.name);
          const relativePath = relative(resolvedBase, entryPath);

          entries.push({
            name: entry.name,
            isDirectory: entry.isDirectory,
            path: relativePath,
          });
        }

        return new Response(JSON.stringify({ 
          path: resolvedTarget,
          entries 
        }), {
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // File content API
    if (pathname === "/api/file-content") {
      const searchParams = url.searchParams;
      const requestedPath = searchParams.get("path");
      
      if (!requestedPath) {
        return new Response(JSON.stringify({ error: "Path required" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      try {
        const basePath = join(Deno.cwd(), "..");
        const targetPath = join(basePath, requestedPath);
        
        // Security: ensure path is within base directory
        const resolvedTarget = await Deno.realPath(targetPath);
        const resolvedBase = await Deno.realPath(basePath);
        
        if (!resolvedTarget.startsWith(resolvedBase)) {
          return new Response(JSON.stringify({ error: "Access denied" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }

        const content = await Deno.readTextFile(resolvedTarget);
        return new Response(JSON.stringify({ content }), {
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (pathname === "/api/agents") {
      try {
        const agentsDir = join(Deno.cwd(), "..", "agents");
        const entries = [];
        
        for await (const entry of Deno.readDir(agentsDir)) {
          if (entry.isDirectory) {
            const indexPath = join(agentsDir, entry.name, "index.ts");
            const stat = await Deno.stat(indexPath).catch(() => null);
            
            if (stat) {
              entries.push({
                name: entry.name,
                createdAt: stat.mtime || new Date(),
              });
            }
          }
        }
        
        return new Response(JSON.stringify(entries), {
          headers: { "content-type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to list agents" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (pathname.startsWith("/api/agents/")) {
      const name = pathname.split("/").pop();
      try {
        const agentPath = join(Deno.cwd(), "..", "agents", name!, "index.ts");
        const code = await Deno.readTextFile(agentPath);
        
        return new Response(JSON.stringify({ name, code }), {
          headers: { "content-type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Agent not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
    }
  }

  // Handle favicon.ico gracefully
  if (pathname === "/favicon.ico") {
    return new Response(null, { status: 204 }); // No Content
  }

  // Serve static files
  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = join(Deno.cwd(), pathname.slice(1));
  return await serveFile(filePath);
}

console.log(`🏭 ERA Web Server starting...`);
console.log(`   Mode: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
console.log(`   Port: ${port}`);
console.log(`   URL:  ${isProduction ? "https://agfactory-web.fly.dev" : `http://localhost:${port}`}`);
console.log(`\n   Press Ctrl+C to stop\n`);

// Start server
Deno.serve({ 
  port,
  hostname: "0.0.0.0"  // Required for Fly.io
}, handler);

// Cleanup esbuild on exit
globalThis.addEventListener("unload", () => {
  esbuild.stop();
});
