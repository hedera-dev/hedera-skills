---
name: h-scope-posture
description: "How to scan an on-chain wallet or address for behavioral signals and an entity-posture score via H-Scope, before transacting with or trusting it. Use this skill whenever the user wants to assess an address's risk or safety, check a counterparty wallet before sending funds, get a behavioral read on an account, or add a safety gate ahead of a payment. Also trigger on wallet risk, address reputation, entity posture, or 'is this wallet safe to transact with' across chains."
---

# H-Scope: wallet behavior and posture

H-Scope scans a single on-chain address and returns deterministic behavioral signals plus an
entity-posture score: a safety read an agent can consult before it transacts. It is a
standing safety input for the rest of the suite (a payment path can check posture before
releasing funds). Multi-chain.

Tools are on the H-Series MCP server (`h_scope_*`); see the `h-series-suite` skill to connect.
Host for direct HTTP: `https://h-scope.xr-utilities.ai` (read `GET /config`).

## Tools

- `h_scope_config` (free): the per-scan price, supported chains, and scan options.
- `h_scope_scan` (paid, x402): scan an address for behavioral signals and an entity-posture
  score. Pass the chain and address; get back the signals and score.

## When to use

Call `h_scope_scan` before sending funds to, or delegating to, an unfamiliar address, and
gate the action on the posture score. It is advisory (a risk read, not a guarantee), so treat
a poor score as a reason to pause or require review, not an automatic block. Pair it with
`h-cert-standing` (principal-level standing) for identity-plus-behavior coverage.
