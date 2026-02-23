# Token Launchpad Demo

## What It Builds

A polished Token Launchpad UI where you can create Hedera fungible tokens with custom parameters (name, symbol, supply, decimals), mint additional supply, and transfer tokens to other accounts.

## Hedera Services Used

- **HTS (Hedera Token Service)** — fungible token creation, minting, transfers
- **Account queries** — HBAR and token balance lookups

## Prerequisites

- Node.js 18+
- Hedera testnet account (free at [portal.hedera.com](https://portal.hedera.com))
- `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` environment variables set

## Expected Result

A Next.js app with:
- Token creation form (name, symbol, initial supply, decimals)
- Card grid displaying all created tokens
- Mint and transfer dialogs
- HBAR balance sidebar
- Transaction history with clickable HashScan links
- Dark theme, production-quality UI (shadcn/ui)

## How to Run

Copy the contents of `PROMPT.md` into your AI coding agent and let it build the app.
