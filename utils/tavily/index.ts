/**
 * Tavily Search Utility - Deno Version
 * 
 * This is the local Deno-compatible version for use in ERA's core codebase.
 * For Node.js injection into generated agents, see examples.ts
 */

import "jsr:@std/dotenv/load"; // Load .env for Deno

export interface TavilySearchOptions {
  apiKey?: string;
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeAnswer?: boolean;
  includeImages?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
}

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  answer: string;
  query: string;
  results: TavilyResult[];
  images?: Array<{ url: string; description: string }>;
}

/**
 * Perform a Tavily search using the REST API (Deno-compatible)
 */
export async function tavilySearch(
  query: string,
  options: TavilySearchOptions = {}
): Promise<TavilyResponse> {
  const apiKey = options.apiKey || Deno.env.get('TAVILY_API_KEY');
  
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is required (pass via options.apiKey or environment variable)');
  }

  const requestBody = {
    query,
    search_depth: options.searchDepth || 'basic',
    max_results: options.maxResults || 5,
    include_answer: options.includeAnswer !== false,
    include_images: options.includeImages || false,
    ...(options.includeDomains && { include_domains: options.includeDomains }),
    ...(options.excludeDomains && { exclude_domains: options.excludeDomains }),
  };

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as TavilyResponse;
}

/**
 * Quick search helper - returns just the answer text
 */
export async function tavilyQuickSearch(query: string, apiKey?: string): Promise<string> {
  const result = await tavilySearch(query, { apiKey, includeAnswer: true });
  return result.answer || 'No answer found';
}

// ============================================================================
// Test runner (if this file is executed directly)
// ============================================================================

if (import.meta.main) {
  console.log('🔍 Testing Tavily Search (Deno)...\n');
  
  try {
    const query = 'What is Deno?';
    console.log(`Query: "${query}"\n`);
    
    const result = await tavilySearch(query, {
      searchDepth: 'basic',
      maxResults: 3,
    });
    
    console.log('📝 Answer:');
    console.log(result.answer);
    console.log('\n📚 Top Sources:');
    
    result.results.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.title} (score: ${r.score})`);
      console.log(`   🔗 ${r.url}`);
      console.log(`   📄 ${r.content.substring(0, 150)}...`);
    });
    
    console.log('\n✅ Tavily search working!');
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    console.error('\n💡 Make sure TAVILY_API_KEY is set in .env');
  }
}

