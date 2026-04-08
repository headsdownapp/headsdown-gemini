# headsdown-gemini

HeadsDown availability awareness and task gating for Gemini CLI.

## What it does

- Loads a Gemini CLI extension manifest from `gemini-extension.json`
- Starts an MCP server that exposes `headsdown_status`, `headsdown_propose`, and `headsdown_auth`
- Runs a `SessionStart` hook that can surface the user's current HeadsDown availability
- Runs a `BeforeTool` hook that can gate write-like tools when the user is busy, limited, or offline
- Ships a `skills/headsdown/SKILL.md` file so Gemini can check availability before starting non-trivial work

## Install

```bash
git clone https://github.com/headsdownapp/headsdown-gemini.git
cd headsdown-gemini
npm install
npm run build
```

The package depends on `@headsdown/sdk` from the HeadsDown SDK repository, so installs will pull that dependency from GitHub.

## Development

```bash
npm run build
npm test
npm run dev
```

## Repository contents

- `gemini-extension.json` - Gemini CLI extension manifest
- `src/` - MCP server and hook handlers
- `skills/` - Gemini skill content
- `test/` - Vitest coverage for hooks and MCP tools

## License

MIT
