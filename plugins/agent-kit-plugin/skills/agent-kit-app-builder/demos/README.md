# Hedera App Builder Demos

Ready-to-use prompts for building Hedera-powered frontend applications. Each demo contains a `PROMPT.md` — copy its contents into your AI coding agent and let it build the app.

## Two Categories

| | Category A: "Built with Agent Kit" | Category B: "Powered by Agent Kit" |
|---|---|---|
| **Pattern** | Multi-plugin orchestration — fixed pipeline | Runtime AI agent — LLM chooses tools |
| **LLM needed?** | No | Yes (OpenAI, Anthropic, or Groq) |
| **Demo** | Meme Coin Launchpad | Hedera DeFi Agent |

Both demos feature a **pipeline visualizer** showing each agent kit tool call executing in real-time.

## Prerequisites

- **Node.js 18+** installed
- **Hedera testnet account** — get one free at [portal.hedera.com](https://portal.hedera.com)
- **AI coding agent** with the `agent-kit-app-builder` skill installed
- **MCP server configured** (optional, for live data seeding) — see `templates/mcp-configs/`
- **LLM API key** (Category B only) — OpenAI, Anthropic, or Groq

## How to Run Any Demo

1. Open your AI coding agent (Claude Code, Cursor, VS Code, etc.)
2. Open the demo's `PROMPT.md` file
3. Copy the entire prompt content
4. Paste it into your AI coding agent's chat
5. Let it build — the agent will scaffold the project, write all code, and optionally seed test data via MCP

## Demo Comparison

| Demo | Category | What It Builds | Hedera Services | Testnet? | LLM Key? |
|------|----------|----------------|-----------------|----------|----------|
| **Meme Coin Launchpad** | A | One-click meme token launch with bonding curve, community topic, and wallet verification | HTS (Memejob), HCS, Account Query | ✅ Full | No |
| **Hedera DeFi Agent** | B | Voice/text DeFi assistant — AI agent with Hedera tools | HTS, HCS, Account, Memejob | ✅ Full | Yes |

## Plugin Testnet Compatibility

Not all third-party plugins work on testnet out of the box:

| Plugin | Testnet | Notes |
|--------|---------|-------|
| Core plugins (account, token, consensus) | ✅ | All work on testnet |
| Memejob | ✅ | Token creation, buying, selling |
| SaucerSwap | ⚠️ Mainnet only | Plugin defaults to mainnet API, returns 401 on testnet |
| Bonzo | ⚠️ Requires setup | Needs `bonzo-contracts.json` config file |

Both demos use only testnet-compatible plugins. SaucerSwap and Bonzo can be added for mainnet-targeting apps.

## Notes

- All demos target **Hedera testnet** by default (free, no real cost)
- Prompts are optimized for one-shot generation but may require 1-2 follow-up iterations for polish
- Each demo uses Next.js 14+ with TypeScript, Tailwind CSS, and shadcn/ui
- Use `@hashgraph/sdk` (NOT `@hiero-ledger/sdk`) — see troubleshooting in the main README
- Server-side API routes handle all Hedera operations — private keys are never exposed to the client
- Category B apps use `createReactAgent` from `@langchain/langgraph/prebuilt` (NOT the old `langchain/agents`)
- Groq free tier has a 12k TPM limit — load fewer plugins or use OpenAI/Anthropic for full tool set
