import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import "jsr:@std/dotenv/load"; // needed for deno run; not req for smallweb or valtown

const app = new Hono();

// Serve the main HTML page
app.get("/", async (c) => {
  try {
    const html = await Deno.readTextFile("./frontend/index.html");
    return c.html(html);
  } catch (error) {
    console.error('Error reading HTML file:', error);
    return c.text('Error loading page', 500);
  }
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Export app.fetch for Val Town, otherwise export app — this is only for hono apps
export default (typeof Deno !== "undefined" && Deno.env.get("valtown")) ? app.fetch : app;

