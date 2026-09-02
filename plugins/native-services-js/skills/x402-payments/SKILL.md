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
- [ ] `payTo` is a **different account** from the payer — a self-transfer nets to zero and fails verification
- [ ] The decoded `PAYMENT-REQUIRED` header shows the asset you intended, not a substituted default
- [ ] The signing key is confirmed to control its account (ECDSA parse alone does not prove it)

## Failure Modes

Five ways an x402 integration on Hedera fails **without erroring**. Each was hit building a
production pay-per-call service; none produces a stack trace pointing at the cause.

### A money-denominated price is silently redenominated

Returning a bare money string from a route's `price` hands it to the scheme's default money
parser, which resolves against `DEFAULT_ASSETS` — **USDC** on Hedera, at 6 decimals — even when
you intend native HBAR.

```ts
// Wrong: quotes 50000 units of USDC (0.0.429274), not HBAR
price: "0.05"

// Right: the asset you meant, in its own base units
price: { asset: "0.0.0", amount: "5000000" }   // 0.05 HBAR in tinybars
```

The 402 is well-formed either way, so nothing warns you. Decode the `PAYMENT-REQUIRED` header and
check the `asset` field is the one you intended — that is the only place the substitution is
visible.

### `PrivateKey.fromStringECDSA` accepts an ED25519 key

A raw Hedera private key is 32 bytes on either curve, so `fromStringECDSA` parses an ED25519 key
without complaint and derives a secp256k1 public key belonging to **no account**. Most faucets
issue ED25519 by default and x402 requires ECDSA, so this is easy to hit, and it surfaces as a
signature the facilitator rejects rather than as a key error.

Verify the key controls the account, at startup, before any payment runs:

```ts
const derived = PrivateKey.fromStringECDSA(key).publicKey.toStringRaw().toLowerCase();
const account = await (await fetch(`${MIRROR_NODE}/api/v1/accounts/${accountId}`)).json();
if (account.key?.key?.toLowerCase() !== derived) {
  throw new Error(`key does not control ${accountId} (on-chain key type: ${account.key?._type})`);
}
```

### Payer and payee must be different accounts

An `exact` transfer debits the payer and credits `payTo`. If they are the same account the net
transfer is zero and the facilitator's check that `payTo` received the required amount fails.
Testing a paid request therefore needs two accounts, which is easy to miss when the first
end-to-end test is written against a single funded operator.

Creating the second one under the same key keeps it to one secret:

```ts
// setKeyWithoutAlias, not setECDSAKeyWithAlias — the EVM alias for this key is already
// assigned to the first account, and requesting it again fails with ALIAS_ALREADY_ASSIGNED
await new AccountCreateTransaction()
  .setKeyWithoutAlias(key.publicKey)
  .setInitialBalance(new Hbar(1))
  .execute(client);
```

### The mirror node lags consensus — confirmation must poll

Verifying settlement by querying the mirror node immediately after the resource server returns 200
reports **not found** for a transaction that succeeded. Mirror nodes are eventually consistent and
lag by a few seconds.

A confirmation step that reports failure for successful work is worse than no confirmation, since
the rational response to a check that cries wolf is to stop believing it. Poll to a deadline
(~30s) rather than reading once.

### A second 402 is indistinguishable from a never-paid 402

If settlement fails, the resource server answers a request that **did** carry a valid
`PAYMENT-SIGNATURE` with another 402 — byte-identical to the response for a request that carried
no payment at all. From the client that looks like the header was never attached, which sends you
to inspect signing and header construction, the two things that are working.

Treat a second 402 as a distinct state:

```ts
const paid = await fetch(url, { headers: { "PAYMENT-SIGNATURE": header } });
if (paid.status === 402) {
  // Not "unpaid" — the payment was signed and submitted and settlement did not complete.
  // This is upstream of the client. Surface it as such, and retry visibly rather than silently:
  // a silent retry hides how often the settlement path fails, which is the number worth knowing.
}
```

Re-sign on retry rather than replaying the payload: a Hedera transaction carries its own id and
validity window, so a replayed payment is rejected as a duplicate.

## References

- [references/examples.md](references/examples.md) — resource server wiring, client retry loop, tinybar helpers
- [references/facilitator.md](references/facilitator.md) — endpoints, env vars, fee-payer role
- [x402 docs](https://docs.x402.org)
- [`@x402/hedera`](https://www.npmjs.com/package/@x402/hedera)
