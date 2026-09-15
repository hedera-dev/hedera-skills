# SaucerSwap Data API — Endpoint Reference

Base URLs: `https://api.saucerswap.finance` (mainnet), `https://test-api.saucerswap.finance` (testnet).
All endpoints require the `x-api-key` header. Schemas below are taken from the official OpenAPI specs embedded in the docs pages (Markdown twins at `docs.saucerswap.finance/v/developer/rest-api/...md`).

## GET /tokens

Compact data for all tokens.

```json
[
  {
    "id": "0.0.731861",
    "icon": "/images/tokens/sauce.svg",
    "symbol": "SAUCE",
    "decimals": 6,
    "price": "36806544",
    "priceUsd": 0.01760954,
    "dueDiligenceComplete": true,
    "isFeeOnTransferToken": false
  }
]
```

| Field                  | Type    | Notes                                              |
| ---------------------- | ------- | -------------------------------------------------- |
| `id`                   | string  | Token id (`shard.realm.num`)                       |
| `icon`                 | string  | Relative path to token icon                        |
| `symbol`               | string  | Token symbol                                       |
| `decimals`             | integer | Token decimal places — use for all unit conversion |
| `price`                | string  | Token price in tinybar (1 HBAR = 1e8 tinybar)      |
| `priceUsd`             | number  | Token price in USD (float)                         |
| `dueDiligenceComplete` | boolean | Passed the SaucerSwap due-diligence checklist      |
| `isFeeOnTransferToken` | boolean | Token charges a fee on transfer                    |

Related pages (append `.md` for the Markdown twin): `tokens/token` (single token by id), `tokens/tokens-full` (detailed), `tokens/tokens-known` (default listed), `tokens/token-price` (candlestick history), `tokens/tokens-price-change` (24h change map).

## GET /stats

General platform statistics.

| Field              | Type    | Notes                                            |
| ------------------ | ------- | ------------------------------------------------ |
| `circulatingSauce` | string  | Circulating SAUCE in smallest unit               |
| `swapTotal`        | integer | Total swaps across all pools since inception     |
| `tvl`              | string  | Total value locked, in tinybar                   |
| `tvlUsd`           | number  | Total value locked, in USD                       |
| `volumeTotal`      | string  | Total trading volume since inception, in tinybar |
| `volumeTotalUsd`   | number  | Total volume, in USD                             |

Related pages: `stats/hbar-price-history` (minutely HBAR price), `stats/platform-data-history`, `stats/sss` (single-sided staking).

## GET /pools

Compact data for all V1 (constant-product AMM) pools.

| Field            | Type    | Notes                                 |
| ---------------- | ------- | ------------------------------------- |
| `id`             | integer | SaucerSwap pool id                    |
| `contractId`     | string  | Pool contract id (`shard.realm.num`)  |
| `lpToken`        | object  | LP token info                         |
| `lpTokenReserve` | string  | LP token reserve, smallest unit       |
| `tokenA`         | object  | TokenCompact (see `/tokens` fields)   |
| `tokenReserveA`  | string  | Token A reserve, smallest unit        |
| `tokenB`         | object  | TokenCompact                          |
| `tokenReserveB`  | string  | Token B reserve, smallest unit        |

Related pages: `pools-v1/pool` (by id), `pools-v1/pools-full`, `pools-v1/pool-conversion-rates` (candles), daily/weekly/monthly/yearly series.

## GET /v2/pools

Compact data for all V2 (concentrated liquidity) pools.

| Field        | Type    | Notes                                |
| ------------ | ------- | ------------------------------------ |
| `id`         | integer | SaucerSwap V2 pool id                |
| `contractId` | string  | Pool contract id (`shard.realm.num`) |
| `tokenA`     | object  | TokenCompact                         |
| `tokenB`     | object  | TokenCompact                         |

Additional fields (fee tier, liquidity, sqrt price) are documented on the docs page: `pools-v2/pools.md` and `pools-v2/pools-full.md`. Related: `pools-v2/account-nft-positions` (positions by account), `pools-v2/lari-reward`.

## GET /farms

Active yield farms.

| Field            | Type    | Notes                                       |
| ---------------- | ------- | ------------------------------------------- |
| `id`             | integer | SaucerSwap farm id                          |
| `poolId`         | integer | Underlying pool id                          |
| `sauceEmissions` | number  | SAUCE emitted per second to the pool        |
| `hbarEmissions`  | number  | HBAR emitted per second to the pool         |
| `totalStaked`    | string  | Total LP staked, smallest unit              |

Related page: `farms/account` (LP amounts in farms by account id).

## Discovering everything else

Fetch `https://docs.saucerswap.finance/llms.txt` for the complete page index, then fetch any page's `.md` twin. Each REST endpoint page embeds its full OpenAPI schema. (The `openapi.yml` URL listed in llms.txt currently returns 404 — rely on the per-page embedded schemas.)
