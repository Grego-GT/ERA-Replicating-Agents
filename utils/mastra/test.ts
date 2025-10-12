/**
 * Mastra Utility Tests
 * 
 * Tests the Mastra agent framework functionality
 */

import { runMastraTest } from './index.ts';

// Run the test
if (import.meta.main) {
  await runMastraTest();
}

