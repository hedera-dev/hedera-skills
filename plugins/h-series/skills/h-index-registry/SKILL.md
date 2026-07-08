---
name: h-index-registry
description: "How to discover agentic services (MCP servers, x402-paid APIs, agent tools) and register your own on H-Index, the capability registry for the agentic economy on Hedera. Use this skill whenever the user wants to find an MCP server or agent tool for a task, discover x402-paid APIs, check a service's safety scan / liveness / trust tier before calling it, or publish, list, or register their own MCP server or API so agents can discover it. Also trigger on capability discovery, agent address book, service registry, or listing on Hedera Consensus Service (HCS)."
---

# H-Index: the capability registry for agents

H-Index answers two questions for an autonomous agent: **what services exist for a task**,
and **can I trust this one**. Every listing is an owner-signed registration anchored on
Hedera Consensus Service (HCS is the source of truth; the searchable index is a derivable
cache). Each carries a deterministic manifest-safety scan, a periodic liveness/drift probe,
and a two-axis trust label, all independently verifiable on chain.

Base URL: `https://h-index.xr-utilities.ai`. Read `GET /config` first for the live contract
(registry topic id, price, payment rails, the TIP-712 domain and types). There are two ways
to work with it: the hosted MCP server (easiest for an agent) or direct HTTP.

## Discover a service

### Via the H-Series MCP server (recommended for agents)

Connect to `https://mcp.xr-utilities.ai` (Streamable HTTP MCP) and call `h_index_search`.
It relays the same trust label and filters as the HTTP API.

```
h_index_search({
  q: "real-time weather forecasts",   // omit q for a recent/popular browse
  trust: "observed_clean",            // attested_only | observed_clean | observed_any
  excludeFlags: "vuln,drift,rugpull", // drop listings carrying a safety flag
  paid: "free",                       // free | paid
  tags: "data,weather",
  sort: "recent"                      // recent | popular
})
```

### Via HTTP

```
# Semantic search (add q=); omit q for the recent/popular browse feed.
GET /endpoints?q=weather%20forecasts&trust=observed_clean&excludeFlags=vuln&limit=20

# One listing's full record (with narrative + trust + receipt-anchoring signals):
GET /endpoints/{topicId}/{seq}

# List filter categories:
GET /categories
```

### Reading the result

Every result carries a `trust` label. Read it before calling a service:

- `provenance`: `attested` (owner signed + paid to register, on chain) vs `observed`
  (operator-scanned from a public source, not owner-registered). Attested outranks observed.
- `ownerVerified` / `githubVerified`: the owner proved control of the endpoint host
  (domain-control) or their dev account. `ownerVerified` is the only signal that asserts
  the listing genuinely belongs to that URL, so an unverified `attested` listing is
  "someone signed and paid for this URL", NOT "verified to be that company".
- `flags`: `vuln` / `drift` / `rugpull`, derived from the safety scan and liveness probe.
  A `rugpull` flag means the URL now answers as a different server, or stopped answering.
- `score` (0-100) + `scoreFactors`: an advisory composite of the above. Not a guarantee.
- `receiptAnchoring.badge`: `none` < `attested` (publisher claims H-Seal proof-of-execution)
  < `verified` (H-Index confirmed against the live H-Seal service). See the h-seal-receipts
  skill.

The `mcpManifest` on a listing is the publisher's snapshot of their `tools/list` at signing
time. Live truth is the server itself, so for current capabilities, connect to the endpoint
and call `tools/list` directly.

## Register your own service

Registration is permissionless: sign the listing with your wallet (TIP-712 / EIP-712) and
pay a one-time $10 USDC fee over x402. Re-registering a URL you already own is free.

Fastest path is the MCP tool `h_index_register` (it carries the same body fields plus the
x402 payment header). To do it directly:

1. `GET /config` and read `registryTopicId`, `registrationPriceUsdCents`, `accepts` (the
   x402 payment rails), and `tip712` (the domain and Register type to sign).
2. Build the register payload (see `references/register-contract.md` for every field).
3. Sign it: EVM and Hedera-ECDSA sign the EIP-712 typed data; Hedera-Ed25519, XRPL, and
   Solana sign SHA-256 over canonical JSON of `{ kind: "register", payload }`.
4. Pay the $10 USDC x402 challenge and `POST /register` with the signature and the
   `X-PAYMENT` header. The signed envelope goes on chain; the listing is live immediately.

Optional but worth it:

- `mcpManifest`: your server's `tools/list` snapshot (a JSON object like `{ "tools": [...] }`),
  so discovery shows what your server exposes. Max 32 KB.
- `slaReceiptRef`: where you anchor H-Seal proof-of-execution receipts. Earns the
  receipt-anchoring badge in discovery (see the h-seal-receipts skill).
- Domain-control proof (`POST /claim/challenge` then `/claim/verify`): publish a token at
  `https://<host>/.well-known/h-index-challenge` or a DNS TXT record to earn the
  `verified owner` tier.

## Verify without trusting the operator

Every listing is a signed HCS message. Fetch the message at its `consensusTimestamp` from
any Hedera mirror node, verify the TIP-712 signature against the owner's public key, and you
have verified the listing without trusting H-Index. The safety and liveness verdicts are
operator-signed and reproducible under the named scanner version (`GET /config` -> the
ruleset topic).
