# NPM Packages in Generated Code

## Overview

Your ERA agents can now use **any npm package** from the entire npm ecosystem! 🎉

The codegen system has been updated with knowledge from the Daytona investigations to properly generate code that installs and uses npm packages.

## How It Works

### 1. Updated System Prompt

The `utils/codegen/index.ts` system prompt now includes:
- **NPM Package Usage section** with working examples
- **Proven patterns** from Daytona demo (IIFE wrapper, install before require)
- **Common packages** list (lodash, moment, axios, uuid, etc.)
- **Common mistakes** to avoid

### 2. The Pattern (IIFE + Install + Require)

```javascript
(async () => {
  const { execSync } = require('child_process');
  
  // Install packages FIRST
  execSync('npm install lodash moment', { stdio: 'pipe' });
  
  // Then require and use them
  const _ = require('lodash');
  const moment = require('moment');
  
  // Your code here
  const sum = _.sum([1, 2, 3, 4, 5]);
  const now = moment().format('YYYY-MM-DD');
  
  console.log(JSON.stringify({ sum, timestamp: now }));
})();
```

## Why This Pattern Works

### IIFE Wrapper: `(async () => { ... })()`
**Node.js v24** uses ES module mode by default where `require()` doesn't work. The IIFE forces CommonJS mode.

### Install Before Require
```javascript
// ✅ CORRECT
execSync('npm install lodash');
const _ = require('lodash');

// ❌ WRONG
const _ = require('lodash');  // Error: Cannot find module!
execSync('npm install lodash');
```

### Suppress Install Output: `{ stdio: 'pipe' }`
Prevents npm install logs from cluttering the output.

### Packages Don't Persist
Each sandbox run is fresh - install packages every time.

## Examples in System Prompt

The AI now has these working examples:

### Example 1: Lodash (Array utilities)
```javascript
(async () => {
  const { execSync } = require('child_process');
  execSync('npm install lodash', { stdio: 'pipe' });
  const _ = require('lodash');
  
  const numbers = [1, 2, 3, 4, 5];
  const sum = _.sum(numbers);
  const avg = _.mean(numbers);
  const shuffled = _.shuffle(numbers);
  
  console.log(JSON.stringify({ sum, average: avg, shuffled }));
})();
```

### Example 2: Moment + Axios (Dates + HTTP)
```javascript
(async () => {
  const { execSync } = require('child_process');
  execSync('npm install moment axios', { stdio: 'pipe' });
  const moment = require('moment');
  const axios = require('axios');
  
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  const response = await axios.get('https://api.github.com/users/github');
  
  console.log(JSON.stringify({ 
    timestamp: now,
    github: response.data.name
  }));
})();
```

## Common Packages Available

The AI knows about these popular packages:

**Utility Libraries**:
- `lodash` - Array/object utilities
- `ramda` - Functional programming
- `date-fns` - Modern date utilities

**Date/Time**:
- `moment` - Date parsing and formatting
- `dayjs` - Lightweight moment alternative

**HTTP**:
- `axios` - HTTP client
- `node-fetch` - Fetch API for Node.js

**IDs/Random**:
- `uuid` - Generate UUIDs
- `nanoid` - Tiny ID generator
- `shortid` - Short unique IDs

**Validation**:
- `joi` - Schema validation
- `validator` - String validators

**Data Processing**:
- `csv-parser` - Parse CSV
- `xml2js` - Parse XML
- `cheerio` - HTML parsing (jQuery-like)

**Crypto**:
- `bcrypt` - Password hashing
- `crypto-js` - Encryption utilities

...and thousands more from npm!

## Testing

Run the test suite:
```bash
deno task test:npm-codegen
```

This test:
1. Generates code that uses lodash (array operations)
2. Generates code that uses moment (date formatting)
3. Generates code that uses uuid (ID generation)
4. Executes all generated code in Daytona
5. Verifies successful execution

## Usage Examples

### Create Agent with Lodash
```bash
deno task cli:create data-processor --prompt "Use lodash to process arrays of data"
```

Generated agent will automatically:
- Install lodash
- Use lodash functions
- Handle errors properly
- Output results as JSON

### Create Agent with Axios
```bash
deno task cli:create api-fetcher --prompt "Use axios to fetch data from GitHub API"
```

Generated agent will:
- Install axios
- Make HTTP requests
- Handle responses and errors
- Return structured data

### Create Agent with Multiple Packages
```bash
deno task cli:create data-analyzer --prompt "Use lodash for data processing and moment for timestamps"
```

Agent will use both packages seamlessly!

## What's Different from Before

### Before (Manual Limitations):
```typescript
// Could only use standard JS/TS
const sum = array.reduce((a, b) => a + b, 0);
const now = new Date().toISOString();
```

### Now (Full npm Ecosystem):
```typescript
// Can use any npm package!
const _ = require('lodash');
const moment = require('moment');
const sum = _.sum(array);
const now = moment().format('YYYY-MM-DD');
```

## How AI Generates This

When you prompt: *"Create code that processes data with lodash"*

AI generates:
```javascript
(async () => {
  const { execSync } = require('child_process');
  
  // AI knows to install first
  execSync('npm install lodash', { stdio: 'pipe' });
  
  // AI knows to require after install
  const _ = require('lodash');
  
  // AI uses lodash functions
  try {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const evens = _.filter(data, n => n % 2 === 0);
    const sum = _.sum(evens);
    
    console.log(JSON.stringify({
      success: true,
      evens,
      sum
    }));
  } catch (error: unknown) {
    const err = error as Error;
    console.log(JSON.stringify({
      success: false,
      error: err.message
    }));
  }
})();
```

## Benefits

### 1. **Infinite Capabilities**
Access to 2+ million npm packages means agents can do almost anything:
- Web scraping (cheerio, puppeteer)
- Data processing (lodash, ramda)
- API integration (axios, got)
- File formats (csv, xml, yaml, etc.)
- Cryptography (bcrypt, crypto-js)
- And more!

### 2. **No Reinventing the Wheel**
Don't waste AI tokens regenerating common functionality - use battle-tested libraries.

### 3. **Higher Quality Code**
Well-maintained packages are better than AI-generated equivalents.

### 4. **Faster Development**
Skip the implementation - go straight to solving the problem.

### 5. **Composability**
Combine multiple packages for complex workflows.

## Common Use Cases

### Data Processing Agent
```bash
deno task cli:create csv-processor --prompt "Parse CSV files with csv-parser and analyze with lodash"
```

### Web Scraper Agent
```bash
deno task cli:create scraper --prompt "Use axios to fetch pages and cheerio to parse HTML"
```

### ID Generator Agent
```bash
deno task cli:create id-gen --prompt "Generate various types of unique IDs using uuid and nanoid"
```

### Validation Agent
```bash
deno task cli:create validator --prompt "Use joi to validate JSON schemas"
```

### Crypto Agent
```bash
deno task cli:create hasher --prompt "Use bcrypt to hash and verify passwords"
```

## Limitations & Notes

### Packages Must Be CommonJS Compatible
Node.js v24 in Daytona uses CommonJS mode. Most npm packages work, but pure ESM packages might need special handling.

### No Persistence
Packages are installed fresh each run. This is fine for most use cases.

### Network Required
Sandbox needs network access to download packages (already enabled in Daytona).

### Bundle Size
Installing large packages adds execution time. Use lightweight alternatives when possible:
- Use `dayjs` instead of `moment` (2kb vs 67kb)
- Use `nanoid` instead of `uuid` (130 bytes vs 4.5kb)

## Next Steps

### 1. Test It
```bash
deno task test:npm-codegen
```

### 2. Generate an Agent with Packages
```bash
deno task cli:create my-agent --prompt "Use lodash to process data"
```

### 3. Explore More Packages
Check [npmjs.com](https://www.npmjs.com/) for packages to use!

### 4. Combine with Utilities
Agents can use BOTH npm packages AND your utilities:
```bash
deno task cli:create combo --prompt "Use lodash for data, wandb for LLM calls, and weave for tracing"
```

Full power unlocked! 🚀

## Summary

✅ **Codegen knows how to use npm packages**
✅ **Follows proven Daytona patterns** (IIFE + install + require)
✅ **Includes working examples** in system prompt
✅ **Avoids common mistakes** (documented in prompt)
✅ **Tested and verified** with multiple packages

Your agents now have access to the **entire npm ecosystem** - 2+ million packages at their fingertips!

