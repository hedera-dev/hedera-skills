---
name: hedera-mirror-node
description: "How to read Hedera network state via the Mirror Node REST API — account balances, transactions, tokens, NFTs, HCS topic messages, and contract results. Use this skill whenever the user wants to query, look up, verify, confirm, or fetch on-chain data from Hedera without submitting a transaction: check a balance, confirm a transfer/mint landed, list an account's tokens or NFTs, read topic messages, page through transaction history, or resolve an account/token/contract by ID. Also trigger when the user mentions the mirror node, `mirrornode.hedera.com`, `/api/v1`, HashScan-style lookups, reading Hedera state from JavaScript/TypeScript, or wiring `context.mirrornodeService` into a Hedera Agent Kit query tool. This is the read counterpart to the SDK/CLI write skills — use it for any read-only lookup."
version: 1.0.0
---

# Hedera Mirror Node — REST API queries

Consensus nodes take **writes** (transactions); **mirror nodes** serve **reads**. Every "did it work / what's the current state" question — balances, transaction history, token and NFT ownership, HCS messages, contract results — is answered by the Mirror Node **REST API** (`GET /api/v1/...`, JSON responses, no key or signature required, no network fee).

> **This is the read half of Hedera.** The token-service, consensus-service, hiero-cli, and agent-kit skills *submit* transactions. When you need to confirm what happened or list current state, you query a mirror node — you do **not** pay for or sign these calls.

## Base URLs

| Network | Base URL |
|---|---|
| Mainnet | `https://mainnet-public.mirrornode.hedera.com` |
| Testnet | `https://testnet.mirrornode.hedera.com` |
| Previewnet | `https://previewnet.mirrornode.hedera.com` |
| Local node (`hedera-local`) | `http://localhost:5551` |

All endpoints are under `/api/v1`. Example: `https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.2`.

> **Mainnet host.** Use the documented public host `mainnet-public.mirrornode.hedera.com`. Prefer an explicit network→host map over templating the network name into the URL (``https://${network}.mirrornode.hedera.com``) — the templated form yields `mainnet.mirrornode.hedera.com`, which is not the canonical public endpoint. An explicit map keeps you on the supported host and lets you point at `hedera-local` or a self-hosted node without special-casing.

## Core endpoints

| Question | Endpoint |
|---|---|
| Account info (balance, keys, memo) | `GET /accounts/{idOrEvmAddress}` |
| Token relationships an account holds | `GET /accounts/{id}/tokens` |
| NFTs an account owns | `GET /accounts/{id}/nfts` |
| HBAR + token balances (snapshot) | `GET /balances?account.id={id}` |
| Token info (supply, keys, treasury) | `GET /tokens/{id}` |
| NFTs in a collection | `GET /tokens/{id}/nfts` |
| A specific NFT serial | `GET /tokens/{id}/nfts/{serial}` |
| Transactions for an account | `GET /transactions?account.id={id}` |
| A specific transaction | `GET /transactions/{transactionId}` |
| HCS topic messages | `GET /topics/{id}/messages` |
| A topic message by sequence | `GET /topics/{id}/messages/{sequenceNumber}` |
| Contract entity | `GET /contracts/{idOrEvmAddress}` |
| Contract call results / logs | `GET /contracts/{id}/results` |
| Network supply / exchange rate / nodes | `GET /network/supply`, `/network/exchangerate`, `/network/nodes` |

See `references/endpoints.md` for the full endpoint list, response shapes, and every query parameter.

## Quick start (Node 18+, zero dependencies)

Native `fetch` is available in Node 18+ and all browsers — no SDK needed for reads.

```js
const BASE = "https://testnet.mirrornode.hedera.com/api/v1";

// Account HBAR balance (returned in tinybars; 1 HBAR = 100,000,000 tinybars)
const res = await fetch(`${BASE}/accounts/0.0.2`);
if (!res.ok) throw new Error(`Mirror node ${res.status}`);
const account = await res.json();
console.log(`Balance: ${account.balance.balance / 1e8} ℏ`);
```

## Filtering, ordering, pagination

Query parameters accept **comparison operators** as a `op:value` prefix: `eq` (default), `ne`, `lt`, `lte`, `gt`, `gte`.

```
/transactions?account.id=0.0.1234&timestamp=gte:1700000000.000000000&order=desc&limit=50
/tokens/0.0.5678/nfts?serialnumber=gt:100&limit=25
```

- `order` — `asc` or `desc`.
- `limit` — 1–100 (default 25). To get more than 100 results you **must paginate**.
- **Pagination is cursor-based via `links.next`.** Each response has a `links.next` field: either `null` (done) or a **relative path** (already carrying the cursor params). Fetch `BASE_HOST + links.next` until it is `null` — do **not** hand-roll offsets.

```js
async function fetchAll(host, path) {
  const out = [];
  let next = path;                    // e.g. "/api/v1/transactions?account.id=0.0.2&limit=100"
  while (next) {
    const r = await fetch(host + next);
    if (!r.ok) throw new Error(`Mirror node ${r.status}`);
    const page = await r.json();
    out.push(...(page.transactions ?? []));
    next = page.links?.next ?? null;  // already includes the next cursor
  }
  return out;
}
```

Runnable versions of both patterns are in `examples/query-account.mjs` and `examples/paginate.mjs`.

## Using it inside a Hedera Agent Kit query tool

Agent Kit query tools are the read-only `BaseTool` variant (`coreAction` returns data, `shouldSecondaryAction()` returns `false` — see the `agent-kit-plugin` skill). Two ways to reach the mirror node from a tool:

1. **Preferred — `context.mirrornodeService`.** The kit puts an `IHederaMirrornodeService` on `Context` (`context.mirrornodeService`), already pointed at the operator's network. Use it so your tool inherits the configured network and any kit-level retry/caching instead of hard-coding a host. Check the methods available on `IHederaMirrornodeService` in your installed `@hashgraph/hedera-agent-kit` version.

2. **Fallback — raw `fetch`.** Fine for endpoints the service does not wrap, but **map the network name to a host explicitly** (see the mainnet note) rather than templating `ledgerId` straight into the URL. The existing `get-token-info` example templates the network name, which lands on `mainnet.mirrornode.hedera.com` for mainnet instead of the canonical `mainnet-public` host — an explicit map avoids that.

```ts
// Inside a query BaseTool's coreAction — prefer the injected service:
async coreAction(params: MyParams, context: Context) {
  if (context.mirrornodeService) {
    // Use the kit's service (method names per your kit version).
    return await context.mirrornodeService /* .getAccount(params.accountId) etc. */;
  }
  // Fallback: explicit host map, never template ledgerId for mainnet.
  const HOSTS: Record<string, string> = {
    mainnet: "https://mainnet-public.mirrornode.hedera.com",
    testnet: "https://testnet.mirrornode.hedera.com",
    previewnet: "https://previewnet.mirrornode.hedera.com",
  };
  const base = HOSTS[params.network ?? "testnet"];
  const r = await fetch(`${base}/api/v1/accounts/${params.accountId}`);
  if (!r.ok) throw new Error(`Mirror node ${r.status}`);
  return await r.json();
}
```

A complete query tool (`GetAccountNftsTool`) is in `examples/get-account-nfts-tool.ts`.

## Data conventions

- **Amounts are integers in the smallest unit.** HBAR is **tinybars** (÷ 100,000,000 for ℏ). Fungible token amounts are in the token's smallest unit — divide by `10 ** decimals` (fetch `decimals` from `/tokens/{id}`).
- **Timestamps are `seconds.nanoseconds` strings**, e.g. `"1700000000.123456789"`. Convert with `new Date(parseFloat(ts) * 1000)`.
- **Transaction IDs in a path use dashes**, not `@`/`.`: the SDK's `0.0.1234@1700000000.000000000` becomes `0.0.1234-1700000000-000000000` for `GET /transactions/{id}`.
- **EVM addresses work** anywhere an account/contract ID is accepted (`/accounts/0x...`).

## Common gotchas

1. **Eventual consistency.** Mirror nodes lag consensus by a few seconds. After submitting a transaction, **poll with a short retry/backoff** — a lookup immediately after `getReceipt()` often 404s or shows stale state. Do not treat the first 404 as "does not exist."
2. **Use the canonical `mainnet-public` host** and an explicit host map (see above) rather than templating the network name into the URL.
3. **404 is a valid answer**, not a crash — an unknown account/token/tx returns 404. Handle it distinctly from 5xx/network errors.
4. **`/balances` is a periodic snapshot**, slightly behind `/accounts/{id}`. For the freshest single-account balance use `/accounts/{id}` (`.balance.balance`).
5. **Public hosts are rate-limited.** Batch, cache, respect `429`/`Retry-After`, and paginate with `limit=100` to cut request count. For heavy workloads run your own mirror node or `hedera-local`.
6. **Paginate via `links.next` only.** There is no reliable total count; keep following the cursor until it is `null`.
7. **Topic message `message` is base64.** Decode with `Buffer.from(msg.message, "base64").toString("utf8")`.

## Reference & examples

- `references/endpoints.md` — full endpoint catalog, response fields, and query parameters
- `examples/query-account.mjs` — balance + token/NFT lookups over raw REST (runnable, no deps)
- `examples/paginate.mjs` — cursor pagination helper following `links.next`
- `examples/get-account-nfts-tool.ts` — Agent Kit query `BaseTool` preferring `context.mirrornodeService` with a raw-`fetch` fallback
