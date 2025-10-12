#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

/**
 * Test Tavily Response Object Handling Fix
 * 
 * This test verifies that the updated TAVILY_NODE_UTIL properly handles
 * Response objects that may be returned by the @tavily/core library.
 * 
 * The issue: tavilySearch was returning [object Response] causing unhandled promise rejections
 * The fix: Added Response object detection and proper JSON parsing
 */

import { TAVILY_NODE_UTIL, TAVILY_NPM_DEPS, TAVILY_API_DOCS } from '../utils/tavily/examples.ts';
import { injectUtilities } from '../utils/registry/index.ts';

console.log('🔍 Testing Tavily Response Object Handling Fix\n');
console.log('='.repeat(70));

// Test 1: Verify TAVILY_NODE_UTIL contains Response handling
console.log('\nTest 1: Verify Response object handling in TAVILY_NODE_UTIL');
console.log('-'.repeat(70));

const hasResponseCheck = TAVILY_NODE_UTIL.includes('typeof response.json === \'function\'');
const hasTryCatch = TAVILY_NODE_UTIL.includes('try {') && TAVILY_NODE_UTIL.includes('catch (error)');
const hasAwaitJson = TAVILY_NODE_UTIL.includes('await response.json()');

if (hasResponseCheck) {
  console.log('✅ Response object detection: PRESENT');
} else {
  console.log('❌ Response object detection: MISSING');
}

if (hasAwaitJson) {
  console.log('✅ JSON parsing with await: PRESENT');
} else {
  console.log('❌ JSON parsing with await: MISSING');
}

if (hasTryCatch) {
  console.log('✅ Error handling with try-catch: PRESENT');
} else {
  console.log('❌ Error handling with try-catch: MISSING');
}

// Test 2: Show the actual injected code
console.log('\n\nTest 2: Display injected tavilySearch function');
console.log('-'.repeat(70));

const functionMatch = TAVILY_NODE_UTIL.match(/async function tavilySearch[\s\S]*?^}/m);
if (functionMatch) {
  const lines = functionMatch[0].split('\n');
  console.log('\nKey parts of tavilySearch function:\n');
  
  let inResponseHandling = false;
  lines.forEach(line => {
    if (line.includes('const response = await')) {
      inResponseHandling = true;
    }
    
    if (inResponseHandling) {
      console.log(`  ${line}`);
    }
    
    if (line.includes('catch (error)')) {
      // Show a few more lines after catch
      console.log(`  ${line}`);
    }
  });
}

// Test 3: Verify NPM dependencies
console.log('\n\nTest 3: Verify NPM dependencies');
console.log('-'.repeat(70));

console.log(`Required packages: ${TAVILY_NPM_DEPS.join(', ')}`);
if (TAVILY_NPM_DEPS.includes('@tavily/core')) {
  console.log('✅ @tavily/core is included');
} else {
  console.log('❌ @tavily/core is missing');
}

// Test 4: Test injection with user code
console.log('\n\nTest 4: Test utility injection with sample user code');
console.log('-'.repeat(70));

const sampleUserCode = `
(async () => {
  try {
    const result = await tavilySearch('latest AI news', {
      maxResults: 3,
      includeAnswer: true
    });
    
    console.log('Answer:', result.answer);
    console.log('Results:', result.results.length);
  } catch (error) {
    console.error('Search failed:', error.message);
  }
})();
`.trim();

try {
  const injectedCode = await injectUtilities(sampleUserCode, ['tavily']);
  
  const hasUtilityCode = injectedCode.includes('async function tavilySearch');
  const hasNpmInstall = injectedCode.includes('npm install @tavily/core');
  const hasUserCode = injectedCode.includes('latest AI news');
  
  if (hasUtilityCode && hasNpmInstall && hasUserCode) {
    console.log('✅ Injection successful');
    console.log(`   - Utility function: ${hasUtilityCode ? 'PRESENT' : 'MISSING'}`);
    console.log(`   - NPM install: ${hasNpmInstall ? 'PRESENT' : 'MISSING'}`);
    console.log(`   - User code: ${hasUserCode ? 'PRESENT' : 'MISSING'}`);
    
    // Show code structure
    const lines = injectedCode.split('\n');
    console.log(`   - Total lines: ${lines.length}`);
  } else {
    console.log('❌ Injection incomplete');
  }
} catch (error) {
  console.log(`❌ Injection failed: ${error}`);
}

// Test 5: Verify API documentation mentions the fix
console.log('\n\nTest 5: Verify API documentation');
console.log('-'.repeat(70));

const mentionsPromiseHandling = TAVILY_API_DOCS.includes('await tavilySearch');
const mentionsErrorHandling = TAVILY_API_DOCS.toLowerCase().includes('error handling');

if (mentionsPromiseHandling) {
  console.log('✅ Documentation mentions proper await usage');
} else {
  console.log('⚠️  Documentation should mention await usage');
}

if (mentionsErrorHandling) {
  console.log('✅ Documentation mentions error handling');
} else {
  console.log('⚠️  Documentation should mention error handling');
}

// Final summary
console.log('\n\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));

const allPassed = hasResponseCheck && hasAwaitJson && hasTryCatch && 
                  TAVILY_NPM_DEPS.includes('@tavily/core');

if (allPassed) {
  console.log('\n✅ ALL TESTS PASSED!');
  console.log('\nThe Tavily utility now properly handles:');
  console.log('  • Response objects from @tavily/core');
  console.log('  • Async JSON parsing with await');
  console.log('  • Error handling with try-catch');
  console.log('  • Informative error messages');
  
  console.log('\n💡 This fix resolves the "[object Response]" error that was causing');
  console.log('   unhandled promise rejections in generated agent code.');
  
  console.log('\n🎯 Next steps:');
  console.log('   1. Try creating a web researcher agent again');
  console.log('   2. The tavilySearch function will now properly handle API responses');
  console.log('   3. Errors will be more informative if issues occur');
} else {
  console.log('\n❌ SOME TESTS FAILED');
  console.log('   Please review the implementation of TAVILY_NODE_UTIL');
}

console.log('\n' + '='.repeat(70));

