# H-Index register contract

Read the live values from `GET https://h-index.xr-utilities.ai/config`. Do not hardcode the
topic id or price; they come from `/config`.

## Register payload fields

Signed and sent to `POST /register`. Required unless marked optional.

| Field | Type | Notes |
|---|---|---|
| `apiName` | string (1-200) | Display name. |
| `endpointUrl` | string (http/https, max 1000) | The service URL. |
| `description` | string (1-4000) | What it does; this is what semantic search matches. |
| `pricing` | string (max 4000) | Pricing info, typically a JSON string. |
| `category` | enum | One of `GET /categories`; defaults to `other`. |
| `mcpManifest` | string (optional, max 32 KB) | Your `tools/list` snapshot as a JSON object `{ "tools": [...] }`. Empty means "not an MCP server, or omitted". Do NOT paste the register payload itself. |
| `ownerAccountId` | string | Your identity: CAIP-10 (`hedera:mainnet:0.0.x`, `eip155:8453:0x...`, `xrpl:0:r...`, `solana:mainnet:...`) or a bare account id. |
| `registryTopicId` | string (`x.y.z`) | From `/config`; must match this server. |
| `issuedAt` | number | Unix seconds. Signature freshness window is 300 s. |
| `signature` | string | TIP-712 / EIP-712 hex signature (or provide `ownerOidc` instead for the identity-bridge path). |
| `termsVersion` | string (optional) | Set to `terms.version` from `/config` to record acceptance on chain. |
| `slaReceiptRef` | string (optional, max 512) | H-Seal topic id / receipt id / URL where you anchor proof-of-execution. Earns the receipt-anchoring badge. |
| `developerLogoUrl`, `developerDocsUrl`, `developerWebsiteUrl`, `developerGithubUrl`, `developerSocial`, `notifyUrl` | string (optional) | Developer metadata; `notifyUrl` gets expiry warnings. |

## Signing

`/config.tip712` publishes the domain and types. Two signer families:

- EVM and Hedera-ECDSA: sign the EIP-712 typed data. The `Register` type lists the fields
  in a fixed order; `termsVersion` then `slaReceiptRef` are appended only when present, so a
  payload without them stays byte-identical to an older one. `chainId` in the domain comes
  from the signer's `eip155` reference.
- Hedera-Ed25519, XRPL, Solana: sign `sha256(canonicalJson({ kind: "register", payload }))`.
  Hedera applies the WalletConnect `\x19Hedera Signed Message:\n` prefix.

## Payment (x402)

`/config.accepts` is the array of payment rails (one per enabled chain and asset), matching
what a `402` challenge returns. The fee is `registrationPriceUsdCents` (default 1000 = $10).
USD cents is the canonical unit; each rail converts deterministically (USDC is 6 decimals).
Stablecoin only today: USDC (Hedera / Base / Solana / Stellar) and RLUSD (XRPL).

Two payer flows:

- On-chain txHash flow (a human/showroom): pay the treasury, submit the tx hash.
- Agent flow: sign the transfer authorization (for example an EIP-3009
  `transferWithAuthorization`) WITHOUT submitting, put it in the `X-PAYMENT` header; the
  facilitator submits and sponsors gas, and H-Index independently re-verifies the settled
  transfer on chain before writing the listing.

## Free owner updates

Re-registering a URL you already own (same `ownerAccountId`) skips the payment: TIP-712
still verifies, the new envelope still goes on chain, and the previous listing is marked
`supersededBy` the new one. First registration of any URL always costs the fee (spam control).

## After registering

- The listing is discoverable immediately via `GET /endpoints`.
- H-Index scans your `mcpManifest` against the active ruleset and anchors an operator-signed
  verdict; a cadenced liveness probe compares your live `tools/list` to the attested snapshot.
- To keep the listing flagged active in discovery, renew for $5/year (`POST /renew`). Revoke
  is free (`POST /revoke`). Renewal is for active status, not manifest updates; to change the
  manifest, re-register.
