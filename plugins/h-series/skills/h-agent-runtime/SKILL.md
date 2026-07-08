---
name: h-agent-runtime
description: "How to give an autonomous agent a runtime identity and a capped, non-custodial spending ability via H-Agent: the agent holds an MPC key and can only spend within an owner-signed on-chain cap. Use this skill whenever the user wants to let an agent pay for things or buy on its own within a budget, provision an agent identity with a spend limit, check an agent's remaining allowance, or set up non-custodial agent spending. Also trigger on agent wallet, agent spend cap, capped autonomous payments, or 'give my agent money to act' on Hedera."
---

# H-Agent: agent runtime identity with a spend cap

H-Agent gives an agent its own identity and the ability to spend non-custodially, bounded by
a cap the owner signs on chain. The agent holds an MPC-held key (no human holds a raw private
key) and can only transact within the owner-signed cap, so an autonomous agent can pay for
resources or buy from merchants on its own without being trusted with unbounded funds.

Unlike the other products, H-Agent is NOT on the shared H-Series MCP server. Each provisioned
agent gets its OWN scoped MCP connection.

## Provision (owner) then connect (agent)

1. Owner provisions an agent at `https://h-agent.xr-utilities.ai` (`POST /agents/provision`,
   OIDC-owner-bound), setting the on-chain spend cap. This returns a scoped MCP connection
   string with a bearer token tied to that agent.
2. The agent connects to `https://h-agent.xr-utilities.ai/mcp` with the bearer token. The MCP
   server is built scoped to that consumer, so its tools only act as that agent, within its cap.

## Tools (per-agent, scoped)

- `who_am_i`: the agent's identity, its owner, and its cap.
- `quote`: price a prospective spend before committing.
- `pay`: make a payment within the cap (non-custodial, via the MPC-held key).
- `purchase`: buy from an x402 merchant within the cap.
- `remaining_cap`: how much of the owner-signed cap is left.

## Notes

The cap is signed by the owner and enforced on chain, so the agent cannot exceed it and the
limit is verifiable. A take-rate fee applies on merchant spend (read `GET /config`, `fee`).
Pair with `h-scope-posture` to check a counterparty before paying, and with `h-seal-receipts`
to prove what the agent bought.
