# Hedera DeFi Agent Demo

**Category B — "Powered by Agent Kit"** (LLM required)

## What It Builds

A voice and text-enabled DeFi assistant that embeds a LangGraph AI agent with hedera-agent-kit tools. Tell it what to do in natural language and watch it reason, select tools, and execute Hedera operations in real-time.

The key showcase is the **agentic pipeline visualizer** — unlike the fixed pipeline in Category A, the agent dynamically decides which tools to call and can chain multiple operations autonomously.

## Why It Needs the Agent Kit

This IS the agent kit. The app creates a LangGraph agent using `createReactAgent` from `@langchain/langgraph/prebuilt` with hedera-agent-kit tools, feeds it natural language, and the LLM reasons about which tools to call. Multi-step operations like "create a token and then check my balance" are handled autonomously by chaining tool calls.

## Hedera Services Used

- **HTS** — Token creation, minting, transfers, airdrops, meme coins (Memejob)
- **HCS** — Topic creation, message posting
- **Account** — Balance queries, token balances
- **Mirror Node** — Account info, transaction history

> **Testnet note:** SaucerSwap and Bonzo plugins are mainnet-only. The testnet demo uses core plugins + Memejob. See the [SDK reference](../../references/agent-kit-sdk-reference.md) for plugin testnet compatibility.

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
OPENAI_API_KEY=sk-...          # Most reliable tool calling
ANTHROPIC_API_KEY=sk-ant-...   # Strong reasoning
GROQ_API_KEY=gsk_...           # Free tier available — BUT has 12k TPM limit (load fewer plugins)
```

### Groq Free Tier Limitation

Loading all hedera-agent-kit plugins generates ~38 tools (~34k tokens of schema definitions). Groq's free tier has a 12k TPM limit. To use Groq free tier:
- Load only needed plugins (e.g., `coreAccountQueryPlugin` + `coreTokenQueryPlugin` + `coreConsensusPlugin` = 9 tools)
- Or upgrade to Groq Dev Tier for higher limits
- OpenAI and Anthropic paid tiers handle the full tool set without issues

## Expected Result

A Next.js app with:
- Text and voice input (Web Speech API)
- Chat interface with agent responses
- Dynamic pipeline visualizer showing tool calls with parameters and results
- Account dashboard (balance, tokens, recent transactions) with auto-refresh
- Suggested action chips for quick interactions
- Dark theme, production-quality UI (shadcn/ui)

## How to Run

Copy the contents of `PROMPT.md` into your AI coding agent and let it build the app.
