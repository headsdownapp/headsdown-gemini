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

    if (schedule.wrapUpGuidance?.active) {
      const remaining = schedule.wrapUpGuidance.remainingMinutes;
      const timing = typeof remaining === "number" ? `${remaining}min left` : "active";
      summary += ` Wrap-Up guidance is ${timing} (${schedule.wrapUpGuidance.selectedMode}).`;
    }

    return { systemMessage: summary };
  } catch (error) {
    return null;
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  handleSessionStart().then(result => {
    if (result) console.log(JSON.stringify(result));
  });
}
