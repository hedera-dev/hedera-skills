# Meme Coin Launchpad Demo

**Category A — "Built with Agent Kit"** (no LLM needed)

## What It Builds

A one-click meme token launchpad that chains 3 Agent Kit plugin groups (Memejob, core consensus, core account query) in a visible 6-step pipeline. Users fill a config form and click "Launch" to create a bonding curve token, buy an initial position, set up a community topic, post the launch announcement, and verify tokens arrived in their wallet — all in one automated sequence.

The key showcase is the **pipeline visualizer** showing each tool executing in real-time with status, parameters, and results.

## Why It Needs the Agent Kit

- **Memejob plugin** is the only way to create bonding curve tokens on Hedera
- Combining Memejob with HCS topic creation and cross-plugin verification in one pipeline is multi-plugin orchestration that raw SDK can't do

## Hedera Services Used

- **HTS** — Meme token creation via Memejob (bonding curve) + token buying
- **HCS** — Community topic creation and launch announcement
- **Account Query** — Verify tokens arrived in creator's wallet

## Prerequisites

- Node.js 18+
- Hedera testnet account (free at [portal.hedera.com](https://portal.hedera.com))
- **No LLM API key needed** — this is a regular app, not an AI agent

## Environment Variables

```env
HEDERA_OPERATOR_ID=0.0.XXXXX
HEDERA_OPERATOR_KEY=302e...
HEDERA_NETWORK=testnet
```

## Expected Result

A Next.js app with:
- Config form (token name, symbol, description, image, buy amount)
- Pipeline visualizer showing 6 steps executing with tool names and HashScan links
- Launch card summary after completion with all created resources
- Dark theme, production-quality UI (shadcn/ui)

## How to Run

Copy the contents of `PROMPT.md` into your AI coding agent and let it build the app.
