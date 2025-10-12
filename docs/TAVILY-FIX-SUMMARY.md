# Tavily API Fix - Quick Reference

## The Problem

Tavily was failing with two errors:
1. **`[object Response]`** - Unhandled promise rejection
2. **`422 Error`** - "Input should be a valid string"

## The Root Cause

The `@tavily/core` npm package has a **different API** than expected:

### ❌ What We Were Doing (WRONG)
```typescript
const searchOptions = {
  query: 'Who is Leo Messi?',  // ❌ Query nested in options
  searchDepth: 'basic',         // ❌ camelCase
  maxResults: 5                 // ❌ camelCase
};
const response = await tvly.search(searchOptions);
```

### ✅ What We Should Do (CORRECT)
```typescript
const searchOptions = {
  search_depth: 'basic',   // ✅ snake_case, no query here
  max_results: 5,          // ✅ snake_case
  include_answer: true,    // ✅ snake_case
  include_images: false    // ✅ snake_case
};
// ✅ Query as FIRST parameter, options as SECOND
const response = await tvly.search('Who is Leo Messi?', searchOptions);
```

## The Fix

**File**: `utils/tavily/examples.ts`

**Changes Made**:
1. **Separated query from options object**
2. **Changed parameter names to snake_case**
3. **Fixed API call signature**: `tvly.search(query, options)`
4. **Added Response object handling**
5. **Improved error messages**

## Key Differences: Deno vs Node.js

### Deno Version (`utils/tavily/index.ts`)
- Calls REST API directly with `fetch()`
- Uses snake_case in request body
- Works correctly ✅

### Node.js Version (`utils/tavily/examples.ts`)
- Uses `@tavily/core` npm package
- Must use SDK's specific API signature
- **Was broken, now fixed** ✅

## Testing

### Deno Test (Always Passed)
```bash
deno task test:tavily
# Uses index.ts - direct REST API ✅
```

### CLI Test (Was Failing, Now Works)
```bash
deno task start:tavily
# Uses examples.ts - npm package injection ✅
```

## Lesson Learned

**Always test the actual injected code in Daytona**, not just the Deno version!

The Deno tests use a different code path than what gets injected into generated agents.

---

**Status**: ✅ FIXED
**Date**: October 12, 2025

