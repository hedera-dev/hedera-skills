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
   HEDERA_OPERATOR_ID=0.0.XXXXX
   HEDERA_OPERATOR_KEY=302e020100300506...
   HEDERA_NETWORK=testnet
   ```
   See [`templates/env.example`](templates/env.example) for the full template.

4. **(Optional) Set up the MCP server** for live data seeding during development. Platform-specific configs are in [`templates/mcp-configs/`](templates/mcp-configs/):
   - `claude-code.json` — Claude Code (`.claude/mcp.json`)
   - `cursor.json` — Cursor (`.cursor/mcp.json`)
   - `vscode.json` — VS Code MCP extension
   - `generic-stdio.json` — Any MCP-compatible agent via stdio

5. **Open your AI agent and paste a demo prompt** from the [`demos/`](demos/) directory.

6. **The agent builds the app** — scaffolds the project, writes all code, and seeds it with real testnet data via MCP.

## What You Can Build

| Blueprint | Description | Hedera Services |
|-----------|-------------|-----------------|
| **Token Launchpad** | Create, mint, and transfer fungible tokens from a polished UI | HTS (default) or EVM variant |
| **Wallet Dashboard** | Read-only account portfolio viewer — balances, tokens, NFTs, transactions | Mirror Node REST API |
| **HCS Message Board** | Decentralized message board with real-time polling | Hedera Consensus Service |
| **NFT Gallery & Minter** | Create NFT collections, mint with metadata, browse in a gallery | HTS (NFTs) |

These are starting points. The skill can build any Hedera-powered frontend — custom apps are supported by combining patterns from the [references](references/).

## HTS vs EVM

The Token Launchpad supports two paths:

- **HTS (default)** — Native Hedera tokens using `TokenCreateTransaction` / `TokenMintTransaction`. No smart contracts needed. Cheaper, faster, and tokens are first-class Hedera entities with built-in compliance features.
- **EVM** — Solidity ERC-20 contracts deployed on Hedera's EVM layer via `CREATE_ERC20_TOOL`. Familiar to Ethereum developers. Total supply is fixed at deployment.

**When to use which:** Use HTS unless you specifically need EVM, Solidity, ERC-20, or smart contract-based tokens.

## How the MCP Server Works

The key differentiator of this skill: the AI agent doesn't just generate code — it uses MCP tools to interact with Hedera live during development.

**Flow:**
```
Agent builds app → Uses MCP to create test token on testnet
  → App renders real on-chain data (not mock data)
  → Agent verifies UI works with actual blockchain state
```

For example, after scaffolding a token launchpad, the agent calls `create_fungible_token_tool` via MCP to create a "DemoToken" on testnet, then the UI immediately displays it with real token ID, supply, and HashScan links.

See [`references/mcp-live-usage.md`](references/mcp-live-usage.md) for full setup details and usage patterns.

## Skill Contents

```
agent-kit-app-builder/
├── README.md                    ← You are here
├── SKILL.md                     # AI agent instructions (the brain)
├── references/                  # Supporting documentation
│   ├── app-blueprints.md        # 4 app architectures with full specs
│   ├── frontend-patterns.md     # React/Next.js + Hedera patterns
│   ├── agent-kit-sdk-reference.md  # hedera-agent-kit API reference
│   ├── network-config.md        # Environment & network setup
│   └── mcp-live-usage.md        # MCP server setup & usage patterns
├── demos/                       # One-shot demo prompts
│   ├── README.md                # Demo overview and comparison
│   ├── token-launchpad/
│   │   ├── PROMPT.md            # Paste into your AI agent
│   │   └── README.md
│   ├── wallet-dashboard/
│   │   ├── PROMPT.md
│   │   └── README.md
│   ├── hcs-message-board/
│   │   ├── PROMPT.md
│   │   └── README.md
│   └── nft-gallery/
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
- **`hedera-agent-kit`** for multi-step operations and MCP server
- **Mirror Node REST API** for read-heavy dashboard queries

## Limitations & Scope

- Apps are **demo/prototype quality** — not production-ready without additional work (auth, database, error handling)
- **Testnet only** by default — mainnet requires explicit opt-in and costs real HBAR
- **No wallet connect / client-side signing** — uses server-side operator key for all transactions
- **MCP seeding is optional** but recommended for the best development experience
- One-shot generation may need **1-2 follow-up iterations** for polish

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

**Token mint fails with `TOKEN_HAS_NO_SUPPLY_KEY`**
Supply key must be set at token creation time via `.setSupplyKey(key)`. You cannot add it after creation. Generate with `PrivateKey.generateECDSA()` and store the key for mint requests.

**Wrong SDK package name**
Use `@hiero-ledger/sdk`, not `@hashgraph/sdk`. The package was renamed as part of the Hiero transition.
