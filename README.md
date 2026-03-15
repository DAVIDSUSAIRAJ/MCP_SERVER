# CRUD MCP Server

A Model Context Protocol (MCP) server for fetching and managing CRUD feedback records.

## Features

- **Fetch CRUD records** - Get feedback data from the bulk endpoint
- **Create/Update records** - Add or update feedback in bulk
- **Built-in caching** - 5-minute cache to reduce API calls and avoid rate limiting (429 errors)
- **Dual transport support** - Works with both stdio (local) and SSE (remote) transports
- **Error handling** - Proper timeout and error responses with `isError` flag

## Setup

### Local Development (stdio)

1. Install dependencies:
```bash
npm install
```

2. Add to your Cursor `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "crud-mcp-tools": {
      "command": "node",
      "args": ["stdio.js"],
      "cwd": "d:\\MCP_SERVER"
    }
  }
}
```

3. Restart Cursor

### Remote Deployment (SSE on Render)

1. Deploy to Render (or any Node.js hosting)
2. Share this config with friends:
```json
{
  "mcpServers": {
    "crud-mcp-tools": {
      "url": "https://mcp-server-mv7m.onrender.com/sse"
    }
  }
}
```

## How the Caching Works

To prevent 429 (Too Many Requests) errors from the upstream API:

- Data is cached for **5 minutes** after the first fetch
- Subsequent requests within 5 minutes use cached data (no API call)
- Cache is automatically invalidated after POST operations
- This reduces API load when multiple users connect

## Available Tools

### `fetch_cruds_bulk`

Fetch CRUD feedback records with optional limit.

**Parameters:**
- `limit` (optional, number): Return only first N records (max 500)

**Example:**
```javascript
// Fetch all records
fetch_cruds_bulk()

// Fetch only 3 records
fetch_cruds_bulk({ limit: 3 })
```

### `create_cruds_bulk`

Create or update CRUD records in bulk.

**Parameters:**
- `records` (array): Array of objects with `title`, `description`, and `id`

**Example:**
```javascript
create_cruds_bulk({
  records: [
    {
      title: "New Feedback",
      description: "Great work!",
      id: Date.now()
    }
  ]
})
```

## API Endpoints (SSE Mode)

- `GET /` - Health check
- `GET /sse` - SSE connection endpoint for MCP clients
- `POST /messages?sessionId=<id>` - JSON-RPC message endpoint

## Troubleshooting

### 429 Too Many Requests

If you see this error, it means the upstream API is rate limiting. The caching mechanism should prevent this for most use cases. If it persists:

1. Wait a few minutes before retrying
2. Check if the upstream API is down
3. Increase the cache TTL in the code (currently 5 minutes)

### 500 Internal Server Error

Check the Render logs for the actual error. Common causes:
- Missing `express.json()` middleware (now fixed)
- Upstream API timeout
- Memory issues on free tier

## License

ISC
