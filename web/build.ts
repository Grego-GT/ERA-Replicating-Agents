/**
 * Build script for AgFactory web UI
 * Bundles React app using esbuild
 */

import * as esbuild from "esbuild";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";

const outdir = "./dist";

console.log("🏗️  Building AgFactory Web UI...\n");

// Ensure dist directory exists
await ensureDir(outdir);

// Bundle the application
const result = await esbuild.build({
  entryPoints: ["./src/main.tsx"],
  bundle: true,
  outdir,
  format: "esm",
  target: "es2020",
  platform: "browser",
  splitting: true,
  minify: true,
  sourcemap: true,
  jsx: "automatic",
  jsxImportSource: "react",
  loader: {
    ".css": "css",
  },
  external: [],
  metafile: true,
  logLevel: "info",
});

// Copy index.html
const indexHtml = await Deno.readTextFile("./index.html");
const modifiedHtml = indexHtml.replace(
  '/src/main.tsx',
  '/main.js'
);
await Deno.writeTextFile(join(outdir, "index.html"), modifiedHtml);

// Copy public assets
try {
  await Deno.copyFile("./public/vite.svg", join(outdir, "vite.svg"));
} catch {
  console.log("⚠️  No public assets to copy");
}

console.log("\n✅ Build complete!");
console.log(`   Output: ${outdir}/`);

// Analyze bundle
if (result.metafile) {
  const analysis = await esbuild.analyzeMetafile(result.metafile);
  console.log("\n📊 Bundle Analysis:");
  console.log(analysis);
}

esbuild.stop();

