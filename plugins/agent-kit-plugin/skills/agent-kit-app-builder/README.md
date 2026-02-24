# Hedera App Builder Skill

Build production-quality Hedera frontend apps with one prompt.

## What This Skill Does

This is an AI agent skill that generates complete Next.js + Hedera applications from a single prompt. It uses the `hedera-agent-kit` MCP server to seed real on-chain data during development, so your app renders with live testnet data from the start — not placeholder content. This is a skill for AI coding agents (Claude Code, Cursor, VS Code), not a standalone CLI tool.

## Quick Start

1. **Install the skill** via the Claude Plugin Marketplace:
   ```
   /plugin marketplace add hedera-dev/hedera-skills
   ```

2. **Get a free Hedera testnet account** at [portal.hedera.com](https://portal.hedera.com). Copy your Account ID (`0.0.XXXXX`) and private key.

3. **Configure environment variables.** Copy the template and fill in your credentials:
   ```env
   # Required for ALL apps:
   HEDERA_OPERATOR_ID=0.0.XXXXX
   HEDERA_OPERATOR_KEY=302e020100300506...
   HEDERA_NETWORK=testnet

   # Required for Category B (agentic) apps only — pick one:
   # OPENAI_API_KEY=sk-...
   # ANTHROPIC_API_KEY=sk-ant-...
   # GROQ_API_KEY=gsk_...
   ```
   See [`templates/env.example`](templates/env.example) for the full template.

4. **(Optional) Set up the MCP server** for live data seeding during development. Platform-specific configs are in [`templates/mcp-configs/`](templates/mcp-configs/):
   - `claude-code.json` — Claude Code (`.claude/mcp.json`)
   - `cursor.json` — Cursor (`.cursor/mcp.json`)
   - `vscode.json` — VS Code MCP extension
   - `generic-stdio.json` — Any MCP-compatible agent via stdio

5. **Open your AI agent and paste a demo prompt** from the [`demos/`](demos/) directory.

6. **The agent builds the app** — scaffolds the project, writes all code, and seeds it with real testnet data via MCP.

## Two Ways to Build

| | Category A: "Built with Agent Kit" | Category B: "Powered by Agent Kit" |
|---|---|---|
| **Pattern** | Multi-plugin orchestration — fixed pipeline | Runtime AI agent — LLM chooses tools |
| **LLM at runtime?** | No | Yes |
| **Why Agent Kit?** | Plugins provide capabilities impossible with raw SDK | Agent Kit IS the runtime — LLM + tools |
| **Env vars** | Hedera credentials only | Hedera credentials + LLM API key |

Both categories feature a **pipeline visualizer** showing each agent kit tool call executing in real-time.

## What You Can Build

| Blueprint | Category | Description | Hedera Services | LLM Key? |
|-----------|----------|-------------|-----------------|----------|
| **Meme Coin Launchpad** | A | One-click meme token launch with bonding curve, community topic, and DEX liquidity — chaining 3 plugins in a visible pipeline | HTS (Memejob), HCS, DeFi (SaucerSwap) | No |
| **Hedera DeFi Agent** | B | Voice/text DeFi assistant — AI agent executes across all Hedera services via natural language | ALL (HTS, HCS, HSCS, Mirror Node, SaucerSwap, Bonzo, Memejob) | Yes |

These are starting points. The skill can build any Hedera-powered frontend — custom apps are supported by combining patterns from the [references](references/).

## How the MCP Server Works

The key differentiator of this skill: the AI agent doesn't just generate code — it uses MCP tools to interact with Hedera live during development.

**Flow:**
```
Agent builds app → Uses MCP to create test token on testnet
  → App renders real on-chain data (not mock data)
  → Agent verifies UI works with actual blockchain state
```

For example, after scaffolding the Meme Coin Launchpad, the agent calls MCP tools to verify the operator account has sufficient HBAR balance, then the UI is ready to execute a real launch pipeline.

See [`references/mcp-live-usage.md`](references/mcp-live-usage.md) for full setup details and usage patterns.

## Skill Contents

```
agent-kit-app-builder/
├── README.md                    ← You are here
├── SKILL.md                     # AI agent instructions (the brain)
├── references/                  # Supporting documentation
│   ├── app-blueprints.md        # 2 app architectures (Category A & B)
│   ├── frontend-patterns.md     # React/Next.js + Hedera patterns (5 patterns)
│   ├── agent-kit-sdk-reference.md  # hedera-agent-kit API + third-party plugins + LangChain
│   ├── network-config.md        # Environment, network setup, LLM providers
│   └── mcp-live-usage.md        # MCP server setup & usage patterns
├── demos/                       # One-shot demo prompts
│   ├── README.md                # Demo overview and comparison
│   ├── meme-coin-launchpad/     # Category A demo
│   │   ├── PROMPT.md            # Paste into your AI agent
│   │   └── README.md
│   └── defi-agent/              # Category B demo
│       ├── PROMPT.md
│       └── README.md
└── templates/
    ├── env.example              # Environment variable template
    └── mcp-configs/             # Platform-specific MCP configs
        ├── claude-code.json
        ├── cursor.json
        ├── vscode.json
        └── generic-stdio.json
```

## Tech Stack

- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** + **shadcn/ui** for production-quality UI
- **`@hiero-ledger/sdk`** (formerly `@hashgraph/sdk`) for direct Hedera SDK access
- **`hedera-agent-kit`** for multi-step operations, plugins, and MCP server
- **Third-party plugins:** SaucerSwap (DEX), Bonzo (lending), Memejob (meme tokens)
- **LangChain** (Category B only) for AI agent framework
- **Mirror Node REST API** for read-heavy dashboard queries
- **Web Speech API** (Category B only) for voice input

## Limitations & Scope

- Apps are **demo/prototype quality** — not production-ready without additional work (auth, database, error handling)
- **Testnet only** by default — mainnet requires explicit opt-in and costs real HBAR
- **No wallet connect / client-side signing** — uses server-side operator key for all transactions
- **MCP seeding is optional** but recommended for the best development experience
- One-shot generation may need **1-2 follow-up iterations** for polish
- Category B apps require an **LLM API key** (Groq offers a free tier for demos)

## Troubleshooting

**Build fails with missing env vars**
Next.js evaluates server modules during `next build`. If env vars contain placeholders, the SDK throws a parse error. Use the lazy-init Proxy pattern from [`references/network-config.md`](references/network-config.md) to defer client initialization to runtime.

**Turbopack lockfile warning**
If the project is nested under a parent directory with its own lockfile, add to `next.config.ts`:
```ts
import path from "path";
// inside config:
turbopack: { root: path.resolve(__dirname) }
```

**`toast` import errors**
The shadcn `toast` component is deprecated. Use `sonner` instead — simpler API: `toast("message")`. Install with `npx shadcn@latest add sonner --yes`.

**Wrong SDK package name**
Use `@hiero-ledger/sdk`, not `@hashgraph/sdk`. The package was renamed as part of the Hiero transition.

**"No LLM API key found" error (Category B only)**
Set exactly one of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GROQ_API_KEY` in `.env.local`. The app auto-detects which provider to use. For free/fast demos, use Groq.

**Agent not calling tools correctly (Category B)**
Make sure you installed the correct LangChain provider package (`@langchain/openai`, `@langchain/anthropic`, or `@langchain/groq`). Different LLMs have varying tool-calling quality — GPT-4o and Claude Sonnet are most reliable.
