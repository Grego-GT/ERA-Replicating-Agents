import { basename } from 'https://deno.land/std@0.208.0/path/mod.ts';

interface AgentViewerData {
  agentName: string;
  prompt: string;
  description?: string;
  code: string;
  executionOutput?: string;
  location: string;
  sessionTimestamp?: string;
  mastraAgent?: any; // Optional Mastra agent instance for ag-ui
}

interface AgentViewerOptions {
  /** Port to bind to. Use 0 for an ephemeral port (default). */
  port?: number;
  /** Hostname to bind to. Defaults to 127.0.0.1 */
  hostname?: string;
  /** Automatically shut down server after N milliseconds. Default: 120_000 (2 minutes). */
  autoShutdownMs?: number;
}

export interface AgentViewerHandle {
  url: string;
  /** Explicitly stop the preview server. */
  shutdown: () => Promise<void>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(value: string, max = 6000): { text: string; truncated: boolean } {
  if (value.length <= max) {
    return { text: value, truncated: false };
  }
  return { text: value.slice(0, max), truncated: true };
}

function renderAgentHtml(data: AgentViewerData): string {
  const { text: trimmedCode, truncated: codeTruncated } = truncate(data.code);
  const { text: trimmedOutput, truncated: outputTruncated } = truncate(
    data.executionOutput ?? '',
    2000
  );

  const agentTitle = data.agentName || basename(data.location);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ERA Agent Preview · ${escapeHtml(agentTitle)}</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #0f172a;
        color: #e2e8f0;
      }

      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 35%, rgba(17,24,39,1) 100%);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 40px 16px;
        box-sizing: border-box;
      }

      main {
        width: min(960px, 100%);
        background: rgba(15,23,42,0.85);
        backdrop-filter: blur(24px);
        border-radius: 18px;
        border: 1px solid rgba(148,163,184,0.15);
        box-shadow: 0 30px 60px -40px rgba(15,23,42,0.9);
        padding: 32px;
      }

      h1 {
        margin: 0 0 12px;
        font-size: 28px;
        line-height: 1.2;
        color: #38bdf8;
        letter-spacing: -0.02em;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
        color: #94a3b8;
        font-size: 14px;
      }

      section {
        margin-top: 28px;
      }

      section h2 {
        margin: 0 0 12px;
        font-size: 18px;
        color: #f8fafc;
        letter-spacing: -0.01em;
      }

      .card {
        background: rgba(15,23,42,0.65);
        border-radius: 14px;
        border: 1px solid rgba(148,163,184,0.12);
        padding: 18px 20px;
        line-height: 1.6;
        color: #cbd5f5;
      }

      pre {
        margin: 0;
        overflow-x: auto;
        background: rgba(2,6,23,0.85);
        border-radius: 12px;
        border: 1px solid rgba(148,163,184,0.16);
        padding: 16px;
        font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
        font-size: 13px;
        line-height: 1.5;
        color: #f8fafc;
        white-space: pre;
      }

      code {
        font-family: inherit;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        background: rgba(56,189,248,0.12);
        color: #bae6fd;
      }

      .notice {
        margin-top: 12px;
        font-size: 12px;
        color: #94a3b8;
        font-style: italic;
      }

      a {
        color: #60a5fa;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      #openAgUiModal:hover {
        background: #0ea5e9;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(56,189,248,0.5);
      }

      #openAgUiModal:active {
        transform: translateY(0);
      }

      #closeAgUiModal:hover {
        background: rgba(148,163,184,0.15);
        color: #f8fafc;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="pill">ERA Agent Preview</div>
        <h1>${escapeHtml(agentTitle)}</h1>
        <div class="meta">
          <span><strong>Filesystem:</strong> ${escapeHtml(data.location)}</span>
          <span><strong>Prompt:</strong> ${escapeHtml(data.prompt)}</span>
          ${
            data.sessionTimestamp
              ? `<span><strong>Generated:</strong> ${escapeHtml(data.sessionTimestamp)}</span>`
              : ''
          }
        </div>
      </header>

      ${
        data.description
          ? `<section>
        <h2>What this agent does</h2>
        <div class="card">${escapeHtml(data.description)}</div>
      </section>`
          : ''
      }

      <section>
        <h2>Generated code</h2>
        <pre><code>${escapeHtml(trimmedCode)}${
    codeTruncated ? '\n// … truncated for preview' : ''
  }</code></pre>
        ${
          codeTruncated
            ? '<p class="notice">Full source available at ' + escapeHtml(data.location) + '</p>'
            : ''
        }
      </section>

      ${
        data.executionOutput
          ? `<section>
        <h2>Execution output</h2>
        <pre><code>${escapeHtml(trimmedOutput)}${
              outputTruncated ? '\n// … truncated for preview' : ''
            }</code></pre>
      </section>`
          : ''
      }

      <!-- ag-ui Modal Trigger Button -->
      <button id="openAgUiModal" style="position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(56,189,248,0.4); transition: all 0.2s;">
        View Agent State
      </button>

      <!-- ag-ui Modal Overlay -->
      <div id="agUiModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; backdrop-filter: blur(4px);">
        <div style="position: relative; width: 90%; max-width: 1200px; height: 90%; margin: 2.5% auto; background: #0f172a; border-radius: 16px; border: 1px solid rgba(148,163,184,0.2); box-shadow: 0 20px 60px rgba(0,0,0,0.6); display: flex; flex-direction: column;">
          <!-- Modal Header -->
          <div style="padding: 20px; border-bottom: 1px solid rgba(148,163,184,0.15); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #38bdf8; font-size: 20px;">Agent State & Tool Calls</h3>
            <button id="closeAgUiModal" style="background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; border-radius: 4px; transition: all 0.2s;">&times;</button>
          </div>
          
          <!-- ag-ui Container -->
          <div id="agUiContainer" style="flex: 1; overflow: auto; padding: 24px;"></div>
        </div>
      </div>
    </main>

    <script type="module">
      // ag-ui Modal Controls
      const modal = document.getElementById('agUiModal');
      const openBtn = document.getElementById('openAgUiModal');
      const closeBtn = document.getElementById('closeAgUiModal');
      const container = document.getElementById('agUiContainer');

      openBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        initializeAgUi();
      });

      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      // Close on outside click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
          modal.style.display = 'none';
        }
      });

      async function initializeAgUi() {
        try {
          container.innerHTML = '<div style="color: #8be9fd; padding: 20px; text-align: center;">Loading agent state viewer...</div>';
          
          // Import @ag-ui/core protocol for event schemas
          const agUiCore = await import('https://esm.sh/@ag-ui/core@latest');
          console.log('✅ @ag-ui/core loaded:', agUiCore);
          
          // Create custom agent state UI
          container.innerHTML = \`
            <div style="color: #e2e8f0; line-height: 1.6;">
              <div style="background: rgba(15,23,42,0.65); border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(148,163,184,0.12);">
                <h4 style="color: #38bdf8; margin-bottom: 12px; font-size: 16px;">🤖 Agent Overview</h4>
                <div style="font-size: 13px; color: #cbd5e1;">
                  <p><strong>Name:</strong> ${escapeHtml(agentTitle)}</p>
                  <p><strong>Status:</strong> <span style="color: #50fa7b;">Ready</span></p>
                  <p><strong>Framework:</strong> Mastra + @ag-ui/core Protocol</p>
                </div>
              </div>

              <div style="background: rgba(15,23,42,0.65); border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(148,163,184,0.12);">
                <h4 style="color: #38bdf8; margin-bottom: 12px; font-size: 16px;">📊 Agent State</h4>
                <div style="font-size: 13px; color: #cbd5e1;">
                  <p style="color: #94a3b8;">Agent completed successfully</p>
                  <p style="font-size: 12px; margin-top: 8px; color: #64748b;">This preview shows the generated agent.</p>
                </div>
              </div>

              <div style="background: rgba(15,23,42,0.65); border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(148,163,184,0.12);">
                <h4 style="color: #38bdf8; margin-bottom: 12px; font-size: 16px;">🔧 Tool Calls</h4>
                <div style="font-size: 13px; color: #cbd5e1;">
                  <p style="color: #94a3b8;">No tool calls recorded</p>
                  <p style="font-size: 12px; margin-top: 8px; color: #64748b;">Tool usage will be logged during agent execution.</p>
                </div>
              </div>

              <div style="background: rgba(15,23,42,0.65); border-radius: 12px; padding: 20px; border: 1px solid rgba(148,163,184,0.12);">
                <h4 style="color: #38bdf8; margin-bottom: 12px; font-size: 16px;">💡 Integration Info</h4>
                <div style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
                  <p>✅ @ag-ui/core protocol loaded</p>
                  <p>📋 Event Types Available: \${Object.keys(agUiCore.EventType || {}).length || 'Multiple'}</p>
                  <p style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(148,163,184,0.12);">
                    For live agent monitoring, run this agent with Mastra tools enabled.
                  </p>
                </div>
              </div>
            </div>
          \`;
          
          console.log('✅ Agent state viewer initialized');
        } catch (error) {
          container.innerHTML = '<div style="color: #f87171; padding: 20px;"><h4>Failed to load agent state viewer</h4><p style="color: #94a3b8; font-size: 13px; margin-top: 8px;">' + error.message + '</p></div>';
          console.error('Agent viewer error:', error);
        }
      }
    </script>
  </body>
</html>`;
}

export function startAgentViewer(
  data: AgentViewerData,
  options: AgentViewerOptions = {}
): AgentViewerHandle {
  const hostname = options.hostname ?? '127.0.0.1';
  const port = options.port ?? 0;
  const autoShutdownMs = options.autoShutdownMs ?? 120_000;

  const html = renderAgentHtml(data);

  const server = Deno.serve({ hostname, port }, (req) => {
    if (new URL(req.url).pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', agent: data.agentName }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  });

  const addr = server.addr as Deno.NetAddr;
  const url = `http://${addr.hostname}:${addr.port}`;

  if (autoShutdownMs > 0) {
    setTimeout(() => {
      try {
        server.shutdown();
      } catch {
        // no-op if already closed
      }
    }, autoShutdownMs);
  }

  return {
    url,
    shutdown: async () => {
      await server.shutdown();
    },
  };
}

