# Hedera Network Configuration

## Environment Variables

```env
HEDERA_OPERATOR_ID=0.0.XXXXX           # Your Hedera account ID (e.g., 0.0.12345)
HEDERA_OPERATOR_KEY=302e020100300506... # Private key (DER-encoded or hex — auto-detected)
HEDERA_NETWORK=testnet                  # "testnet" (default) or "mainnet"
```

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
import { Client, PrivateKey } from '@hashgraph/sdk';

/**
 * Parse a private key from either DER-encoded or hex (ECDSA) format.
 * DER keys start with "302e" or "3030"; hex keys are raw 64-char hex strings.
 */
function parsePrivateKey(key: string): PrivateKey {
  const trimmed = key.trim();
  if (trimmed.startsWith('302')) {
    return PrivateKey.fromStringDer(trimmed);
  }
  return PrivateKey.fromStringECDSA(trimmed);
}

const network = process.env.HEDERA_NETWORK || 'testnet';
const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
client.setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  parsePrivateKey(process.env.HEDERA_OPERATOR_KEY!)
);
```

### Supported Key Formats

| Format | Example Prefix | Parser |
|--------|---------------|--------|
| DER-encoded (default from Hedera Portal) | `302e...`, `3030...` | `PrivateKey.fromStringDer()` |
| ECDSA hex (64-char hex string) | `a]c1b2...` | `PrivateKey.fromStringECDSA()` |
| ED25519 (if explicitly needed) | varies | `PrivateKey.fromStringED25519()` |

The `parsePrivateKey()` helper above auto-detects DER vs hex. Use it everywhere instead of hardcoding a specific format.

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
