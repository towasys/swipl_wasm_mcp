import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "HelloWorldServer",
  version: "1.0.0",
});

// 簡単なhelloツールを追加
server.tool(
  "hello",
  {
    name: z.string().optional(),
  },
  async ({ name }) => {
    const greeting = name ? `Hello, ${name}!` : "Hello, World!";
    return { content: [{ type: "text", text: greeting }] };
  }
);

// 簡単な計算ツールを追加
server.tool(
  "add",
  {
    a: z.number(),
    b: z.number(),
  },
  async ({ a, b }) => {
    return { content: [{ type: "text", text: `Result: ${a + b}` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.log("Hello, World! MCP Server is running with tools.");
