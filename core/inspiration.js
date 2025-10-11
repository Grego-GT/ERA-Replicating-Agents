/**
 * ZOOM RTMS - AI-Powered Meeting Assistant
 * 
 * ROUTING ARCHITECTURE:
 * This application uses an AI-powered intelligent router instead of regex-based keyword matching.
 * 
 * Key Features:
 * 1. AI Router (intelligentRouter): Uses openai/gpt-oss-20b to analyze user intent
 * 2. Tool Registry (UNIFIED_TOOL_REGISTRY): Single source of truth for all tools
 * 3. MCP Function Details: Each MCP tool includes specific function definitions and parameters
 * 4. Parameter Extraction: Router automatically extracts parameters from user queries
 * 5. Flexible Tool Selection: Can handle complex, ambiguous, or multi-tool requests
 * 
 * Tool Types:
 * - MCP Tools: External services (Salesforce, HuggingFace, Parallel Search)
 * - Built-in Tools: Internal handlers (Weather, Direct Answer)
 * 
 * Router Output Format:
 * {
 *   tools: ['tool_id'],              // Array of tool IDs (backward compatible)
 *   toolDetails: [{                  // Detailed tool information
 *     tool_id: 'salesforce',
 *     functions: ['sf_search_leads'],
 *     params: { company: 'Acme Corp' }
 *   }],
 *   reasoning: 'why these tools',
 *   primaryIntent: 'intent category',
 *   confidence: 0.95
 * }
 * 
 * Migration from Regex:
 * - OLD: Simple keyword matching (if text.includes('weather') -> weather tool)
 * - NEW: AI understands intent, extracts params, selects specific functions
 * - Benefits: More flexible, handles typos, understands context, extracts structured data
 */

import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import "jsr:@std/dotenv/load";
import OpenAI from "npm:openai@4.52.7";
import { getTailwindConfig, getStyles } from "./styles.js";

// Zoom RTMS configuration
const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID");
const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET");
const ZOOM_SECRET_TOKEN = Deno.env.get("ZOOM_SECRET_TOKEN");
const WEBHOOK_PATH = Deno.env.get("WEBHOOK_PATH") || "/webhook";

// Groq API configuration
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const groqClient = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Salesforce MCP configuration
const SALESFORCE_MCP_URL = Deno.env.get("SALESFORCE_MCP_URL");
console.log(`🔧 Salesforce MCP URL: ${SALESFORCE_MCP_URL || 'NOT SET - Please set SALESFORCE_MCP_URL in .env'}`);

// Unified Tool Registry - Single source of truth for all tools
const UNIFIED_TOOL_REGISTRY = {
  // MCP Tools
  huggingface: {
    id: 'huggingface',
    type: 'mcp',
    category: 'ai_ml',
    namespace: 'huggingface',
    displayName: '🤗 HuggingFace',
    description: 'Hugging Face model and dataset search and management',
    routing_keywords: ['model', 'hugging face', 'dataset', 'machine learning', 'ai model', 'transform', 'nlp', 'computer vision'],
    trigger_prompt: 'Use this when users ask about AI models, datasets, machine learning models, transformers, NLP models, or want to find pretrained models. This tool can search models, get model details, and browse trending models on Hugging Face.',
    server_label: 'Huggingface', // Match curl example exactly
    server_url: 'https://huggingface.co/mcp',
    headers: {},
    require_approval: 'always', // Match curl example
    allowed_tools: null, // Match curl example (null means allow all)
    mcp_functions: [
      { name: 'search_models', description: 'Search for models by keyword, task, or name', params: ['query', 'task', 'sort', 'limit'] },
      { name: 'get_model_info', description: 'Get detailed information about a specific model', params: ['model_id'] },
      { name: 'search_datasets', description: 'Search for datasets by keyword or task', params: ['query', 'task', 'limit'] },
      { name: 'list_trending', description: 'Get trending models', params: ['limit'] }
    ],
    auth: { type: 'none' },
    examples: ['find a text generation model', 'search for image classification datasets', 'what are trending models']
  },

  parallel_search: {
    id: 'parallel_search',
    type: 'mcp',
    category: 'search',
    namespace: 'parallel',
    displayName: '🔍 Parallel Search',
    description: 'Advanced web search and content retrieval with Parallel',
    routing_keywords: ['search', 'find', 'look up', 'current', 'latest', 'news', 'trending', 'web'],
    trigger_prompt: 'Use this when users need real-time web information, want to search the internet, need current news, or want to look up trending topics. This tool performs web searches and retrieves page content.',
    server_label: 'ParallelSearch',
    server_url: 'https://mcp.parallel.ai/v1beta/search_mcp/',
    require_approval: 'never',
    allowed_tools: ['web_search', 'get_page_content', 'search_trending'],
    mcp_functions: [
      { name: 'web_search', description: 'Search the web for information', params: ['query', 'num_results'] },
      { name: 'get_page_content', description: 'Get content from a specific URL', params: ['url'] },
      { name: 'search_trending', description: 'Get trending topics', params: ['category'] }
    ],
    auth: { type: 'env_header', header: 'x-api-key', env: 'PARALLEL_API_KEY' },
    examples: ['search for latest AI news', 'find information about quantum computing', 'what\'s trending on social media']
  },

  salesforce: {
    id: 'salesforce',
    type: 'mcp',
    category: 'crm',
    namespace: 'salesforce',
    displayName: '☁️ Salesforce',
    description: 'Salesforce CRM integration for leads, contacts, accounts, and SOQL queries',
    routing_keywords: ['salesforce', 'crm', 'lead', 'leads', 'contact', 'contacts', 'account', 'accounts', 'opportunity', 'opportunities', 'soql', 'query', 'create lead', 'search lead', 'sales'],
    trigger_prompt: 'Use this when users mention sales, leads, contacts, accounts, opportunities, or need to interact with Salesforce CRM. This includes searching for leads/contacts, creating new records, running SOQL queries, or managing CRM data. Always use this for any sales or CRM-related requests.',
    server_label: 'Salesforce',
    server_url: '', // Will be set dynamically
    require_approval: 'never',
    allowed_tools: ['sf_search_leads', 'sf_create_lead', 'sf_run_soql_query', 'sf_create_note', 'sf_get_session_info'],
    mcp_functions: [
      { name: 'sf_search_leads', description: 'Search for leads in Salesforce by company, name, status, or other fields', params: ['company', 'name', 'status', 'limit'] },
      { name: 'sf_create_lead', description: 'Create a new lead in Salesforce', params: ['first_name', 'last_name', 'company', 'email', 'phone', 'status'] },
      { name: 'sf_run_soql_query', description: 'Run a SOQL query to retrieve or manipulate Salesforce data', params: ['query'] },
      { name: 'sf_create_note', description: 'Create a note attached to a Salesforce record', params: ['parent_id', 'title', 'body'] },
      { name: 'sf_get_session_info', description: 'Get current Salesforce session information', params: [] }
    ],
    auth: { type: 'salesforce_session' }, // Custom auth type for Salesforce session-based auth
    examples: ['search for leads in Acme Corp', 'create a new lead', 'run SOQL query to get accounts', 'add note to contact']
  },

  // Built-in Tools
  weather: {
    id: 'weather',
    type: 'builtin',
    category: 'utility',
    namespace: 'general',
    displayName: '🌤️ Weather',
    description: 'Weather information using Groq compound model',
    routing_keywords: ['weather', 'temperature', 'forecast', 'climate', 'rain', 'sunny', 'cloudy', 'humidity', 'wind'],
    trigger_prompt: 'Use this when users ask about weather, temperature, forecast, or climate conditions in any location.',
    handler: getWeather,
    examples: ['what\'s the weather in SF', 'forecast for tomorrow', 'is it raining']
  },

  groq_compound: {
    id: 'groq_compound',
    type: 'builtin',
    category: 'search',
    namespace: 'general',
    displayName: '⚡ Groq Compound',
    description: 'FAST lightweight web search and code execution using Groq compound model. Instantly searches the web for any query AND can run code for math calculations, data analysis, or code execution. Much faster than parallel_search.',
    routing_keywords: ['search', 'find', 'look up', 'current', 'latest', 'news', 'trending', 'web', 'information about', 'calculate', 'math', 'run code', 'execute', 'compute'],
    trigger_prompt: 'Use this when users need: 1) Current/real-time web information, latest news, or web searches, OR 2) Math calculations, code execution, or computational tasks. This is MUCH FASTER than parallel_search and should be PREFERRED for quick web searches and calculations.',
    handler: performWebSearch,
    examples: ['search for latest AI news', 'find information about quantum computing', 'calculate 15% of 2847', 'run this python code', 'what\'s the latest on OpenAI']
  },

  direct_answer: {
    id: 'direct_answer',
    type: 'builtin',
    category: 'general',
    namespace: 'general',
    displayName: '💭 Direct Answer',
    description: 'Direct answer using Groq compound model',
    routing_keywords: ['explain', 'what is', 'how does', 'why', 'when', 'where', 'who'],
    trigger_prompt: 'Use this as a fallback when no other tools match, or when users ask general knowledge questions that don\'t require real-time data or external tools.',
    handler: answerDirectly,
    examples: ['explain machine learning', 'what is quantum computing', 'how does the internet work']
  }
};

// Function to add tools programmatically to the unified registry
function addTool(toolId, config) {
  UNIFIED_TOOL_REGISTRY[toolId] = {
    id: toolId,
    type: config.type || 'builtin',
    category: config.category || 'general',
    namespace: config.namespace || 'general',
    displayName: config.displayName || `⚙️ ${toolId}`,
    description: config.description || `${toolId} tool`,
    routing_keywords: config.routing_keywords || [],
    examples: config.examples || [],

    // MCP-specific fields
    ...(config.type === 'mcp' && {
      server_label: config.serverLabel || toolId,
      server_url: config.serverUrl,
      headers: config.headers || {},
      require_approval: config.requireApproval || 'never',
      allowed_tools: config.allowedTools || []
    }),

    // Built-in specific fields
    ...(config.type === 'builtin' && {
      handler: config.handler
    })
  };
}

// Function to get all available tools from unified registry
function getAvailableTools() {
  return { ...UNIFIED_TOOL_REGISTRY };
}

// Helper function to get tools by namespace
function getToolsByNamespace(namespace) {
  return Object.values(UNIFIED_TOOL_REGISTRY).filter(tool => tool.namespace === namespace);
}

// Helper function to get routing information for system prompts
function getRoutingInfo() {
  const routingInfo = {};

  Object.values(UNIFIED_TOOL_REGISTRY).forEach(tool => {
    if (!routingInfo[tool.namespace]) {
      routingInfo[tool.namespace] = [];
    }
    routingInfo[tool.namespace].push({
      id: tool.id,
      description: tool.description,
      keywords: tool.routing_keywords || [],
      examples: tool.examples || []
    });
  });

  return routingInfo;
}

// Store for Salesforce session credentials (in-memory, per-instance)
const salesforceCredentials = new Map();

// Helper function to get or create Salesforce session ID
function getSalesforceSessionId(userId = 'default') {
  return salesforceCredentials.get(userId);
}

// Helper function to set Salesforce session credentials
function setSalesforceCredentials(userId = 'default', credentials) {
  salesforceCredentials.set(userId, credentials);
}

// Helper function to process authentication for MCP tools based on registry auth config
function processToolAuth(toolConfig, userId = 'default') {
  const authConfig = toolConfig.auth || { type: 'none' };
  const result = {
    shouldInclude: true,
    headers: {},
    error: null
  };

  switch (authConfig.type) {
    case 'none':
      // No authentication required
      break;

    case 'salesforce_session':
      // Salesforce session-based authentication
      const sfCreds = getSalesforceSessionId(userId);
      if (!sfCreds) {
        result.shouldInclude = false;
        result.error = `No Salesforce credentials configured for ${toolConfig.id}. Please configure in the Salesforce MCP section.`;
        break;
      }

      // Add state/session_id to query params or body (handled by MCP server)
      result.headers['X-Salesforce-Session'] = sfCreds.state || sfCreds.session_id;
      result.headers['X-Salesforce-Access-Token'] = sfCreds.access_token;
      result.headers['X-Salesforce-Instance-URL'] = sfCreds.instance_url;
      break;

    case 'env_header':
      // Header authentication using environment variable
      if (!authConfig.header || !authConfig.env) {
        result.shouldInclude = false;
        result.error = `Invalid auth config: missing header or env field for ${toolConfig.id}`;
        break;
      }

      const envValue = Deno.env.get(authConfig.env);
      if (!envValue) {
        result.shouldInclude = false;
        result.error = `Missing environment variable: ${authConfig.env} for ${toolConfig.id}`;
        break;
      }

      result.headers[authConfig.header] = envValue;
      break;

    case 'bearer_token':
      // Bearer token authentication using environment variable
      if (!authConfig.env) {
        result.shouldInclude = false;
        result.error = `Invalid auth config: missing env field for bearer token auth for ${toolConfig.id}`;
        break;
      }

      const bearerToken = Deno.env.get(authConfig.env);
      if (!bearerToken) {
        result.shouldInclude = false;
        result.error = `Missing environment variable: ${authConfig.env} for ${toolConfig.id}`;
        break;
      }

      result.headers['Authorization'] = `Bearer ${bearerToken}`;
      break;

    case 'api_key':
      // Generic API key authentication
      if (!authConfig.env) {
        result.shouldInclude = false;
        result.error = `Invalid auth config: missing env field for api_key auth for ${toolConfig.id}`;
        break;
      }

      const apiKey = Deno.env.get(authConfig.env);
      if (!apiKey) {
        result.shouldInclude = false;
        result.error = `Missing environment variable: ${authConfig.env} for ${toolConfig.id}`;
        break;
      }

      const keyHeader = authConfig.header || 'X-API-Key';
      result.headers[keyHeader] = apiKey;
      break;

    default:
      result.shouldInclude = false;
      result.error = `Unknown auth type: ${authConfig.type} for ${toolConfig.id}`;
      break;
  }

  return result;
}

// Example of adding tools programmatically with different auth types:

// Example 1: MCP tool with API key header authentication
// addTool('custom_api_tool', {
//   type: 'mcp',
//   category: 'ai_ml',
//   namespace: 'custom',
//   displayName: '🤖 Custom API Tool',
//   description: 'Custom API tool with header authentication',
//   routing_keywords: ['custom', 'api', 'search'],
//   examples: ['search custom api', 'find with custom tool'],
//   serverLabel: 'CustomAPI',
//   serverUrl: 'https://api.example.com/mcp',
//   requireApproval: 'never',
//   allowedTools: ['search', 'analyze'],
//   auth: { type: 'env_header', header: 'X-API-Key', env: 'CUSTOM_API_KEY' }
// });

// Example 2: MCP tool with Bearer token authentication  
// addTool('custom_bearer_tool', {
//   type: 'mcp',
//   category: 'search',
//   namespace: 'custom',
//   displayName: '🔐 Custom Bearer Tool',
//   description: 'Custom tool with Bearer token auth',
//   routing_keywords: ['secure', 'bearer', 'auth'],
//   examples: ['secure search', 'authenticated query'],
//   serverLabel: 'SecureAPI',
//   serverUrl: 'https://secure-api.example.com/mcp',
//   requireApproval: 'always',
//   allowedTools: ['secure_search'],
//   auth: { type: 'bearer_token', env: 'SECURE_API_TOKEN' }
// });

// Example 3: MCP tool with generic API key authentication (uses X-API-Key by default)
// addTool('simple_api_tool', {
//   type: 'mcp',
//   category: 'utility',
//   namespace: 'simple',
//   displayName: '⚡ Simple API Tool',
//   description: 'Simple tool with standard API key auth',
//   routing_keywords: ['simple', 'basic', 'quick'],
//   examples: ['quick search', 'basic query'],
//   serverLabel: 'SimpleAPI',
//   serverUrl: 'https://simple.example.com/mcp',
//   requireApproval: 'never',
//   allowedTools: ['basic_search'],
//   auth: { type: 'api_key', env: 'SIMPLE_API_KEY' }
// });

// Example 4: MCP tool with no authentication required
// addTool('public_tool', {
//   type: 'mcp',
//   category: 'utility',
//   namespace: 'public',
//   displayName: '🌐 Public Tool',
//   description: 'Public tool requiring no authentication',
//   routing_keywords: ['public', 'free', 'open'],
//   examples: ['public search', 'open data'],
//   serverLabel: 'PublicAPI',
//   serverUrl: 'https://public-api.example.com/mcp',
//   requireApproval: 'never',
//   allowedTools: ['public_search'],
//   auth: { type: 'none' }
// });

// Example 5: Built-in tool (no auth needed, uses handler function)
// addTool('custom_builtin_tool', {
//   type: 'builtin',
//   category: 'utility',
//   namespace: 'custom',
//   displayName: '⚙️ Custom Tool',
//   description: 'Custom built-in tool',
//   routing_keywords: ['custom', 'utility', 'tool'],
//   examples: ['use custom tool', 'run custom function'],
//   handler: async (query, context) => {
//     // Your custom handler logic here
//     return { response: `Custom tool result for: ${query}` };
//   }
// });


const app = new Hono();

// Security headers middleware for Zoom Apps marketplace
function addSecurityHeaders(c, next) {
  // Essential CORS headers for Zoom Apps
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Zoom-App-Context, X-Zoom-App-Token');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  // Relaxed CSP for Zoom Apps marketplace
  c.header('Content-Security-Policy',
    "default-src 'self' https://*.zoom.us https://zoom.us https://app.zoom.us https://marketplace.zoom.us; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://esm.town https://code.iconify.design https://cdn.jsdelivr.net https://*.zoom.us https://zoom.us; " +
    "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://*.zoom.us https://zoom.us; " +
    "img-src 'self' data: https: blob: https://*.zoom.us https://zoom.us; " +
    "font-src 'self' https://fonts.gstatic.com https://*.zoom.us https://zoom.us; " +
    "connect-src 'self' * wss: ws: https: http: data: https://*.zoom.us https://zoom.us https://api.zoom.us; " +
    "frame-src 'self' https://*.zoom.us https://zoom.us https://app.zoom.us; " +
    "frame-ancestors 'self' https://*.zoom.us https://zoom.us https://app.zoom.us https://marketplace.zoom.us https://*.zoomgov.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self' https://*.zoom.us https://zoom.us https://app.zoom.us"
  );

  // Remove restrictive frame options for Zoom Apps
  c.header('X-Frame-Options', 'ALLOWALL');

  // Other security headers
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('X-XSS-Protection', '1; mode=block');

  return next();
}

// Handle preflight OPTIONS requests for CORS
app.options('*', (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Zoom-App-Context, X-Zoom-App-Token');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');
  return c.text('', 204);
});

// Apply security headers to all routes except WebSocket endpoints
app.use('*', (c, next) => {
  // Always skip headers on WS endpoints to avoid interfering with upgrades
  const path = c.req.path;
  if (path === '/ws' || path === '/ws-analysis') {
    return next();
  }
  // Skip security headers for WebSocket upgrade requests
  const upgradeHeader = c.req.header('Upgrade');
  const connectionHeader = c.req.header('Connection');
  const websocketKey = c.req.header('Sec-WebSocket-Key');
  const websocketVersion = c.req.header('Sec-WebSocket-Version');

  const isWebSocketUpgrade =
    (upgradeHeader === 'websocket') ||
    (connectionHeader && connectionHeader.toLowerCase().includes('upgrade')) ||
    (websocketKey && websocketVersion);

  if (isWebSocketUpgrade) {
    console.log('🔌 WebSocket upgrade request detected - skipping security headers');
    return next();
  }
  return addSecurityHeaders(c, next);
});

// RTMS data structures
const activeConnections = new Map();
// Simple SSE client pool
const sseClients = new Set();


// Cross-isolate relay for Deno Deploy: broadcast transcripts to all isolates
const INSTANCE_ID = (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function')
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2);
const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('rtms-transcripts') : null;
if (bc) {
  bc.onmessage = (ev) => {
    try {
      const msg = ev.data;
      if (!msg || msg.origin === INSTANCE_ID) return;
      if (msg.type === 'transcript') {
        for (const client of sseClients) {
          client.send('event: transcript\n' + 'data: ' + JSON.stringify(msg.payload) + '\n\n');
        }
      }
    } catch {}
  };
}

// Health check endpoint for Zoom Apps
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    zoom_app_ready: true
  });
});

// CORS test endpoint for Zoom Apps
app.get("/cors-test", (c) => {
  return c.json({
    message: "CORS is working! Zoom Apps can connect.",
    cors_headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "X-Zoom-App-Context,X-Zoom-App-Token"
    },
    zoom_domains_allowed: [
      "https://zoom.us",
      "https://*.zoom.us",
      "https://app.zoom.us",
      "https://marketplace.zoom.us"
    ]
  });
});

// Serve Alpine.js from local file
app.get("/@alpinejs@3.12.3.cdn.min.js", async (c) => {
  try {
    const alpineJs = await Deno.readTextFile("./alpinejs@3.12.3.cdn.min.js");
    return new Response(alpineJs, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('Error reading Alpine.js file:', error);
    return c.text('Alpine.js file not found', 404);
  }
});

// Serve the minimal UI at root
app.get("/", async (c) => {
  try {
    let html = await Deno.readTextFile("./frontend/index.html");
    
    // Inject Tailwind config and styles
    const tailwindConfig = JSON.stringify(getTailwindConfig());
    const styles = getStyles();
    
    // Replace placeholders in HTML
    html = html.replace('{{TAILWIND_CONFIG}}', tailwindConfig);
    html = html.replace('{{STYLES}}', styles);
    
    return c.html(html);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    return c.text('Error loading page', 500);
  }
});

// Deno crypto helper for HMAC
async function createHmacSha256(key, data) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBytes = encoder.encode(data);

  const keyImported = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', keyImported, dataBytes);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate signature for RTMS authentication
async function generateSignature(meetingUuid, streamId) {
  const message = `${ZOOM_CLIENT_ID},${meetingUuid},${streamId}`;
  return await createHmacSha256(ZOOM_CLIENT_SECRET, message);
}


// RTMS Webhook endpoint
app.post(WEBHOOK_PATH, async (c) => {
  try {
    const body = await c.req.json();
    const { event, payload } = body;

    // Handle URL validation event
    if (event === 'endpoint.url_validation' && payload?.plainToken) {
      const hash = await createHmacSha256(ZOOM_SECRET_TOKEN, payload.plainToken);
      return c.json({
        plainToken: payload.plainToken,
        encryptedToken: hash,
      });
    }

    // Handle RTMS started event
    if (event === 'meeting.rtms_started') {
      const { meeting_uuid, rtms_stream_id, server_urls } = payload;
      console.log(`🚀 WEBHOOK: RTMS started - meeting: ${meeting_uuid.slice(0, 8)}..., stream: ${rtms_stream_id}, initiating signaling connection`);
      connectToSignalingWebSocket(meeting_uuid, rtms_stream_id, server_urls);
    }

    // Handle RTMS stopped event
    if (event === 'meeting.rtms_stopped') {
      const { meeting_uuid } = payload;
      if (activeConnections.has(meeting_uuid)) {
        const connections = activeConnections.get(meeting_uuid);
        for (const conn of Object.values(connections)) {
          if (conn && typeof conn.close === 'function') {
            conn.close();
          }
        }
        activeConnections.delete(meeting_uuid);
      }
    }

    return c.json({ status: 'Event received' });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// WebSocket connection functions for RTMS
async function connectToSignalingWebSocket(meetingUuid, streamId, serverUrl) {
  const ws = new WebSocket(serverUrl);

  // Store connection for cleanup later
  if (!activeConnections.has(meetingUuid)) {
    activeConnections.set(meetingUuid, {});
  }
  activeConnections.get(meetingUuid).signaling = ws;

  ws.onopen = async () => {
    console.log(`🔌 SIGNALING: WebSocket connection opened - meeting: ${meetingUuid.slice(0, 8)}..., stream: ${streamId}`);
    const signature = await generateSignature(meetingUuid, streamId);

    // Send handshake message to the signaling server
    const handshake = {
      msg_type: 1, // SIGNALING_HAND_SHAKE_REQ
      protocol_version: 1,
      meeting_uuid: meetingUuid,
      rtms_stream_id: streamId,
      sequence: Math.floor(Math.random() * 1e9),
      signature,
    };
    ws.send(JSON.stringify(handshake));
    console.log(`📤 SIGNALING: Sent handshake request`);
  };

  ws.onmessage = async (event) => {
    try {
      const msg = await parseWsJson(event.data);

      // Handle successful handshake response
      if (msg.msg_type === 2 && msg.status_code === 0) { // SIGNALING_HAND_SHAKE_RESP
        console.log(`✅ SIGNALING: Handshake successful - status: ${msg.status_code}`);
        const mediaUrl = msg.media_server?.server_urls?.all;
        if (mediaUrl) {
          console.log(`🎯 SIGNALING: Got media server URL, connecting to media WebSocket...`);
          connectToMediaWebSocket(mediaUrl, meetingUuid, streamId, ws);
        } else {
          console.warn(`⚠️ SIGNALING: No media URL in handshake response`);
        }
      }

      // Respond to keep-alive requests
      if (msg.msg_type === 12) { // KEEP_ALIVE_REQ
        console.log(`🔄 SIGNALING: Received keep-alive request - timestamp: ${msg.timestamp}, meeting: ${meetingUuid.slice(0, 8)}...`);
        const keepAliveResponse = {
          msg_type: 13, // KEEP_ALIVE_RESP
          timestamp: msg.timestamp,
        };
        ws.send(JSON.stringify(keepAliveResponse));
        console.log(`✅ SIGNALING: Sent keep-alive response - timestamp: ${msg.timestamp}`);
      }
    } catch (error) {
      console.error('Error processing signaling message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('Signaling socket error:', error);
  };

  ws.onclose = (event) => {
    console.log(`❌ SIGNALING: WebSocket connection closed - code: ${event.code}, reason: ${event.reason || 'none'}, meeting: ${meetingUuid.slice(0, 8)}...`);
    if (activeConnections.has(meetingUuid)) {
      delete activeConnections.get(meetingUuid).signaling;
    }
  };
}

async function connectToMediaWebSocket(mediaUrl, meetingUuid, streamId, signalingSocket) {
  const mediaWs = new WebSocket(mediaUrl);

  // Store connection for cleanup later
  if (activeConnections.has(meetingUuid)) {
    activeConnections.get(meetingUuid).media = mediaWs;
  }

  mediaWs.onopen = async () => {
    console.log(`🔌 MEDIA: WebSocket connection opened - meeting: ${meetingUuid.slice(0, 8)}..., stream: ${streamId}`);
    const signature = await generateSignature(meetingUuid, streamId);
    const handshake = {
      msg_type: 3, // DATA_HAND_SHAKE_REQ
      protocol_version: 1,
      meeting_uuid: meetingUuid,
      rtms_stream_id: streamId,
      signature,
      media_type: 8, // MEDIA_DATA_TRANSCRIPT (same as Node.js version)
      payload_encryption: false,
    };
    mediaWs.send(JSON.stringify(handshake));
    console.log(`📤 MEDIA: Sent handshake request - media_type: 8 (transcript)`);
  };

  mediaWs.onmessage = async (event) => {
    try {
      const msg = await parseWsJson(event.data);

      // Handle successful media handshake
      if (msg.msg_type === 4 && msg.status_code === 0) { // DATA_HAND_SHAKE_RESP
        console.log(`✅ MEDIA: Handshake successful - status: ${msg.status_code}, ready to receive transcripts`);
        signalingSocket.send(
          JSON.stringify({
            msg_type: 7, // CLIENT_READY_ACK
            rtms_stream_id: streamId,
          })
        );
        console.log(`📤 SIGNALING: Sent CLIENT_READY_ACK via signaling socket`);
      }

      // Respond to keep-alive requests
      if (msg.msg_type === 12) { // KEEP_ALIVE_REQ
        console.log(`🔄 MEDIA: Received keep-alive request - timestamp: ${msg.timestamp}, meeting: ${meetingUuid.slice(0, 8)}..., stream: ${streamId}`);
        const keepAliveResponse = {
          msg_type: 13, // KEEP_ALIVE_RESP
          timestamp: msg.timestamp,
        };
        mediaWs.send(JSON.stringify(keepAliveResponse));
        console.log(`✅ MEDIA: Sent keep-alive response - timestamp: ${msg.timestamp}`);
      }

      // Handle transcript data
      if (msg.msg_type === 17 && msg.content && msg.content.data) {
        let { user_id, user_name, data, timestamp } = msg.content;
        console.log(`📝 Transcript: ${user_name || 'unknown'} → "${data?.slice(0, 50)}${data?.length > 50 ? '...' : ''}"`);

        // Broadcast to SSE clients (local) and to other isolates via BroadcastChannel
        try {
          const payload = {
            msg_type: 17,
            content: { user_id, user_name, data, timestamp }
          };
          
          // Store for polling endpoint
          addToRecentTranscripts(payload.content);
          
          // Local SSE
          for (const client of sseClients) {
            client.send('event: transcript\n' + 'data: ' + JSON.stringify(payload) + '\n\n');
          }
          // Cross-isolate relay
          if (bc) {
            bc.postMessage({ type: 'transcript', origin: INSTANCE_ID, payload });
          }
        } catch (e) {
          // swallow SSE broadcast errors
        }
      }

    } catch (error) {
      console.error('Error processing media message:', error);
      // suppress non-transcript noisy logs
    }
  };

  mediaWs.onerror = (error) => {
    console.error('Media socket error:', error);
  };

  mediaWs.onclose = (event) => {
    console.log(`❌ MEDIA: WebSocket connection closed - code: ${event.code}, reason: ${event.reason || 'none'}, meeting: ${meetingUuid.slice(0, 8)}...`);
    if (activeConnections.has(meetingUuid)) {
      delete activeConnections.get(meetingUuid).media;
    }
  };
}

// Zoom may provide server_urls in multiple shapes; normalize to a single wss:// URL
function resolveWsUrl(server_urls) {
  try {
    if (!server_urls) return null;
    if (typeof server_urls === 'string') return server_urls;
    if (server_urls.all) return server_urls.all;
    if (Array.isArray(server_urls) && server_urls.length > 0) return server_urls[0];
    return null;
  } catch {
    return null;
  }
}

// Robustly parse WebSocket event data (string | Blob | ArrayBuffer | Uint8Array)
async function parseWsJson(data) {
  try {
    if (typeof data === 'string') return JSON.parse(data);
    if (data instanceof Uint8Array) return JSON.parse(new TextDecoder().decode(data));
    if (data instanceof ArrayBuffer) return JSON.parse(new TextDecoder().decode(new Uint8Array(data)));
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      const text = await data.text();
      return JSON.parse(text);
    }
    // Handle Buffer (Node.js style) - might be what Deno uses
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      return JSON.parse(data.toString());
    }
    throw new Error('Unsupported WebSocket data type: ' + Object.prototype.toString.call(data));
  } catch (err) {
    throw err;
  }
}

// SSE endpoint for streaming transcripts to a minimal UI
app.get('/events', (c) => {
  let clientRef = null;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      clientRef = {
        send: (text) => controller.enqueue(encoder.encode(text)),
      };
      sseClients.add(clientRef);
      clientRef.send(': connected\n\n');
    },
    cancel() {
      if (clientRef) {
        sseClients.delete(clientRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      // Enhanced CORS headers for Zoom Apps
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Zoom-App-Context, X-Zoom-App-Token',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
});

// Handle OPTIONS requests for SSE endpoint
app.options('/events', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Zoom-App-Context, X-Zoom-App-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
});

// Polling endpoint for embedded environments that can't use SSE
let recentTranscripts = []; // Store recent transcripts for polling
let lastPollTimestamp = Date.now();

app.get('/api/poll-transcripts', (c) => {
  // Return transcripts added since last poll
  const since = parseInt(c.req.query('since')) || lastPollTimestamp;
  const newTranscripts = recentTranscripts.filter(t => t.timestamp > since);
  
  lastPollTimestamp = Date.now();
  
  return c.json({
    transcripts: newTranscripts,
    timestamp: lastPollTimestamp,
    total_stored: recentTranscripts.length
  });
});

// Salesforce MCP Credential Management Endpoints

// Get Salesforce credentials status
app.get('/api/salesforce/status', (c) => {
  const userId = c.req.query('userId') || 'default';
  const creds = getSalesforceSessionId(userId);
  
  return c.json({
    configured: !!creds,
    hasAccessToken: !!(creds?.access_token),
    hasInstanceUrl: !!(creds?.instance_url),
    sessionId: creds?.state || creds?.session_id || null,
    mcpServerUrl: SALESFORCE_MCP_URL
  });
});

// Request OAuth URL from Salesforce MCP wrapper
app.get('/api/salesforce/oauth-url', async (c) => {
  try {
    // Get the current app URL for callback
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const host = c.req.header('host') || 'localhost:8000';
    const redirectUri = `${protocol}://${host}/salesforce/oauth/callback`;
    
    const mcpUrl = `${SALESFORCE_MCP_URL}/api/oauth-url?redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log(`🔗 Calling Salesforce MCP wrapper: ${mcpUrl}`);
    
    // Call the Salesforce MCP wrapper to get OAuth URL
    const response = await fetch(mcpUrl);
    
    console.log(`📡 MCP wrapper responded with status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MCP wrapper error response: ${errorText}`);
      throw new Error(`Failed to get OAuth URL: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Got OAuth URL from MCP wrapper`);
    
    return c.json({
      success: true,
      oauthUrl: data.oauth_url,
      state: data.state,
      redirectUri: redirectUri,
      instructions: data.instructions
    });
  } catch (error) {
    console.error('❌ Error getting OAuth URL:', error);
    return c.json({
      success: false,
      error: error.message,
      mcpServerUrl: SALESFORCE_MCP_URL
    }, 500);
  }
});

// OAuth callback handler (receives code from Salesforce)
app.get('/salesforce/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  
  // Handle OAuth errors
  if (error) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salesforce OAuth Error</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 p-8">
        <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">❌</div>
            <h1 class="text-2xl font-bold text-red-600 mb-2">OAuth Error</h1>
            <p class="text-gray-600">Failed to authenticate with Salesforce</p>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-red-800 font-medium">Error: ${error}</p>
          </div>
          <div class="text-center">
            <a href="/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              ← Back to App
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  
  // Missing code parameter
  if (!code) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Error</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 p-8">
        <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">⚠️</div>
            <h1 class="text-2xl font-bold text-yellow-600 mb-2">Missing Authorization Code</h1>
            <p class="text-gray-600">No authorization code received from Salesforce</p>
          </div>
          <div class="text-center">
            <a href="/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              ← Back to App
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  
  try {
    // Exchange code for tokens via Salesforce MCP wrapper
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const host = c.req.header('host') || 'localhost:8000';
    const redirectUri = `${protocol}://${host}/salesforce/oauth/callback`;
    
    const response = await fetch(`${SALESFORCE_MCP_URL}/api/exchange-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state,
        redirect_uri: redirectUri
      })
    });
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Token exchange failed');
    }
    
    // Store credentials
    const credentials = {
      access_token: result.access_token,
      instance_url: result.instance_url,
      state: result.state || state,
      timestamp: Date.now()
    };
    
    setSalesforceCredentials('default', credentials);
    
    console.log(`✅ Salesforce OAuth completed successfully - Instance: ${result.instance_url}`);
    
    // Show success page
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salesforce Connected</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 p-8">
        <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">✅</div>
            <h1 class="text-2xl font-bold text-green-600 mb-2">Salesforce Connected!</h1>
            <p class="text-gray-600">Your Salesforce credentials have been saved successfully</p>
          </div>
          
          <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 space-y-2">
            <div class="flex items-start gap-3">
              <span class="text-green-600 font-semibold min-w-[120px]">Instance URL:</span>
              <span class="text-gray-700 break-all">${result.instance_url}</span>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-green-600 font-semibold min-w-[120px]">Session ID:</span>
              <code class="text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">${credentials.state}</code>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-green-600 font-semibold min-w-[120px]">Status:</span>
              <span class="text-green-700 font-medium">Ready to use</span>
            </div>
          </div>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 class="font-semibold text-blue-900 mb-2">🎉 What's Next?</h3>
            <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Go back to the app and start using Salesforce tools</li>
              <li>Try: "Hey Groq, search for leads in Acme Corp"</li>
              <li>Try: "Hey Groq, create a new lead for John Doe"</li>
              <li>Try: "Hey Groq, show me all accounts in Salesforce"</li>
            </ul>
          </div>
          
          <div class="text-center">
            <a href="/" class="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              ← Back to App
            </a>
          </div>
        </div>
        
        <script>
          // Notify parent window if opened in popup
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'salesforce-connected',
              instanceUrl: '${result.instance_url}',
              sessionId: '${credentials.state}'
            }, '*');
            
            // Auto-close popup after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          }
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Error</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 p-8">
        <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">❌</div>
            <h1 class="text-2xl font-bold text-red-600 mb-2">Connection Failed</h1>
            <p class="text-gray-600">Failed to exchange OAuth code for credentials</p>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-red-800 font-medium">Error: ${error.message}</p>
          </div>
          <div class="text-center space-x-4">
            <a href="/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              ← Back to App
            </a>
            <button onclick="window.location.reload()" class="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
              🔄 Try Again
            </button>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// Set Salesforce credentials (for copy-paste flow)
app.post('/api/salesforce/credentials', async (c) => {
  try {
    const body = await c.req.json();
    const { access_token, instance_url, state, userId = 'default' } = body;
    
    if (!access_token || !instance_url) {
      return c.json({ 
        error: 'Missing required fields: access_token and instance_url are required',
        success: false 
      }, 400);
    }
    
    // Store credentials
    const credentials = {
      access_token,
      instance_url,
      state: state || `session_${Date.now()}`,
      timestamp: Date.now()
    };
    
    setSalesforceCredentials(userId, credentials);
    
    console.log(`✅ Salesforce credentials configured for user: ${userId}`);
    
    return c.json({
      success: true,
      message: 'Salesforce credentials saved successfully',
      sessionId: credentials.state,
      instanceUrl: instance_url
    });
  } catch (error) {
    console.error('Error setting Salesforce credentials:', error);
    return c.json({ 
      error: error.message,
      success: false 
    }, 500);
  }
});

// Clear Salesforce credentials
app.delete('/api/salesforce/credentials', (c) => {
  const userId = c.req.query('userId') || 'default';
  salesforceCredentials.delete(userId);
  
  return c.json({
    success: true,
    message: 'Salesforce credentials cleared'
  });
});

// Function to add transcript to recent transcripts for polling
function addToRecentTranscripts(transcript) {
  recentTranscripts.unshift(transcript);
  
  // Keep only last 50 transcripts to prevent memory issues
  if (recentTranscripts.length > 50) {
    recentTranscripts = recentTranscripts.slice(0, 50);
  }
}


// Enhanced AI-powered router that decides which tools and specific MCP functions to use
async function intelligentRouter(question, userName, context = {}, chatHistory = []) {
  try {
    // Get routing information from unified registry
    const availableTools = getAvailableTools();

    console.log(`🔍 ROUTING: Analyzing question: "${question}" from user: ${userName}`);

    // Prepare chat history context (last 5 messages for context)
    const recentHistory = chatHistory.slice(-5).map(msg => ({
      role: msg.user_id === 'groq-ai' ? 'assistant' : 'user',
      content: msg.data,
      timestamp: msg.timestamp
    }));

    // Build detailed tool information including MCP functions
    const toolsDescription = Object.values(availableTools).map(tool => {
      let toolInfo = `## ${tool.displayName} (${tool.id})
Type: ${tool.type}
Description: ${tool.description}
Trigger: ${tool.trigger_prompt || 'N/A'}
Examples: ${tool.examples.join('; ')}`;

      // Add MCP function details if available
      if (tool.mcp_functions && tool.mcp_functions.length > 0) {
        toolInfo += `\nAvailable Functions:`;
        tool.mcp_functions.forEach(func => {
          toolInfo += `\n  - ${func.name}: ${func.description}`;
          if (func.params && func.params.length > 0) {
            toolInfo += `\n    Parameters: ${func.params.join(', ')}`;
          }
        });
      }

      return toolInfo;
    }).join('\n\n');

    // Get today's date for context
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Dynamically generate system prompt from registry with detailed MCP function info
    const systemPrompt = `You are an intelligent routing system for Groq AI. Your task is to analyze user questions and select the most appropriate tools and specific functions to use.

TODAY'S DATE: ${today}

CRITICAL INSTRUCTIONS:
1. You MUST respond with VALID JSON only
2. Do NOT include any explanatory text before or after the JSON
3. The JSON must start with { and end with }
4. For MCP tools, specify which specific functions should be called
5. Extract parameters from the user's question when possible

QUESTION TO ANALYZE: "${question}"
USER: ${userName}

AVAILABLE TOOLS AND FUNCTIONS:
${toolsDescription}

ROUTING RULES:
1. **Salesforce Priority**: If user mentions sales, leads, contacts, accounts, opportunities, CRM, or Salesforce → ALWAYS use 'salesforce' tool
2. **Weather Priority**: If user asks about weather, temperature, forecast → use 'weather' tool
3. **Groq Compound Priority**: If user needs web search, current information, calculations, or code execution → use 'groq_compound' tool (FAST and lightweight)
4. **HuggingFace Priority**: If user asks about AI models, datasets, machine learning models → use 'huggingface' tool
5. **Parallel Search (Slow)**: Only use 'parallel_search' if groq_compound is insufficient or user specifically needs deep/multi-source search
6. **Direct Answer Fallback**: For general knowledge questions without need for external data → use 'direct_answer'
7. **Function Selection**: When selecting MCP tools, specify which functions to call based on the user's intent
8. **Parameter Extraction**: Extract relevant parameters from the user's question (e.g., company names, search terms, locations)

**IMPORTANT**: Prefer 'groq_compound' over 'parallel_search' for web searches - it's much faster!

REQUIRED JSON RESPONSE FORMAT:
{
  "tools": [
    {
      "tool_id": "tool_name",
      "functions": ["function_name"],
      "params": {
        "param_name": "extracted_value"
      }
    }
  ],
  "reasoning": "brief explanation of why these tools were selected",
  "primary_intent": "main user intent category",
  "confidence": 0.0
}

RESPONSE EXAMPLES:

Question: "search for leads in Acme Corp"
Response: {
  "tools": [
    {
      "tool_id": "salesforce",
      "functions": ["sf_search_leads"],
      "params": {
        "company": "Acme Corp"
      }
    }
  ],
  "reasoning": "User wants to search Salesforce leads for a specific company",
  "primary_intent": "crm_search",
  "confidence": 0.95
}

Question: "find a good image classification model on hugging face"
Response: {
  "tools": [
    {
      "tool_id": "huggingface",
      "functions": ["search_models"],
      "params": {
        "query": "image classification",
        "task": "image-classification"
      }
    }
  ],
  "reasoning": "User wants to find ML models for image classification",
  "primary_intent": "ai_ml",
  "confidence": 0.9
}

Question: "what's the weather in San Francisco"
Response: {
  "tools": [
    {
      "tool_id": "weather",
      "functions": [],
      "params": {
        "location": "San Francisco"
      }
    }
  ],
  "reasoning": "User wants weather information for a specific location",
  "primary_intent": "weather",
  "confidence": 0.95
}

Question: "create a new lead for John Doe at TechCorp"
Response: {
  "tools": [
    {
      "tool_id": "salesforce",
      "functions": ["sf_create_lead"],
      "params": {
        "first_name": "John",
        "last_name": "Doe",
        "company": "TechCorp"
      }
    }
  ],
  "reasoning": "User wants to create a new lead in Salesforce",
  "primary_intent": "crm_create",
  "confidence": 0.92
}

Now analyze the user's question and return ONLY valid JSON:`;

    const response = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-20b", // Using the model you specified for better inference
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.1, // Low temperature for consistent JSON output
      max_tokens: 1000, // More tokens for detailed function/param extraction
      response_format: { type: "json_object" } // Force JSON response
    });

    const resultText = response.choices[0]?.message?.content || '';
    console.log(`🔍 ROUTING: AI raw response: "${resultText}"`);

    // Try to parse the JSON response - handle various formats
    try {
      // First try direct JSON parsing
      let routingDecision = JSON.parse(resultText);
      console.log(`✅ ROUTING: Successfully parsed JSON - tools: ${JSON.stringify(routingDecision.tools)}, reasoning: "${routingDecision.reasoning}", confidence: ${routingDecision.confidence}`);

      // Normalize tools array to support both old and new format
      const normalizedTools = routingDecision.tools.map(tool => {
        if (typeof tool === 'string') {
          // Old format: just tool IDs
          return { tool_id: tool, functions: [], params: {} };
        }
        // New format: tool objects with functions and params
        return tool;
      });

      return {
        tools: normalizedTools.map(t => t.tool_id), // Keep backward compatibility
        toolDetails: normalizedTools, // New detailed format
        reasoning: routingDecision.reasoning || 'AI-powered routing decision',
        primaryIntent: routingDecision.primary_intent || 'general',
        confidence: routingDecision.confidence || 0.8
      };
    } catch (parseError) {
      console.error('❌ ROUTING: Failed to parse routing decision as JSON:', parseError);

      // Try multiple methods to extract JSON from the response
      try {
        // Method 1: Look for JSON-like content with curly braces
        const jsonMatch = resultText.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const extractedJson = JSON.parse(jsonMatch[0]);
          console.log(`🔄 ROUTING: Extracted JSON from braces`);
          const normalizedTools = (extractedJson.tools || []).map(tool => 
            typeof tool === 'string' ? { tool_id: tool, functions: [], params: {} } : tool
          );
          return {
            tools: normalizedTools.map(t => t.tool_id),
            toolDetails: normalizedTools,
            reasoning: extractedJson.reasoning || 'Extracted from AI response',
            primaryIntent: extractedJson.primary_intent || 'general',
            confidence: extractedJson.confidence || 0.6
          };
        }

        // Method 2: Try to find JSON between code blocks
        const codeBlockMatch = resultText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          const extractedJson = JSON.parse(codeBlockMatch[1]);
          console.log(`🔄 ROUTING: Extracted JSON from code block`);
          const normalizedTools = (extractedJson.tools || []).map(tool => 
            typeof tool === 'string' ? { tool_id: tool, functions: [], params: {} } : tool
          );
          return {
            tools: normalizedTools.map(t => t.tool_id),
            toolDetails: normalizedTools,
            reasoning: extractedJson.reasoning || 'Extracted from code block',
            primaryIntent: extractedJson.primary_intent || 'general',
            confidence: extractedJson.confidence || 0.6
          };
        }

      } catch (extractError) {
        console.error('❌ ROUTING: Failed to extract JSON from response:', extractError);
      }

      // If all parsing fails, return default
      console.log(`⚠️ ROUTING: All parsing failed, using default - tools: [direct_answer]`);
      return {
        tools: ['direct_answer'],
        toolDetails: [{ tool_id: 'direct_answer', functions: [], params: {} }],
        reasoning: 'Default routing due to parsing failure',
        primaryIntent: 'general',
        confidence: 0.5
      };
    }

  } catch (error) {
    console.error('❌ ROUTING: Intelligent routing error:', error);
    console.log(`⚠️ ROUTING: Error fallback - tools: [direct_answer]`);
    return {
      tools: ['direct_answer'],
      toolDetails: [{ tool_id: 'direct_answer', functions: [], params: {} }],
      reasoning: 'Error in intelligent routing, using direct answer',
      primaryIntent: 'general',
      confidence: 0.3
    };
  }
}

// OLD REGEX-BASED ROUTER (kept for reference, not used)
// This was the original regex-based approach that matched keywords
// Now replaced by the AI-powered intelligentRouter above
async function regexBasedRouter_DEPRECATED(question, userName, context = {}) {
  // This function is no longer used but kept for reference
  // It used simple keyword matching like:
  // - if (question.includes('weather')) return 'weather'
  // - if (question.includes('salesforce')) return 'salesforce'
  // 
  // The new AI-powered router is much more flexible and can:
  // - Understand natural language intent
  // - Extract parameters automatically
  // - Select specific MCP functions
  // - Handle ambiguous queries better
  console.warn('⚠️ regexBasedRouter_DEPRECATED called - this function is deprecated');
  return { tools: ['direct_answer'], reasoning: 'Deprecated router', confidence: 0.1 };
}


// Correct common misspellings of "Groq" to ensure system works
function correctGroqSpelling(text) {
  if (!text) return text;

  // Common misspellings and variations to correct
  const corrections = [
    // Exact word replacements (case-sensitive for proper nouns)
    { from: /\bgrok\b/gi, to: 'Groq' },        // grok -> Groq
    { from: /\bgrock\b/gi, to: 'Groq' },       // grock -> Groq
    { from: /\bgroq\b/g, to: 'Groq' },         // groq -> Groq (already correct but ensure proper case)
    { from: /\bGrok\b/g, to: 'Groq' },         // Grok -> Groq (standardize)
    { from: /\bGrock\b/g, to: 'Groq' },        // Grock -> Groq

    // Contextual corrections for phrases
    { from: /hey\s+grok/gi, to: 'Hey Groq' },    // "hey grok" -> "Hey Groq"
    { from: /hey\s+grock/gi, to: 'Hey Groq' },   // "hey grock" -> "Hey Groq"
    { from: /hi\s+grok/gi, to: 'Hey Groq' },     // "hi grok" -> "Hey Groq"
    { from: /hello\s+grok/gi, to: 'Hey Groq' },  // "hello grok" -> "Hey Groq"

    // Handle cases where "groq" appears without "hey"
    { from: /^\s*grok\s+/gi, to: 'Groq ' },      // "grok something" -> "Groq something"
    { from: /^\s*grock\s+/gi, to: 'Groq ' },     // "grock something" -> "Groq something"
  ];

  let correctedText = text;

  // Apply all corrections
  corrections.forEach(correction => {
    correctedText = correctedText.replace(correction.from, correction.to);
  });

  // More specific Brock vs Grok handling
  // Only correct "Brock" to "Groq" if it's clearly a misspelling in a trigger context
  if (correctedText.includes('Brock') && !correctedText.toLowerCase().includes('hugging')) {
    // If "Brock" appears and it's not in a Hugging Face context, it might be a Groq misspelling
    correctedText = correctedText.replace(/\bBrock\b/g, 'Groq');
  }

  // Add Hugging Face corrections
  correctedText = correctedText
    .replace(/\bhugging\s+clothes?\b/gi, 'Hugging Face')
    .replace(/\bhuging\s+face\b/gi, 'Hugging Face')
    .replace(/\bhuggingface\b/gi, 'Hugging Face')
    .replace(/\bhugging\s+face\b/gi, 'Hugging Face');


  return correctedText;
}

// Detect if text contains "Hey Groq" trigger using simple detection
function detectGroqTrigger(text) {
  // Normalize common misspellings first
  const normalized = correctGroqSpelling(text || '');

  // Robust detection for "Hey Groq" with optional punctuation and spacing
  const canonical = normalized
    .toLowerCase()
    .replace(/[.,!?;:]+/g, ' ') // ignore punctuation between/around words
    .replace(/\s+/g, ' ')
    .trim();

  // Common greeting words that can trigger Groq
  const GREETINGS = ['hey', 'hi', 'hello', 'yo', 'sup', 'what\'s up', 'greetings'];

  // Allow up to N words between greeting and "groq" (either order)
  const MAX_WORD_GAP = 6;

  // Build regex patterns for all greetings
  const greetingPatterns = GREETINGS.map(greeting => {
    // Escape special regex characters in greetings
    const escapedGreeting = greeting.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Pattern for greeting then groq (with optional words in between)
    const greetingThenGroq = new RegExp(`\\b${escapedGreeting}\\b(?:\\s+\\S+){0,${MAX_WORD_GAP}}\\s+\\bgroq\\b`, 'i');
    // Pattern for groq then greeting (with optional words in between)
    const groqThenGreeting = new RegExp(`\\bgroq\\b(?:\\s+\\S+){0,${MAX_WORD_GAP}}\\s+\\b${escapedGreeting}\\b`, 'i');
    return { greetingThenGroq, groqThenGreeting };
  });

  // Test all greeting patterns
  const hasGreetingTrigger = greetingPatterns.some(patterns =>
    patterns.greetingThenGroq.test(canonical) || patterns.groqThenGreeting.test(canonical)
  );

  const hasTrigger = hasGreetingTrigger ||
                     /^groq\b/.test(canonical) ||
                     /\bheygroq\b/i.test(canonical);

  console.log(`🎤 Trigger detection for: "${text}" -> ${hasTrigger ? '✅ DETECTED' : '❌ NOT DETECTED'}`);

  return hasTrigger;
}

// Get weather using Groq compound model
async function getWeather(location) {
  try {
    const response = await groqClient.chat.completions.create({
      model: "groq/compound",
      messages: [
        {
          role: "user",
          content: `What's the current weather in ${location}? Return ONLY a single sentence with temperature, conditions, and any relevant details. Keep it brief and conversational.`,
        },
      ],
    });

    return {
      response: response.choices[0]?.message?.content || "I couldn't get the weather information right now.",
      tool: "weather"
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return {
      response: `Sorry, I couldn't get the weather for ${location} at the moment.`,
      tool: "weather",
      error: true
    };
  }
}

// Perform web search and/or code execution using Groq compound model
async function performWebSearch(query) {
  try {
    const response = await groqClient.chat.completions.create({
      model: "groq/compound",
      messages: [
        {
          role: "user",
          content: query, // Pass query directly - compound model will figure out if it needs web search, code execution, or both
        },
      ],
    });

    return {
      response: response.choices[0]?.message?.content || "I couldn't process your request right now.",
      tool: "groq_compound"
    };
  } catch (error) {
    console.error('Groq compound error:', error);
    return {
      response: `Sorry, I couldn't process "${query}" at the moment.`,
      tool: "groq_compound",
      error: true
    };
  }
}

// Answer question directly using OpenAI GPT model
async function answerDirectly(question, context = {}) {
  try {
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const systemPrompt = `You are Groq AI, a helpful AI assistant. Answer this question directly using your knowledge: "${question}"

TODAY'S DATE: ${today}

Context: Meeting transcript
User: ${context.userName || 'Unknown'}

Provide a helpful, accurate response based on your training data. If you need current information, suggest using web search.`;

    const response = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    return {
      response: response.choices[0]?.message?.content || "I couldn't generate a response right now.",
      tool: "direct_answer"
    };
  } catch (error) {
    console.error('Direct answer error:', error);
    return {
      response: `Sorry, I couldn't answer that question directly at the moment.`,
      tool: "direct_answer",
      error: true
    };
  }
}

// Generic inference function using intelligent routing with MCP support
async function performGroqInference(transcript, userName, context = 'general', chatHistory = [], skipTriggerDetection = false) {
  try {
    // First, detect if this is actually a Groq trigger (unless skipped)
    if (!skipTriggerDetection) {
      const isGroqTrigger = detectGroqTrigger(transcript);

      if (!isGroqTrigger) {
        return {
          detected: false,
          response: `I didn't detect a "Hey Groq" trigger in: "${transcript}"`
        };
      }
    }

    // Use intelligent router to decide which tools to use (now with chat history)
    // Router works with original transcript text (no spelling corrections)
    const routingDecision = await intelligentRouter(transcript, userName, context, chatHistory);

    console.log(`🎯 INFERENCE: Routing decision - tools: [${routingDecision.tools.join(', ')}], reasoning: "${routingDecision.reasoning}", confidence: ${routingDecision.confidence}`);
    
    // Log detailed tool information including functions and params
    if (routingDecision.toolDetails && routingDecision.toolDetails.length > 0) {
      console.log(`📋 INFERENCE: Detailed tool routing:`);
      routingDecision.toolDetails.forEach((toolDetail, idx) => {
        console.log(`  ${idx + 1}. Tool: ${toolDetail.tool_id}`);
        if (toolDetail.functions && toolDetail.functions.length > 0) {
          console.log(`     Functions: [${toolDetail.functions.join(', ')}]`);
        }
        if (toolDetail.params && Object.keys(toolDetail.params).length > 0) {
          console.log(`     Params: ${JSON.stringify(toolDetail.params)}`);
        }
      });
    }

    const availableTools = getAvailableTools();
    const toolResults = [];
    let finalResponse = '';
    const toolsUsed = [];
    const mcpTools = [];

    // Prepare MCP tools for the Responses API: include ONLY MCP tools selected by the router
    for (const toolName of routingDecision.tools) {
      const toolConfig = availableTools[toolName];
      if (!toolConfig || toolConfig.type !== 'mcp') continue;

      // Dynamically set server URL for Salesforce
      const serverUrl = toolConfig.id === 'salesforce' 
        ? `${SALESFORCE_MCP_URL}/mcp`
        : toolConfig.server_url;

      const mcpToolConfig = {
        type: 'mcp',
        server_label: toolConfig.server_label,
        server_url: serverUrl,
      };

      // Use generalized auth processing
      const authResult = processToolAuth(toolConfig);
      
      if (!authResult.shouldInclude) {
        console.warn(`⚠️ Skipping MCP tool ${toolName}: ${authResult.error}`);
        continue;
      }

      // Add authentication headers from processToolAuth
      // These are required for MCP servers that need authentication (like Parallel API)
      mcpToolConfig.headers = authResult.headers || {};
      
      console.log(`🔑 MCP Tool ${toolName} headers:`, Object.keys(mcpToolConfig.headers).length > 0 ? Object.keys(mcpToolConfig.headers) : 'none');

      mcpTools.push(mcpToolConfig);
    }

    // If we have MCP tools, use the chat completions API with MCP tools
    if (mcpTools.length > 0) {
      try {
        console.log(`🔧 Using ${mcpTools.length} MCP tools`);

        // Get today's date for context
        const today = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        // Get Salesforce credentials if needed - add as a user message like the playground
        const sfCreds = getSalesforceSessionId('default');
        const messages = [];
        
        // Add system message with today's date
        messages.push({
          role: "system",
          content: `You are Groq AI assistant. Today's date is ${today}. Provide accurate and helpful responses using the available tools.`
        });
        
        if (sfCreds && routingDecision.tools.includes('salesforce')) {
          // Add credentials as a user message (like playground pattern)
          messages.push({
            role: "user",
            content: JSON.stringify({
              access_token: sfCreds.access_token,
              instance_url: sfCreds.instance_url,
              state: sfCreds.state || sfCreds.session_id
            })
          });
        }
        
        // Add the actual user query
        messages.push({
          role: "user",
          content: transcript
        });

        console.log('📤 Groq API Request (using OpenAI client):');
        console.log('Messages:', JSON.stringify(messages, null, 2));
        console.log('Tools:', JSON.stringify(mcpTools, null, 2));

        // Use the OpenAI client instead of raw fetch (like playground)
        const completion = await groqClient.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: messages,
          temperature: 1,
          max_completion_tokens: 8192,
          top_p: 1,
          tools: mcpTools
        });

        console.log('📦 MCP Response:', JSON.stringify(completion, null, 2));

        // Extract the final response from chat completion format
        finalResponse = completion.choices?.[0]?.message?.content || 'I used MCP tools but couldn\'t generate a response.';

        // Extract citations if present (for groq/compound and parallel_search)
        let citations = [];
        const message = completion.choices?.[0]?.message;
        
        // Check for citations in various formats
        if (message?.citations) {
          citations = message.citations;
        } else if (message?.search_results?.results) {
          citations = message.search_results.results.map(r => ({
            title: r.title,
            url: r.url,
            content: r.content?.substring(0, 200) + (r.content?.length > 200 ? '...' : ''),
            score: r.score
          }));
        }

        // Track tool calls if present
        const toolCalls = completion.choices?.[0]?.message?.tool_calls || [];
        
        toolCalls.forEach(call => {
          console.log(`✅ MCP call: ${call.function?.name}`);
          toolsUsed.push({
            name: call.function?.name || 'unknown',
            success: true,
            category: 'mcp',
            server: 'Salesforce',
            citations: citations.length > 0 ? citations : undefined
          });
        });
        
        // If we have citations but no tool calls, add them to a general search result
        if (citations.length > 0 && toolCalls.length === 0) {
          toolsUsed.push({
            name: 'web_search',
            success: true,
            category: 'search',
            citations: citations
          });
        }

      } catch (mcpError) {
        console.error('❌ MCP Responses API error:', mcpError);
        console.error('Error details:', mcpError.message);
        console.error('Error stack:', mcpError.stack);

        // Try to get more details from the error
        let errorDetails = {};
        try {
          if (mcpError.message.includes('Groq API error:')) {
            const statusMatch = mcpError.message.match(/(\d+)/);
            if (statusMatch) {
              const status = parseInt(statusMatch[1]);
              errorDetails.status = status;

              if (status === 401 || status === 403) {
                console.error('💡 This might be an authentication issue - check GROQ_API_KEY');
              } else if (status === 404) {
                console.error('💡 This might be a model or endpoint issue - check model name');
              } else if (status >= 500) {
                console.error('💡 This might be a server-side issue with Groq');
              }
            }
          }
        } catch (parseError) {
          // Ignore parsing errors
        }

        // Check for common MCP issues in the error message
        if (mcpError.message?.includes('model') || mcpError.message?.includes('not supported')) {
          console.error('💡 This might be a model compatibility issue - MCP may not be supported by the current model');
        }

        // Fall back to built-in tools or direct answer
      }
    }

    // Execute built-in tools if no MCP tools were used or if MCP failed
    if (!finalResponse) {

      for (const toolName of routingDecision.tools) {
        try {
          const toolConfig = availableTools[toolName];
          if (!toolConfig) {
            continue;
          }

          if (toolConfig.type === 'mcp') {
            // MCP tool failed, try to provide a fallback response
            if (toolName === 'huggingface') {
              finalResponse = `I tried to search Hugging Face for trending models, but the tool is currently unavailable. You can visit https://huggingface.co/models?sort=trending to see the latest trending models directly.`;
            } else if (toolName === 'parallel_search') {
              finalResponse = `I tried to perform a web search, but the tool is currently unavailable. You can try searching directly on your preferred search engine.`;
            } else {
              finalResponse = `I tried to use the ${toolName} tool, but it's currently unavailable.`;
            }
            toolsUsed.push({
              name: toolName,
              success: false,
              category: 'mcp',
              namespace: toolConfig.namespace,
              displayName: toolConfig.displayName,
              error: 'MCP tool unavailable'
            });
            continue;
          }

          if (toolConfig.type !== 'builtin') continue;

          let result;

          // Use the handler function from the registry
          if (toolConfig.handler) {
            // Special handling for weather tool to extract location
            if (toolName === 'weather') {
              const locationMatch = transcript.match(/(?:weather in|weather for)\s+([A-Za-z\s,]+)/i);
              const location = locationMatch ? locationMatch[1].trim() : 'San Francisco';
              result = await toolConfig.handler(location);
              result.location = location;
            } else {
              result = await toolConfig.handler(transcript, { userName, context });
            }
          } else {
            console.warn(`No handler found for built-in tool: ${toolName}`);
            continue;
          }

          toolResults.push(result);
          toolsUsed.push({
            name: toolName,
            success: !result.error,
            category: toolConfig.category,
            namespace: toolConfig.namespace,
            displayName: toolConfig.displayName,
            location: result.location
          });

          // Combine responses
          if (finalResponse) {
            finalResponse += '\n\n';
          }
          finalResponse += result.response;

        } catch (toolError) {
          console.error(`Error executing built-in tool ${toolName}:`, toolError);
          toolsUsed.push({
            name: toolName,
            success: false,
            category: 'builtin',
            namespace: 'general',
            error: toolError.message
          });
        }
      }

      // If still no response, fall back to direct answer
      if (!finalResponse) {
        try {
          const directResult = await answerDirectly(transcript, { userName, context });
          finalResponse = directResult.response;
          toolsUsed.push({
            name: 'direct_answer',
            success: true,
            category: 'general',
            namespace: 'general',
            displayName: 'Direct Answer'
          });
        } catch (directError) {
          console.error('Direct answer fallback failed:', directError);
          finalResponse = "I'm sorry, I encountered an error processing your request. Please try again.";
        }
      }

      // If we have multiple built-in tools, create a summary response
      if (routingDecision.tools.length > 1 && toolResults.length > 1) {
        try {
          const summaryPrompt = `You are Groq AI. The user asked: "${transcript}"

I used these tools: ${toolsUsed.map(t => t.name).join(', ')}

Tool results:
${toolResults.map((result, index) =>
  `Tool ${index + 1} (${result.tool}): ${result.response}`
).join('\n\n')}

Please provide a comprehensive, well-formatted response that synthesizes all this information for the user.`;

          const summaryResponse = await groqClient.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content: summaryPrompt
              },
              {
                role: "user",
                content: "Please summarize and synthesize the tool results into a comprehensive response."
              }
            ]
          });

          finalResponse = summaryResponse.choices[0]?.message?.content || finalResponse;
          toolsUsed.push({
            name: 'response_synthesis',
            success: true,
            category: 'synthesis'
          });

        } catch (summaryError) {
          console.error('Error creating summary response:', summaryError);
          // Keep the combined response if summary fails
        }
      }
    }

    // Extract all citations from tools
    const allCitations = toolsUsed
      .filter(t => t.citations && t.citations.length > 0)
      .flatMap(t => t.citations);

    return {
      detected: true,
      response: finalResponse || "I processed your request but couldn't generate a response.",
      tools: toolsUsed,
      routing: routingDecision,
      context: context,
      chatHistoryLength: chatHistory.length,
      citations: allCitations.length > 0 ? allCitations : undefined
    };

  } catch (error) {
    console.error('Groq inference error:', error);
    return {
      detected: true,
      response: `Hello ${userName}! I detected your "Hey Groq" trigger but encountered an error processing your request: ${transcript}`,
      error: error.message,
      tools: []
    };
  }
}

// Groq inference endpoint
app.post('/api/groq-inference', async (c) => {
  try {
    const { transcript, user_name, context, chat_history } = await c.req.json();

    if (!transcript) {
      return c.json({ error: 'Transcript text required' }, 400);
    }

    if (!GROQ_API_KEY) {
    return c.json({
      detected: true,
      response: `Hello ${user_name || 'there'}! I detected your "Hey Groq" trigger, but the Groq API key is not configured. Please set GROQ_API_KEY environment variable.`,
      original_message: transcript,
      tools: []
    });
    }

    // Prepare chat history for the router (filter out system messages and limit to recent)
    const filteredChatHistory = (chat_history || [])
      .filter(msg => msg.user_id !== 'system' && msg.data)
      .slice(-10); // Keep last 10 messages for context

    const result = await performGroqInference(transcript, user_name, context, filteredChatHistory);

    // Include original message for frontend formatting
    result.original_message = transcript;

    return c.json(result);
  } catch (error) {
    console.error('Groq inference endpoint error:', error);
    return c.json({
      detected: false,
      response: 'Sorry, I encountered an error processing your request.',
      error: error.message,
      tools: [],
      original_message: transcript
    }, 500);
  }
});

// New trigger endpoint that processes Groq triggers from frontend
app.post('/api/trigger-groq', async (c) => {
  try {
    const { transcript, user_name, context, chat_history, user_id, timestamp } = await c.req.json();

    if (!transcript) {
      return c.json({ error: 'Transcript text required' }, 400);
    }

    console.log(`🎯 Processing: "${transcript?.slice(0, 40)}${transcript?.length > 40 ? '...' : ''}"`);

    // Prepare chat history for the router (filter out system messages and limit to recent)
    const filteredChatHistory = (chat_history || [])
      .filter(msg => msg.user_id !== 'system' && msg.data)
      .slice(-10); // Keep last 10 messages for context

    // Process the inference (skip trigger detection since frontend already validated)
    const result = await performGroqInference(transcript, user_name || 'Unknown', context || 'meeting_transcript', filteredChatHistory, true);

    // Create response transcript for SSE broadcast
    const responseTranscript = {
      user_id: 'groq-ai',
      user_name: 'Groq AI Assistant',
      data: result.response || 'I processed your request but couldn\'t generate a response.',
      timestamp: Date.now(),
      tools: result.tools || [],
      routing: result.routing || { reasoning: 'Direct routing', primaryIntent: 'general', confidence: 0.5 },
      original_message: transcript,
      citations: result.citations || []
    };

    // Store response transcript for polling endpoint
    addToRecentTranscripts(responseTranscript);

    // Try to broadcast through SSE first (works in single-instance environments)
    let sseBroadcastSuccess = false;
    for (const client of sseClients) {
      try {
        client.send('event: transcript\n' + 'data: ' + JSON.stringify({
          content: responseTranscript
        }) + '\n\n');
        sseBroadcastSuccess = true;
      } catch (broadcastError) {
        console.error('Error broadcasting to SSE client:', broadcastError);
      }
    }

    // In serverless environments, SSE clients may not be connected to this instance
    // Return the response transcript so frontend can add it directly
    if (!sseBroadcastSuccess || sseClients.size === 0) {
      return c.json({
        success: true,
        detected: true,
        tools_used: (result.tools || []).length,
        routing_decision: (result.routing || {}).reasoning,
        response_transcript: responseTranscript // Include the full transcript for frontend to add
      });
    }

    // Also broadcast a system message if there was an error
    if (result.error) {
      const errorTranscript = {
        user_id: 'system',
        user_name: 'Groq AI',
        data: `⚠️ Processing completed with error: ${result.error}`,
        timestamp: Date.now(),
        error: true
      };

      for (const client of sseClients) {
        try {
          client.send('event: transcript\n' + 'data: ' + JSON.stringify({
            content: errorTranscript
          }) + '\n\n');
        } catch (broadcastError) {
          console.error('Error broadcasting error to SSE client:', broadcastError);
        }
      }
    }

    return c.json({
      success: true,
      detected: result.detected,
      tools_used: result.tools?.length || 0,
      routing_decision: result.routing?.reasoning
    });

  } catch (error) {
    console.error('Trigger processing error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Discovery Mode endpoint - analyzes entire conversation for background insights
app.post('/api/discovery-analysis', async (c) => {
  try {
    const { transcripts, full_history } = await c.req.json();

    if (!transcripts || transcripts.length === 0) {
      return c.json({ insights: [] });
    }

    console.log(`🔮 Discovery Mode: Analyzing ${transcripts.length} transcripts...`);
    console.log(`🔮 Transcripts received:`, transcripts.map(t => `"${t.data?.substring(0, 50)}..."`));

    // Get today's date for context
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Build conversation context from transcripts
    // NOTE: Frontend sends transcripts in REVERSE order (newest first)
    // We need to reverse them so oldest is first, newest is last
    const allMessages = transcripts.slice(0, 20).reverse(); // Take up to 20 and reverse to chronological order
    
    // Smart segmentation: only mark as "current" if we have enough messages
    // Otherwise, just mark the VERY LAST message as newest
    let conversationSummary = '';
    
    if (allMessages.length > 3) {
      // Enough messages to split into past/current
      const recentMessages = allMessages.slice(-2); // Only last 2 are "current"
      const olderMessages = allMessages.slice(0, -2); // Everything else is "past"
      
      if (olderMessages.length > 0) {
        conversationSummary += '<past_conversation>\n';
        conversationSummary += olderMessages.map(t => `${t.user_name || 'User'}: ${t.data}`).join('\n');
        conversationSummary += '\n</past_conversation>\n\n';
      }
      
      conversationSummary += '<current_conversation>\n';
      conversationSummary += recentMessages.map((t, idx) => {
        const prefix = idx === recentMessages.length - 1 ? '[NEWEST] ' : '';
        return `${prefix}${t.user_name || 'User'}: ${t.data}`;
      }).join('\n');
      conversationSummary += '\n</current_conversation>';
    } else {
      // Very few messages - just mark the newest one
      conversationSummary += '<conversation>\n';
      conversationSummary += allMessages.map((t, idx) => {
        const prefix = idx === allMessages.length - 1 ? '[NEWEST] ' : '';
        return `${prefix}${t.user_name || 'User'}: ${t.data}`;
      }).join('\n');
      conversationSummary += '\n</conversation>';
    }

    console.log(`🔮 Conversation summary built:\n${conversationSummary}`);

    // Create discovery prompt for AI
    const discoveryPrompt = `You are a Discovery Mode AI assistant that proactively provides background information and insights during conversations.

TODAY'S DATE: ${today}

Analyze this conversation and determine if there are opportunities to provide helpful background information, context, or insights using available tools.

**CRITICAL INSTRUCTIONS**:
- Focus ONLY on the message marked [NEWEST] - this is the MOST RECENT message
- <past_conversation> is for context only - DO NOT answer old questions
- Only provide insights about topics in the [NEWEST] message
- Ignore any topics that were mentioned in older messages but NOT in the [NEWEST] one

Conversation History:
${conversationSummary}

Available tools:
- Weather: Get current weather conditions for mentioned locations
- Groq Compound (Web Search): FAST web search for current information about topics, companies, people, events, or trends. This uses groq/compound model which searches the web instantly. Use this for ANY web search needs.
- HuggingFace: Find AI models or datasets if AI/ML topics are discussed

**IMPORTANT**: 
- Discovery Mode does NOT have access to parallel_search (too slow/expensive)
- Use "groq_compound" for all web searches - it's much faster and perfect for quick discovery insights
- Keep insights short and relevant

Your task:
1. Look at the [NEWEST] message ONLY
2. Identify if that specific message mentions a topic that could benefit from additional context
3. Suggest 0-1 insight to discover (MAXIMUM 1!)

**CRITICAL RULES**:
- Suggest ONLY 1 insight maximum
- Focus EXCLUSIVELY on the [NEWEST] message
- Ignore all older messages - even if they seem related
- DO NOT suggest weather unless the [NEWEST] message explicitly asks about weather/temperature
- Only suggest an insight if it would genuinely add value

Don't suggest insights for:
- Topics from old messages (anything NOT marked [NEWEST])
- Questions that were already answered
- Topics already covered in previous discovery insights  
- Weather (unless [NEWEST] message explicitly asks "what's the weather")
- Trivial information
- Topics that don't need external context

Respond in JSON format:
{
  "should_discover": true/false,
  "insights": [
    {
      "topic": "what to discover",
      "reasoning": "why this would be valuable",
      "suggested_query": "specific query to use",
      "tool": "weather|groq_compound|huggingface"
    }
  ]
}`;

    const discoveryResponse = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: `You are a discovery analysis AI that identifies opportunities for providing helpful background information. Today's date is ${today}.` },
        { role: "user", content: discoveryPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const discoveryContent = discoveryResponse.choices[0]?.message?.content;
    console.log('🔮 Discovery analysis result:', discoveryContent);

    // Parse discovery decision
    let discoveryDecision;
    try {
      // Try to extract JSON from the response
      const jsonMatch = discoveryContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        discoveryDecision = JSON.parse(jsonMatch[0]);
      } else {
        discoveryDecision = { should_discover: false, insights: [] };
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse discovery decision, skipping:', parseError);
      return c.json({ insights: [] });
    }

    // If no insights to discover, return empty
    if (!discoveryDecision.should_discover || !discoveryDecision.insights || discoveryDecision.insights.length === 0) {
      console.log('ℹ️ No discovery insights needed');
      return c.json({ insights: [] });
    }

    // ENFORCE MAXIMUM 1 INSIGHT - take only the first one even if AI returns more
    const insights = discoveryDecision.insights.slice(0, 1);
    console.log(`🔮 Discovery returned ${discoveryDecision.insights.length} insights, processing only the first 1`);

    // Process each insight using the appropriate tool
    const processedInsights = [];
    
    for (const insight of insights) {
      try {
        console.log(`🔍 Discovering: ${insight.topic} using ${insight.tool}`);
        
        // Route through the same performGroqInference but with a BRIEF query instruction
        // Add explicit instruction to be brief since we'll distill further
        const discoveryQuery = `${insight.suggested_query}\n\nIMPORTANT: Provide a brief, factual answer in 2-3 sentences maximum. No tables or long explanations.`;
        const result = await performGroqInference(
          discoveryQuery,
          'Discovery Mode',
          'discovery_analysis',
          transcripts.slice(-10),
          true // Skip trigger detection
        );

        if (result.response) {
          // Re-process the raw findings as a background researcher
          console.log(`📝 Re-processing findings for background research presentation...`);
          
          const researcherPrompt = `Extract ONLY the single most important fact from this research about "${insight.topic}":

${result.response}

Rules:
- ONE sentence only
- Maximum 20 words
- Just the core fact, no context or explanation
- Ignore all tables, lists, and formatting
- If there are multiple facts, pick the MOST important one

Output format: [Single factual sentence]`;

          const researcherResponse = await groqClient.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: `You are a fact extractor. Extract ONLY the single most important fact. Maximum 20 words. No preamble, no explanation, just the fact. Today's date is ${today}.` },
              { role: "user", content: researcherPrompt }
            ],
            temperature: 0.1,
            max_tokens: 50
          });

          const firstBriefing = researcherResponse.choices[0]?.message?.content || result.response;
          
          // SECOND PROCESSING STEP: Further distill to 1 sentence max
          console.log(`📝 Second distillation pass to ensure brevity...`);
          
          const finalDistillationPrompt = `Shorten this to ONE sentence, maximum 15 words:

"${firstBriefing}"

Remove any fluff. Keep only the core fact.`;

          const finalDistillationResponse = await groqClient.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: `You are a text compressor. Output ONLY 1 sentence, max 15 words. Today's date is ${today}.` },
              { role: "user", content: finalDistillationPrompt }
            ],
            temperature: 0.1,
            max_tokens: 30
          });

          const finalBriefing = finalDistillationResponse.choices[0]?.message?.content || firstBriefing;
          
          processedInsights.push({
            content: `### 🔮 ${insight.topic}\n\n${finalBriefing}`,
            tools: result.tools || [],
            routing: result.routing,
            citations: result.citations || []
          });
        }
      } catch (insightError) {
        console.error(`❌ Failed to process insight "${insight.topic}":`, insightError);
      }
    }

    console.log(`✅ Generated ${processedInsights.length} discovery insight(s)`);

    return c.json({
      success: true,
      insights: processedInsights
    });

  } catch (error) {
    console.error('❌ Discovery analysis error:', error);
    return c.json({
      success: false,
      error: error.message,
      insights: []
    }, 500);
  }
});

// Export app.fetch for Val Town, otherwise export app
export default (typeof Deno !== "undefined" && Deno.env.get("valtown")) ? app.fetch : app;

