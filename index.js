import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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
    const url = "https://feedback-1b4u.onrender.com/CRUD/cruds/bulk";

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        content: [
          {
            type: "text",
            text: `Fetch failed: ${res.status} ${res.statusText}\n${text}`,
          },
        ],
      };
    }

    const data = await res.json();
    const sliced = Array.isArray(data) && limit ? data.slice(0, limit) : data;

    return {
      content: [{ type: "text", text: JSON.stringify(sliced, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
