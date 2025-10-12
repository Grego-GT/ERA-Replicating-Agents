/**
 * Tavily Utility Tests
 * 
 * Tests the Tavily search API functionality
 */

import { runTavilyTest } from './index.ts';

// Run the test
if (import.meta.main) {
  await runTavilyTest();
}

