# Hedera DeFi Agent Demo

**Category B — "Powered by Agent Kit"** (LLM required)

## What It Builds

A voice and text-enabled DeFi assistant that embeds a LangChain AI agent with ALL hedera-agent-kit tools. Tell it what to do in natural language and watch it reason, select tools, and execute across all Hedera services in real-time.

The key showcase is the **agentic pipeline visualizer** — unlike the fixed pipeline in Category A, the agent dynamically decides which tools to call and can chain multiple operations autonomously.

## Why It Needs the Agent Kit

This IS the agent kit. The app initializes a LangChain agent with hedera-agent-kit tools, feeds it natural language, and the LLM reasons about which tools to call. Multi-step operations like "borrow USDC on Bonzo and swap it for SAUCE" are handled autonomously by chaining tool calls.

## Hedera Services Used

- **HTS** — Token creation, minting, transfers, airdrops
- **HCS** — Topic creation, message posting
- **HSCS** — EVM contract deployment and interaction
- **Mirror Node** — Account info, token balances, transactions
- **DeFi** — SaucerSwap (swaps, liquidity), Bonzo (lending/borrowing), Memejob (meme tokens)

## Prerequisites

- Node.js 18+
- Hedera testnet account (free at [portal.hedera.com](https://portal.hedera.com))
- **LLM API key required** — one of: OpenAI, Anthropic, or Groq

## Environment Variables

```env
HEDERA_OPERATOR_ID=0.0.XXXXX
HEDERA_OPERATOR_KEY=302e...
HEDERA_NETWORK=testnet

# Pick ONE LLM provider:
OPENAI_API_KEY=sk-...          # or
ANTHROPIC_API_KEY=sk-ant-...   # or
GROQ_API_KEY=gsk_...           # Free tier available — great for demos
```

## Expected Result

A Next.js app with:
- Text and voice input (Web Speech API)
- Chat interface with agent responses
- Dynamic pipeline visualizer showing agent reasoning and tool calls
- Account dashboard (balance, tokens, recent transactions) with auto-refresh
- Suggested action chips for quick interactions
- Dark theme, production-quality UI (shadcn/ui)

## How to Run

Copy the contents of `PROMPT.md` into your AI coding agent and let it build the app.
