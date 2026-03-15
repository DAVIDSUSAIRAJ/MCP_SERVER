import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CRUD_API_URL = "https://feedback-1b4u.onrender.com/CRUD/cruds/bulk";

// Simple cache to reduce API calls
let cache = {
  data: null,
  timestamp: null,
  TTL: 5 * 60 * 1000, // 5 minutes
};

function isCacheValid() {
  return cache.data && Date.now() - cache.timestamp < cache.TTL;
}

const server = new McpServer(
  { name: "crud-mcp-tools", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.tool(
  "fetch_cruds_bulk",
  "Fetch CRUD records from bulk endpoint and return JSON.",
  {
    limit: z
      .number()
      .int()
      .positive()
      .max(500)
      .optional()
      .describe("Optional: return only first N records (client-side slice)"),
  },
  async ({ limit }) => {
    try {
      let data;

      // Use cache if valid
      if (isCacheValid()) {
        data = cache.data;
      } else {
        // Fetch fresh data with timeout
        const res = await fetch(CRUD_API_URL, {
          method: "GET",
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Fetch failed: ${res.status} ${res.statusText}\n${text}`,
              },
            ],
          };
        }

        data = await res.json();
        // Update cache
        cache.data = data;
        cache.timestamp = Date.now();
      }

      const sliced = Array.isArray(data) && limit ? data.slice(0, limit) : data;

      return {
        content: [{ type: "text", text: JSON.stringify(sliced, null, 2) }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "create_cruds_bulk",
  "Create or update CRUD records in bulk. Accepts an array of records with title, description, and id.",
  {
    records: z
      .array(
        z.object({
          title: z.string().describe("Title of the record"),
          description: z.string().describe("Description of the record"),
          id: z.number().describe("Unique ID for the record"),
        })
      )
      .min(1)
      .describe("Array of CRUD records to create/update"),
  },
  async ({ records }) => {
    try {
      const res = await fetch(CRUD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `POST failed: ${res.status} ${res.statusText}\n${text}`,
            },
          ],
        };
      }

      const data = await res.json();
      // Invalidate cache after successful POST
      cache.data = null;
      cache.timestamp = null;

      return {
        content: [
          {
            type: "text",
            text: `Successfully created/updated ${records.length} record(s).\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
