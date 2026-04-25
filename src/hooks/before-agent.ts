import { HeadsDownClient } from "@headsdown/sdk";

/**
 * HeadsDown BeforeAgent hook for Gemini CLI.
 * Fires before the agent starts planning for a user request.
 */
export async function handleBeforeAgent() {
  try {
    const client = await HeadsDownClient.fromCredentials();
    const { contract, schedule } = await client.getAvailability();

    if (!contract) return { decision: "allow" };

    const mode = contract.mode;
    if (mode === "online") return { decision: "allow" };

    const statusText = contract.statusText ? ` (${contract.statusText})` : "";
    let warning = `[HeadsDown] The user is currently in ${mode.toUpperCase()} mode${statusText}. `;

    if (schedule.wrapUpGuidance?.active) {
      warning += "An attention deadline is approaching. Keep plans minimal and focused on finishing current tasks.";
    } else if (mode === "busy" || mode === "offline") {
      warning += "They are likely unavailable for deep discussion or large new tasks. Minimize disruptions.";
    }

    return {
      decision: "allow",
      systemMessage: warning
    };
  } catch {
    // Fail silent to not block the user if the SDK/API has issues
    return { decision: "allow" };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  handleBeforeAgent().then((result) => {
    console.log(JSON.stringify(result));
  });
}
