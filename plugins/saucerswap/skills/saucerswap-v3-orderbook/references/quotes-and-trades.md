# Orderbook API — Quotes and Trade Tape

Everything on this page is a public no-auth read. Quotes are served only for `OPEN` books (`400` “not found or not open” otherwise); the trade tape stays available for closed books.

## Quote endpoints

Price a hypothetical fill against the live book before committing to an order. Two directions:

### GET /books/:id/quote/exact-input

"I am selling exactly this much input — what do I get?"

Query params: `inputToken`, `inputAmount` (raw smallest units).

### GET /books/:id/quote/exact-output

"I want exactly this much output — what must I pay?"

Query params: `outputToken`, `outputAmount` (raw smallest units).

### Response

**Exact input** returns `{ outputToken, snappedInputAmount, consumedInputAmount, expectedOutputAmount, suggestedOutputAmount, slippageBps, fillable }`.
**Exact output** returns `{ inputToken, requestedOutputAmount, snappedOutputAmount, expectedInputAmount, suggestedInputAmount, slippageBps, fillable }`.

- **snapped** amounts — your requested amount snapped to the book's `tickStep`/`sizeStep`/`lotSize` grid; for exact-input, `snappedInputAmount` is the value to submit as `inputAmount`
- **expected** amounts — what the current book would actually fill at, with no slippage applied
- **suggested** amounts — the slippage-buffered counterparty amount, ready to submit to `POST /orders/build` (`suggestedOutputAmount` for exact-input; `suggestedInputAmount` for exact-output)
- `slippageBps` — the applied slippage buffer (a fixed server-side tolerance), not a market-impact prediction
- `fillable` — whether the book can currently fill the request

### Quote → order flow

The quote fields feed **straight into `POST /orders/build`** — no client-side rounding math needed:

```typescript
// 1. Quote (public, no JWT) — exact-input: you fix the spend side
const q = await fetch(
  `${base}/books/${bookId}/quote/exact-input?inputToken=${inputEvmAddr}&inputAmount=${raw}`,
).then(r => r.json())

if (!q.fillable) throw new Error('book cannot fill this size')

// 2. Build with the snapped input and suggested output (JWT)
const built = await client.buildOrders([{
  orderbookId: String(bookId),
  type: 'LIMIT',
  deadline: String(Math.floor(Date.now() / 1000) + 3600),
  inputToken: inputEvmAddr,
  inputAmount: q.snappedInputAmount,     // input floored to the size grid — submit THIS
  outputToken: q.outputToken,
  outputAmount: q.suggestedOutputAmount, // slippage-buffered minimum output
}])
// 3. sign + save as usual
// exact-output is symmetric: submit q.suggestedInputAmount as inputAmount and
// q.snappedOutputAmount as outputAmount
```

Surface `slippageBps` to the user before placing marketable orders.

## Trade tape

### GET /trades/:orderbookId

Recent trades for a book. Query params: `sort`, `page`, `limit`. Response envelope: `{ orderbookId, timestamp, trades: Trade[], total, page, limit }`.

```typescript
interface Trade {
  timestamp: number        // trade time
  price: string            // execution price
  amountBase: string       // human-readable base amount, already decimals-adjusted (NOT raw smallest units)
  direction: string        // taker side
  transactionHash: string  // on-chain settlement reference
}
```

Use the tape for last-price displays, VWAP/volume analytics, and fill verification against `transactionHash` on a Hedera mirror node.

## Related public reads

- `GET /books` — includes 24h stats fields alongside the market definition
- `GET /depth/:orderbookId` — snapshot with `lastUpdateId`
- `GET /signature/domain` — EIP-712 domain without auth
