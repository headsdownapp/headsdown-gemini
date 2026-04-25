# headsdown-gemini

HeadsDown availability awareness and task gating for Gemini CLI. This extension makes Gemini "availability-aware," allowing it to respect your focus time, submit task proposals, and negotiate scope when you are busy.

## Features

- **Specialist Subagent (`@headsdown`)**: A dedicated expert agent for managing your availability, focus time, and task proposals.
- **Interactive Conflict Resolution**: Uses Gemini CLI's native `ask_user` UI to negotiate scope (Override, Wrap-Up, or Defer) when focus conflicts arise.
- **Real-time Gating**:
  - `BeforeAgent` Hook: Warns the agent if you are busy or a "Wrap-Up" deadline is near before it even starts planning.
  - `BeforeTool` Hook: Prevents destructive actions (file writes, shell commands) unless a proposal has been approved.
- **Secure Storage**: Leverages Gemini CLI's `settings` to securely store your `HEADSDOWN_TOKEN` in the system keychain.
- **MCP Server**: Provides low-level tools for status, proposals, outcomes, and authentication.

## Installation

```bash
git clone https://github.com/headsdownapp/headsdown-gemini.git
cd headsdown-gemini
npm install
npm run build
```

Then, link the extension to your Gemini CLI:
```bash
gemini extension install .
```

## Requirements

- **Node.js**: `>=22.14.0` (Standardized for modern agentic workflows)
- **Gemini CLI**: `v0.39.1` or higher

## Development

```bash
npm run build   # Compile TypeScript
npm test        # Run Vitest suite
npm run dev     # Watch mode
```

## Publishing

This package uses **npm Trusted Publishing** with SLSA provenance.
1. Update version in `package.json`.
2. Push a tag (e.g., `git tag v0.2.0 && git push origin v0.2.0`).
3. GitHub Actions will verify the version, publish to npm, and create a GitHub Release automatically.

## Repository Structure

- `agents/` - The `@headsdown` specialist subagent definition.
- `src/hooks/` - Hook handlers (`SessionStart`, `BeforeAgent`, `BeforeTool`).
- `src/mcp/` - MCP server implementation with interactive `ask_user` hints.
- `skills/` - Gemini skill content for broad availability awareness.
- `test/` - Comprehensive test suite for hooks and MCP logic.

## License

MIT
