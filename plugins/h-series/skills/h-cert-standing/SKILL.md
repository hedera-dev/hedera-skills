---
name: h-cert-standing
description: "How to check a principal's behavior standing and resolve trust requirements via H-Cert before delegating to or transacting with it. Use this skill whenever the user wants to look up whether a counterparty or agent is in good standing, resolve whether a subject clears a caller's trust bar, maintain a named directory of grantees/counterparties, or read a signed reputation/standing verdict. Also trigger on principal directory, behavior standing, counterparty trust, or delegation check on Hedera."
---

# H-Cert: principal directory and standing

H-Cert answers "should I trust this principal". It maintains a named directory of principals
(an owner's grantees and counterparties) and issues an advisory, operator-signed STANDING
verdict for a subject, derived from its on-chain behavior across the H-Series. It is
advisory, not enforcing: it informs a trust decision, it does not block anything (a
deliberate liability firewall). Verdicts are anchored on Hedera Consensus Service.

Standing RISES with a clean track record and DEGRADES on risky behavior (Agent Behavioral
Standing). Risk events from the action-path products (a grant cap trip, a blocked data
egress, a reach to a known-bad host, a drain/rugpull wallet shape, an agent spend spike) fold
into a decayed risk load that can lower a subject's tier (at most to `suspended`, never
`revoked`), then relaxes as the risk decays. This is REPUTATION (detected real behavior), not
a rating or prediction. The public, free "Agent Track Record" card renders it for any agent,
reconstructible from the public Hedera topics.

Tools are on the H-Series MCP server (`h_cert_*`, `h_index_risk_events`); see the
`h-series-suite` skill to connect. Host for direct HTTP: `https://h-cert.xr-utilities.ai`
(read `GET /config`).

## Tools

- `h_cert_config` (free): the standing HCS topic id, ruleset version, and read mode.
- `h_cert_standing` (free): the current signed STANDING verdict for a subject (advisory).
- `h_cert_resolve` (free): resolve whether a subject clears a caller's stated trust
  requirements (a yes/no against your bar, not just the raw verdict).
- `h_cert_principals` (free): list an owner's principal directory (the named
  grantees/counterparties they track).
- `h_index_risk_events` (free): the subject's recent risk events (the contributing signals
  behind a degraded standing), read from the public H-Index audit index.

## When to use

Before delegating a capability (see the `h-grant-authorization` skill) or transacting with a
counterparty, call `h_cert_resolve` with your trust requirements, or read `h_cert_standing`
for the raw verdict. Because standing is signed and anchored, you can verify it against the
signer's key rather than trusting the operator. Pair it with `h-scope-posture` (wallet-level
posture) for a fuller safety picture.
