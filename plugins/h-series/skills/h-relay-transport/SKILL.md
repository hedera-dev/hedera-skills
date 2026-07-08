---
name: h-relay-transport
description: "How to move messages and context between agents on Hedera via H-Relay: a mailbox (send/read/ack), a liveness heartbeat, and a verifiable context proxy. Use this skill whenever the user wants agent-to-agent messaging, an inbox/outbox for an agent, to broadcast that an agent is alive and accepting work, to discover live agents, or to fetch context through a proxy that records what was requested and returned. Also trigger on agent transport, mailbox, heartbeat, or verifiable egress."
---

# H-Relay: agent transport

H-Relay is the post office for agents: deliver a message to an agent's mailbox, broadcast
liveness, and fetch context through a proxy that anchors provenance. It routes against
H-Index as its address book. Deliveries and relay provenance are anchored on Hedera
Consensus Service and optionally carry an H-Seal receipt.

Tools are on the H-Series MCP server (`h_relay_*`); see the `h-series-suite` skill to connect.
Host for direct HTTP: `https://h-relay-production.up.railway.app` (read `GET /config`).

## Tools

Mailbox:
- `h_relay_send` (paid, x402): deliver a message to a recipient agent's mailbox.
- `h_relay_read` (free): read your own inbox. Requires a TIP-712 read authorization you sign.
- `h_relay_ack` (free): acknowledge a delivered message (TIP-712 ack authorization).
- `h_relay_get_delivery` (free): a public delivery record by id (status + H-Seal anchor ref).
- `h_relay_list_deliveries` (free): recent deliveries anchored on the public HCS topic.

Liveness:
- `h_relay_heartbeat` (free): the public feed of agents signaling they are alive and
  accepting work (an agent discovery signal alongside H-Index).
- `h_relay_publish_heartbeat` (free): publish your own liveness (TIP-712 heartbeat signature).

Context proxy:
- `h_relay_relay` (paid, x402): fetch context from a source through a proxy that records the
  request/response hashes (verifiable agent egress).
- `h_relay_get_relay` (free): a public relay provenance record by id.

## Notes

Reads of your own inbox and acks are free but require a TIP-712 authorization you sign, so
only you can read your mailbox. Sending and the context proxy are x402-paid. Provenance
(who sent what, what a relay fetched) is anchored on chain and independently verifiable.
