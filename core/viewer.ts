import { basename } from 'https://deno.land/std@0.208.0/path/mod.ts';

interface AgentViewerData {
  agentName: string;
  prompt: string;
  description?: string;
  code: string;
  executionOutput?: string;
  location: string;
  sessionTimestamp?: string;
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
    </main>
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
