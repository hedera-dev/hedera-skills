---
name: agent-kit-app-builder
description: Build Hedera-powered frontend applications using the Hedera Agent Kit and its MCP server. Use this skill whenever the user wants to build a web app, dashboard, or UI that interacts with Hedera — creating tokens, transferring HBAR, posting HCS messages, displaying NFTs, querying accounts, swapping on SaucerSwap, lending on Bonzo, launching meme coins, or building AI-powered DeFi agents. This skill combines frontend code generation with live MCP-based blockchain interaction during development, so apps start with real on-chain data. Also use when the user asks "what can I build on Hedera", wants to explore Hedera capabilities, or needs to query/transact on Hedera from their development environment. Trigger on mentions of: Hedera app, HBAR dashboard, HTS, HCS, Hedera tokens, token launchpad, meme coin, DeFi agent, wallet dashboard, NFT gallery, Hedera frontend, hedera-agent-kit, SaucerSwap, Bonzo, Memejob, pipeline visualizer, or any request to build blockchain/web3 apps on Hedera.
version: 2.0.0
---

# Build Hedera Apps with the Agent Kit

This skill enables you to build polished frontend applications with native Hedera blockchain support using the `hedera-agent-kit` npm package and `@hiero-ledger/sdk`. It also enables live interaction with the Hedera network during development via the Hedera Agent Kit MCP server — query accounts, create test tokens, seed data, and validate that your generated UI works with real on-chain data.

## Two Ways to Build

Apps built with this skill fall into two categories:

| | Category A: "Built with Agent Kit" | Category B: "Powered by Agent Kit" |
|---|---|---|
| **Pattern** | Multi-plugin orchestration — fixed pipeline | Runtime AI agent — LLM chooses tools dynamically |
| **LLM at runtime?** | No | Yes (OpenAI, Anthropic, or Groq) |
| **Pipeline** | Predefined steps execute in sequence | Agent reasons and chains tools autonomously |
| **Why Agent Kit?** | Plugins provide capabilities impossible with raw SDK | Agent Kit IS the runtime — LLM + tools |
| **Env vars** | Hedera credentials only | Hedera credentials + LLM API key |

Both categories feature a **pipeline visualizer** showing each agent kit tool call executing in real-time.

## Pre-Flight Checklist

Before building, verify:

1. **Environment variables set?** — `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` are required. For Category B apps, also set one LLM key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GROQ_API_KEY`). See `templates/env.example` for the full template.
2. **MCP server configured?** — Check `templates/mcp-configs/` for platform-specific config (Claude Code, Cursor, VS Code, or generic stdio).
3. **Network selected?** — Defaults to **testnet** (free). Only switch to mainnet if the user explicitly requests it.

## Decision Tree

Route to the right reference based on what the user needs:

### "I want to BUILD a frontend app"

1. **Determine the category:**
   - User wants a **regular app** with multi-plugin orchestration (no LLM) → **Category A**
   - User wants an **AI-powered app** with natural language interaction → **Category B**
   - User mentions: voice, chat, agent, AI, natural language → **Category B**
   - User mentions: pipeline, launchpad, one-click, automated workflow → **Category A**
   - Unclear → Ask: "Do you want an app with a fixed workflow (Category A) or an AI agent that responds to natural language (Category B)?"

2. Read `references/app-blueprints.md` — pick the matching blueprint:
   - **Meme Coin Launchpad** (Category A) — multi-plugin pipeline, no LLM
   - **Hedera DeFi Agent** (Category B) — LangChain agent with all tools

3. Read `references/frontend-patterns.md` — implementation patterns:
   - Patterns 1-3: Direct SDK, Agent Kit toolkit, Mirror Node (both categories)
   - **Pattern 4: Pipeline SSE** — Shared pipeline engine (both categories)
   - **Pattern 5: LangChain Agent** — Agent initialization and streaming (Category B only)
   - **Voice Input Pattern** — Web Speech API (Category B only)

4. Read `references/agent-kit-sdk-reference.md` — API details:
   - Core plugin tools (both categories)
   - Third-party plugin tools: SaucerSwap, Bonzo, Memejob (both categories)
   - LangChain agent integration (Category B only)

### "I want to QUERY or TRANSACT on Hedera during development"

1. Read `references/mcp-live-usage.md` — MCP server setup and development-time usage patterns

### "What CAN I build on Hedera?"

1. Read `references/app-blueprints.md` — browse available blueprints and the two categories
2. Use MCP tools to inspect the user's account state and suggest relevant apps

### "I need NETWORK or ENV configuration help"

1. Read `references/network-config.md` — environment variables, testnet setup, network URLs, LLM provider configuration

## Network Safety

- **Always default to Hedera testnet.** Only switch to mainnet if the user explicitly requests it.
- When switching to mainnet, warn: "You are now on Hedera mainnet. Transactions will use real HBAR."
- For mainnet write operations, require explicit user confirmation before executing.

## Ready-to-Use Demos

The `demos/` directory contains complete prompts for two demo apps. Copy a `PROMPT.md` into your AI coding agent to build each app in one shot:

| Demo | Category | What it builds | Hedera services | LLM key? |
|------|----------|---------------|-----------------|----------|
| `demos/meme-coin-launchpad/` | A | One-click meme token launch with bonding curve, community topic, DEX liquidity | HTS (Memejob), HCS, DeFi (SaucerSwap) | No |
| `demos/defi-agent/` | B | Voice/text DeFi assistant — AI agent across all Hedera services | ALL (HTS, HCS, HSCS, Mirror Node, SaucerSwap, Bonzo, Memejob) | Yes |

## Integration Patterns Summary

Five ways to connect your frontend to Hedera (details in `references/frontend-patterns.md`):

1. **Direct SDK** — `@hiero-ledger/sdk` for simple queries and transactions
2. **Agent Kit** — `hedera-agent-kit` toolkit with plugins for complex multi-step operations
3. **Mirror Node REST API** — HTTP queries for read-heavy dashboard UIs (no private key needed)
4. **Pipeline Execution with SSE** — Server-side pipeline engine that chains toolkit tool calls sequentially, streaming progress to the client. Shared by both Category A and B demos.
5. **LangChain Agent Integration** — LangChain agent with hedera-agent-kit tools for natural language interaction. Category B only.

## Key Principle

Use the MCP server during development to seed real on-chain data into your app. Build the UI, then immediately create test tokens, topics, or NFTs so the interface renders with real data — not placeholder content.
