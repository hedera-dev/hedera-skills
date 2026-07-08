---
name: h-gate-egress
description: "How to inspect and control data an agent is about to send across a boundary via H-Gate (agentic DLP): allow, redact, or block. Use this skill whenever the user wants to check an agent's outbound text for sensitive data before it leaves, prevent secret or PII leakage, apply a data-egress policy, or gate what an agent transmits to a third party. Also trigger on data loss prevention, egress control, redaction, or 'stop my agent from leaking X' on Hedera."
---

# H-Gate: data-egress control

H-Gate is the checkpoint on an agent's outbound data. Before an agent sends text across a
trust boundary (to a third-party API, a user, another agent), H-Gate inspects it against a
policy and returns a verdict: allow, redact (return the text with sensitive spans removed),
or block. The decision produces an H-Seal receipt, so what was gated is provable.

Tools are on the H-Series MCP server (`h_gate_*`); see the `h-series-suite` skill to connect.
Host for direct HTTP: `https://h-gate.xr-utilities.ai` (read `GET /config`).

## Tools

- `h_gate_config` (free): the per-inspect price and accepted x402 payment rails.
- `h_gate_inspect` (paid, x402): inspect the text an agent is about to send and apply the
  policy. Returns the verdict (allow / redact / block) and, for redact, the sanitized text.

## Flow

Call `h_gate_inspect` with the candidate outbound text just before it leaves the agent. Act
on the verdict: send as-is on allow, send the sanitized version on redact, or drop it on
block. The verdict is receipted via H-Seal, so a downstream party or an audit can verify the
egress decision. Treat it as an enforcement point in the agent's send path, not an advisory.
