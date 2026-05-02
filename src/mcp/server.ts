import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import * as HeadsDownSDK from "@headsdown/sdk";
import {
  HeadsDownClient,
  ProposalStateStore,
  describeExecutionDirective,
} from "@headsdown/sdk";
import { getConfigPath } from "../config.js";

const CONFIG_PATH = getConfigPath();

export function createServer(): Server {
  const server = new Server(
    { name: "headsdown", version: "0.3.2" },
    { capabilities: { tools: {}, resources: {} } }
  );

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "headsdown://status",
        name: "Current Availability Status",
        description: "The user's current HeadsDown mode, lock status, and status text.",
        mimeType: "application/json"
      },
      {
        uri: "headsdown://schedule",
        name: "Today's Schedule",
        description: "Upcoming reachable hours and focus windows for today.",
        mimeType: "application/json"
      }
    ]
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const client = await getClient();

    if (!client) {
      throw new Error("Not authenticated. Run headsdown_auth tool.");
    }

    try {
      const { contract, schedule } = await client.getAvailability();
      
      if (uri === "headsdown://status") {
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(contract, null, 2)
          }]
        };
      } else if (uri === "headsdown://schedule") {
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(schedule, null, 2)
          }]
        };
      }
      throw new Error(`Unknown resource: ${uri}`);
    } catch (error: any) {
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  });

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
            source_ref: { type: "string", description: "Reference (e.g., ticket ID, PR URL)." },
            delivery_mode: {
              type: "string",
              enum: ["auto", "wrap_up", "full_depth"],
              description: "Optional Wrap-Up delivery mode override for this proposal."
            }
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
        content: [
          { 
            type: "text", 
            text: "Not authenticated. Please run the 'headsdown_auth' tool to link your account." 
          }
        ],
        isError: true
      };
    }

    try {
      switch (name) {
        case "headsdown_status": {
          const { contract, schedule } = await client!.getAvailability();
          const directive = describeExecutionDirective({ contract, schedule });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    contract,
                    schedule,
                    summary: summarizeAvailability(contract, schedule),
                    wrapUpInstruction: directive.primaryDirective
                  },
                  null,
                  2
                )
              }
            ]
          };
        }
        case "headsdown_propose": {
          const input = {
            agentRef: "gemini-cli",
            framework: "gemini-cli",
            description: (args?.description as string).trim(),
            estimatedFiles: args?.estimated_files as number,
            estimatedMinutes: args?.estimated_minutes as number,
            scopeSummary: args?.scope_summary as string,
            sourceRef: args?.source_ref as string,
            deliveryMode: parseDeliveryMode(args?.delivery_mode)
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
          const directive = describeExecutionDirective({
            verdict: {
              decision: verdict.decision,
              reason: verdict.reason,
              wrapUpGuidance: verdict.wrapUpGuidance
            }
          });

          // Suggest an interactive resolution if deferred
          let suggested_interaction = undefined;
          if (verdict.decision === "deferred") {
            suggested_interaction = {
              type: "ask_user",
              header: "Focus Conflict",
              question: `Your task was deferred: ${verdict.reason}. How would you like to proceed?`,
              options: [
                { label: "Override", description: "Ignore focus mode and proceed with full scope." },
                { label: "Wrap-Up", description: "Proceed with a minimal, reduced scope." },
                { label: "Defer", description: "Stop and wait until you are available." }
              ]
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ 
                  ...verdict, 
                  wrapUpInstruction: directive.primaryDirective, 
                  suggested_interaction 
                }, null, 2)
              }
            ]
          };
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
          }, { 
            label: "Gemini CLI Extension",
            credentialsPath: CONFIG_PATH
          });
          
          const profile = await authClient.getProfile();

          return { 
            content: [
              { 
                type: "text", 
                text: `Successfully authenticated as ${profile.email}. Your token has been saved to ${CONFIG_PATH}.` 
              }
            ] 
          };
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

function parseDeliveryMode(value: unknown): "auto" | "wrap_up" | "full_depth" | undefined {
  if (value === "auto" || value === "wrap_up" || value === "full_depth") {
    return value;
  }

  return undefined;
}

function summarizeAvailability(
  contract: { mode: string; statusText?: string | null; lock?: boolean | null } | null,
  schedule: {
    inReachableHours?: boolean;
    wrapUpGuidance?: { active?: boolean; remainingMinutes?: number | null; selectedMode?: string };
  } | null,
): string {
  if (!contract) {
    return "No active availability contract.";
  }

  const parts = [`Mode: ${contract.mode}`];
  if (contract.statusText) {
    parts.push(`Status: ${contract.statusText}`);
  }
  if (contract.lock) {
    parts.push("Status is locked");
  }
  if (schedule?.inReachableHours === false) {
    parts.push("Outside reachable hours");
  }
  const directive = describeExecutionDirective({ contract, schedule });
  if (directive.primaryDirective) {
    parts.push(`Wrap-Up instruction: ${directive.primaryDirective}`);
  }

  return parts.join(" · ");
}

async function getClient() {
  try {
    // 1. Try environment variable (Gemini Settings / API Key env)
    if (process.env.HEADSDOWN_TOKEN || process.env.HEADSDOWN_API_KEY) {
      return await HeadsDownClient.fromCredentials();
    }

    // 2. Try local extension config file
    return await HeadsDownClient.fromCredentials({ credentialsPath: CONFIG_PATH });
  } catch {
    return null;
  }
}
