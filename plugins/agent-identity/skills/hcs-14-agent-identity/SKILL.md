---
name: hcs-14-agent-identity
description: "HCS-14 agent identity, registration, and discovery on Hedera. Use this skill whenever the user wants to give an AI agent an on-chain identity, register an agent or provider to an HCS registry topic, discover agents by reading registry topics via the Mirror Node REST API, generate or parse Universal Agent IDs (UAIDs), or bridge Hedera agent identity to ERC-8004, A2A, or x402 for interop. Also trigger when users mention HCS-14, UAID, agent identity on Hedera, agent discovery, agent registry topics, HCS-2 registries, agent metadata on Hedera, or on-chain agent identity."
---

# HCS-14 Agent Identity, Registration & Discovery

HCS-14 is the **Universal Agent ID (UAID)** standard for generating globally unique identifiers for AI agents using the W3C Decentralized Identifier (DID) framework. It enables consistent agent identification across web2 APIs, web3 protocols, and hybrid systems, with routing information embedded directly in the identifier so agent discovery and communication are seamless across protocol boundaries.

On Hedera, HCS-14 works with **HCS-2 Topic Registries** — an HCS topic acts as an append-only registry where agents register their identity metadata, and anyone can discover them by reading the topic back through the Mirror Node REST API.

## Why Agents Need On-Chain Identity

AI agents are proliferating across platforms, each with its own identification system. Without a portable, verifiable identity:

- An agent's reputation resets every time it enters a new environment.
- There's no censorship-resistant way to discover agents across organizational boundaries.
- No machine-readable layer for "who is this agent, what can it do, and can it be trusted?"

HCS-14 solves this by giving every agent a **deterministic, portable identifier** (UAID) that resolves to on-chain metadata, and a **registry topic** where agent registrations are immutably recorded with consensus timestamps.

## UAID Format

HCS-14 defines two identifier targets sharing one grammar:

```
uaid:{aid|did}:{id};{parameters}
```

### AID Target (Registry-Generated, Deterministic)

```
uaid:aid:{base58hash};uid={uid};registry={registry};proto={protocol};nativeId={nativeId};domain={domain}
```

The `{id}` is a **Base58-encoded SHA-384 hash** of canonical JSON containing exactly six fields:

```json
{
  "registry": "hedera",
  "name": "Trading Bot Alpha",
  "version": "1.0.0",
  "protocol": "hcs-10",
  "nativeId": "hedera:testnet:0.0.123456",
  "skills": [0, 17]
}
```

- `registry` — lowercase, trimmed (e.g. `hedera`, `hol`, `olas`, `self`)
- `name` — human-readable agent name (trimmed)
- `version` — semantic version string
- `protocol` — protocol identifier (e.g. `hcs-10`, `a2a`, `mcp`)
- `nativeId` — protocol-native unique identifier (CAIP-10 where applicable; for Hedera: `hedera:{network}:{account}`)
- `skills` — array of numeric skill IDs from [0–39] (core) or [100+] (OASF). Range [40–99] is reserved and must be rejected. Sorted ascending.

**Canonicalization rules**: lowercase + trim `registry` and `protocol`; trim all string fields; sort JSON keys lexicographically; sort `skills` numerically ascending; SHA-384 the UTF-8 canonical JSON; Base58-encode the hash.

The hash uses **only** these six fields — communication details (endpoints, topic IDs) are excluded so the same agent always generates the same AID regardless of endpoint changes.

### DID Target (Self-Sovereign)

```
uaid:did:{methodSpecificId};uid={uid};registry={registry};proto={protocol};nativeId={nativeId};domain={domain};src={multibase58btc}
```

Wraps an existing W3C DID (e.g. `did:hedera:testnet:0.0.1234`, `did:web:agent.example`). No new hash is computed — the `{id}` is the sanitized method-specific identifier of the base DID. The `src` parameter is included when sanitization stripped suffixes (`;`, `?`, `#`) from the base DID.

### Parameter Summary

| Parameter | Required | Description |
|-----------|----------|-------------|
| `uid` | Yes (`"0"` if N/A) | Unique ID within the registry. For HCS-10 on Hedera: `inboundTopicId@accountId` when available, else `accountId`. |
| `registry` | No | Organizational namespace (e.g. `hedera`, `hol`, `olas`, `self`) |
| `proto` | No | Protocol identifier (e.g. `hcs-10`, `a2a`, `mcp`) |
| `nativeId` | No | Protocol-native unique ID (CAIP-10 for Hedera: `hedera:testnet:0.0.1234`) |
| `domain` | No | Domain identifier (e.g. `foo.hbar`, `alice.btc`) |
| `src` | `uaid:did` only | Multibase base58btc of the full source DID when sanitized |

Parameters are ordered: `uid`, `registry`, `proto`, `nativeId`, `domain` (then optional `src`).

See [references/uaid-format.md](references/uaid-format.md) for parsing, validation, and generation details.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     HCS Registry Topic                       │
│                   (HCS-2 append-only registry)               │
│                                                             │
│  msg #1: { "p":"hcs-2","op":"register","t_id":"0.0.789",...}│
│  msg #2: { "p":"hcs-2","op":"register","t_id":"0.0.790",...}│
│  msg #3: { "p":"hcs-2","op":"update","o_id":"1",...}        │
│                                                             │
│  Read via Mirror Node REST API → /api/v1/topics/{id}/messages│
└─────────────────────────────────────────────────────────────┘
        ▲                                          │
        │ submit registration                      │ query messages
        │                                          ▼
┌───────────────┐                         ┌──────────────────┐
│  Agent Owner  │                         │   Discoverer     │
│  (operator)   │                         │  (agent or app)  │
│               │                         │                  │
│  1. Create    │                         │  1. GET messages │
│     registry  │                         │  2. Parse HCS-2  │
│     topic     │                         │     ops          │
│  2. Generate  │                         │  3. Resolve      │
│     UAID      │                         │     agent topics │
│  3. Register  │                         │  4. Read HCS-11  │
│     agent     │                         │     profiles     │
│  4. Create    │                         │                  │
│     profile   │                         │                  │
│     topic     │                         │                  │
│     (HCS-11)  │                         │                  │
└───────────────┘                         └──────────────────┘
```

## Setup

All SDK imports come from `@hiero-ledger/sdk` (formerly `@hashgraph/sdk`).

```js
import { Client, AccountId, PrivateKey } from "@hiero-ledger/sdk";

const client = Client.forName(process.env.HEDERA_NETWORK) // "testnet" or "mainnet"
    .setOperator(
        AccountId.fromString(process.env.OPERATOR_ID),
        PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY),
    );
```

## 1. Creating an HCS Registry Topic

An HCS registry topic is a standard HCS topic used as an **HCS-2 Topic Registry** — an append-only log where each message is a structured JSON operation (`register`, `update`, `delete`, `migrate`).

```js
import { TopicCreateTransaction, PrivateKey } from "@hiero-ledger/sdk";

const adminKey = PrivateKey.generateECDSA();
const submitKey = PrivateKey.generateECDSA();

const { topicId } = await (
    await new TopicCreateTransaction()
        .setTopicMemo("HCS-14 Agent Registry — testnet")
        .setAdminKey(adminKey.publicKey)
        .setSubmitKey(submitKey.publicKey)
        .execute(client)
).getReceipt(client);

console.log(`Registry topic: ${topicId.toString()}`);
// Keep adminKey and submitKey — needed to update/delete and to post registrations
```

**Key behaviors**:
- `adminKey` — required to update or delete the topic. Without it, the topic is immutable.
- `submitKey` — restricts who can post registrations. Use it for curated registries. Omit it for open registries where any agent can self-register.
- The topic memo should identify it as an HCS-14 registry so indexers can discover it.

## 2. Generating a UAID

### AID Method (Deterministic Hash)

```js
import crypto from "node:crypto";
import bs58 from "bs58";

/**
 * Canonicalize agent data per HCS-14 rules:
 * - lowercase + trim registry and protocol
 * - trim all string fields
 * - sort JSON keys lexicographically
 * - sort skills numerically ascending
 */
function canonicalizeAgentData(data) {
    const normalized = {
        name: data.name.trim(),
        nativeId: data.nativeId.trim(),
        protocol: data.protocol.trim().toLowerCase(),
        registry: data.registry.trim().toLowerCase(),
        skills: [...data.skills].sort((a, b) => a - b),
        version: data.version.trim(),
    };
    // JSON.stringify with sorted keys
    return JSON.stringify(
        Object.fromEntries(
            Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b))
        )
    );
}

/**
 * Generate a uaid:aid:{base58hash} from canonical agent data.
 */
function generateAid(data) {
    const canonical = canonicalizeAgentData(data);
    const hash = crypto.createHash("sha384").update(canonical, "utf8").digest();
    return bs58.encode(hash);
}

// Example
const agentData = {
    registry: "hedera",
    name: "Trading Bot Alpha",
    version: "1.0.0",
    protocol: "hcs-10",
    nativeId: "hedera:testnet:0.0.123456",
    skills: [0, 17],  // Text Generation + API Integration
};

const aidHash = generateAid(agentData);
const uaid = `uaid:aid:${aidHash};uid=trading-bot-alpha;registry=hedera;proto=hcs-10;nativeId=hedera:testnet:0.0.123456`;
console.log(`UAID: ${uaid}`);
```

### Using the Standards SDK

For production use, the `@hashgraphonline/standards-sdk` provides a `HCS14Client`:

```ts
import { HCS14Client } from "@hashgraphonline/standards-sdk";

const hcs14 = new HCS14Client();

// AID from canonical agent data
const aid = await hcs14.createUaid(
    {
        registry: "hedera",
        name: "Trading Bot Alpha",
        version: "1.0.0",
        protocol: "hcs-10",
        nativeId: "hedera:testnet:0.0.123456",
        skills: [0, 17],
    },
    { uid: "trading-bot-alpha" }
);

// UAID from an existing DID
const didUaid = hcs14.createUaid("did:hedera:testnet:0.0.123456", {
    uid: "trading-bot-alpha",
    proto: "hcs-10",
    nativeId: "hedera:testnet:0.0.123456",
});
```

## 3. Registering an Agent Identity

Registration submits an **HCS-2 `register` operation** to the registry topic. The message includes the agent's UAID, a reference to the agent's HCS-11 profile topic, and metadata.

### Agent Registration Message Format

```json
{
  "p": "hcs-2",
  "op": "register",
  "t_id": "0.0.789101",
  "metadata": "hcs://1/0.0.789101",
  "m": "Trading Bot Alpha v1.0.0 — uaid:aid:QmX...;uid=trading-bot-alpha;registry=hedera;proto=hcs-10;nativeId=hedera:testnet:0.0.123456"
}
```

| Field | Description |
|-------|-------------|
| `p` | Protocol identifier — always `"hcs-2"` |
| `op` | Operation — `"register"`, `"update"`, `"delete"`, or `"migrate"` |
| `t_id` | The agent's profile topic ID (HCS-11 profile topic) |
| `metadata` | Optional URI to the agent's metadata (e.g. `hcs://1/{topicId}`) |
| `m` | Optional memo — include the UAID here for indexer discoverability |

### Full Registration Flow

```js
import {
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";

// --- Step 1: Create the agent's HCS-11 profile topic ---
const { topicId: profileTopicId } = await (
    await new TopicCreateTransaction()
        .setTopicMemo("HCS-11 Profile — Trading Bot Alpha")
        .setAdminKey(operatorKey)
        .setSubmitKey(operatorKey)
        .execute(client)
).getReceipt(client);

console.log(`Profile topic: ${profileTopicId.toString()}`);

// --- Step 2: Submit the HCS-11 profile message to the profile topic ---
const profile = {
    version: "1.0",
    type: 1,  // 1 = AGENT (HCS-10 type)
    display_name: "Trading Bot Alpha",
    uaid: uaid,  // the UAID generated above
    inboundTopicId: profileTopicId.toString(),
    outboundTopicId: profileTopicId.toString(),  // can be a separate topic
    bio: "Autonomous trading agent for HBAR/USDC pairs",
    capabilities: ["text-generation", "api-integration"],
    ai_model: "gpt-4o",
    skills: [0, 17],
};

await (
    await new TopicMessageSubmitTransaction()
        .setTopicId(profileTopicId)
        .setMessage(JSON.stringify(profile))
        .execute(client)
).getReceipt(client);

// --- Step 3: Register the agent on the HCS-14 registry topic ---
const registration = {
    p: "hcs-2",
    op: "register",
    t_id: profileTopicId.toString(),
    metadata: `hcs://1/${profileTopicId.toString()}`,
    m: `Trading Bot Alpha v1.0.0 — ${uaid}`,
};

const submitTx = new TopicMessageSubmitTransaction()
    .setTopicId(registryTopicId)
    .setMessage(JSON.stringify(registration));

// If the registry topic has a submit key, freeze and sign:
if (registrySubmitKey) {
    await submitTx.freezeWith(client);
    await submitTx.sign(registrySubmitKey);
}

const response = await submitTx.execute(client);
const receipt = await response.getReceipt(client);
console.log(`Agent registered! Sequence: ${receipt.topicSequenceNumber}`);
```

See [examples/register-agent.ts](examples/register-agent.ts) for a complete runnable script.

## 4. Discovering Agents via Mirror Node REST API

The registry topic is an append-only log. Discovery means reading all messages from the topic, parsing HCS-2 operations, and resolving agent profiles.

### curl (Mirror Node REST API)

```bash
# Get all messages from the registry topic (paginated)
curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.123456/messages?limit=100&order=asc" \
  | jq '.messages[] | {
      sequence: .sequence_number,
      timestamp: .consensus_timestamp,
      content: (.message | @base64d | fromjson)
    }'
```

### JavaScript (fetch)

```js
const MIRROR_NODE = "https://testnet.mirrornode.hedera.com/api/v1";

async function discoverAgents(registryTopicId) {
    const agents = [];
    let url = `${MIRROR_NODE}/topics/${registryTopicId}/messages?limit=100&order=asc`;

    while (url) {
        const res = await fetch(url);
        const data = await res.json();
        const messages = data.messages || [];

        for (const msg of messages) {
            // message field is base64-encoded
            const content = JSON.parse(
                Buffer.from(msg.message, "base64").toString("utf8")
            );

            // Only process HCS-2 register operations
            if (content.p === "hcs-2" && content.op === "register") {
                agents.push({
                    sequence: msg.sequence_number,
                    timestamp: msg.consensus_timestamp,
                    profileTopicId: content.t_id,
                    metadata: content.metadata,
                    memo: content.m,
                    // Extract UAID from the memo if present
                    uaid: extractUaidFromMemo(content.m),
                });
            }
        }

        // Follow pagination link
        url = data.links?.next || null;
    }

    return agents;
}

function extractUaidFromMemo(memo) {
    if (!memo) return null;
    const match = memo.match(/uaid:(aid|did):[^\s]+/);
    return match ? match[0] : null;
}

const agents = await discoverAgents("0.0.123456");
console.log(`Discovered ${agents.length} agents:`);
for (const agent of agents) {
    console.log(`  #${agent.sequence} — ${agent.uaid} → profile topic ${agent.profileTopicId}`);
}
```

### Resolving Agent Profiles

Once you have a profile topic ID from a registration entry, read the HCS-11 profile:

```js
async function resolveAgentProfile(profileTopicId) {
    const url = `${MIRROR_NODE}/topics/${profileTopicId}/messages?limit=1&order=asc`;
    const res = await fetch(url);
    const data = await res.json();
    const messages = data.messages || [];
    if (messages.length === 0) return null;

    const profile = JSON.parse(
        Buffer.from(messages[0].message, "base64").toString("utf8")
    );
    return profile;
}

const profile = await resolveAgentProfile("0.0.789101");
console.log(`Name: ${profile.display_name}`);
console.log(`UAID: ${profile.uaid}`);
console.log(`Inbound: ${profile.inboundTopicId}`);
console.log(`Skills: ${profile.skills}`);
```

See [examples/discover-agents.ts](examples/discover-agents.ts) for a complete discovery script and [references/mirror-node-discovery.md](references/mirror-node-discovery.md) for full endpoint details.

## 5. Provider / Operator Registration

A **provider** (also called an operator) is an entity that runs one or more agents. Providers register themselves to the registry topic so that agents can be attributed and trust can be computed at the operator level.

### Provider Registration Message

```json
{
  "p": "hcs-2",
  "op": "register",
  "t_id": "0.0.888888",
  "metadata": "hcs://1/0.0.888888",
  "m": "PROVIDER: Acme AI Services — operator account 0.0.555111"
}
```

The provider profile (on its own topic) uses HCS-11 with `type: 2` (PROVIDER/SERVER):

```json
{
  "version": "1.0",
  "type": 2,
  "display_name": "Acme AI Services",
  "uaid": "uaid:aid:QmY...;uid=acme-ai;registry=hedera;proto=hcs-10;nativeId=hedera:testnet:0.0.555111",
  "inboundTopicId": "0.0.888888",
  "outboundTopicId": "0.0.888889",
  "bio": "Provider of autonomous trading and analysis agents on Hedera",
  "managed_agents": ["0.0.789101", "0.0.789102"]
}
```

See [examples/register-provider.ts](examples/register-provider.ts) for the full flow.

## 6. Capability / Service Descriptor Format

Agent capabilities are advertised in two places:

1. **UAID `skills` array** — numeric skill IDs (HCS-14 core skills 0–19, protocol-specific 20–39, OASF 100+). These are part of the canonical hash, so they're stable.
2. **HCS-11 profile** — richer descriptors including string capability names, endpoints, and payment terms.

### HCS-14 Core Skills (0–19)

| Value | Skill | Description |
|-------|-------|-------------|
| 0 | Text Generation | Generate human-like text |
| 4 | Code Generation | Generate and modify code |
| 7 | Knowledge Retrieval | Access and reason over structured data |
| 11 | Smart Contract Audit | Evaluate blockchain code for security |
| 16 | Multi-Agent Coordination | Orchestrate multiple agent interactions |
| 17 | API Integration | Connect with external systems |
| 18 | Workflow Automation | Automate routine tasks |
| 19 | Real-time Communication | Live messaging and interaction |

### Protocol-Specific Skills (20–39)

| Value | Skill | Description |
|-------|-------|-------------|
| 20 | Resource Provider | Expose data resources (MCP) |
| 25 | Web Access | Browse and analyze web content |

### Service Descriptor in HCS-11 Profile

```json
{
  "version": "1.0",
  "type": 1,
  "display_name": "Trading Bot Alpha",
  "uaid": "uaid:aid:QmX...;uid=trading-bot-alpha;registry=hedera;proto=hcs-10;nativeId=hedera:testnet:0.0.123456",
  "inboundTopicId": "0.0.789101",
  "outboundTopicId": "0.0.789102",
  "skills": [0, 17],
  "capabilities": ["text-generation", "api-integration", "trade-execution"],
  "endpoints": {
    "a2a": "https://agent.example.com/.well-known/agent.json",
    "mcp": "https://agent.example.com/mcp"
  },
  "payment": {
    "x402": true,
    "asset": "0.0.0",
    "network": "hedera:testnet",
    "price_per_call": "100000000"
  },
  "ai_model": "gpt-4o"
}
```

## 7. Bridging to ERC-8004, A2A, and x402

HCS-14 is designed for cross-protocol interop. The UAID's `proto` and `nativeId` parameters carry routing information that lets other protocols resolve the same agent.

### ERC-8004 (EVM Agent Registries)

ERC-8004 is an Ethereum standard for trustless agent discovery using on-chain ERC-721 identity registries. Each agent is an NFT with a `agentURI` pointing to an off-chain registration file. The global agent ID format is:

```
eip155:{chainId}:{identityRegistry}:{agentId}
```

**Bridge mapping**:

| HCS-14 | ERC-8004 |
|--------|----------|
| UAID (`uaid:aid:...`) | `agentRegistry` string (`eip155:{chainId}:{registry}:{tokenId}`) |
| HCS registry topic | ERC-721 Identity Registry contract |
| HCS-2 register op | ERC-721 mint + `tokenURI` set |
| HCS-11 profile topic | `agentURI` → off-chain registration file |
| `skills` array | `skills` array in registration file (OASF-aligned) |
| `nativeId` (Hedera CAIP-10) | `registrations[]` cross-chain entry |

An agent registered on both HCS-14 and ERC-8004 can list its EVM identity in the HCS-11 profile's `registrations` array and vice versa:

```json
{
  "registrations": [
    { "agentId": 4471, "agentRegistry": "eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" }
  ]
}
```

See [references/erc-8004-bridge.md](references/erc-8004-bridge.md) for the full mapping and bidirectional bridge patterns.

### A2A (Agent-to-Agent Protocol)

Google's A2A protocol uses `/.well-known/agent.json` for agent cards. HCS-14 bridges to A2A by:

1. Hosting the `agent.json` at the endpoint specified in the UAID's `domain` or in the HCS-11 profile's `endpoints.a2a`.
2. Including the UAID in the `agent.json` `did` field:

```json
{
  "name": "Trading Bot Alpha",
  "did": "uaid:aid:QmX...;uid=trading-bot-alpha;registry=hedera;proto=a2a;nativeId=agent.example.com",
  "version": "1.0.0",
  "capabilities": [...],
  "url": "https://agent.example.com"
}
```

The `nativeId` for A2A is the domain hosting the `agent.json`.

### x402 (Pay-Per-Use Payments)

x402 and HCS-14 are complementary but kept separate:

- **HCS-14** handles **identity and discovery** — who the agent is and where to find it.
- **x402** handles **payment evidence** — HTTP 402 challenges, signed transfers, and settlement receipts.

The HCS-11 profile can advertise x402 support in its `payment` block, but the actual x402 receipts (verify/settle) are kept as **separate lifecycle evidence** — not embedded in the registry topic. This separation is intentional:

- Identity registration, discovery, and payment evidence stay in separate concerns.
- Trust/reputation is computed **downstream** from those typed claims — the registry provides identity, x402 provides payment proof, and reputation systems aggregate both.

## Common Patterns

### Multiple Agents, One Registry

A single registry topic can hold registrations for many agents. Each `register` op links to a different profile topic:

```js
// Register multiple agents to the same registry
for (const agent of agents) {
    const registration = {
        p: "hcs-2",
        op: "register",
        t_id: agent.profileTopicId,
        metadata: `hcs://1/${agent.profileTopicId}`,
        m: `${agent.name} — ${agent.uaid}`,
    };
    await new TopicMessageSubmitTransaction()
        .setTopicId(registryTopicId)
        .setMessage(JSON.stringify(registration))
        .execute(client);
}
```

### Updating an Agent Registration

Use the HCS-2 `update` operation to point to a new profile topic (e.g. after rotating keys):

```json
{
  "p": "hcs-2",
  "op": "update",
  "o_id": "1",
  "t_id": "0.0.999999",
  "m": "Updated profile topic for Trading Bot Alpha v1.1.0"
}
```

`o_id` references the sequence number of the original `register` message.

### Filtering by Skill During Discovery

```js
const agents = await discoverAgents(registryTopicId);
const codeGenerators = agents.filter(a =>
    a.skills?.includes(4)  // Code Generation skill
);
```

## Separation of Concerns (Key Design Principle)

Following the issue guidelines:

| Concern | Where it lives | Standard |
|---------|---------------|----------|
| Identity + discovery | HCS registry topic + HCS-11 profile | HCS-14 + HCS-2 + HCS-11 |
| Payment evidence | x402 verify/settle receipts (separate topic or off-chain) | x402 |
| Trust / reputation | Computed downstream from typed claims | ERC-8004 reputation registry or custom |

**Do not** mix x402 payment receipts into the HCS-14 registry topic. The registry is for identity and discovery only.

## Common Gotchas

1. **Mirror node sync delay**: After submitting a registration, wait 3–5 seconds before querying the mirror node — it needs time to index the new message.

2. **Base64 message encoding**: The Mirror Node REST API returns `message` as a **base64-encoded** string. Always decode with `Buffer.from(msg.message, "base64").toString("utf8")` before parsing JSON.

3. **Pagination**: The mirror node API paginates results. Follow `links.next` to get all messages. Default limit is 100.

4. **UAID determinism**: The AID hash depends on exactly six fields. If you change any field (even `version`), you get a different UAID. Communication details (endpoints, topic IDs) are deliberately excluded.

5. **Skills validation**: Skill IDs in [40–99] are reserved and must be rejected. Use [0–39] for HCS-14 skills or [100+] for OASF skills.

6. **Submit key = access control**: If your registry topic has a submit key, only key holders can register agents. This is useful for curated registries but blocks open self-registration.

7. **HCS-2 vs raw messages**: Use the HCS-2 JSON operation format (`p`, `op`, `t_id`) for registry messages. Don't submit unstructured text to a registry topic — indexers expect HCS-2 format.

8. **Profile topic ≠ registry topic**: The registry topic holds registration entries (pointers). The profile topic holds the actual HCS-11 agent metadata. They are separate topics.

## Reference Files

- [references/uaid-format.md](references/uaid-format.md) — UAID grammar, parsing, validation, canonicalization, and generation
- [references/mirror-node-discovery.md](references/mirror-node-discovery.md) — Mirror Node REST API endpoints for reading registry topics and resolving profiles
- [references/erc-8004-bridge.md](references/erc-8004-bridge.md) — How HCS-14 maps to ERC-8004 on-chain agent identity registries