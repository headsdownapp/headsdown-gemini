import { HeadsDownClient, describeExecutionDirective } from "@headsdown/sdk";
import { getConfigPath } from "../config.js";

/**
 * HeadsDown SessionStart hook for Gemini CLI.
 */
export async function handleSessionStart() {
  try {
    const client = await HeadsDownClient.fromCredentials({ credentialsPath: getConfigPath() });
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

    const directive = describeExecutionDirective({ contract, schedule });
    if (directive.primaryDirective) {
      summary += ` ${directive.primaryDirective}`;
    }

    return { systemMessage: summary };
  } catch {
    return null;
  }
}

import { fileURLToPath } from "url";
import * as path from "path";

// Only run if this is the main module
const __filename = fileURLToPath(import.meta.url);
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath === __filename) {
  handleSessionStart().then((result) => {
    if (result) console.log(JSON.stringify(result));
  });
}
