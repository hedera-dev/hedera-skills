# Hedera Network Configuration

## Environment Variables

```env
HEDERA_OPERATOR_ID=0.0.XXXXX           # Your Hedera account ID (e.g., 0.0.12345)
HEDERA_OPERATOR_KEY=302e020100300506... # Private key (DER-encoded or hex — auto-detected)
HEDERA_NETWORK=testnet                  # "testnet" (default) or "mainnet"
NEXT_PUBLIC_HEDERA_NETWORK=testnet      # Same value — needed for client-side components
```

> **Next.js note:** Server-side env vars (used in API routes) don't need a prefix. But any value read in client components (e.g., `"use client"` files) must be duplicated with the `NEXT_PUBLIC_` prefix.

See `templates/env.example` for a complete `.env` template.

## Getting a Testnet Account

1. Go to [https://portal.hedera.com](https://portal.hedera.com)
2. Create a free account
3. Copy your **Account ID** (format: `0.0.XXXXX`)
4. Copy your **private key** — either DER-encoded (starts with `302e...`) or hex format (64-char hex string)
5. Testnet accounts receive free test HBAR — no real cost

## Network URLs

| Resource | Testnet | Mainnet |
|----------|---------|---------|
| Mirror Node API | `https://testnet.mirrornode.hedera.com/api/v1` | `https://mainnet.mirrornode.hedera.com/api/v1` |
| HashScan Explorer | `https://hashscan.io/testnet` | `https://hashscan.io/mainnet` |
| Hedera Portal | `https://portal.hedera.com` | `https://portal.hedera.com` |

## Client Initialization by Network

```typescript
import { Client, PrivateKey, AccountId } from '@hiero-ledger/sdk';

/**
 * Parse a private key from either DER-encoded or hex (ECDSA) format.
 * DER keys start with "302e" or "3030"; hex keys are raw 64-char hex strings.
 * Keys starting with "0x" (e.g., from MetaMask) have the prefix stripped automatically.
 */
function parsePrivateKey(key: string): PrivateKey {
  const trimmed = key.trim().replace(/^0x/, '');
  if (trimmed.startsWith('302')) {
    return PrivateKey.fromStringDer(trimmed);
  }
  return PrivateKey.fromStringECDSA(trimmed);
}

const network = process.env.HEDERA_NETWORK || 'testnet';
const operatorId = process.env.HEDERA_OPERATOR_ID || '';

// Lazy-init: prevents build-time crash when env vars contain placeholders.
// Next.js evaluates API route modules during `next build` — eager Client.setOperator()
// with placeholder values (e.g., "0.0.XXXXX") throws an SDK parse error.
let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    const id = process.env.HEDERA_OPERATOR_ID;
    const key = process.env.HEDERA_OPERATOR_KEY;
    if (!id || !key) {
      throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY in .env.local');
    }
    _client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
    _client.setOperator(AccountId.fromString(id), parsePrivateKey(key));
  }
  return _client;
}

// Proxy allows importing `client` and using it like a normal Client instance
// while deferring actual initialization to first use.
const client = new Proxy({} as Client, {
  get(_, prop) {
    const c = getClient();
    const val = (c as any)[prop];
    return typeof val === 'function' ? (val as Function).bind(c) : val;
  },
});

export { client, network, operatorId };
```

> **Why lazy init?** During `next build`, Next.js pre-renders and evaluates all server modules. If the Hedera client is created at module scope with placeholder env vars (like `0.0.XXXXX` in a template `.env.local`), the SDK throws a parse error and the build fails. The Proxy pattern defers initialization until the first API route actually calls the client at runtime.

### Supported Key Formats

| Format | Example Prefix | Parser |
|--------|---------------|--------|
| DER-encoded (default from Hedera Portal) | `302e...`, `3030...` | `PrivateKey.fromStringDer()` |
| ECDSA hex (64-char hex string) | `a1c1b2...` or `0xa1c1...` | `PrivateKey.fromStringECDSA()` |
| ED25519 (if explicitly needed) | varies | `PrivateKey.fromStringED25519()` |

The `parsePrivateKey()` helper above auto-detects DER vs hex. Use it everywhere instead of hardcoding a specific format.

## LLM Provider Configuration (Category B Apps Only)

Category B (agentic) apps require an LLM API key to power the AI agent. Category A (regular) apps do **not** need any LLM key.

### Environment Variables

```env
# Pick ONE provider — the app auto-detects which key is set:
OPENAI_API_KEY=sk-...              # OpenAI (GPT-4o)
ANTHROPIC_API_KEY=sk-ant-...       # Anthropic (Claude Sonnet)
GROQ_API_KEY=gsk_...               # Groq (Llama 3.3 70B)
```

### Provider Comparison

| Provider | Model | Speed | Cost | Best For |
|----------|-------|-------|------|----------|
| **Groq** | Llama 3.3 70B | Fastest | Free tier available | Prototyping, demos, speed-sensitive |
| **OpenAI** | GPT-4o | Fast | ~$2.50/1M input tokens | Reliability, broad tool-calling support |
| **Anthropic** | Claude Sonnet | Fast | ~$3/1M input tokens | Complex reasoning, multi-step chains |

### LangChain Dependencies by Provider

```bash
# OpenAI
npm install @langchain/openai

# Anthropic
npm install @langchain/anthropic

# Groq (fast, free tier)
npm install @langchain/groq
```

### How to Choose

- **Just want it to work?** → Use **Groq** (free tier, fastest inference)
- **Production reliability?** → Use **OpenAI** (most mature tool-calling)
- **Complex multi-step reasoning?** → Use **Anthropic** (best at chaining operations)
- **Free/local?** → Use **Ollama** with a local model (requires `@langchain/ollama`, no API key needed, but tool-calling quality varies)

> **Tip:** For hackathons and demos, Groq's free tier is ideal — no credit card needed and responses are near-instant.

---

## MCP Server Network Flag

```bash
# Testnet (default, free)
node dist/index.js --ledger-id=testnet

# Mainnet (real HBAR costs — use with caution)
node dist/index.js --ledger-id=mainnet
```

## Cost Awareness

| Network | Token Creation | HBAR Transfer | HCS Message | NFT Mint |
|---------|---------------|---------------|-------------|----------|
| **Testnet** | Free | Free | Free | Free |
| **Mainnet** | ~$1 | ~$0.001 | ~$0.0001 | ~$0.05 |

**Rules:**
- Always default to **testnet** unless the user explicitly requests mainnet
- When switching to mainnet, always warn that transactions will use real HBAR
- Testnet accounts get free test HBAR — transactions have no real cost
- Mainnet private keys should never be committed to source control

## HashScan Explorer Links

Use these URL patterns to link transactions and entities to the HashScan block explorer:

```
# Transactions
https://hashscan.io/{network}/transaction/{transactionId}

# Accounts
https://hashscan.io/{network}/account/{accountId}

# Tokens
https://hashscan.io/{network}/token/{tokenId}

# Topics
https://hashscan.io/{network}/topic/{topicId}

# Contracts
https://hashscan.io/{network}/contract/{contractId}
```

Replace `{network}` with `testnet` or `mainnet`.
