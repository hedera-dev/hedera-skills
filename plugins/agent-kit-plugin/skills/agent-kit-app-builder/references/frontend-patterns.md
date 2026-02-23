# Frontend Patterns for Hedera Apps

Implementation patterns for building polished Hedera-powered frontends with React/Next.js.

## Recommended Tech Stack

- **Framework:** React 18+ or Next.js 14+ (App Router preferred)
- **Language:** TypeScript always
- **Styling:** Tailwind CSS + shadcn/ui for production-quality UI
- **Hedera (server-side):** `hedera-agent-kit` for multi-step operations, `@hashgraph/sdk` for direct SDK access
- **Hedera (read-heavy):** Mirror Node REST API for dashboard data
- **State/Data:** React Server Components + API routes (no client-side private keys)

## Project Scaffolding

When asked to build a Hedera app, follow this sequence:

```bash
# 1. Create Next.js project
npx create-next-app@latest my-hedera-app --typescript --tailwind --app --src-dir

# 2. Install Hedera dependencies
cd my-hedera-app
npm install hedera-agent-kit @hashgraph/sdk dotenv

# 3. Install UI components
npx shadcn@latest init
npx shadcn@latest add button card input dialog toast table badge tabs

# 4. Create .env.local
cp templates/env.example .env.local
# Fill in HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_NETWORK
```

### Suggested File Structure

```
my-hedera-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with providers, network badge
│   │   ├── page.tsx             # Main page
│   │   └── api/                 # Server-side API routes
│   │       ├── account/
│   │       │   └── route.ts     # Account queries
│   │       └── tokens/
│   │           ├── create/
│   │           │   └── route.ts # Token creation
│   │           └── route.ts     # Token queries
│   ├── lib/
│   │   ├── hedera.ts            # Hedera client singleton
│   │   └── mirror.ts            # Mirror Node API helpers
│   └── components/
│       ├── account-card.tsx     # Account overview
│       ├── token-table.tsx      # Token portfolio
│       ├── transfer-dialog.tsx  # Transfer form
│       └── network-badge.tsx    # Testnet/mainnet indicator
├── .env.local                   # Hedera credentials (gitignored)
└── package.json
```

## Three Integration Patterns

### Pattern 1: Direct SDK (Simple Queries & Transactions)

Best for straightforward single operations like balance queries and simple transfers.

```typescript
// src/lib/hedera.ts — Shared client singleton
import { Client, PrivateKey } from '@hashgraph/sdk';

const network = process.env.HEDERA_NETWORK || 'testnet';
const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
client.setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!)
);

export { client, network };
```

```typescript
// src/app/api/balance/route.ts — Balance query API route
import { AccountBalanceQuery } from '@hashgraph/sdk';
import { client } from '@/lib/hedera';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return Response.json({ error: 'accountId is required' }, { status: 400 });
  }

  const balance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client);

  return Response.json({
    hbar: balance.hbars.toString(),
    tokens: Object.fromEntries(balance.tokens._map),
  });
}
```

### Pattern 2: Agent Kit (Complex Multi-Step Operations)

Best for operations that involve multiple steps, plugins, or need the full toolkit capabilities.

```typescript
// src/lib/toolkit.ts — Agent Kit toolkit setup
import {
  HederaLangchainToolkit,
  coreTokenPlugin,
  coreTokenQueryPlugin,
  coreAccountQueryPlugin,
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
  AgentMode,
} from 'hedera-agent-kit';
import { Client, PrivateKey } from '@hashgraph/sdk';

const client = Client.forTestnet().setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!)
);

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    tools: [],
    context: { mode: AgentMode.AUTONOMOUS },
    plugins: [
      coreTokenPlugin,
      coreTokenQueryPlugin,
      coreAccountQueryPlugin,
      coreConsensusPlugin,
      coreConsensusQueryPlugin,
    ],
  },
});

export { toolkit };
```

```typescript
// src/app/api/tokens/create/route.ts — Token creation via Agent Kit
import { toolkit } from '@/lib/toolkit';

export async function POST(req: Request) {
  const { name, symbol, initialSupply, decimals } = await req.json();

  const tools = toolkit.getTools();
  const createTokenTool = tools.find(t => t.name.includes('create_fungible_token'));

  if (!createTokenTool) {
    return Response.json({ error: 'Token creation tool not available' }, { status: 500 });
  }

  const result = await createTokenTool.invoke({
    name,
    symbol,
    initialSupply,
    decimals,
  });

  return Response.json(result);
}
```

### Pattern 3: Mirror Node REST API (Read-Heavy Dashboards)

Best for read-only dashboard UIs. No private key needed — public API.

```typescript
// src/lib/mirror.ts — Mirror Node API helpers
const MIRROR_BASE = process.env.HEDERA_NETWORK === 'mainnet'
  ? 'https://mainnet.mirrornode.hedera.com/api/v1'
  : 'https://testnet.mirrornode.hedera.com/api/v1';

export async function getAccountInfo(accountId: string) {
  const res = await fetch(`${MIRROR_BASE}/accounts/${accountId}`);
  if (!res.ok) throw new Error(`Account not found: ${accountId}`);
  return res.json();
}

export async function getAccountTokens(accountId: string) {
  const res = await fetch(`${MIRROR_BASE}/accounts/${accountId}/tokens`);
  return res.json();
}

export async function getAccountNfts(accountId: string) {
  const res = await fetch(`${MIRROR_BASE}/accounts/${accountId}/nfts`);
  return res.json();
}

export async function getTopicMessages(topicId: string) {
  const res = await fetch(`${MIRROR_BASE}/topics/${topicId}/messages`);
  return res.json();
}

export async function getTransactions(accountId: string, limit = 20) {
  const res = await fetch(
    `${MIRROR_BASE}/transactions?account.id=${accountId}&limit=${limit}&order=desc`
  );
  return res.json();
}

export async function getTokenInfo(tokenId: string) {
  const res = await fetch(`${MIRROR_BASE}/tokens/${tokenId}`);
  return res.json();
}

export async function getNftInfo(tokenId: string, serialNumber: number) {
  const res = await fetch(`${MIRROR_BASE}/tokens/${tokenId}/nfts/${serialNumber}`);
  return res.json();
}
```

---

## UI Component Patterns

### Account Overview Card

**Data requirements:** HBAR balance, account ID, token count, key type.

```typescript
interface AccountCardProps {
  accountId: string;
  hbarBalance: string;     // e.g., "125.5 ℏ"
  tokenCount: number;
  nftCount: number;
}
```

### Token Portfolio Table

**Data requirements:** Token name, symbol, balance, token ID.

```typescript
interface TokenRow {
  tokenId: string;         // "0.0.12345"
  name: string;            // "DemoToken"
  symbol: string;          // "DMT"
  balance: number;
  decimals: number;
  hashScanUrl: string;     // "https://hashscan.io/testnet/token/0.0.12345"
}
```

### Token Creation Form

**Fields:** name (string), symbol (string, 3-8 chars), initial supply (number), decimals (0-18).

### Transfer Dialog

**Fields:** recipient account ID (`0.0.XXXXX` format), amount, token selector dropdown.

### HCS Message Feed

**Data requirements:** Message content (base64 decoded), sequence number, consensus timestamp.

```typescript
interface HcsMessage {
  sequenceNumber: number;
  consensusTimestamp: string;
  content: string;         // Base64 decoded message body
  payerAccountId: string;
}
```

### NFT Gallery Grid

**Data requirements:** Token ID, serial number, metadata (name, description, image URL).

```typescript
interface NftCard {
  tokenId: string;
  serialNumber: number;
  name: string;            // From metadata
  description: string;     // From metadata
  imageUrl: string;        // From metadata, with fallback placeholder
}
```

### Transaction History Table

**Data requirements:** Timestamp, type, status, transaction hash, HashScan link.

```typescript
interface TransactionRow {
  transactionId: string;
  type: string;            // "CRYPTOTRANSFER", "TOKENCREATION", etc.
  status: string;          // "SUCCESS" or error
  timestamp: string;
  hashScanUrl: string;
}
```

---

## Design Guidelines

### Theme & Colors
- **Dark theme by default** — web3 convention. Use shadcn/ui dark mode.
- Accent color: Hedera green (`#00E08E`) for success states and branding touches.

### Hedera-Specific Formatting
- **HBAR amounts:** Display with `ℏ` symbol (e.g., `125.50 ℏ`)
- **Account IDs:** Always `0.0.XXXXX` format, monospace font
- **Token IDs:** Always `0.0.XXXXX` format, clickable link to HashScan
- **Transaction hashes:** Truncated with copy button, clickable link to HashScan

### HashScan Explorer Links

```typescript
const hashScanBase = network === 'mainnet'
  ? 'https://hashscan.io/mainnet'
  : 'https://hashscan.io/testnet';

// Transaction link
`${hashScanBase}/transaction/${transactionId}`

// Token link
`${hashScanBase}/token/${tokenId}`

// Account link
`${hashScanBase}/account/${accountId}`
```

### UX Patterns
- **Loading states** for ALL blockchain operations (they take 3-7 seconds)
- **Success/error toast notifications** for every transaction
- **Network badge** in header/navbar showing "Testnet" or "Mainnet"
- **Responsive layout** — mobile-friendly, but desktop-primary
- **Confirmation dialogs** for destructive or costly operations (transfers, mainnet transactions)
- **Copy-to-clipboard** on all IDs and hashes

### API Route Pattern

All Hedera operations should go through server-side API routes. Never expose private keys to the client.

```
User Action → React Component → fetch('/api/...') → API Route → SDK/Agent Kit → Hedera Network → Response → UI Update
```
