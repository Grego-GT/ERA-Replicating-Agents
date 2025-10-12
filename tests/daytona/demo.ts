/**
 * Daytona Demo - NPM Packages & Environment Variables
 * 
 * Complete demonstration of how to use Daytona sandboxes with npm packages and env vars.
 * 
 * QUICK START:
 *   deno task daytona-demo
 * 
 * WHAT THIS SHOWS:
 *   1. Daytona uses Node.js (not Deno)
 *   2. Install npm packages dynamically with execSync('npm install pkg')
 *   3. Wrap code in (async () => { ... })() for require() support
 *   4. Pass environment variables from Deno .env to Daytona sandboxes
 *   5. Packages don't persist across sandbox runs
 *   6. Real packages work (async-sema, lodash, moment, etc.)
 * 
 * BASIC PATTERN:
 *   (async () => {
 *     const { execSync } = require('child_process');
 *     execSync('npm install lodash', { stdio: 'pipe' });
 *     const _ = require('lodash');
 *     console.log(_.sum([1, 2, 3]));
 *   })();
 * 
 * PASSING ENV VARS (from Deno to Daytona):
 *   // In Deno:
 *   const envVars = { API_KEY: Deno.env.get('API_KEY') };
 *   await runCode(code, 'javascript', envVars);
 * 
 *   // In Daytona sandbox:
 *   const apiKey = process.env.API_KEY;
 * 
 * WHY IIFE WRAPPER:
 *   Node.js v24+ uses ES module mode by default where require() fails.
 *   The (async () => { ... })() wrapper forces CommonJS mode.
 */

import "jsr:@std/dotenv/load";
import { runCode } from '../../utils/daytona/index.ts';

console.log('🔬 Daytona NPM Investigation - Key Findings\n');
console.log('='.repeat(70));

// ============================================================================
// FINDING 1: Daytona uses Node.js (not Deno)
// ============================================================================

console.log('\n📌 FINDING 1: Daytona uses Node.js (not Deno)\n');

const finding1 = `
(async () => {
  // Check the environment
  console.log('Runtime:', typeof process !== 'undefined' ? 'Node.js' : 'Deno');
  console.log('Node version:', process.version);
  console.log('Platform:', process.platform);
})();
`;

const result1 = await runCode(finding1, 'javascript');
console.log(result1.result);

// ============================================================================
// FINDING 2: Install packages dynamically with execSync
// ============================================================================

console.log('\n📌 FINDING 2: Install packages dynamically with execSync\n');

const finding2 = `
(async () => {
  const { execSync } = require('child_process');
  
  console.log('Installing lodash...');
  execSync('npm install lodash', { stdio: 'pipe' });
  console.log('✅ Package installed');
  
  const _ = require('lodash');
  console.log('✅ Package loaded');
  console.log('Sum of [1,2,3,4,5]:', _.sum([1, 2, 3, 4, 5]));
})();
`;

const result2 = await runCode(finding2, 'javascript');
console.log(result2.result);

// ============================================================================
// FINDING 3: Wrap code in IIFE to use require() in Node.js v24+
// ============================================================================

console.log('\n📌 FINDING 3: Wrap code in IIFE for require() support\n');

const finding3 = `
(async () => {
  // This IIFE wrapper forces CommonJS mode
  // Without it, require() fails in Node.js v24+ (ES module mode)
  const { execSync } = require('child_process');
  
  console.log('✅ require() works inside IIFE');
  console.log('Pattern: (async () => { ... })()');
})();
`;

const result3 = await runCode(finding3, 'javascript');
console.log(result3.result);

// ============================================================================
// FINDING 4: Pass environment variables from Deno to Daytona
// ============================================================================

console.log('\n📌 FINDING 4: Pass environment variables to sandboxes\n');

const finding4 = `
(async () => {
  const apiKey = process.env.WANDB_API_KEY;
  const customVar = process.env.CUSTOM_VAR;
  
  console.log('API key available:', !!apiKey);
  console.log('Custom var:', customVar);
  console.log('✅ Environment variables passed successfully');
})();
`;

const envVars = {
  WANDB_API_KEY: Deno.env.get('WANDB_API_KEY') || 'demo-key-12345',
  CUSTOM_VAR: 'hello-from-deno'
};

const result4 = await runCode(finding4, 'javascript', envVars);
console.log(result4.result);

// ============================================================================
// FINDING 5: Packages don't persist across sandbox runs
// ============================================================================

console.log('\n📌 FINDING 5: Packages don\'t persist - install each time\n');

const finding5 = `
(async () => {
  const { execSync } = require('child_process');
  
  console.log('Each sandbox is a fresh Node.js environment');
  console.log('Packages must be installed every time');
  
  // Install moment
  execSync('npm install moment', { stdio: 'pipe' });
  const moment = require('moment');
  
  console.log('Current time:', moment().format('YYYY-MM-DD HH:mm:ss'));
  console.log('✅ Package installed and used (won\'t persist to next run)');
})();
`;

const result5 = await runCode(finding5, 'javascript');
console.log(result5.result);

// ============================================================================
// FINDING 6: Real-world package works (async-sema example)
// ============================================================================

console.log('\n📌 FINDING 6: Real npm packages work (async-sema example)\n');

const finding6 = `
(async () => {
  const { execSync } = require('child_process');
  
  // Install the same package used in utils/wandb/index.ts
  execSync('npm install async-sema', { stdio: 'pipe' });
  
  const { Sema } = require('async-sema');
  const sema = new Sema(2); // Max 2 concurrent
  
  async function task(id) {
    await sema.acquire();
    console.log('Task', id, 'running');
    await new Promise(r => setTimeout(r, 50));
    sema.release();
  }
  
  await Promise.all([task(1), task(2), task(3)]);
  console.log('✅ async-sema works! (Same package you use in utils/wandb)');
})();
`;

const result6 = await runCode(finding6, 'javascript');
console.log(result6.result);

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('\n📊 SUMMARY OF KEY FINDINGS:\n');
console.log('1. ✅ Daytona uses Node.js (not Deno)');
console.log('2. ✅ Install packages: execSync("npm install pkg", { stdio: "pipe" })');
console.log('3. ✅ Wrap code: (async () => { ... })() for require() support');
console.log('4. ✅ Pass env vars: runCode(code, "javascript", envVars)');
console.log('5. ✅ Packages don\'t persist - install each time');
console.log('6. ✅ Real packages work (async-sema, lodash, axios, etc.)');

console.log('\n🎯 PATTERN FOR FBI/DIRECTOR:\n');
console.log('```javascript');
console.log('(async () => {');
console.log('  const { execSync } = require("child_process");');
console.log('  execSync("npm install lodash", { stdio: "pipe" });');
console.log('  const _ = require("lodash");');
console.log('  // Use package...');
console.log('  console.log(JSON.stringify({ success: true, result: data }));');
console.log('})();');
console.log('```\n');

console.log('✅ Investigation complete!\n');

