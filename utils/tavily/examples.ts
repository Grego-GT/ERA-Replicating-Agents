/**
 * Tavily Search Utility - Node.js Examples for Daytona Injection
 * 
 * This file provides Node.js-compatible Tavily search utilities
 * that can be injected into AI-generated agents running in Daytona sandboxes.
 */

// ============================================================================
// Node.js-Compatible Tavily Utility (for injection into generated code)
// ============================================================================

export const TAVILY_NODE_UTIL = `
// Tavily Search Utility - requires npm install @tavily/core
async function tavilySearch(query: string, options: {
  apiKey?: string;
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeAnswer?: boolean;
  includeImages?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
} = {}): Promise<any> {
  const { tavily } = require('@tavily/core');
  
  const apiKey = options.apiKey || process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is required (pass via options.apiKey or environment variable)');
  }
  
  const tvly = tavily({ apiKey });
  
  const searchOptions: any = {
    query,
    searchDepth: options.searchDepth || 'basic',
    maxResults: options.maxResults || 5,
    includeAnswer: options.includeAnswer !== false, // default true
    includeImages: options.includeImages || false,
  };
  
  if (options.includeDomains) {
    searchOptions.includeDomains = options.includeDomains;
  }
  if (options.excludeDomains) {
    searchOptions.excludeDomains = options.excludeDomains;
  }
  
  const response = await tvly.search(searchOptions);
  return response;
}

// Quick search helper - returns just the answer text
async function tavilyQuickSearch(query: string, apiKey?: string): Promise<string> {
  const result = await tavilySearch(query, { apiKey, includeAnswer: true });
  return result.answer || 'No answer found';
}
`;

// ============================================================================
// NPM Dependencies for Tavily
// ============================================================================

export const TAVILY_NPM_DEPS = ['@tavily/core'];

// ============================================================================
// API Documentation for AI (teaches the AI how to use this utility)
// ============================================================================

export const TAVILY_API_DOCS = `
# Tavily Search Utility

Tavily provides AI-powered web search with real-time results.

## Pre-loaded Functions

### tavilySearch(query, options)
Performs a Tavily search with full control over options.

**Parameters:**
- \`query\` (string): The search query
- \`options\` (object, optional):
  - \`apiKey\` (string): Tavily API key (defaults to process.env.TAVILY_API_KEY)
  - \`searchDepth\` ('basic' | 'advanced'): Search depth (default: 'basic')
  - \`maxResults\` (number): Max results to return (default: 5)
  - \`includeAnswer\` (boolean): Include AI-generated answer (default: true)
  - \`includeImages\` (boolean): Include images in results (default: false)
  - \`includeDomains\` (string[]): Only search these domains
  - \`excludeDomains\` (string[]): Exclude these domains

**Returns:** Promise<TavilyResponse>
- \`answer\` (string): AI-generated answer to the query
- \`results\` (array): Search results with title, url, content, score
- \`images\` (array, optional): Image results if includeImages=true

### tavilyQuickSearch(query, apiKey?)
Quick search that returns just the AI-generated answer as a string.

**Parameters:**
- \`query\` (string): The search query
- \`apiKey\` (string, optional): Tavily API key

**Returns:** Promise<string> - The AI-generated answer

## Environment Variables Required

\`\`\`env
TAVILY_API_KEY=tvly-your-api-key-here
\`\`\`

## Usage Examples

### Basic Search
\`\`\`typescript
const result = await tavilySearch("Who is Leo Messi?");
console.log("Answer:", result.answer);
console.log("Sources:", result.results.length);
\`\`\`

### Quick Answer
\`\`\`typescript
const answer = await tavilyQuickSearch("What is the capital of France?");
console.log(answer); // "Paris is the capital of France..."
\`\`\`

### Advanced Search with Options
\`\`\`typescript
const result = await tavilySearch("Latest AI developments", {
  searchDepth: 'advanced',
  maxResults: 10,
  includeImages: true,
  includeDomains: ['arxiv.org', 'openai.com']
});

result.results.forEach(r => {
  console.log(\`[\${r.score}] \${r.title}\`);
  console.log(\`   \${r.url}\`);
  console.log(\`   \${r.content.substring(0, 150)}...\\n\`);
});
\`\`\`

### Domain Filtering
\`\`\`typescript
// Only search news sites
const newsResult = await tavilySearch("Climate change updates", {
  includeDomains: ['bbc.com', 'reuters.com', 'apnews.com'],
  maxResults: 5
});

// Exclude certain domains
const result = await tavilySearch("Python tutorials", {
  excludeDomains: ['pinterest.com', 'quora.com']
});
\`\`\`

## Important Notes

1. **API Key**: Always pass TAVILY_API_KEY via environment variable or options
2. **Search Depth**: Use 'advanced' for more comprehensive results (uses more credits)
3. **Rate Limits**: Be mindful of Tavily API rate limits and credits
4. **Error Handling**: Wrap calls in try-catch for network/API errors
5. **Results**: The \`results\` array is ordered by relevance score (0-1)

## Complete Example
\`\`\`typescript
// Install first
execSync('npm install @tavily/core', { stdio: 'inherit' });

// Then use
(async () => {
  try {
    const query = "What are the latest breakthroughs in quantum computing?";
    
    const result = await tavilySearch(query, {
      searchDepth: 'advanced',
      maxResults: 5,
      includeAnswer: true
    });
    
    console.log("🔍 Query:", query);
    console.log("\\n📝 AI Answer:");
    console.log(result.answer);
    console.log("\\n📚 Top Sources:");
    
    result.results.slice(0, 3).forEach((r, i) => {
      console.log(\`\\n\${i + 1}. \${r.title} (score: \${r.score})\`);
      console.log(\`   🔗 \${r.url}\`);
      console.log(\`   📄 \${r.content.substring(0, 200)}...\`);
    });
  } catch (error) {
    console.error("Search failed:", error.message);
  }
})();
\`\`\`
`;

// ============================================================================
// Complete Standalone Example (for testing in Daytona)
// ============================================================================

export const TAVILY_COMPLETE_EXAMPLE = `
// Complete Tavily Search Example for Daytona
// This code can be run directly in a Daytona sandbox

const { execSync } = require('child_process');

// Install Tavily
console.log('📦 Installing @tavily/core...');
execSync('npm install @tavily/core', { stdio: 'inherit' });

${TAVILY_NODE_UTIL}

// Example usage
(async () => {
  try {
    console.log('\\n🔍 Testing Tavily Search...\\n');
    
    // Example 1: Quick search
    console.log('Example 1: Quick Answer');
    const quickAnswer = await tavilyQuickSearch("Who is Leo Messi?");
    console.log("Answer:", quickAnswer);
    
    // Example 2: Full search with details
    console.log('\\n\\nExample 2: Detailed Search');
    const detailedResult = await tavilySearch("What is Deno?", {
      searchDepth: 'basic',
      maxResults: 3,
      includeAnswer: true
    });
    
    console.log("\\n📝 AI Answer:");
    console.log(detailedResult.answer);
    
    console.log("\\n📚 Sources:");
    detailedResult.results.forEach((r, i) => {
      console.log(\`\\n\${i + 1}. \${r.title} (relevance: \${r.score})\`);
      console.log(\`   🔗 \${r.url}\`);
      console.log(\`   📄 \${r.content.substring(0, 150)}...\`);
    });
    
    console.log('\\n\\n✅ Tavily search working!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\\n💡 Make sure TAVILY_API_KEY is set in environment variables');
  }
})();
`;

// ============================================================================
// Test runner (if this file is executed directly)
// ============================================================================

if (import.meta.main) {
  console.log("Tavily Utility - Examples and Documentation");
  console.log("=".repeat(60));
  console.log("\n📦 NPM Dependencies:");
  console.log(TAVILY_NPM_DEPS.map(dep => `  - ${dep}`).join("\n"));
  console.log("\n📚 API Documentation:");
  console.log(TAVILY_API_DOCS);
  console.log("\n" + "=".repeat(60));
}

