import * as HeadsDownSDK from "@headsdown/sdk";
import { HeadsDownClient } from "@headsdown/sdk";

/**
 * HeadsDown SessionStart hook for Gemini CLI.
 */
export async function handleSessionStart() {
  try {
    const client = await HeadsDownClient.fromCredentials();
    const { contract, schedule } = await client.getAvailability();

    if (!contract) return null;

    const mode = contract.mode;
    const statusText = contract.statusText ? ` (${contract.statusText})` : "";
    
    let summary = `[HeadsDown] Mode: ${mode}${statusText}. `;
    
    if (contract.expiresAt) {
      const expires = new Date(contract.expiresAt);
      const now = new Date();
      const mins = Math.round((expires.getTime() - now.getTime()) / 60000);
      if (mins > 0) summary += `${mins}min remaining. `;
    }

    if (!schedule.inReachableHours && schedule.nextWindow) {
      summary += `Currently outside reachable hours (Next window: ${schedule.nextWindow.label} at ${schedule.nextWindow.startTime}).`;
    } else if (schedule.inReachableHours) {
      summary += "Reachable hours active.";
    }

    const wrapUpInstruction = resolveExecutionInstruction({ contract, schedule });
    if (wrapUpInstruction) {
      summary += ` ${wrapUpInstruction}`;
    }

    return { systemMessage: summary };
  } catch {
    return null;
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  handleSessionStart().then((result) => {
    if (result) console.log(JSON.stringify(result));
  });
}

function resolveExecutionInstruction(input: { contract?: unknown; schedule?: unknown }): string | null {
  const describeExecutionDirective = (
    HeadsDownSDK as unknown as {
      describeExecutionDirective?: (value: {
        contract?: unknown;
        schedule?: unknown;
      }) => { primaryDirective?: string };
    }
  ).describeExecutionDirective;

  if (typeof describeExecutionDirective === "function") {
    const directive = describeExecutionDirective(input);
    return directive.primaryDirective ?? null;
  }

  const guidance = (input.schedule as { wrapUpGuidance?: unknown } | undefined)?.wrapUpGuidance as
    | {
        active?: boolean;
        selectedMode?: "auto" | "wrap_up" | "full_depth";
        remainingMinutes?: number | null;
        reason?: string;
        hints?: string[];
      }
    | undefined;

  if (!guidance || !guidance.active) {
    return null;
  }

  let instruction = "";
  if (guidance.selectedMode === "wrap_up") {
    instruction =
      "Execution policy for this task: keep scope minimal, avoid starting new refactors, finish the current slice cleanly, and include clear handoff notes for deferred work.";
  } else if (guidance.selectedMode === "full_depth") {
    instruction =
      "Execution policy for this task: proceed with full implementation depth, include robust validation and tests, and do not shrink scope only because a deadline is near.";
  } else {
    instruction =
      "Execution policy for this task: follow the provided context to balance scope and depth, stay focused on the requested outcome, and avoid unnecessary expansion.";
  }

  const context: string[] = [];

  if (typeof guidance.remainingMinutes === "number") {
    context.push(`About ${guidance.remainingMinutes} minutes remain before the attention deadline.`);
  }

  if (guidance.reason) {
    context.push(`Reason: ${guidance.reason}`);
  }

  if (guidance.hints && guidance.hints.length > 0) {
    context.push(`Hints: ${guidance.hints.join("; ")}`);
  }

  return `Wrap-Up instruction: ${[instruction, ...context].join(" ")}`;
}
