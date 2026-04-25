---
name: headsdown
description: HeadsDown availability awareness. Use this when the user mentions focus mode, availability, or before starting non-trivial work. It allows you to check status, submit task proposals for verdict (approved/deferred), and respect focus time.
---

# HeadsDown Availability Skill

This skill connects you to [HeadsDown](https://headsdown.app) so you're aware of the user's focus mode and availability.

## When to Use

- **High-level management**: For complex availability management or detailed status checks, consider delegating to the `@headsdown` specialist subagent.
- **Before starting any non-trivial work:** Check `headsdown_status` to see the user's current mode.
- **If the user is Busy/Limited:** Submit a proposal using `headsdown_propose` to get a verdict (Approved/Deferred).
- **Interactive Conflict Resolution:** If a verdict is **Deferred**, use the `ask_user` tool to present the user with a choice. Example choices:
    - **Header: "Focus Conflict"**, Options: `[{"label": "Override", "description": "Proceed anyway"}, {"label": "Reduce Scope", "description": "Switch to Wrap-Up mode"}, {"label": "Defer", "description": "Stop and try later"}]`
- **If the user selects "Reduce Scope":** Follow the `wrapUpInstruction` strictly.
- **When availability is mentioned:** "I'm heading into deep work", "Are you free?", etc.

## MCP Tools

- **`headsdown_status`**: Get current mode, status message, and schedule.
- **`headsdown_propose`**: Submit a task description for a deterministic verdict. Fields: `description`, `estimated_files`, `estimated_minutes`, `scope_summary`, `source_ref`.
- **`headsdown_outcome`**: Report task outcome (success/failure/cancelled) with actual `files_modified` and `minutes_spent`.
- **`headsdown_auth`**: Authenticate via Device Flow if you get a 401/Auth error.

## Advanced Features

### Subagent: `@headsdown`
The extension includes a specialist subagent for dedicated focus-time management. Delegate to it for detailed planning around availability.

### Hooks
- **`SessionStart`**: Injects initial availability context.
- **`BeforeAgent`**: Provides real-time warnings before each planning phase if the user is busy or a deadline is near.
- **`BeforeTool`**: Gates modifications (like writing files) when you are in a focus mode. If a tool call is denied, you must submit a proposal via `headsdown_propose` first. 
