---
name: h-pact-rings
description: "How to manage a membership ring (a trusted set of members with on-chain, owner-signed membership and policy) via H-Pact. Use this skill whenever the user wants to create a trusted group or allowlist of agents/accounts, admit or evict members, set or update a ring policy, renew a membership, or check who is in a ring. Also trigger on membership registry, trusted set, allowlist, consortium, or ring governance on Hedera."
---

# H-Pact: membership rings

H-Pact is a registry of trusted sets. A ring has an owner, a governance mode, a policy
document, and members with expiries. It is the membership twin of H-Index: where H-Index
registers services, H-Pact registers who belongs to a trusted group. Every ring event
(create, admit, evict, policy update, renew) is owner-signed and anchored on Hedera
Consensus Service, so membership is verifiable and tamper-evident.

Tools are on the H-Series MCP server (`h_pact_*`); see the `h-series-suite` skill to connect.
Host for direct HTTP: `https://h-pact.xr-utilities.ai` (read `GET /config`).

## Tools

- `h_pact_config` (free): the ring HCS topic id, the ring-create price, signing contract.
- `h_pact_get_ring` (free): a ring's public metadata (owner, governance mode, policy version,
  member set).
- `h_pact_create_ring` (paid, x402): create a ring you own.
- `h_pact_admit` (free): admit a member to a ring you own (owner-signed, recorded on chain).
- `h_pact_evict` (free): evict a member (owner-signed, recorded on chain).
- `h_pact_update_policy` (free): update the ring's policy document (owner-signed; bumps the
  policy version).
- `h_pact_renew` (free): renew a member's membership to a new expiry (owner-signed).

## Notes

Creating a ring is the only paid step (x402); membership management is free but every write
is owner-signed, so only the ring owner can admit, evict, or change policy. A consumer reads
the ring from chain and verifies each membership event against the owner's key. Use it as an
allowlist an agent can check, or a consortium's shared, verifiable membership record.
