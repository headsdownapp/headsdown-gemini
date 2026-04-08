import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  HeadsDownClient,
  ProposalStateStore,
  AuthError,
  ValidationError,
  NetworkError,
  ApiError
} from "@headsdown/sdk";

const proposalState = new ProposalStateStore();

export function createServer(): Server {
  const server = new Server(
    { name: "headsdown", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "headsdown_status",
        description: "Get user's current HeadsDown status and availability.",
        inputSchema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "headsdown_propose",
        description: "Submit a task proposal for verdict (Approved/Deferred). Be specific in description.",
        inputSchema: {
          type: "object",
          properties: {
            description: { type: "string", description: "What you plan to do." },
            estimated_files: { type: "number", description: "Estimated number of files to modify." },
            estimated_minutes: { type: "number", description: "Estimated time in minutes." },
            scope_summary: { type: "string", description: "Brief scope summary (e.g., 'Refactor auth hooks')." },
            source_ref: { type: "string", description: "Reference (e.g., ticket ID, PR URL)." }
          },
          required: ["description"]
        }
      },
      {
        name: "headsdown_outcome",
        description: "Report the outcome of a task (completed, failed, cancelled, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            proposal_id: { type: "string", description: "The proposal ID from the verdict." },
            outcome: { type: "string", enum: ["completed", "failed", "partially_completed", "cancelled", "timed_out"], description: "The task result." },
            files_modified: { type: "number", description: "Actual number of files modified." },
            minutes_spent: { type: "number", description: "Actual time spent in minutes." }
          },
          required: ["proposal_id", "outcome"]
        }
      },
      {
        name: "headsdown_auth",
        description: "Authenticate with HeadsDown via Device Flow.",
        inputSchema: { type: "object", properties: {}, required: [] }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const client = await getClient();

    if (!client && name !== "headsdown_auth") {
      return {
        content: [{ type: "text", text: "Not authenticated. Run headsdown_auth tool." }],
        isError: true
      };
    }

    try {
      switch (name) {
        case "headsdown_status": {
          const { contract, calendar } = await client!.getAvailability();
          return { content: [{ type: "text", text: JSON.stringify({ contract, calendar }, null, 2) }] };
        }
        case "headsdown_propose": {
          const input = {
            agentRef: "gemini-cli",
            framework: "gemini-cli",
            description: (args?.description as string).trim(),
            estimatedFiles: args?.estimated_files as number,
            estimatedMinutes: args?.estimated_minutes as number,
            scopeSummary: args?.scope_summary as string,
            sourceRef: args?.source_ref as string
          };
          const verdict = await client!.submitProposal(input);
          if (verdict.decision === "approved") {
            await proposalState.recordApproval({
              id: verdict.proposalId,
              decision: "approved",
              description: input.description,
              evaluatedAt: verdict.evaluatedAt
            });
          }
          return { content: [{ type: "text", text: JSON.stringify(verdict, null, 2) }] };
        }
        case "headsdown_outcome": {
          const outcome = await client!.reportOutcome({
            proposalId: args?.proposal_id as string,
            outcome: args?.outcome as any,
            filesModified: args?.files_modified as number,
            actualDurationMinutes: args?.minutes_spent as number
          });
          return { content: [{ type: "text", text: JSON.stringify(outcome, null, 2) }] };
        }
        case "headsdown_auth": {
          const authClient = await HeadsDownClient.authenticate((auth) => {
            console.error(`Visit ${auth.verificationUriComplete} to authenticate.`);
          }, { label: "Gemini CLI Extension" });
          const profile = await authClient.getProfile();
          return { content: [{ type: "text", text: `Authenticated as ${profile.email}` }] };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
  });

  return server;
}

async function getClient() {
  try { return await HeadsDownClient.fromCredentials(); } catch { return null; }
}
