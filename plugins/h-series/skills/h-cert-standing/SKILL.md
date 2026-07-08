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

Tools are on the H-Series MCP server (`h_cert_*`); see the `h-series-suite` skill to connect.
Host for direct HTTP: `https://h-cert.xr-utilities.ai` (read `GET /config`).

## Tools

- `h_cert_config` (free): the standing HCS topic id, ruleset version, and read mode.
- `h_cert_standing` (free): the current signed STANDING verdict for a subject (advisory).
- `h_cert_resolve` (free): resolve whether a subject clears a caller's stated trust
  requirements (a yes/no against your bar, not just the raw verdict).
- `h_cert_principals` (free): list an owner's principal directory (the named
  grantees/counterparties they track).

## When to use

Before delegating a capability (see the `h-grant-authorization` skill) or transacting with a
counterparty, call `h_cert_resolve` with your trust requirements, or read `h_cert_standing`
for the raw verdict. Because standing is signed and anchored, you can verify it against the
signer's key rather than trusting the operator. Pair it with `h-scope-posture` (wallet-level
posture) for a fuller safety picture.
