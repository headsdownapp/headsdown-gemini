# @headsdown/gemini

HeadsDown availability awareness and task gating for Gemini CLI. This extension makes Gemini "availability-aware," allowing it to respect your focus time, submit task proposals, and negotiate scope when you are busy.

## Features

- **Specialist Subagent (`@headsdown`)**: A dedicated expert agent for managing your availability, focus time, and task proposals.
- **Interactive Conflict Resolution**: Uses Gemini CLI's native `ask_user` UI to negotiate scope (Override, Wrap-Up, or Defer) when focus conflicts arise.
- **Real-time Gating**:
  - `BeforeAgent` Hook: Warns the agent if you are busy or a "Wrap-Up" deadline is near before it even starts planning.
  - `BeforeTool` Hook: Prevents destructive actions (file writes, shell commands) unless a proposal has been approved.
- **Secure Storage**: Leverages Gemini CLI's `settings` to securely store your `HEADSDOWN_TOKEN` in the system keychain.

## Installation

### Standard Install (Recommended)

Install directly from npm:
```bash
gemini extension install @headsdown/gemini
```

### Local Development

If you want to contribute or run from source:
```bash
git clone https://github.com/headsdownapp/headsdown-gemini.git
cd headsdown-gemini
npm install
npm run build
gemini extension install .
```

## Configuration

After installation, the CLI will prompt you for your HeadsDown token. You can also set it manually:
```bash
gemini settings set HEADSDOWN_TOKEN <your-token>
```
*Tip: Use the `headsdown_auth` tool within Gemini to get your token via device flow.*

## Requirements

- **Node.js**: `>=22.14.0`
- **Gemini CLI**: `v0.39.1` or higher

## Development

```bash
npm run build   # Compile TypeScript
npm test        # Run Vitest suite
npm run dev     # Watch mode
```

## Publishing

1. Update version in `package.json`.
2. Push a tag (e.g., `git tag v0.4.0 && git push origin --tags`).
3. GitHub Actions will automatically update `CHANGELOG.md`, publish to npm, and create a GitHub Release.

## License

MIT
