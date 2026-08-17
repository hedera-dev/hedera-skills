# x402 Payment Examples

Generic patterns for Hedera x402 resource servers and clients. Prefer a concrete template (e.g. Scaffold-HBAR `templates/x402-pay-per-use`) for full copy-paste wiring.

## Resource server wiring

```ts
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { ExactHederaScheme } from "@x402/hedera/exact/server";

const facilitator = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL ?? "http://localhost:4020",
});
const server = new x402ResourceServer(facilitator).register(
  (process.env.X402_NETWORK ?? "hedera:testnet") as Network,
  new ExactHederaScheme(),
);
await server.initialize();
```

Payment header (v2 or legacy):

```ts
paymentHeader:
  req.headers.get("payment-signature") ??
  req.headers.get("x-payment") ??
  undefined;
```

## Paid route sketch

```ts
// 1) No payment → 402 challenge
const paymentRequiredBody = await server.buildPaymentRequiredResponse(...);
const res = NextResponse.json(paymentRequiredBody, { status: 402 });
res.headers.set("PAYMENT-REQUIRED", encodePaymentRequiredHeader(paymentRequiredBody));

// 2) With payment → verify then settle; resource only after success
const verification = await server.verifyPayment(payload, matched);
const settlement = await server.settlePayment(payload, matched);
if (!settlement.success) {
  return NextResponse.json({ error: "Payment settlement failed" }, { status: 402 });
}
const response = NextResponse.json({ /* resource payload */ });
response.headers.set("PAYMENT-RESPONSE", encodePaymentResponseHeader(settlement));
```

Payment requirements typically include:

- `payTo` — Hedera account id string (e.g. `0.0.1234`)
- `amount` — tinybars as string
- `asset` — `"0.0.0"` (native HBAR)
- `network` — e.g. `hedera:testnet`

## Client retry loop

```ts
const httpClient = new x402HTTPClient(
  new x402Client().register(network, new ExactHederaScheme(signer)),
);

const first = await fetch(resourceUrl);
if (first.status === 402) {
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    name => first.headers.get(name),
    await first.clone().json().catch(() => undefined),
  );
  const payload = await httpClient.createPaymentPayload(paymentRequired);
  const headers = httpClient.encodePaymentSignatureHeader(payload);
  const paid = await fetch(resourceUrl, { headers });
  const result = await httpClient.processResponse(paid);
  // result.kind === "success" → paid resource body
}
```

Signer builds a native HBAR transfer: debit buyer, credit `requirements.payTo`, amount in tinybars.

## Tinybar helpers

```ts
export const TINYBAR_PER_HBAR = 100_000_000n;

export function hbarToTinybar(hbar: string): bigint {
  const [whole = "0", fraction = ""] = hbar.trim().split(".");
  if (fraction.length > 8) throw new Error("HBAR supports at most 8 decimal places");
  return BigInt(whole || "0") * TINYBAR_PER_HBAR + BigInt(fraction.padEnd(8, "0") || "0");
}
```
