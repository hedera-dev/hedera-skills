# Orderbook API — REST Endpoint Reference

Base URLs: `https://orderbook-api.saucerswap.finance` (mainnet), `https://testnet-orderbook-api.saucerswap.finance` (testnet).
Public market data — `/books`, `/depth/:id`, `/trades/:id`, the quote endpoints, and `/signature/domain` — needs no authentication. Protected endpoints take `Authorization: Bearer <jwt>`.

## Markets

### GET /books — list orderbooks (public)

Response envelope: `{ orderbooks: OrderbookItem[], total, page, limit }` — supports `page` and `limit` query params.

```typescript
interface OrderbookItem {
  id: string                     // string-encoded integer, e.g. "5"
  baseTokenId: string            // Hedera id, e.g. "0.0.731861"
  quoteTokenId: string
  baseTokenEvmAddress: string    // use for order inputToken/outputToken
  quoteTokenEvmAddress: string
  status: string                 // 'OPEN' | 'CLOSED'
  isAMMEnabled: number           // 1 | 0 — AMM liquidity can be routed into this book
  isMarketHalted: number         // 1 | 0
  baseTokenSymbol: string | null
  quoteTokenSymbol: string | null
  baseTokenDecimals: number | null   // e.g. 8 for WBTC
  quoteTokenDecimals: number | null  // e.g. 6 for USDC
  quotePrice: string             // last price, quote per base
  quotePrice24hPct: string | null
  quotePrice24hHigh: string
  quotePrice24hLow: string
  baseVol24h: string             // 24h base volume, decimals-adjusted
  quoteVol24h: string
  tickStep: string               // price increment
  sizeStep: string               // size increment
  lotSize: string
  minNotional: string
  takerFeePips: number           // pips (1e-6)
  makerFeePips: number
  createdAt: string              // ISO timestamp
  updatedAt: string
}
```

### GET /depth/:orderbookId — depth snapshot (public)

Full bid/ask snapshot: `{ orderbookId, timestamp, baseTokenId, quoteTokenId, bestBidQuote, bestAskQuote, spreadPercent, asks, bids, lastUpdateId }`. `asks`/`bids` are `[price, size]` string pairs, decimals-adjusted. Use `lastUpdateId` for sequencing against `/ws/depth` diffs. Served only for `OPEN` books (`404` otherwise).

### GET /trades/:orderbookId — trade tape (public)

Query params: `sort`, `page`, `limit`. An invalid `sort` or a negative `page`/`limit` returns `400`; zero and non-numeric values fall back to the defaults. Response envelope: `{ orderbookId, timestamp, trades: Trade[], total, page, limit }`. The tape stays available for closed books.

```typescript
interface Trade {
  timestamp: number      // epoch milliseconds
  price: string
  amountBase: string     // decimals-adjusted, NOT raw smallest units
  direction: string      // taker side: 'buy' | 'sell'
  transactionHash: string
}
```

### GET /fees/:orderbookId?side=maker|taker — fee rates (JWT)

Returns fee rates in **PIPS (parts per million, 1e-6), not basis points**. `fee / 10_000` = percent.

### GET /onboarding/:orderbookId/status — account trading eligibility (JWT)

Check whether the authenticated account can trade a market before building orders.

## Quotes (public)

See `quotes-and-trades.md` for full request/response detail. Quotes are served only for `OPEN` books (`400` otherwise).

- `GET /books/:id/quote/exact-input?inputToken=&inputAmount=`
- `GET /books/:id/quote/exact-output?outputToken=&outputAmount=`

## Orders

### GET /signature/domain (public)

EIP-712 domain for the active environment: `{ name, version, chainId, verifyingContract }`. `verifyingContract` is the on-chain reactor. Fetch once per session and cache.

### POST /orders/build (JWT)

Request body: an array of order requests. The server assigns nonces and returns serialized order structs to sign. **Sign the returned struct, not the request.**

| Field          | Type                | Required   | Description                                             |
| -------------- | ------------------- | ---------- | ------------------------------------------------------- |
| `orderbookId`  | `string`            | Yes        | Market id                                               |
| `type`         | `LIMIT` or `MARKET` | Yes        | Order type                                              |
| `deadline`     | `string`            | LIMIT only | Unix seconds. Omit for market orders.                   |
| `inputToken`   | `string`            | Yes        | EVM address of the token being sold                     |
| `inputAmount`  | `string`            | Yes        | Raw amount, smallest units                              |
| `outputToken`  | `string`            | Yes        | EVM address of the token being bought                   |
| `outputAmount` | `string`            | Yes        | Minimum raw output. For an exact-input market order use the quote's `suggestedOutputAmount`; for exact output use `snappedOutputAmount`. Never `"1"`: that removes price protection. |
| `recipient`    | `string`            | No         | Output recipient EVM address                            |
| `makerOnly`    | `boolean`           | No         | Restrict order to maker fills                           |
| `takerOnce`    | `boolean`           | No         | Allow only one taker fill                               |
| `isAMMEnabled` | `boolean`           | No         | Permit AMM-backed settlement                            |

If a requested deadline exceeds the maximum, the server may clamp it — always sign the deadline in the built response.

### POST /orders/save (JWT)

```json
{
  "items": [
    { "order": {}, "signature": "0x...", "orderbookId": "3", "type": "LIMIT" }
  ],
  "ocoLinks": [{ "a": 0, "b": 1 }]
}
```

Response: `orders` array with `meta.status` populated (and an `oco` block if links were supplied). OCO pairs must share `orderbookId` and swapper; only LIMIT orders may be OCO-linked. OCO links are server-side transport metadata — not part of the EIP-712 digest, not submitted to the reactor.

API consumers are governed by the API terms of service; there is no in-app legal-acceptance call to make before `POST /orders/save` (that acceptance gate applies only to the web app).

### GET /orders (JWT)

List the authenticated account's orders.

### GET /orders/:orderId/history (JWT)

Per-order event history. Use to confirm terminal states (fills, `ORDER_CANCELED`) and to reconcile after WebSocket reconnects.

## Cancellation (JWT, asynchronous)

| Endpoint           | Description                                        |
| ------------------ | -------------------------------------------------- |
| `POST /cancel`     | Cancel specific order ids — up to 500 per request  |
| `POST /cancel/all` | Emergency cancel by nonce floor                    |

A `202 Accepted` means the request was accepted, **not** that the order is cancelled. Confirm via `/ws/user-events` or order history. The on-chain reactor is the source of truth; advanced clients can also cancel on-chain directly and rely on indexer reconciliation.

## Policy limits

| Constraint                        | Value               |
| --------------------------------- | ------------------- |
| Max open orders per wallet        | 5,000               |
| Min order deadline                | 30 seconds from now |
| Max order deadline                | 90 days from now    |
| Max orders per build/save request | 250                 |
| Max order ids per cancel request  | 500                 |

## Errors

```json
{ "error": "message string" }
```

| Status | Meaning                                   |
| ------ | ----------------------------------------- |
| `400`  | Invalid request                           |
| `401`  | Missing or expired JWT — re-authenticate  |
| `403`  | Account not allowed to perform the action |
| `404`  | Resource not found                        |
| `429`  | Rate limited — back off                   |
| `500`  | Server error                              |

## Production checklist (from the official guide)

Before sustained mainnet flow, your client must:

- re-authenticate after `401`s and before WS reconnects
- reconnect WebSockets with backoff
- rebuild local books from snapshot + buffered diffs
- treat cancellation `202`s as acknowledgements, not final states
- keep all `uint256` values as strings through signing and saving
- convert amounts with the book's token decimals
- store JWTs and private keys only in server-side secret storage
- monitor open order count, deadlines, and rate-limit responses
- reconcile user events with `GET /orders/:orderId/history` after reconnects
