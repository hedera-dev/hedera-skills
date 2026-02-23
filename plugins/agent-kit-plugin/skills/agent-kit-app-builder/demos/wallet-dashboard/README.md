# Wallet Dashboard Demo

## What It Builds

A read-only Wallet Dashboard where you can look up any Hedera account and view its full portfolio — HBAR balance, fungible token holdings, NFTs, and recent transactions.

## Hedera Services Used

- **Mirror Node REST API** — all data is fetched via Hedera's public mirror node (no private key needed for queries)

## Prerequisites

- Node.js 18+
- Hedera testnet account (free at [portal.hedera.com](https://portal.hedera.com))
- `HEDERA_OPERATOR_ID` environment variable set (for default account view)

## Expected Result

A Next.js app with:
- Search bar to look up any Hedera account by ID
- Account overview card (HBAR balance, account ID, key type)
- Sortable token portfolio table
- NFT gallery grid
- Transaction history timeline with HashScan links
- Network toggle (testnet/mainnet)
- Dark theme, responsive layout (shadcn/ui)

## How to Run

Copy the contents of `PROMPT.md` into your AI coding agent and let it build the app.
