# Tavily Search Utility 🔍

AI-powered web search utility for ERA agents using [Tavily](https://tavily.com).

## Overview

Tavily provides AI-powered web search with real-time results and AI-generated answers. Perfect for agents that need to search the web, gather information, and get quick answers to questions.

**Key Features:**
- 🤖 **AI-Generated Answers**: Get instant answers powered by search results
- 🌐 **Real-Time Search**: Access current web information
- 🎯 **Relevance Scoring**: Results ranked by relevance (0-1)
- 📊 **Structured Results**: Clean JSON responses with sources
- 🔍 **Advanced Filtering**: Include/exclude specific domains
- ⚡ **Quick Search**: Get just the answer without full results

## Prerequisites

Get your API key from [Tavily](https://tavily.com):

1. Sign up at https://tavily.com
2. Get your API key from the dashboard
3. Add it to your `.env` file

## Installation

Add to your `.env` file:

```env
TAVILY_API_KEY=tvly-your_api_key_here
```

## Quick Start

### CLI Quick Start

```bash
# Interactive mode - create a search agent
deno task cli

# Or use existing test
deno task test:tavily
```

### Testing the Utility

```bash
# Run comprehensive tests
deno run --allow-read --allow-env --allow-net utils/tavily/test.ts

# Or use the utility directly
deno run --allow-read --allow-env --allow-net utils/tavily/index.ts
```

## Core Functions

### `tavilySearch(query, options)`

Performs a full Tavily search with AI-generated answer and detailed results.

```typescript
const result = await tavilySearch('What is Deno?', {
  searchDepth: 'basic',
  maxResults: 5,
  includeAnswer: true
});

console.log('Answer:', result.answer);
console.log('Sources:', result.results.length);
result.results.forEach(r => {
  console.log(`- ${r.title} (${r.score})`);
  console.log(`  ${r.url}`);
});
```

**Parameters:**
- `query` (string) - The search query
- `options` (object, optional):
  - `apiKey` - Tavily API key (default: `TAVILY_API_KEY` env var)
  - `searchDepth` - `'basic'` or `'advanced'` (default: `'basic'`)
  - `maxResults` - Number of results (default: 5)
  - `includeAnswer` - Include AI answer (default: true)
  - `includeImages` - Include images (default: false)
  - `includeDomains` - Array of domains to include
  - `excludeDomains` - Array of domains to exclude

**Returns:** Promise<TavilyResponse>
- `answer` (string) - AI-generated answer to the query
- `query` (string) - The original query
- `results` (array) - Search results with:
  - `title` (string) - Page title
  - `url` (string) - Page URL
  - `content` (string) - Relevant content snippet
  - `score` (number) - Relevance score (0-1)
- `images` (array, optional) - Image results if requested

### `tavilyQuickSearch(query, apiKey?)`

Quick search that returns just the AI-generated answer as a string.

```typescript
const answer = await tavilyQuickSearch('Who won the Nobel Prize in Physics in 2023?');
console.log(answer);
```

**Parameters:**
- `query` (string) - The search query
- `apiKey` (string, optional) - Tavily API key

**Returns:** Promise<string> - The AI-generated answer

## Usage Examples

### Example 1: Basic Search

```typescript
(async () => {
  const result = await tavilySearch('latest developments in quantum computing');
  
  console.log('🔍 Search Results:');
  console.log('AI Answer:', result.answer);
  console.log('\nTop Sources:');
  
  result.results.slice(0, 3).forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   ${r.url}`);
    console.log(`   Relevance: ${r.score}`);
  });
})();
```

### Example 2: Quick Answer

```typescript
(async () => {
  const answer = await tavilyQuickSearch('What is the capital of France?');
  console.log('Answer:', answer);
})();
```

### Example 3: Advanced Search with Domain Filtering

```typescript
(async () => {
  const result = await tavilySearch('AI safety research', {
    searchDepth: 'advanced',
    maxResults: 10,
    includeDomains: ['arxiv.org', 'openai.com', 'anthropic.com']
  });
  
  console.log('Answer:', result.answer);
  console.log(`Found ${result.results.length} results from trusted sources`);
  
  result.results.forEach(r => {
    console.log(`[${r.score}] ${r.title}`);
    console.log(`   ${r.url}`);
  });
})();
```

### Example 4: Excluding Domains

```typescript
(async () => {
  const result = await tavilySearch('Python tutorials', {
    searchDepth: 'basic',
    maxResults: 5,
    excludeDomains: ['pinterest.com', 'quora.com']
  });
  
  console.log('Results without Pinterest/Quora:');
  result.results.forEach(r => {
    console.log(`- ${r.title}`);
    console.log(`  ${r.url}`);
  });
})();
```

### Example 5: Search with Images

```typescript
(async () => {
  const result = await tavilySearch('SpaceX Starship', {
    includeAnswer: true,
    includeImages: true,
    maxResults: 3
  });
  
  console.log('Answer:', result.answer);
  
  if (result.images) {
    console.log('\nImages:');
    result.images.forEach(img => {
      console.log(`- ${img.description}`);
      console.log(`  ${img.url}`);
    });
  }
})();
```

### Example 6: Comparing Search Depths

```typescript
(async () => {
  // Basic search - faster, fewer results
  const basic = await tavilySearch('AI agents', {
    searchDepth: 'basic',
    maxResults: 5
  });
  
  // Advanced search - more comprehensive, uses more credits
  const advanced = await tavilySearch('AI agents', {
    searchDepth: 'advanced',
    maxResults: 10
  });
  
  console.log('Basic search:', basic.results.length, 'results');
  console.log('Advanced search:', advanced.results.length, 'results');
})();
```

## Integration with ERA

This utility is automatically registered in the ERA system and can be injected into generated agents:

```bash
# The AI will automatically use Tavily when appropriate
deno task cli:create researcher --prompt "Search the web for latest AI news and summarize"
```

The FBI Director will:
1. Detect keywords like "search", "web", "find information"
2. Inject the Tavily utility code
3. Install NPM dependencies (`@tavily/core`)
4. Generate code using `tavilySearch()` and `tavilyQuickSearch()`

## Response Object Handling

The Tavily utility includes automatic Response object handling to prevent unhandled promise rejections. The injected code properly:

✅ Detects Response objects from the API  
✅ Parses JSON asynchronously with `await`  
✅ Handles errors gracefully with try-catch  
✅ Provides informative error messages  

This fix resolves the `[object Response]` error that was causing issues in earlier versions.

## Advanced Usage

### Error Handling

```typescript
try {
  const result = await tavilySearch('complex query');
  console.log(result.answer);
} catch (error) {
  console.error('Search failed:', error.message);
  // Fallback logic here
}
```

### Custom API Key

```typescript
const result = await tavilySearch('query', {
  apiKey: 'tvly-custom-key'
});
```

### Processing Results

```typescript
const result = await tavilySearch('climate change solutions');

// Filter high-relevance results
const topResults = result.results.filter(r => r.score > 0.8);

// Extract just URLs
const urls = result.results.map(r => r.url);

// Get content snippets
const snippets = result.results.map(r => ({
  title: r.title,
  snippet: r.content.substring(0, 200)
}));
```

## API Pricing & Rate Limits

- **Search Depth**: `'basic'` uses fewer credits than `'advanced'`
- **Rate Limits**: Check your Tavily dashboard for current limits
- **Credits**: Monitor usage at https://tavily.com/dashboard
- **Best Practice**: Use `'basic'` for most queries, `'advanced'` only when needed

## Important Notes

1. **API Key Required**: Must have `TAVILY_API_KEY` in environment
2. **Always Await**: Always use `await` with Tavily functions (handles async properly)
3. **Search Depth**: Start with `'basic'`, upgrade to `'advanced'` if needed
4. **Relevance Scores**: Results are ordered by score (0-1), higher is better
5. **Error Handling**: Wrap calls in try-catch for network/API errors
6. **Rate Limits**: Be mindful of API rate limits and credits

## Debugging

### Check API Key

```bash
echo $TAVILY_API_KEY
```

### Test Connection

```bash
deno run --allow-read --allow-env --allow-net utils/tavily/test.ts
```

### View Response Structure

```typescript
const result = await tavilySearch('test');
console.log(JSON.stringify(result, null, 2));
```

## Troubleshooting

### "TAVILY_API_KEY is required"
- Make sure `.env` file exists with `TAVILY_API_KEY=tvly-...`
- Check that dotenv is loaded

### "Tavily API error: 401"
- API key is invalid or expired
- Get new key from https://tavily.com

### "[object Response]" error (FIXED)
- This was fixed in the latest version
- The utility now properly handles Response objects
- Update to latest version if you see this

## Resources

- [Tavily Website](https://tavily.com)
- [Tavily API Documentation](https://docs.tavily.com)
- [Get API Key](https://tavily.com/dashboard)
- [Pricing Information](https://tavily.com/pricing)

## Files

- `index.ts` - Deno-compatible Tavily search functions
- `examples.ts` - Node.js injection code for generated agents
- `test.ts` - Test runner (imports from index.ts)
- `README.md` - This file

## Next Steps

1. Set up `TAVILY_API_KEY` in `.env`
2. Test the utility: `deno task test:tavily`
3. Create search agents: `deno task cli`
4. Monitor usage at https://tavily.com/dashboard

---

**Questions?** Check the [API documentation](./examples.ts) or run:
```bash
deno run --allow-read utils/tavily/examples.ts
```

