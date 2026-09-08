---
name: x402-payments
description: >
  x402 pay-per-use payments on Hedera. Use when gating HTTP resources behind native HBAR
  payments, wiring a self-hosted Hedera facilitator (verify/settle), building
  x402ResourceServer / ExactHederaScheme flows, or integrating WalletConnect payment
  retries (PAYMENT-REQUIRED → PAYMENT-SIGNATURE).
---

# x402 Payments (Hedera)

**Pay-per-use pattern:** store protected bytes off-chain, record access terms separately (on-chain or config), gate HTTP resources with **HTTP 402** + a **self-hosted Hedera facilitator** that verifies and settles native HBAR transfers.

```text
Buyer → GET protected resource
          ├─ free / public → resource
          └─ paid → 402 PAYMENT-REQUIRED
                → client signs HBAR transfer
                → retry with PAYMENT-SIGNATURE
                → resource server verify + settle via facilitator
                → PAYMENT-RESPONSE + resource
```

The resource server **never holds facilitator keys**. Settlement uses a funded **ECDSA** fee-payer account on the facilitator process.

## Quick Reference

| Piece | Role |
| ----- | ---- |
| Payment asset | `"0.0.0"` — native HBAR; amounts in **tinybars** (1 HBAR = 1e8) |
| Resource server | `@x402/core` + `ExactHederaScheme` → talks to facilitator over HTTP |
| Facilitator | `GET /supported`, `POST /verify`, `POST /settle`, `GET /health` |
| Client | Request → read 402 → sign → retry with `PAYMENT-SIGNATURE` (legacy `X-PAYMENT` also accepted) |
| Wallet | ECDSA Hedera account (e.g. HashPack via WalletConnect / UniversalProvider) |

See [references/examples.md](references/examples.md) for server/client snippets. See [references/facilitator.md](references/facilitator.md) for env vars and settle semantics.

## Critical: Facilitator Fee Payer

Hedera x402 settles with native `TransferTransaction`s. The buyer **partially signs** (authorize buyer → seller). The facilitator must:

1. Verify the signed payload against payment requirements
2. Co-sign as the advertised **fee payer** (`/supported`)
3. Pay network fees and submit until `SUCCESS`

Requires `FACILITATOR_ACCOUNT_ID` + `FACILITATOR_PRIVATE_KEY` on a funded **ECDSA** account — separate from deployer/seller keys. Do not put that key in the resource-server process.

## Critical: Native HBAR Is Not a Default Asset

`@x402/core` applies **client-side spend controls before signing**, and by default it allows
only assets its `findDefaultAsset` recognises. On Hedera that is **USDC — not HBAR**. So a
client built the obvious way, against a route priced in the `0.0.0` native HBAR this skill
specifies, fails before any transaction exists:

```
Failed to create payment payload: All payment requirements were rejected by spendControls:
only default assets or entries in spendControls.allowedAssets are allowed.
```

Opt HBAR in explicitly, with a per-payment ceiling in **tinybars** (an atomic integer, not `"$1"`):

```ts
import { HBAR_ASSET_ID, HEDERA_TESTNET_CAIP2 } from "@x402/hedera";

const client = new x402Client()
  .setSpendControls({
    allowedAssets: [
      { network: HEDERA_TESTNET_CAIP2, asset: HBAR_ASSET_ID, maxAmountPerPayment: "20000000" },
    ],
  })
  .register(HEDERA_TESTNET_CAIP2, new ExactHederaScheme(signer));
```

Prefer this over `spendControls: false`. The control is doing real work — it stops an agent
paying in a token nobody told it about — and disabling it to get past one error removes that
protection everywhere.

Both client paths enforce it: `wrapFetchWithPayment` and a manual `createPaymentPayload` both
route through `enrichPaymentPayloadWithExtensions`, which applies spend controls.

## Critical: `new x402Client({ ... })` Silently Ignores Its Argument

The constructor signature is `constructor(paymentRequirementsSelector?: SelectPaymentRequirements)`
— a **function**. Passing a config object compiles, runs, and is discarded, so spend controls
stay at their defaults and the error above does not change no matter what you put in it:

```ts
// ignored — no error, no warning
const client = new x402Client({ spendControls: { allowedAssets: [...] } });
```

Use `new x402Client().setSpendControls(controls)` or `x402Client.fromConfig({ schemes, spendControls })`.

## Critical: `payTo` Must Differ From the Payer

Pointing `payTo` at the account that is paying produces a zero net transfer. Verification fails
and the retry returns a bare **402 with an empty body** — no `PAYMENT-RESPONSE`, no error text,
nothing in the resource server's log. It is indistinguishable from a signing failure, a
facilitator outage, or a stale server process holding the port.

The seller needs its own account. Create one from the funded operator with
`AccountCreateTransaction` — note it is **not** among the symbols `@x402/hedera` re-exports, so
import it from `@hiero-ledger/sdk` directly, and check the tree has exactly one copy of that
package (two copies produce `t.startsWith is not a function` at runtime).

## Critical: Prices Are Tinybars

Payment requirements use tinybars. Convert in UIs with 8-decimal helpers; never float.

```ts
const TINYBAR_PER_HBAR = 100_000_000n;
// hbar "1.5" → 150_000_000n tinybars
```

## Resource Server Flow (paid resource)

1. Load access terms for the resource — if missing → 404
2. If free/public → return the resource
3. Else build payment requirements: `payTo` = seller Hedera account id, `amount` in tinybars, asset `0.0.0`, network (e.g. `hedera:testnet`)
4. No payment header → **402** with `PAYMENT-REQUIRED` header + JSON body
5. With payment header → `verifyPayment` then `settlePayment`; only on success return resource + `PAYMENT-RESPONSE`

```ts
const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const server = new x402ResourceServer(facilitator)
  .register(X402_NETWORK, new ExactHederaScheme());
await server.initialize(); // pulls fee-payer from /supported
```

## Client Flow

```ts
const first = await fetch(resourceUrl);
if (first.status === 402) {
  const paymentRequired = httpClient.getPaymentRequiredResponse(...);
  const payload = await httpClient.createPaymentPayload(paymentRequired);
  const headers = httpClient.encodePaymentSignatureHeader(payload);
  const paid = await fetch(resourceUrl, { headers });
  // processResponse → resource + settle receipt
}
```

Machine-to-machine clients use a key-based signer instead of a browser wallet.

## Checklist

- [ ] Resource server has no facilitator private key
- [ ] Client and server share the same `X402_NETWORK` (e.g. `hedera:testnet`)
- [ ] Amounts are tinybars; asset id is `0.0.0`
- [ ] 402 challenge → signed retry → verify → settle → resource only after success
- [ ] Fee-payer account is ECDSA and funded for network fees
- [ ] Facilitator `/health` OK before testing paid requests
- [ ] `payTo` is a Hedera account id string (e.g. `0.0.1234`), not an EVM address
- [ ] `payTo` is a **different account** from the payer, or settlement nets to zero
- [ ] The client allows native HBAR via `setSpendControls`, not by disabling spend controls
- [ ] Spend controls were set with `setSpendControls` / `fromConfig`, not the constructor

## References

- [references/examples.md](references/examples.md) — resource server wiring, client retry loop, tinybar helpers
- [references/facilitator.md](references/facilitator.md) — endpoints, env vars, fee-payer role
- [x402 docs](https://docs.x402.org)
- [`@x402/hedera`](https://www.npmjs.com/package/@x402/hedera)
