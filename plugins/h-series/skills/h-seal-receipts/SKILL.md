---
name: h-seal-receipts
description: "How to make a service produce verifiable, two-party proof-of-execution receipts on Hedera via H-Seal, with zero code, using the signing sidecar in proxy mode. Use this skill whenever the user wants their API, MCP server, or agent to prove what it delivered (SLA evidence, billing-dispute protection, a tamper-proof delivery record), co-sign its responses, anchor receipts on Hedera Consensus Service, or advertise proof-of-execution as a trust signal in H-Index discovery. Also trigger on receipt anchoring, provider attestation, or two-party co-signed receipts."
---

# H-Seal: proof-of-execution receipts

H-Seal turns a service call into a signed, on-chain record of what was asked and what was
delivered, anchored on Hedera Consensus Service. A receipt is **two-party** when both the
caller and the provider sign it: the caller attests "I asked for this and got that", the
provider co-signs "yes, I delivered it". That co-signature is what makes a receipt evidence
in an SLA or a billing dispute instead of one side's word.

Base URL: `https://h-seal.xr-utilities.ai`.

## Co-sign every response (zero code)

If you RUN a service, you do NOT write any receipt code. You put the H-Seal signing sidecar
in PROXY MODE in front of your service and route traffic through it. Every JSON response is
then co-signed by your identity, no handler changes, any language or stack.

```
# A fundless ed25519 identity you control (XRPL must be ed25519; a Hedera / Solana / EVM key
# also works). Run the sidecar in front of your service:
npx -p github:XR-Utilities/h-seal-provider#v0.3.0 hseal-sidecar

# environment:
PROXY_TARGET=https://your-service.example.com   # the sidecar sits in front of this
PROVIDER_IDENTITY=<your CAIP-10 identity>        # e.g. xrpl:0:r... or hedera:mainnet:0.0.x
PROVIDER_KEY_RAW=<your ed25519 seed>             # env only, never commit
```

Point your public URL at the sidecar. Every JSON response now carries your signature: an
`x-hseal-attestation` response header and a `_hSeal` field in the body. Streaming/SSE
responses pass through unsigned. Nothing else to write.

When your service is consumed through the estate (an agent calling it via H-Grant, or any
H-Seal caller), your co-signature is folded into the anchored receipt automatically, so the
receipt is a genuine two-party proof-of-execution record naming you as the provider.

## Advertise it in discovery

Once you anchor receipts, set `slaReceiptRef` on your H-Index listing (the H-Seal receipt
topic id, a specific receipt id, or a URL). See the h-index-registry skill. In discovery
this earns `receiptAnchoring.badge`:

- `attested`: you declared the ref. Self-claimed, signed into your register envelope.
- `verified`: H-Index cross-checked the claim against the live H-Seal service and confirmed
  you are actively anchoring receipts. This is the strong, earned signal.

## Verify a receipt

```
# H-Seal's live receipt topic id:
GET /config            -> { "receiptTopicId": "0.0...." , ... }

# A specific receipt by id ("<topic>/<seq>"): 200 with the record, 404 if absent.
GET /receipts/{topic}/{seq}

# Receipts a provider has anchored (CAIP-10 identity):
GET /receipts?provider=<caip10>&limit=50
```

A receipt names the `callerIdentity` and `providerIdentity` (CAIP-10), a hash of the request
and of the response, the result status, timing, and the `consensusTimestamp` of the anchor.
Everything is on HCS and independently replayable from any mirror node, so a receipt is
verifiable without trusting H-Seal.

## Scope

H-Seal anchors receipts; it does not run your service or hold your keys. The sidecar signs
with the provider key you give it and nothing else. Discovery/registration of the service is
H-Index (the h-index-registry skill); H-Seal is only the proof-of-execution layer.
