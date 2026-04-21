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
    expect(names).toEqual(["headsdown_auth", "headsdown_outcome", "headsdown_propose", "headsdown_status"]);
  });

  it("headsdown_propose has expected fields", async () => {
    const client = await createTestClient();
    const result = await client.listTools();
    const propose = result.tools.find((t) => t.name === "headsdown_propose");
    expect(propose?.inputSchema.required).toContain("description");
    expect(propose?.inputSchema.properties).toHaveProperty("scope_summary");
    expect(propose?.inputSchema.properties).toHaveProperty("source_ref");
    expect(propose?.inputSchema.properties).toHaveProperty("delivery_mode");
  });

  it("server source includes deliveryMode pass-through and status summary", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../src/mcp/server.ts", import.meta.url), "utf8");

    expect(source).toContain("deliveryMode: parseDeliveryMode");
    expect(source).toContain("wrapUpGuidance");
    expect(source).toContain("summary: summarizeAvailability");
    expect(source).toContain("wrapUpInstruction");
    expect(source).toContain("Execution policy for this task");
  });

  it("headsdown_outcome has expected required fields", async () => {
    const client = await createTestClient();
    const result = await client.listTools();
    const outcome = result.tools.find((t) => t.name === "headsdown_outcome");
    expect(outcome?.inputSchema.required).toContain("proposal_id");
    expect(outcome?.inputSchema.required).toContain("outcome");
  });
});
