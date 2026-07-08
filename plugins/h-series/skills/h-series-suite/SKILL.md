---
name: h-series-suite
description: "The H-Series is a family of Hedera services for the agentic economy (registry, proof-of-execution, authorization, transport, egress control, standing, rings, wallet posture). Use this skill whenever the user wants to work with any H-Series product (H-Index, H-Seal, H-Grant, H-Relay, H-Gate, H-Cert, H-Pact, H-Scope, H-Agent) or asks how an agent can discover services, prove what it delivered, get a scoped spending authorization, send agent-to-agent messages, gate its data egress, check a principal's standing, manage a membership ring, or scan a wallet's safety posture on Hedera. Start here to connect the hosted MCP server that exposes the whole suite, then pick the product."
---

# The H-Series (Hedera services for agents)

The H-Series is a product family for the agentic economy, built on Hedera Consensus
Service (HCS is the source of truth for every product). You do not integrate each service
separately: one hosted MCP server exposes the whole suite as live, self-describing tools.

## Connect the hosted MCP server (the whole suite)

Point any MCP client at the H-Series MCP server:

```
https://mcp.xr-utilities.ai/mcp        (Streamable HTTP MCP; serverInfo "h-series")
```

Claude Code:

```
claude mcp add --transport http h-series https://mcp.xr-utilities.ai/mcp
```

It exposes 44 tools across 8 products, namespaced by product (`h_index_*`, `h_seal_*`,
`h_grant_*`, `h_relay_*`, `h_gate_*`, `h_cert_*`, `h_pact_*`, `h_scope_*`). Call `tools/list`
for the current, authoritative catalog and each tool's schema; this skill is the map of
when to reach for which product, not a substitute for the live tool definitions.

## Which product for what

Each product has its own focused skill (linked below) for its when-to-use and client-side
flow; this map routes you to the right one.

- **H-Index** (`h_index_*`): the capability registry. Discover agentic services and register
  your own, with a safety scan, liveness, and trust tiers. Skill: `h-index-registry`.
- **H-Seal** (`h_seal_*`): proof-of-execution. Anchor, read, and verify tamper-proof,
  optionally two-party receipts of what a service delivered. Skill: `h-seal-receipts`.
- **H-Grant** (`h_grant_*`): scoped authorization. Give an agent a bounded, owner-signed
  ability to act, not a key. Skill: `h-grant-authorization`.
- **H-Relay** (`h_relay_*`): agent transport. Mailbox, liveness heartbeat, and a verifiable
  context proxy. Routes against H-Index as its address book. Skill: `h-relay-transport`.
- **H-Gate** (`h_gate_*`): data-egress control. Inspect an agent's outbound text and apply
  allow / redact / block (agentic DLP). Skill: `h-gate-egress`.
- **H-Cert** (`h_cert_*`): principal directory + standing. Check a principal's signed behavior
  standing before trusting or delegating to it. Skill: `h-cert-standing`.
- **H-Pact** (`h_pact_*`): membership rings. Owner-signed, on-chain trusted-set membership.
  Skill: `h-pact-rings`.
- **H-Scope** (`h_scope_*`): wallet posture. Score an address's behavioral risk before
  transacting. Skill: `h-scope-posture`.
- **H-Agent** (NOT in the MCP suite): agent runtime identity with an on-chain spend cap (an
  MPC-held key spending only within an owner-signed cap). Its own scoped MCP at
  `https://h-agent.xr-utilities.ai`. Skill: `h-agent-runtime`.

## Two things the tools rely on you to do

The MCP tools relay your request; two cross-cutting flows stay client-side:

- **Writes are signed (TIP-712 / EIP-712).** Any tool that changes state (register, renew,
  revoke, publish a grant, create/admit a ring, publish a heartbeat) carries a signature YOU
  produce over the structured payload. Never raw-sign a bare payload; sign the typed data the
  product's `*_config` tool publishes. The tool relays the signed body; it does not hold your key.
- **Paid tools need x402.** Tools marked Paid (register $10, renew $5, `h_grant_call`,
  `h_gate_inspect`, `h_scope_scan`, `h_pact_create_ring`, `h_relay_relay`) require a one-time
  stablecoin micropayment: USDC (Hedera / Base / Solana / Stellar) or RLUSD (XRPL). You sign a
  transfer authorization the facilitator submits; the service independently re-verifies it on
  chain. Reads and discovery are free.

## Verify, do not trust

Every product writes to HCS. A listing, receipt, grant, ring event, or standing verdict is a
signed on-chain message you can replay from any Hedera mirror node and verify against the
signer's key, without trusting the operator. Live hosts, if you prefer direct HTTP over the
MCP server: `h-index`, `h-seal`, `h-grant`, `h-gate`, `h-cert`, `h-scope` at
`https://h-<name>.xr-utilities.ai`; H-Relay at `https://h-relay-production.up.railway.app`.
Read each product's `GET /config` for its topic id, price, and signing contract.
