# Hedera Network Configuration

## Environment Variables

```env
HEDERA_OPERATOR_ID=0.0.XXXXX           # Your Hedera account ID (e.g., 0.0.12345)
HEDERA_OPERATOR_KEY=302e020100300506... # DER-encoded private key (default format)
HEDERA_NETWORK=testnet                  # "testnet" (default) or "mainnet"
```

See `templates/env.example` for a complete `.env` template.

## Getting a Testnet Account

1. Go to [https://portal.hedera.com](https://portal.hedera.com)
2. Create a free account
3. Copy your **Account ID** (format: `0.0.XXXXX`)
4. Copy your **DER-encoded private key** (starts with `302e...`)
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

const network = process.env.HEDERA_NETWORK || 'testnet';
const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
client.setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!)
);
```

### Alternative Key Formats

```typescript
// DER-encoded (default, recommended)
PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!)

// ECDSA hex format
PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!)

// ED25519 format
PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY!)
```

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
