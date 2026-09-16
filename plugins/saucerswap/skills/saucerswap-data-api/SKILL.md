---
name: saucerswap-data-api
description: "Read market data from SaucerSwap, the leading DEX on Hedera, using the SaucerSwap REST API (api.saucerswap.finance). Use this skill whenever the user wants token prices, token decimals, TVL, trading volume, pool data (V1 or V2), farm data, candlestick/OHLC history, or any SaucerSwap analytics in an app, bot, or script. Triggers include SaucerSwap prices, Hedera DEX data, SAUCE token stats, HBAR-denominated prices, liquidity pool reserves, or priceUsd lookups."
---

# SaucerSwap Data API

Read-only REST API for SaucerSwap market data: tokens, prices, pools (V1 AMM and V2 concentrated liquidity), farms, and platform statistics. This is the right surface for dashboards, analytics, price feeds, and any integration that reads DeFi state on Hedera without placing trades.

## Base URLs

| Hedera Network | Base URL                                 |
| -------------- | ---------------------------------------- |
| Mainnet        | `https://api.saucerswap.finance`         |
| Testnet        | `https://test-api.saucerswap.finance`    |
| Previewnet     | Not supported                            |

## Authentication

Every request needs an `x-api-key` header. Request a key by emailing [support@saucerswap.finance](mailto:support@saucerswap.finance). Keys are provisioned with a monthly request quota.

```bash
curl -H "x-api-key: $SAUCERSWAP_API_KEY" \
  https://api.saucerswap.finance/tokens
```

Store the key in an environment variable or secret manager. Never hardcode it in source or commit it to a repository.

### Quota headers

The API communicates a monthly quota through response headers. Read them programmatically to self-throttle:

| Header                         | Meaning                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `x-ratelimit-limit`            | Total requests allowed per month                                   |
| `x-ratelimit-remaining`        | Requests remaining this month                                      |
| `x-ratelimit-additional-total` | Overage requests counted beyond the provisioned limit              |
| `x-ratelimit-reset`            | Epoch milliseconds when usage resets (typically end of the month)  |

## Core Endpoints

| Endpoint        | Returns                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `GET /tokens`   | Compact data for all tokens: `id`, `symbol`, `decimals`, `price`, `priceUsd`, `dueDiligenceComplete`, `isFeeOnTransferToken`, `icon` |
| `GET /stats`    | Platform stats: `circulatingSauce`, `swapTotal`, `tvl`, `tvlUsd`, `volumeTotal`, `volumeTotalUsd` |
| `GET /pools`    | Compact data for all V1 pools: `id`, `contractId`, `lpToken`, `lpTokenReserve`, `tokenA`/`tokenB` with reserves |
| `GET /v2/pools` | Compact data for all V2 (concentrated liquidity) pools: `id`, `contractId`, `tokenA`/`tokenB` |
| `GET /farms`    | Active farms: `id`, `poolId`, `sauceEmissions`, `hbarEmissions`, `totalStaked` |

Many more endpoints exist (per-token candles, daily/weekly/monthly series, positions by account, single-sided staking stats). Discover them all through the docs index — see "Full documentation" below.

## Critical: Units and Types

- **`decimals` from `/tokens` is the source of truth** for converting raw amounts. All token amounts and reserves are strings in the token's smallest unit.
- **`price` is a string denominated in tinybar** (1 HBAR = 100,000,000 tinybar). **`priceUsd` is a float in USD.** Do not confuse the two.
- Platform `tvl` and `volumeTotal` are tinybar strings; `tvlUsd` and `volumeTotalUsd` are USD floats.
- Keep large integer strings as strings (or `BigInt`). Do not parse reserves into JavaScript numbers.

```typescript
const res = await fetch('https://api.saucerswap.finance/tokens', {
  headers: { 'x-api-key': process.env.SAUCERSWAP_API_KEY! },
})
const tokens = await res.json()
const sauce = tokens.find((t: any) => t.id === '0.0.731861') // SAUCE
// human amount = rawAmount / 10 ** sauce.decimals
// USD price     = sauce.priceUsd
```

## Full Documentation (agent-friendly)

The SaucerSwap docs publish an LLM-readable index and Markdown twins of every page:

- Index of all pages: `https://docs.saucerswap.finance/llms.txt`
- Any docs page has a Markdown twin — append `.md` to its URL, e.g. `https://docs.saucerswap.finance/v/developer/rest-api/tokens/tokens.md`

Fetch `llms.txt` first to discover endpoint pages; each page embeds the OpenAPI schema for that endpoint, including full response shapes.

## Safety Conventions

- This API is read-only; there is nothing here that moves funds.
- Treat the API key as a secret: environment variable or secret store only.
- Respect the monthly quota; cache responses where freshness allows.

## Additional References

- `references/endpoints.md` — verified response schemas for the core endpoints
