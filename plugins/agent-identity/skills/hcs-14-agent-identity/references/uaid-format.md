# UAID Format — Parsing, Validation, and Generation

HCS-14 defines a single Universal Agent Identifier (UAID) scheme with two targets sharing one grammar:

```
uaid:{aid|did}:{id};{parameters}
```

## Grammar

### AID Target (Deterministic)

```
uaid:aid:{base58hash};uid={uid};registry={registry};proto={protocol};nativeId={nativeId};domain={domain}
```

- `{base58hash}` — Base58-encoded SHA-384 hash of canonical agent JSON (6 fields only)
- Deterministic: same canonical agent data → same hash → same AID

### DID Target (Self-Sovereign)

```
uaid:did:{methodSpecificId};uid={uid};registry={registry};proto={protocol};nativeId={nativeId};domain={domain};src={multibase58btc}
```

- `{methodSpecificId}` — sanitized method-specific ID from the base W3C DID (strip everything after first `;`, `?`, or `#`)
- `src` — included only when sanitization removed a suffix; multibase base58btc (`z…`) encoding of the full original DID string

## Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `uid` | Yes (`"0"` if N/A) | Unique ID within registry. HCS-10 Hedera: `inboundTopicId@accountId` or `accountId`. | `trading-bot-alpha` |
| `registry` | No | Organizational namespace | `hedera`, `hol`, `olas`, `self` |
| `proto` | No | Communication protocol | `hcs-10`, `a2a`, `mcp` |
| `nativeId` | No | Protocol-native unique ID (CAIP-10 where applicable) | `hedera:testnet:0.0.123456` |
| `domain` | No | Domain identifier | `foo.hbar`, `alice.btc` |
| `src` | `uaid:did` only | Multibase base58btc of full source DID | `z6Mk...` |

**Ordering**: `uid`, `registry`, `proto`, `nativeId`, `domain`, (then `src`). Implementations must preserve this order when emitting UAIDs.

Both `registry` and `proto` can coexist — they serve different purposes (registry = organization, proto = protocol).

## Canonical Agent Data (AID Hash Input)

Only six fields are hashed. Communication details are excluded for determinism.

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

### Normalization Rules

1. **String normalization**: lowercase and trim `registry` and `protocol`. Trim all other string fields.
2. **Deterministic serialization**: JSON keys sorted lexicographically. `skills` array sorted numerically ascending.
3. **Hash generation**: SHA-384 on UTF-8 canonical JSON. Base58-encode the digest.
4. **Field validation**: all six required fields present and non-empty.
5. **Native ID**: must be the protocol's canonical unique identifier.
6. **Skills array**: numeric IDs from [0–39] (HCS-14 core/protocol) or [100+] (OASF). Range [40–99] is reserved — reject. Empty arrays are permitted.

### Canonicalization Implementation

```ts
function canonicalizeAgentData(data: {
    registry: string;
    name: string;
    version: string;
    protocol: string;
    nativeId: string;
    skills: number[];
}): string {
    const normalized: Record<string, unknown> = {
        name: data.name.trim(),
        nativeId: data.nativeId.trim(),
        protocol: data.protocol.trim().toLowerCase(),
        registry: data.registry.trim().toLowerCase(),
        skills: [...data.skills].sort((a, b) => a - b),
        version: data.version.trim(),
    };
    return JSON.stringify(
        Object.fromEntries(
            Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b))
        )
    );
}
```

### Hash Generation

```ts
import crypto from "node:crypto";
import bs58 from "bs58";

function generateAidHash(data: CanonicalAgentData): string {
    const canonical = canonicalizeAgentData(data);
    const hash = crypto.createHash("sha384").update(canonical, "utf8").digest();
    return bs58.encode(hash);
}
```

## UAID Generation

### Full UAID with Parameters

```ts
function buildUaid(
    target: "aid" | "did",
    id: string,
    params: {
        uid: string;          // required, use "0" if N/A
        registry?: string;
        proto?: string;
        nativeId?: string;
        domain?: string;
        src?: string;         // did only
    }
): string {
    const parts: string[] = [];
    parts.push(`uid=${params.uid}`);
    if (params.registry) parts.push(`registry=${params.registry}`);
    if (params.proto) parts.push(`proto=${params.proto}`);
    if (params.nativeId) parts.push(`nativeId=${params.nativeId}`);
    if (params.domain) parts.push(`domain=${params.domain}`);
    if (params.src) parts.push(`src=${params.src}`);

    return `uaid:${target}:${id};${parts.join(";")}`;
}

// AID example
const aidHash = generateAidHash(agentData);
const uaid = buildUaid("aid", aidHash, {
    uid: "trading-bot-alpha",
    registry: "hedera",
    proto: "hcs-10",
    nativeId: "hedera:testnet:0.0.123456",
});
```

### DID Target (Sanitization)

```ts
function sanitizeDidMethodId(did: string): { id: string; src?: string } {
    // Strip everything after first ;, ?, or # from the method-specific id
    // The method-specific id is the part after did:method:
    const match = did.match(/^did:[^:]+:(.+)$/);
    if (!match) throw new Error(`Invalid DID: ${did}`);
    const methodSpecificId = match[1];

    const stripIndex = methodSpecificId.search(/[;?#]/);
    if (stripIndex >= 0) {
        const sanitized = methodSpecificId.substring(0, stripIndex);
        // Include src because we stripped a suffix
        const src = encodeMultibaseBase58btc(did);
        return { id: sanitized, src };
    }
    return { id: methodSpecificId };
}
```

## Parsing a UAID

```ts
interface ParsedUaid {
    scheme: string;      // "uaid"
    target: "aid" | "did";
    id: string;          // base58 hash (aid) or sanitized method-specific id (did)
    params: {
        uid?: string;
        registry?: string;
        proto?: string;
        nativeId?: string;
        domain?: string;
        src?: string;
    };
    raw: string;
}

function parseUaid(uaid: string): ParsedUaid {
    if (!uaid.startsWith("uaid:")) {
        throw new Error("Not a UAID: missing 'uaid:' scheme prefix");
    }

    const withoutScheme = uaid.substring(5);  // remove "uaid:"
    const semicolonIdx = withoutScheme.indexOf(";");

    let targetAndId: string;
    let paramStr: string;

    if (semicolonIdx >= 0) {
        targetAndId = withoutScheme.substring(0, semicolonIdx);
        paramStr = withoutScheme.substring(semicolonIdx + 1);
    } else {
        targetAndId = withoutScheme;
        paramStr = "";
    }

    const colonIdx = targetAndId.indexOf(":");
    if (colonIdx < 0) {
        throw new Error("Invalid UAID: missing target:id");
    }

    const target = targetAndId.substring(0, colonIdx);
    const id = targetAndId.substring(colonIdx + 1);

    if (target !== "aid" && target !== "did") {
        throw new Error(`Invalid UAID target: ${target} (must be 'aid' or 'did')`);
    }

    // The id portion shall not contain ';'
    if (id.includes(";")) {
        throw new Error("UAID id portion must not contain ';'");
    }

    // Parse parameters
    const params: ParsedUaid["params"] = {};
    if (paramStr) {
        for (const pair of paramStr.split(";")) {
            const eqIdx = pair.indexOf("=");
            if (eqIdx < 0) continue;
            const key = pair.substring(0, eqIdx);
            const value = pair.substring(eqIdx + 1);
            params[key] = value;
        }
    }

    if (!params.uid) {
        throw new Error("UAID must include uid parameter (use '0' if not applicable)");
    }

    return { scheme: "uaid", target, id, params, raw: uaid };
}
```

## Validation

```ts
function validateUaid(uaid: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
        const parsed = parseUaid(uaid);

        if (parsed.target === "aid") {
            // AID id must be valid Base58
            if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(parsed.id)) {
                errors.push("AID id must be valid Base58");
            }
        }

        if (!parsed.params.uid) {
            errors.push("uid parameter is required (use '0' if not applicable)");
        }

        // Validate skills if extracting from a profile (not from UAID itself)
        // The UAID doesn't carry skills; they're in the canonical hash input
    } catch (e) {
        errors.push(e.message);
    }

    return { valid: errors.length === 0, errors };
}
```

## Skills Reference

### Core Skills (0–19)

| Value | Skill |
|-------|-------|
| 0 | Text Generation |
| 1 | Image Generation |
| 2 | Audio Generation |
| 3 | Video Generation |
| 4 | Code Generation |
| 5 | Language Translation |
| 6 | Content Summarization |
| 7 | Knowledge Retrieval |
| 8 | Data Visualization |
| 9 | Sentiment Analysis |
| 10 | Transaction Analytics |
| 11 | Smart Contract Audit |
| 12 | Risk Assessment |
| 13 | Market Analysis |
| 14 | Compliance Analysis |
| 15 | Fraud Detection |
| 16 | Multi-Agent Coordination |
| 17 | API Integration |
| 18 | Workflow Automation |
| 19 | Real-time Communication |

### Protocol-Specific Skills (20–39)

| Value | Skill |
|-------|-------|
| 20 | Resource Provider (MCP) |
| 25 | Web Access |

Range [40–99] is **reserved** — must be rejected.

### OASF Skills (100+)

Open Agentic Schema Framework skills. Use IDs ≥ 100. See the [OASF repository](https://github.com/agntcy/oasf) for the full catalog.

## Native Protocol IDs

| Protocol | nativeId Format | Example |
|----------|----------------|---------|
| HCS-10 (Hedera) | `hedera:{network}:{account}` (CAIP-10) | `hedera:testnet:0.0.123456` |
| A2A | Domain hosting `agent.json` | `agent.example.com` |
| MCP | Server URL or domain | `mcp.example.com` |
| NANDA | Registry-specific UID | `nanda-uid` |

## Determinism and Collisions

AID identifiers are deterministic by design. Identical canonical agent data yields the same AID. Uniqueness is anchored by `nativeId` (e.g. public key or domain) and `registry`. If distinct deployments require separate identifiers, bump `version` or use distinct `uid` values — never introduce non-deterministic inputs into the canonical set.