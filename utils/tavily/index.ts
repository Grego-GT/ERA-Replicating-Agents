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
// Test runner function (can be imported by test.ts)
// ============================================================================

/**
 * Run comprehensive tests for Tavily search functionality
 */
export async function runTavilyTest(): Promise<void> {
  console.log('🚀 Starting Tavily Search Tests...\n');
  
  try {
    // Test 1: Basic search with answer
    console.log('📝 Test 1: Basic search with AI-generated answer');
    const query1 = 'What is Deno?';
    console.log(`Query: "${query1}"\n`);
    
    const result1 = await tavilySearch(query1, {
      searchDepth: 'basic',
      maxResults: 3,
      includeAnswer: true
    });
    
    console.log('🤖 AI Answer:');
    console.log(result1.answer);
    console.log('\n📚 Top 3 Sources:');
    
    result1.results.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.title} (relevance: ${r.score})`);
      console.log(`   🔗 ${r.url}`);
      console.log(`   📄 ${r.content.substring(0, 100)}...`);
    });
    console.log('');
    
    // Test 2: Quick search (just answer)
    console.log('📝 Test 2: Quick search (answer only)');
    const query2 = 'Who won the Nobel Prize in Physics in 2023?';
    console.log(`Query: "${query2}"\n`);
    
    const answer = await tavilyQuickSearch(query2);
    console.log('🤖 Quick Answer:', answer);
    console.log('');
    
    // Test 3: Advanced search with more results
    console.log('📝 Test 3: Advanced search with domain filtering');
    const query3 = 'latest AI breakthroughs';
    console.log(`Query: "${query3}"\n`);
    
    const result3 = await tavilySearch(query3, {
      searchDepth: 'advanced',
      maxResults: 5,
      includeAnswer: true,
      // Example of domain filtering (optional)
      // includeDomains: ['arxiv.org', 'openai.com', 'anthropic.com']
    });
    
    console.log('🤖 AI Answer:');
    console.log(result3.answer);
    console.log(`\n📊 Found ${result3.results.length} results`);
    console.log('Top 3:');
    result3.results.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     Score: ${r.score}, URL: ${r.url}`);
    });
    console.log('');
    
    console.log('✅ All Tavily search tests completed successfully!');
    console.log('💡 Tavily is working correctly with proper Response handling\n');
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ Tavily test failed:', err.message);
    console.error('\n💡 Make sure TAVILY_API_KEY is set in .env');
    console.error('   Get your API key at: https://tavily.com/');
    throw error;
  }
}

// ============================================================================
// Test runner (if this file is executed directly)
// ============================================================================

if (import.meta.main) {
  await runTavilyTest();
}

