# ERC-8004 Bridge — HCS-14 ↔ EVM Agent Identity

ERC-8004 ("Trustless Agents") is an Ethereum standard for discovering AI agents and establishing trust through on-chain identity, reputation, and validation registries. It deploys three singleton smart contracts per chain:

1. **Identity Registry** — ERC-721 with URIStorage. Each agent is an NFT; `tokenURI` resolves to an off-chain registration file.
2. **Reputation Registry** — standard interface for posting and fetching feedback signals.
3. **Validation Registry** — independent verification of agent work for high-stakes tasks.

## ERC-8004 Agent ID Format

```
eip155:{chainId}:{identityRegistry}:{agentId}
```

- `eip155` — chain family namespace (CAIP-10)
- `{chainId}` — blockchain network ID (e.g. `1` for mainnet, `8453` for Base)
- `{identityRegistry}` — deployed ERC-721 registry contract address
- `{agentId}` — ERC-721 `tokenId`, assigned incrementally

Example: `eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb:4471`

## HCS-14 ↔ ERC-8004 Mapping

| Concept | HCS-14 (Hedera) | ERC-8004 (EVM) |
|---------|-----------------|----------------|
| Agent identifier | UAID (`uaid:aid:{hash};...` or `uaid:did:{id};...`) | `eip155:{chainId}:{registry}:{agentId}` |
| Registry | HCS-2 topic (append-only log) | ERC-721 Identity Registry contract |
| Registration op | HCS-2 `register` message to topic | ERC-721 mint + `setTokenURI` |
| Profile | HCS-11 profile on a separate topic | Off-chain registration file at `agentURI` |
| Skills | Numeric array in canonical hash input | `skills` array in registration file (OASF-aligned) |
| Native ID | `hedera:{network}:{account}` (CAIP-10) | `eip155:{chainId}:{address}` (CAIP-10) |
| Cross-chain | `registrations[]` in HCS-11 profile | `registrations[]` in registration file |
| Trust signals | Computed downstream from typed claims | Reputation Registry + Validation Registry |
| Payment evidence | x402 receipts (separate) | x402 receipts (separate) |

## Bidirectional Bridge Patterns

### Pattern 1: Hedera-Native Agent with EVM Cross-Registration

An agent primarily registered on Hedera (HCS-14) can cross-register on an EVM chain (ERC-8004) to be discoverable by EVM-native agents.

**Hedera side** (HCS-11 profile):

```json
{
  "version": "1.0",
  "type": 1,
  "display_name": "Trading Bot Alpha",
  "uaid": "uaid:aid:QmX...;uid=trading-bot-alpha;registry=hedera;proto=hcs-10;nativeId=hedera:testnet:0.0.123456",
  "inboundTopicId": "0.0.789101",
  "skills": [0, 17],
  "registrations": [
    {
      "agentId": 4471,
      "agentRegistry": "eip155:8453:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  ]
}
```

**EVM side** (ERC-8004 registration file at `tokenURI`):

```json
{
  "type": "agent",
  "name": "Trading Bot Alpha",
  "description": "Autonomous trading agent for HBAR/USDC pairs",
  "version": "1.0.0",
  "skills": [0, 17],
  "endpoints": [
    {
      "name": "HCS-10",
      "endpoint": "uaid:aid:QmX...;uid=trading-bot-alpha;registry=hedera;proto=hcs-10;nativeId=hedera:testnet:0.0.123456",
      "version": "1.0"
    }
  ],
  "x402Support": true,
  "active": true,
  "registrations": [
    {
      "agentId": 4471,
      "agentRegistry": "eip155:8453:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  ],
  "supportedTrust": ["reputation", "crypto-economic"]
}
```

### Pattern 2: EVM-Native Agent with Hedera Cross-Registration

An agent primarily registered on an EVM chain (ERC-8004) can register on a Hedera HCS-14 registry topic to be discoverable by Hedera-native agents.

```js
// Register an EVM-native agent on a Hedera HCS-14 registry
const evmAgentId = "eip155:1:0x742d35Cc...:4471";

const registration = {
    p: "hcs-2",
    op: "register",
    t_id: profileTopicId.toString(),  // Hedera profile topic mirroring the EVM registration
    metadata: `https://example.com/agent/4471/registration.json`,
    m: `Cross-registered EVM agent — ${evmAgentId}`,
};

await new TopicMessageSubmitTransaction()
    .setTopicId(hederaRegistryTopicId)
    .setMessage(JSON.stringify(registration))
    .execute(client);
```

The HCS-11 profile on Hedera would include the EVM registration in `registrations[]`:

```json
{
  "version": "1.0",
  "type": 1,
  "display_name": "EVM Analysis Bot",
  "uaid": "uaid:did:z6Mk...;uid=evm-analysis-bot;registry=hol;proto=a2a;nativeId=eip155:1:0xAbCd...",
  "registrations": [
    { "agentId": 4471, "agentRegistry": "eip155:1:0x742d35Cc..." }
  ]
}
```

### Pattern 3: UAID Resolving to ERC-8004 Identity

A UAID with `proto=a2a` and an EVM `nativeId` can resolve to an ERC-8004 agent:

```
uaid:aid:QmZ...;uid=evm-analysis-bot;registry=olas;proto=a2a;nativeId=eip155:1:0xAbCd1234...
```

A resolver would:
1. Parse the UAID to extract `nativeId` = `eip155:1:0xAbCd...`
2. Query the ERC-8004 Identity Registry on chain 1 at that address
3. Read `tokenURI(agentId)` to get the off-chain registration file
4. Return the agent's capabilities, endpoints, and trust signals

## Skill ID Alignment

Both HCS-14 and ERC-8004 use OASF (Open Agentic Schema Framework) skill IDs. The core HCS-14 skills (0–39) and OASF skills (100+) are compatible:

| HCS-14 | OASF / ERC-8004 | Skill |
|--------|-----------------|-------|
| 0 | OASF equivalent | Text Generation |
| 4 | OASF equivalent | Code Generation |
| 17 | OASF equivalent | API Integration |
| 100+ | OASF native | Full OASF catalog |

When bridging, map HCS-14 skill IDs directly to the `skills` array in the ERC-8004 registration file.

## Trust and Reputation

ERC-8004 separates trust into three pluggable tiers:
- **Reputation** — feedback signals from past interactions
- **Crypto-economic** — stake/slashing mechanisms
- **TEE attestation** — hardware-based execution proofs

HCS-14 keeps trust computation **downstream** — the registry provides identity and discovery, not trust scores. An ERC-8004 Reputation Registry can aggregate signals from:
- HCS-14 registry interactions (HCS-10 message logs)
- x402 payment evidence (successful settlements)
- On-chain transaction history

## A2A and x402 Interop

Both HCS-14 and ERC-8004 are designed to interoperate with:

- **A2A** (Agent-to-Agent): agent cards at `/.well-known/agent.json` carry the UAID in the `did` field
- **x402** (pay-per-use): payment support advertised in the profile/registration file; receipts kept as separate lifecycle evidence
- **MCP** (Model Context Protocol): `proto=mcp` in the UAID; resource provider skill (20)

## Bridge Checklist

- [ ] Agent has a stable UAID on its primary chain
- [ ] Cross-registration entries in `registrations[]` on both sides
- [ ] Skills arrays use compatible OASF IDs
- [ ] `nativeId` follows CAIP-10 for the target chain
- [ ] Profile/registration files are accessible at their declared URIs
- [ ] x402 payment evidence is kept separate from identity registries
- [ ] Trust signals are computed downstream, not embedded in registration