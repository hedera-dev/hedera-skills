# SaucerSwap

DeFi integration skills for [SaucerSwap](https://www.saucerswap.finance), the leading decentralized exchange on Hedera. Covers the three integration surfaces an agent needs: read-only market data, AMM swaps, and orderbook (CLOB) trading.

## Installation

### Claude Code

```bash
# Step 1: Add the Hedera marketplace (skip if already added)
/plugin marketplace add hedera-dev/hedera-skills

# Step 2: Install the plugin
/plugin install saucerswap
```

### Other Agents (npx skills)

```bash
npx skills add hedera-dev/hedera-skills
```

## Skills included

| Skill | Surface | What it covers |
|-------|---------|----------------|
| **saucerswap-data-api** | `api.saucerswap.finance` (REST, `x-api-key`) | Token prices and decimals, platform stats, V1/V2 pools, farms, monthly quota headers, agent-friendly docs discovery via `llms.txt` |
| **saucerswap-v2-swaps** | On-chain (QuoterV2 + SwapRouter) | Gas-free quotes via `eth_call` (`quoteExactInput`/`quoteExactOutput`, path encoding), swap execution via the official Hedera Agent Kit `saucer-swap-plugin` or direct router calls |
| **saucerswap-v3-orderbook** | `orderbook-api.saucerswap.finance` | Books, depth, trades, and fill quotes; wallet-challenge JWT auth; build → EIP-712 sign → save order flow; cancellations; depth and user-event WebSockets |

## Use when

- Fetching SaucerSwap prices, TVL, pool, or farm data on Hedera
- Quoting or executing token swaps on the SaucerSwap V2 AMM
- Building trading bots, market makers, or dashboards on the SaucerSwap V3 orderbook
- Wiring SaucerSwap into a Hedera Agent Kit agent

## Safety model

These skills are **read-only by default**. Swap execution and order placement happen only with explicit user opt-in, on testnet first (`test-api.saucerswap.finance`, testnet contracts, `testnet-orderbook-api.saucerswap.finance`). Private keys are never pasted into agent-readable config: orders are EIP-712-signed client-side and Agent Kit integrations prefer `RETURN_BYTES` mode, so keys never leave the user's machine.

## Documentation

SaucerSwap docs are agent-friendly: fetch `https://docs.saucerswap.finance/llms.txt` for the full index, and append `.md` to any docs page URL for its Markdown twin.

- Data API key requests: [support@saucerswap.finance](mailto:support@saucerswap.finance)
- Contract deployments: `https://docs.saucerswap.finance/developerx/contract-deployments.md`
- Orderbook API guide: `https://docs.saucerswap.finance/v/developer/saucerswap-v3/orderbook-api.md`
