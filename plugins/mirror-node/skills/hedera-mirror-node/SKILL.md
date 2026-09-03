---
name: hedera-mirror-node
description: "How to read Hedera network state via the Mirror Node REST API — account balances, transactions, tokens, NFTs, HCS topic messages, and contract results. Use this skill whenever the user wants to query, look up, verify, confirm, or fetch on-chain data from Hedera without submitting a transaction: check a balance, confirm a transfer/mint landed, list an account's tokens or NFTs, read topic messages, page through transaction history, or resolve an account/token/contract by ID. Also trigger when the user mentions the mirror node, `mirrornode.hedera.com`, `/api/v1`, HashScan-style lookups, paginating mirror node results, or reading Hedera state from JavaScript/TypeScript. This is the read counterpart to the SDK/CLI write skills — use it for any read-only lookup."
version: 1.0.0
---

# Hedera Mirror Node — REST API queries

Consensus nodes take **writes** (transactions); **mirror nodes** serve **reads**. Every "did it work / what's the current state" question — balances, transaction history, token and NFT ownership, HCS messages, contract results — is answered by the Mirror Node **REST API** (`GET /api/v1/...`, JSON responses, no key or signature required, no network fee).

> **This is the read half of Hedera.** The token-service, consensus-service, hiero-cli, and agent-kit skills *submit* transactions. When you need to confirm what happened or list current state, you query a mirror node — you do **not** pay for or sign these calls.

## Base URLs

| Network | Base URL |
|---|---|
| Mainnet | `https://mainnet.mirrornode.hedera.com` |
| Testnet | `https://testnet.mirrornode.hedera.com` |
| Previewnet | `https://previewnet.mirrornode.hedera.com` |
| Local node (`hedera-local`) | `http://localhost:5551` |

All endpoints are under `/api/v1`. Example: `https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.2`.

> **Host naming.** The three public networks follow one pattern, so ``https://${network}.mirrornode.hedera.com`` is fine for `mainnet`, `testnet`, and `previewnet`. `mainnet-public.mirrornode.hedera.com` is an older public hostname that still serves the same data — prefer `mainnet`. Keep an explicit host map only when you also target `hedera-local` or a self-hosted node, which do not follow the pattern.

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
const TINYBAR = 100000000n; // 1 HBAR = 100,000,000 tinybars

// Balances arrive as JSON *numbers* and are corrupted by JSON.parse before
// BigInt can help, so quote long integers first. See the warning below.
function parseWithBigInts(text) {
  return JSON.parse(text.replace(/:\s*(-?\d{16,})(?=\s*[,}\]])/g, ': "$1"'));
}

const res = await fetch(`${BASE}/accounts/0.0.2`);
if (!res.ok) throw new Error(`Mirror node ${res.status}`);

// res.text(), NOT res.json() — this is the whole point.
const account = parseWithBigInts(await res.text());

const tinybars = BigInt(account.balance.balance);
const hbar = `${tinybars / TINYBAR}.${(tinybars % TINYBAR).toString().padStart(8, "0")}`;
console.log(`Balance: ${hbar} ℏ`);
```

> ### ⚠️ Balances lose precision in `JSON.parse` — `BigInt` alone does not save you
>
> The mirror node returns balances as **JSON numbers, not strings** (`"balance":3389692518476689184`). Any value above `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991) is already corrupted by the time `res.json()` returns, so `BigInt(account.balance.balance)` is **too late** — it faithfully converts an
> already-wrong number.
>
> Measured on testnet `0.0.2`:
>
> | | value |
> |---|---|
> | raw bytes on the wire | `3389692518476689184` |
> | after `res.json()` / `JSON.parse` | `3389692518476689408` |
>
> That is a silent 224-tinybar error before any arithmetic happens. The fix is to read the response as **text** and quote long integers so they survive as strings:
>
> ```js
> function parseWithBigInts(text) {
>   // Quote any 16+ digit integer that appears as a value, then BigInt it later.
>   return JSON.parse(text.replace(/:\s*(-?\d{16,})(?=\s*[,}\]])/g, ': "$1"'));
> }
> const data = parseWithBigInts(await res.text());
> const exact = BigInt(data.balance.balance); // 3389692518476689184n ✅
> ```
>
> (Node 22+ can instead use a `JSON.parse` reviver's `context.source`; the text approach works on Node 18/20 too.)
>
> It is **network- and account-dependent**, so "it looked fine once" proves nothing: the same `0.0.2` on **mainnet** holds `1663012637744658` tinybars — below the limit, and it round-trips correctly. Total HBAR supply is 5e18 tinybars (~555× `MAX_SAFE_INTEGER`), so any treasury-sized balance overflows. Apply this to HBAR **and** fungible token amounts.

## Filtering, ordering, pagination

Query parameters accept **comparison operators** as a `op:value` prefix: `eq` (default), `ne`, `lt`, `lte`, `gt`, `gte`.

```
/transactions?account.id=0.0.1234&timestamp=gte:1700000000.000000000&order=desc&limit=50
/tokens/0.0.5678/nfts?serialnumber=gt:100&limit=25
```

- `order` — `asc` or `desc`.
- `limit` — 1–100, default 25. Values above 100 are **silently clamped to 100**, not rejected — so `limit=1000` returns 100 rows and you must still paginate.
- **Pagination is cursor-based via `links.next`.** Each response has a `links.next` field: either `null` (done) or a **relative path** (already carrying the cursor params). Fetch `BASE_HOST + links.next` until it is `null` — do **not** hand-roll offsets.

```js
async function fetchAll(host, path) {
  const out = [];
  let next = path;                    // e.g. "/api/v1/transactions?account.id=0.0.2&limit=100"
  while (next) {
    const r = await fetch(host + next);
    if (!r.ok) throw new Error(`Mirror node ${r.status}`);
    // Not r.json() — transfer amounts are tinybars and can exceed 2^53.
    const page = parseWithBigInts(await r.text());
    out.push(...(page.transactions ?? []));
    next = page.links?.next ?? null;  // already includes the next cursor
  }
  return out;
}
```

Runnable versions of both patterns are in `examples/query-account.mjs` and `examples/paginate.mjs`.

## Reading HCS topic messages

Topic messages come back base64-encoded in the `message` field. Use `limit` + `order=desc` to get the most recent ones rather than fetching everything and slicing client-side.

```js
const url = `${BASE}/topics/${topicId}/messages?limit=10&order=desc`;
const { messages } = await fetch(url).then((r) => r.json());

for (const m of messages) {
  const text = Buffer.from(m.message, "base64").toString("utf8"); // browser: atob()
  console.log(`#${m.sequence_number} @${m.consensus_timestamp}: ${text}`);
}
```

`sequence_number` starts at 1 and increments per message. A single message by sequence: `GET /topics/{id}/messages/{sequenceNumber}`. (`r.json()` is safe here — message bodies are strings, not big integers.)

## Using it from a Hedera Agent Kit tool

If you are reaching the mirror node from inside an Agent Kit tool, the kit injects an `IHederaMirrornodeService` on `Context` as `context.mirrornodeService`, already pointed at the operator's network — prefer it over hard-coding a host. For the shape of a read-only query tool itself, see the **`agent-kit-plugin`** skill, which owns that material.

## Data conventions

- **Amounts are integers in the smallest unit — parse with `BigInt`.** HBAR is **tinybars** (÷ 100,000,000 for ℏ). Fungible token amounts are in the token's smallest unit — divide by `10 ** decimals` (fetch `decimals` from `/tokens/{id}`). Both can exceed `Number.MAX_SAFE_INTEGER`; see the precision warning above.
- **Timestamps are `seconds.nanoseconds` strings**, e.g. `"1700000000.123456789"`. Convert with `new Date(parseFloat(ts) * 1000)`.
- **Transaction IDs in a path use dashes**, not `@`/`.`: the SDK's `0.0.1234@1700000000.000000000` becomes `0.0.1234-1700000000-000000000` for `GET /transactions/{id}`.
- **EVM addresses work** anywhere an account/contract ID is accepted (`/accounts/0x...`).

## Common gotchas

1. **Eventual consistency.** Mirror nodes lag consensus by a few seconds. After submitting a transaction, **poll with a short retry/backoff** — a lookup immediately after `getReceipt()` often 404s or shows stale state. Do not treat the first 404 as "does not exist."
2. **Balances overflow JS `Number` — and `res.json()` is where they break.** Read the body as text and quote long integers before parsing, then use `BigInt`. Calling `res.json()` first and wrapping in `BigInt` afterwards is already too late (see the precision warning above).
3. **404 is a valid answer**, not a crash — an unknown account/token/tx returns 404. Handle it distinctly from 5xx/network errors.
4. **`/balances` is a periodic snapshot**, slightly behind `/accounts/{id}`. For the freshest single-account balance use `/accounts/{id}` (`.balance.balance`).
5. **Public hosts are rate-limited.** Batch, cache, respect `429`/`Retry-After`, and paginate with `limit=100` to cut request count. For heavy workloads run your own mirror node or `hedera-local`.
6. **Paginate via `links.next` only.** There is no reliable total count; keep following the cursor until it is `null`.
7. **Topic message `message` is base64.** Decode with `Buffer.from(msg.message, "base64").toString("utf8")`.

## Reference & examples

- `references/endpoints.md` — full endpoint catalog, response fields, and query parameters
- `examples/query-account.mjs` — balance + token/NFT lookups over raw REST (runnable, no deps)
- `examples/paginate.mjs` — cursor pagination helper following `links.next`
