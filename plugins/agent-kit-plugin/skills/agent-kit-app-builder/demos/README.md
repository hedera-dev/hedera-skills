# Hedera App Builder Demos

Ready-to-use prompts for building Hedera-powered frontend applications. Each demo contains a `PROMPT.md` — copy its contents into your AI coding agent and let it build the app.

## Prerequisites

- **Node.js 18+** installed
- **Hedera testnet account** — get one free at [portal.hedera.com](https://portal.hedera.com)
- **AI coding agent** with the `agent-kit-app-builder` skill installed
- **MCP server configured** (optional, for live data seeding) — see `templates/mcp-configs/`

## How to Run Any Demo

1. Open your AI coding agent (Claude Code, Cursor, VS Code, etc.)
2. Open the demo's `PROMPT.md` file
3. Copy the entire prompt content
4. Paste it into your AI coding agent's chat
5. Let it build — the agent will scaffold the project, write all code, and optionally seed test data via MCP

## Demo Comparison

| Demo | Complexity | What It Builds | Hedera Services | MCP Seeding |
|------|-----------|----------------|-----------------|-------------|
| **Token Launchpad** | Medium | Token creation, minting, transfer UI | HTS (fungible tokens) | Creates test token |
| **Wallet Dashboard** | Low-Medium | Read-only account portfolio viewer | Mirror Node REST API | Queries operator account |
| **HCS Message Board** | Medium | Decentralized message board | HCS (consensus service) | Creates topic + test messages |
| **NFT Gallery** | Medium-High | NFT collection creator and gallery | HTS (NFTs) | Creates collection + mints NFTs |

## Notes

- All demos target **Hedera testnet** by default (free, no real cost)
- Prompts are optimized for one-shot generation but may require 1-2 follow-up iterations for polish
- Each demo uses Next.js 14+ with TypeScript, Tailwind CSS, and shadcn/ui
- Server-side API routes handle all Hedera operations — private keys are never exposed to the client
