# Orderbook API — WebSocket Streams

Both streams run on the API host with the `wss://` scheme and require a valid JWT in the `token` query parameter:

```text
wss://<host>/ws/depth?token=<jwt>&books=<id>,<id>
wss://<host>/ws/user-events?token=<jwt>&books=<id>,<id>
```

| Stream           | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `/ws/depth`      | Live orderbook depth diffs for subscribed books |
| `/ws/user-events`| Authenticated order lifecycle events (fills, cancellations) for the JWT's account |

## Reliable depth handling

The canonical snapshot-plus-diff sequence:

1. Connect to `/ws/depth` for the target books.
2. **Buffer** incoming diffs while fetching the REST snapshot `GET /depth/:orderbookId`.
3. Apply buffered diffs on top of the snapshot, sequenced by the snapshot's `lastUpdateId`.
4. Continue applying live diffs.

Rebuild from snapshot + buffered diffs after every reconnect.

## Connection discipline

- **Re-authenticate before each reconnect attempt.** JWTs are verified at handshake time; an open connection can outlive its token, but a reconnect with a stale token fails.
- Reconnect with backoff; expect service-protection limits.
- **Treat WebSocket URLs as sensitive** — they contain the JWT. Never log full URLs in production.
- After a user-events reconnect, reconcile any gap with `GET /orders` and `GET /orders/:orderId/history`.

## Cancellation finality

Cancellation REST calls return `202 Accepted` (request accepted, not yet final). Watch `/ws/user-events` for the terminal `ORDER_CANCELED` event, or poll order history. Do not treat capital as freed until the terminal event arrives.

## Client sketch

```typescript
await client.authenticate('0.0.123456', process.env.PRIVATE_KEY!)

const ws = client.connectDepthWs(['3'], {
  onOpen: () => console.log('depth stream connected'),
  onMessage: (message) => {
    const event = JSON.parse(message)
    // buffer until snapshot applied, then apply in sequence
  },
  onClose: (code, reason) => scheduleReconnectWithFreshJwt(),
  onError: (error) => console.error(error),
})
```

Full pattern: `https://docs.saucerswap.finance/v/developer/saucerswap-v3/orderbook-api/typescript-client.md`
