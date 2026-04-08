import { HeadsDownClient, ProposalStateStore } from "@headsdown/sdk";

export interface HookInput {
  tool_name: string;
  tool_input?: any;
}

/**
 * HeadsDown BeforeTool hook for Gemini CLI.
 */
export async function handleBeforeTool(input: HookInput) {
  const toolName = input.tool_name;
  
  const modificationTools = ["write_file", "replace", "run_shell_command"];
  if (!modificationTools.includes(toolName)) {
    return { decision: "allow" };
  }

  try {
    const client = await HeadsDownClient.fromCredentials();
    const { contract } = await client.getAvailability();

    if (!contract || contract.mode === "online") {
      return { decision: "allow" };
    }

    const mode = contract.mode;
    const lock = contract.lock || false;
    const statusText = contract.statusText || "";
    const statusLabel = statusText ? ` (${statusText})` : "";

    const proposalStore = new ProposalStateStore();
    const hasApproved = await proposalStore.hasApprovedProposal();

    if (hasApproved) {
      return {
        decision: "allow",
        systemMessage: `[HeadsDown] Proceeding in ${mode} mode${statusLabel} (proposal approved).`
      };
    }

    if (lock || mode === "offline") {
      return {
        decision: "deny",
        reason: `[HeadsDown] User is in ${mode.toUpperCase()} mode${statusLabel}. Status is locked or user is offline. You MUST ask for explicit permission before continuing.`,
        systemMessage: `Blocked: ${mode.toUpperCase()} mode${statusLabel}.`
      };
    } else if (mode === "busy" || mode === "limited") {
      return {
        decision: "deny",
        reason: `[HeadsDown] User is in ${mode.toUpperCase()} mode${statusLabel}. You must submit a task proposal using headsdown_propose before proceeding with this modification.`,
        systemMessage: `Blocked: ${mode.toUpperCase()} mode${statusLabel}. Proposal required.`
      };
    }
    
    return { decision: "allow" };
  } catch (error) {
    return { decision: "allow" };
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const chunks: any[] = [];
  process.stdin.on("data", chunk => chunks.push(chunk));
  process.stdin.on("end", () => {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    handleBeforeTool(input).then(result => {
      console.log(JSON.stringify(result));
    });
  });
}
