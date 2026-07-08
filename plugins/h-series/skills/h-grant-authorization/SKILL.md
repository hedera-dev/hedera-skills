---
name: h-grant-authorization
description: "How to give an agent a scoped, owner-signed authorization to act on your behalf via H-Grant, without handing over a key or credential. Use this skill whenever the user wants to delegate a bounded capability to an agent or grantee, publish or revoke a grant, let an agent spend or call a service within owner-set limits, or release a stored credential's capability. Also trigger on agent authorization, delegated action, capability grant, or 'let my agent do X but only within these limits' on Hedera."
---

# H-Grant: scoped authorization for agents

H-Grant lets an owner delegate a bounded capability to a grantee (an agent, a service, a
person) without giving up a key. The owner publishes a signed grant that names the grantee
and the exact actions and limits; the grantee later exercises it, and H-Grant uses the
owner's stored credential to perform the action strictly within the grant. Every grant and
release is anchored on Hedera Consensus Service.

Tools are on the H-Series MCP server (`h_grant_*`); see the `h-series-suite` skill to connect.
Host for direct HTTP: `https://h-grant.xr-utilities.ai` (read `GET /config`).

## Tools

- `h_grant_config` (free): audit/grant topic ids, the per-release price, signing contract.
- `h_grant_publish` (free): publish an owner-signed grant authorizing a grantee to take
  specific actions within limits. Owner signs the grant body (TIP-712); it goes on chain.
- `h_grant_revoke` (free): revoke a grant you own. Owner signs the revocation body.
- `h_grant_call` (paid, x402): release the granted capability (`POST /call/{vaultId}`).
  H-Grant uses the owner's stored credential to perform the action within the grant's limits,
  and can fold an H-Seal proof-of-execution receipt of the call.

## Flow

1. Owner: `h_grant_publish` with a grant signed (TIP-712) over { grantee, actions, limits }.
2. Grantee/agent: `h_grant_call` to exercise it. The call is x402-paid; H-Grant enforces the
   grant's limits server-side and performs the action with the owner's stored credential, so
   the grantee never holds the key.
3. Each call can anchor an H-Seal receipt (caller + provider), so what was released is provable.
4. Owner: `h_grant_revoke` to end it. Both publish and revoke are owner-signed and on chain.

Non-custodial by design: the grantee gets a bounded capability, not a credential. The limits
live in the signed, anchored grant, so they are verifiable and cannot be silently widened.
