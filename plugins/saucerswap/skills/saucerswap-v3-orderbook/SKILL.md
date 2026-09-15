---
name: saucerswap-v3-orderbook
description: "Trade on the SaucerSwap V3 orderbook (CLOB) on Hedera via the Orderbook API (orderbook-api.saucerswap.finance). Use this skill whenever the user wants to build a trading bot, market maker, or dashboard against the SaucerSwap V3 orderbook: reading books, depth snapshots, trade tape, or quotes; wallet-challenge JWT authentication; building, EIP-712-signing, and saving limit or market orders; cancelling orders; or subscribing to depth and user-event WebSockets. Triggers include SaucerSwap orderbook, Hedera CLOB, limit orders on Hedera, orderbook API, EIP-712 order signing on Hedera, or market-making on SaucerSwap."
---

# SaucerSwap V3 Orderbook API

SaucerSwap V3 is a central limit orderbook (CLOB) on Hedera with optional AMM-backed settlement. The Orderbook API serves programmatic trading clients, market makers, wallets, and dashboards: market data, order placement, cancellation, and live streams. Orders are signed **client-side with EIP-712** — private keys never leave the user's machine (the same philosophy as Hedera Agent Kit's `RETURN_BYTES` mode).

This API is separate from the SaucerSwap Data API (`api.saucerswap.finance`, `x-api-key`). The Orderbook API uses wallet-challenge authentication and short-lived JWTs for trading.

## Environments

| Environment | API base URL                                       | Mirror node                              |
| ----------- | -------------------------------------------------- | ---------------------------------------- |
| Testnet     | `https://testnet-orderbook-api.saucerswap.finance` | `https://testnet.mirrornode.hedera.com`  |
| Mainnet     | `https://orderbook-api.saucerswap.finance`         | `https://mainnet.mirrornode.hedera.com`  |

WebSockets use the same host with `wss://`. **Always build and validate on testnet first.**

## Surface at a Glance

| Category     | Endpoint                                        | Auth   |
| ------------ | ----------------------------------------------- | ------ |
| Markets      | `GET /books`                                    | none   |
| Market data  | `GET /depth/:orderbookId`                       | none   |
| Trade tape   | `GET /trades/:orderbookId`                      | none   |
| Quotes       | `GET /books/:id/quote/exact-input`              | none   |
| Quotes       | `GET /books/:id/quote/exact-output`             | none   |
| Signing      | `GET /signature/domain`                         | none   |
| Auth         | `POST /auth/challenge`, `POST /auth/verify`     | none   |
| Fees         | `GET /fees/:orderbookId?side=`                  | JWT    |
| Onboarding   | `GET /onboarding/:orderbookId/status`           | JWT    |
| Orders       | `GET /orders`, `GET /orders/:orderId/history`   | JWT    |
| Placement    | `POST /orders/build`, `POST /orders/save`       | JWT    |
| Cancellation | `POST /cancel`, `POST /cancel/all`              | JWT    |
| WebSocket    | `/ws/depth`, `/ws/user-events`                  | JWT (`?token=`) |

## Read Market Data

- `GET /books` lists orderbooks (paginated: `{ orderbooks, total, page, limit }`). Key fields per book: `id` (string-encoded integer), `baseTokenId`/`quoteTokenId` (Hedera ids), `baseTokenEvmAddress`/`quoteTokenEvmAddress`, `status` (`OPEN`/`CLOSED`), `isAMMEnabled`, `isMarketHalted`, `baseTokenDecimals`/`quoteTokenDecimals`, the trading increments `tickStep`, `sizeStep`, `lotSize`, `minNotional` (strings), 24h stats (`quotePrice`, `quotePrice24hPct`, `quotePrice24hHigh`/`Low`, `baseVol24h`, `quoteVol24h`), and fee rates in pips (`makerFeePips`, `takerFeePips`). Use the EVM addresses when building orders and the decimals for all unit conversion.
- `GET /depth/:orderbookId` returns a full depth snapshot with a `lastUpdateId` for sequencing against the `/ws/depth` diff stream. Depth and quotes are served only for `OPEN` books; the trade tape stays available for closed books.
- `GET /trades/:orderbookId` returns the trade tape (supports `sort`, `page`, `limit`); each trade has `timestamp`, `price`, `amountBase`, `direction`, `transactionHash`.
- `GET /books/:id/quote/exact-input` and `.../quote/exact-output` price a hypothetical fill against the live book and return snapped/expected/suggested amounts, `slippageBps`, and `fillable`. The `suggested*` amounts feed straight into `POST /orders/build`.

Details and shapes: `references/quotes-and-trades.md`, `references/endpoints.md`.

## Authenticate (for trading)

1. `POST /auth/challenge` with `{ "accountId": "0.0.123456" }` → `{ "message": "..." }`
2. Sign the message client-side:
   - `0.0.x` Hedera accounts (ED25519 or ECDSA): sign with the Hedera signed-message prefix — `'\x19Hedera Signed Message:\n' + message.length + message`
   - `0x...` EVM accounts (ECDSA only): standard `personal_sign` (EIP-191)
3. `POST /auth/verify` with `{ "accountId", "signature" }` → `{ "token": "<jwt>" }`

JWTs are short-lived: re-authenticate on any `401` and before each WebSocket reconnect. Full flow and key-type matrix: `references/auth-and-signing.md`.

## Place Orders (build → sign → save)

1. `GET /signature/domain` → EIP-712 domain `{ name, version, chainId, verifyingContract }`. Cache per session; `verifyingContract` is the on-chain reactor.
2. `POST /orders/build` with order requests (`orderbookId`, `type: LIMIT|MARKET`, `deadline` (LIMIT only), `inputToken`/`inputAmount`, `outputToken`/`outputAmount`, optional `recipient`, `makerOnly`, `takerOnce`, `isAMMEnabled`). The server assigns nonces and returns the serialized order structs. **Sign the returned struct, never your request object.** Up to 250 orders per build/save request.
3. Sign each order client-side (EIP-712) and prepend the one-byte signature mode: `0x00` for EIP-712 (ECDSA and ED25519 bots), `0x01` for Hedera personal-sign wallet flows (HIP-632 `SignatureMap`). Do not strip the prefix.
4. `POST /orders/save` with `{ order, signature, orderbookId, type }` items. Optional `ocoLinks` pair two LIMIT orders one-cancels-the-other.

API consumers are governed by the API terms of service; there is no in-app legal-acceptance call to make before saving orders (that acceptance gate applies only to the web app).

**Keep every integer as a string** (nonces, deadlines, raw amounts) — never cast to JavaScript numbers. Full field tables, policy limits (max 5,000 open orders, deadlines 30s–90d, 500 ids per cancel), and a worked TypeScript flow: `references/endpoints.md` and the official [TypeScript Bot Client guide](https://docs.saucerswap.finance/v/developer/saucerswap-v3/orderbook-api/typescript-client.md).

## Fees

`GET /fees/:orderbookId?side=maker|taker` (JWT) returns fee rates in **PIPS (parts per million, 1e-6) — not basis points**. Divide by 10,000 to get percent.

## Cancel

`POST /cancel` (≤500 order ids) and `POST /cancel/all` (nonce floor, emergency) are **asynchronous** — a `202 Accepted` is an acknowledgement, not a cancellation. Confirm the final `ORDER_CANCELED` event via `/ws/user-events` or `GET /orders/:orderId/history`.

## WebSockets

`wss://<host>/ws/depth?token=<jwt>&books=<id>,<id>` and `wss://<host>/ws/user-events?token=<jwt>&books=<id>,<id>`. Reliable depth handling: connect, buffer diffs, fetch the REST snapshot, apply buffered diffs after the snapshot, then apply live diffs. Never log full WS URLs (they contain the JWT). See `references/websockets.md`.

## Safety Conventions (non-negotiable)

- **Read-only by default.** Market data and quotes are safe. Build/sign/save an order **only** when the user has explicitly opted into live trading in this session.
- **Never ask a user to paste a private key** into chat, into code, or into a config file the agent reads. Keys live in server-side secret storage or environment variables loaded by the user's own process. All signing happens client-side; keys never travel to the API.
- **Testnet first** (`testnet-orderbook-api.saucerswap.finance`). Move to mainnet only after auth renewal, WS reconnects, cancellation finality, and string-integer handling all work.
- **Use a dedicated bot/integration account**, never a primary wallet key, for automated trading.
- Errors come back as `{ "error": "message" }` with conventional statuses (`400`, `401`, `403`, `404`, `429`, `500`). Expect rate limits; teams planning sustained high volume should contact [support@saucerswap.finance](mailto:support@saucerswap.finance).

## Documentation

- Orderbook API guide: `https://docs.saucerswap.finance/v/developer/saucerswap-v3/orderbook-api.md`
- TypeScript bot client: `https://docs.saucerswap.finance/v/developer/saucerswap-v3/orderbook-api/typescript-client.md`
- Full docs index: `https://docs.saucerswap.finance/llms.txt`

## Additional References

- `references/endpoints.md` — full REST endpoint reference, order fields, policy limits, errors
- `references/auth-and-signing.md` — challenge/verify flow, key types, EIP-712 signing, signature modes
- `references/quotes-and-trades.md` — quote endpoints, trade tape, quote-to-order flow
- `references/websockets.md` — depth and user-event streams, reconnect discipline
