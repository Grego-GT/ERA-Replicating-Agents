# AgFactory

A barebones Hono + Alpine.js application for Deno.

## Getting Started

### Run locally with Deno
```bash
deno run --allow-net --allow-read --allow-env main.js
```

### Run with watch mode
```bash
deno run --allow-net --allow-read --allow-env --watch main.js
```

## Project Structure

```
/AgFactory
  ├── main.js              # Main Hono application
  ├── frontend/
  │   └── index.html       # Alpine.js frontend
  ├── backend/
  │   └── index.js         # Backend module exports
  ├── deno.json            # Deno configuration
  └── README.md
```

## Tech Stack

- **Backend**: Hono (Deno)
- **Frontend**: Alpine.js
- **Styling**: Tailwind CSS (CDN)

## Development

The project is set up to work with:
- Val.town (serverless)
- Local Deno development
- Smallweb

Backend functions should be added to the `backend/` directory and exported through `backend/index.js`.
