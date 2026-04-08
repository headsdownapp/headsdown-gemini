import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/mcp/server.js";

async function createTestClient() {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.1.0" });
  await client.connect(clientTransport);
  return client;
}

describe("HeadsDown MCP Server", () => {
  it("exposes the expected tools", async () => {
    const client = await createTestClient();
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name).sort();
    expect(names).toEqual(["headsdown_auth", "headsdown_propose", "headsdown_status"]);
  });

  it("headsdown_propose requires a description", async () => {
    const client = await createTestClient();
    const result = await client.listTools();
    const propose = result.tools.find((t) => t.name === "headsdown_propose");
    expect(propose?.inputSchema.required).toContain("description");
  });
});
