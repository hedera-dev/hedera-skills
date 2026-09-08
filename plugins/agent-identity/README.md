# Agent Identity (HCS-14)

Agent identity, registration, and discovery on Hedera using the HCS-14 Universal Agent ID (UAID) standard. Gives AI agents an on-chain identity, registers them to HCS registry topics, and makes them discoverable via the Mirror Node REST API. Bridges to ERC-8004, A2A, and x402 for cross-protocol interop.

## Installation

### Claude Code

```bash
/plugin marketplace add hedera-dev/hedera-skills
/plugin install agent-identity
```

### Other Agents

```bash
npx skills add hedera-dev/hedera-skills
```

## Skills

### hcs-14-agent-identity

Covers the full agent identity lifecycle on Hedera:

- **UAID generation** — AID (deterministic SHA-384 hash of canonical agent data) and DID (self-sovereign, wraps existing W3C DIDs) methods
- **Registry topic creation** — HCS-2 topic registries for agent registration
- **Agent registration** — submitting HCS-2 `register` operations with UAID and HCS-11 profile references
- **Provider/operator registration** — registering entities that manage multiple agents
- **Agent discovery** — reading registry topics via the Mirror Node REST API, parsing HCS-2 operations, resolving HCS-11 profiles
- **Capability/service descriptors** — HCS-14 skill IDs, HCS-11 profile format, endpoint advertisement
- **Cross-protocol bridging** — HCS-14 ↔ ERC-8004 (EVM), A2A (agent cards), x402 (payment evidence kept separate)

**Use when:**

- Giving an AI agent an on-chain identity on Hedera
- Registering an agent or provider to an HCS registry topic
- Discovering agents by reading registry topics via the Mirror Node REST API
- Generating or parsing Universal Agent IDs (UAIDs)
- Bridging Hedera agent identity to ERC-8004, A2A, or x402

**References included:**

- `uaid-format.md` — UAID grammar, parsing, validation, canonicalization, and generation
- `mirror-node-discovery.md` — Mirror Node REST API endpoints for reading registry topics and resolving profiles
- `erc-8004-bridge.md` — How HCS-14 maps to ERC-8004 on-chain agent identity registries

**Examples included:**

- `register-agent.ts` — Full agent registration flow (registry topic + UAID + profile + registration)
- `discover-agents.ts` — Discovery via Mirror Node REST API with pagination and profile resolution
- `register-provider.ts` — Provider/operator registration with child agent registration

## Design Principles

This skill follows the separation-of-concerns principle from the HCS-14 ecosystem:

| Concern | Where it lives | Standard |
|---------|---------------|----------|
| Identity + discovery | HCS registry topic + HCS-11 profile | HCS-14 + HCS-2 + HCS-11 |
| Payment evidence | x402 verify/settle receipts (separate) | x402 |
| Trust / reputation | Computed downstream from typed claims | ERC-8004 reputation or custom |

Identity registration, discovery, and payment evidence are kept separate. Trust and reputation are computed downstream from those typed claims.

## License

Apache-2.0