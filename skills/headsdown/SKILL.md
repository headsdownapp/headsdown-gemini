---
name: headsdown
description: HeadsDown availability awareness. Use this when the user mentions focus mode, availability, or before starting non-trivial work. It allows you to check status, submit task proposals for verdict (approved/deferred), and respect focus time.
---

# HeadsDown Availability Skill

This skill connects you to [HeadsDown](https://headsdown.app) so you're aware of the user's focus mode and availability.

## When to Use

- **Before starting any non-trivial work:** Check `headsdown_status` to see the user's current mode.
- **If the user is Busy/Limited:** Submit a proposal using `headsdown_propose` to get a verdict (Approved/Deferred).
- **If the verdict is Deferred:** Inform the user why and suggest postponing or reducing scope.
- **When availability is mentioned:** "I'm heading into deep work", "Are you free?", etc.

## MCP Tools

- **`headsdown_status`**: Get current mode, status message, and schedule.
- **`headsdown_propose`**: Submit a task description for a deterministic verdict.
- **`headsdown_auth`**: Authenticate via Device Flow if you get a 401/Auth error.

## Gating Policy

The extension includes a `BeforeTool` hook that gates modifications (like writing files) when you are in a focus mode. If a tool call is denied, it means you must submit a proposal via `headsdown_propose` first.
