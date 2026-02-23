---
name: agent-kit-app-builder
description: Build Hedera-powered frontend applications using the Hedera Agent Kit and its MCP server. Use this skill whenever the user wants to build a web app, dashboard, or UI that interacts with Hedera — creating tokens, transferring HBAR, posting HCS messages, displaying NFTs, querying accounts, or any frontend with blockchain features. This skill combines frontend code generation with live MCP-based blockchain interaction during development, so apps start with real on-chain data. Also use when the user asks "what can I build on Hedera", wants to explore Hedera capabilities, or needs to query/transact on Hedera from their development environment. Trigger on mentions of: Hedera app, HBAR dashboard, HTS, HCS, Hedera tokens, token launchpad, wallet dashboard, NFT gallery, Hedera frontend, hedera-agent-kit, or any request to build blockchain/web3 apps on Hedera.
version: 1.0.0
---

# Build Hedera Apps with the Agent Kit

This skill enables you to build polished frontend applications with native Hedera blockchain support using the `hedera-agent-kit` npm package and `@hiero-ledger/sdk`. It also enables live interaction with the Hedera network during development via the Hedera Agent Kit MCP server — query accounts, create test tokens, seed data, and validate that your generated UI works with real on-chain data.

## Pre-Flight Checklist

Before building, verify:

1. **Environment variables set?** — `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` are required. See `templates/env.example` for the full template.
2. **MCP server configured?** — Check `templates/mcp-configs/` for platform-specific config (Claude Code, Cursor, VS Code, or generic stdio).
3. **Network selected?** — Defaults to **testnet** (free). Only switch to mainnet if the user explicitly requests it.

## Decision Tree

Route to the right reference based on what the user needs:

### "I want to BUILD a frontend app"

1. Read `references/app-blueprints.md` — pick a blueprint matching the user's request (token launchpad, wallet dashboard, HCS message board, NFT gallery) or adapt one
2. Read `references/frontend-patterns.md` — implementation patterns for React/Next.js + Hedera
3. Read `references/agent-kit-sdk-reference.md` — API details for `hedera-agent-kit`

### "I want to QUERY or TRANSACT on Hedera during development"

1. Read `references/mcp-live-usage.md` — MCP server setup and development-time usage patterns

### "What CAN I build on Hedera?"

1. Read `references/app-blueprints.md` — browse available blueprints and capabilities
2. Use MCP tools to inspect the user's account state and suggest relevant apps

### "I need NETWORK or ENV configuration help"

1. Read `references/network-config.md` — environment variables, testnet setup, network URLs

## Network Safety

- **Always default to Hedera testnet.** Only switch to mainnet if the user explicitly requests it.
- When switching to mainnet, warn: "You are now on Hedera mainnet. Transactions will use real HBAR."
- For mainnet write operations, require explicit user confirmation before executing.

## Ready-to-Use Demos

The `demos/` directory contains complete prompts for four demo apps. Copy a `PROMPT.md` into your AI coding agent to build each app in one shot:

| Demo | What it builds | Hedera services |
|------|---------------|-----------------|
| `demos/token-launchpad/` | Token creation, minting, transfer UI | HTS |
| `demos/wallet-dashboard/` | Account portfolio viewer | Mirror Node API |
| `demos/hcs-message-board/` | Decentralized message board | HCS |
| `demos/nft-gallery/` | NFT collection creator and gallery | HTS (NFTs) |

## Integration Patterns Summary

Three ways to connect your frontend to Hedera (details in `references/frontend-patterns.md`):

1. **Direct SDK** — `@hiero-ledger/sdk` for simple queries and transactions
2. **Agent Kit** — `hedera-agent-kit` toolkit with plugins for complex multi-step operations
3. **Mirror Node REST API** — HTTP queries for read-heavy dashboard UIs (no private key needed)

## Key Principle

Use the MCP server during development to seed real on-chain data into your app. Build the UI, then immediately create test tokens, topics, or NFTs so the interface renders with real data — not placeholder content.
