# Frontend Patterns for Hedera Apps

Implementation patterns for building polished Hedera-powered frontends with React/Next.js.

## Recommended Tech Stack

- **Framework:** React 18+ or Next.js 14+ (App Router preferred)
- **Language:** TypeScript always
- **Styling:** Tailwind CSS + shadcn/ui for production-quality UI
- **Hedera (server-side):** `hedera-agent-kit` for multi-step operations, `@hiero-ledger/sdk` for direct SDK access
- **Hedera (read-heavy):** Mirror Node REST API for dashboard data
- **State/Data:** React Server Components + API routes (no client-side private keys)

## Project Scaffolding

When asked to build a Hedera app, follow this sequence:

```bash
# 1. Create Next.js project (pipe "no" to decline React Compiler prompt)
echo "no" | npx create-next-app@latest my-hedera-app --typescript --tailwind --app --src-dir --no-eslint --use-npm --import-alias "@/*"

# 2. Install Hedera dependencies
cd my-hedera-app
npm install hedera-agent-kit @hiero-ledger/sdk dotenv

# 3. Install UI components (use --yes for non-interactive, sonner replaces deprecated toast)
npx shadcn@latest init -d --force
npx shadcn@latest add button card input dialog label sonner table badge tabs separator --yes

# 4. Fix Turbopack lockfile warning (common when project is nested under a parent with its own lockfile)
# Add to next.config.ts:
#   import path from "path";
#   turbopack: { root: path.resolve(__dirname) }

# 5. Create .env.local
cp templates/env.example .env.local
# Fill in HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_NETWORK, NEXT_PUBLIC_HEDERA_NETWORK
```

> **Note:** `create-next-app` now prompts about React Compiler — pipe `echo "no"` for non-interactive use. The shadcn `toast` component is deprecated; use `sonner` instead (simpler API: just call `toast("message")`). Use `--yes` flag to skip shadcn confirmation prompts.

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
// src/lib/hedera.ts — Shared client singleton (lazy-init for Next.js build compatibility)
import { Client, PrivateKey, AccountId } from '@hiero-ledger/sdk';

/** Auto-detect DER vs hex (ECDSA) private key format */
function parsePrivateKey(key: string): PrivateKey {
  const trimmed = key.trim().replace(/^0x/, '');
  if (trimmed.startsWith('302')) {
    return PrivateKey.fromStringDer(trimmed);
  }
  return PrivateKey.fromStringECDSA(trimmed);
}

const network = process.env.HEDERA_NETWORK || 'testnet';
const operatorId = process.env.HEDERA_OPERATOR_ID || '';

// Lazy-init: avoids build-time crash with placeholder env vars
let _client: Client | null = null;
function getClient(): Client {
  if (!_client) {
    const id = process.env.HEDERA_OPERATOR_ID;
    const key = process.env.HEDERA_OPERATOR_KEY;
    if (!id || !key) throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY');
    _client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
    _client.setOperator(AccountId.fromString(id), parsePrivateKey(key));
  }
  return _client;
}

const client = new Proxy({} as Client, {
  get(_, prop) {
    const c = getClient();
    const val = (c as any)[prop];
    return typeof val === 'function' ? (val as Function).bind(c) : val;
  },
});

export { client, network, operatorId };
```

```typescript
// src/app/api/balance/route.ts — Balance query API route
import { AccountBalanceQuery } from '@hiero-ledger/sdk';
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
import { Client, PrivateKey } from '@hiero-ledger/sdk';

const operatorKey = process.env.HEDERA_OPERATOR_KEY!.trim().replace(/^0x/, '').startsWith('302')
  ? PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!)
  : PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!.replace(/^0x/, ''));

const client = Client.forTestnet().setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  operatorKey
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

**Fields:** name (string), symbol (string, 3-8 chars), initial supply (number), decimals (0-18, default: 0).

> **Default decimals to 0** for demo/launchpad apps. Decimals of 0 means whole tokens (1 token = 1 unit). This is simpler for users to understand. Use higher decimals (e.g., 8 or 18) only when fractional tokens are needed.

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
- **Success/error toast notifications** for every transaction (use `sonner` — `toast("message")` or `toast.error("message")`)
- **Network badge** in header/navbar showing "Testnet" or "Mainnet"
- **Responsive layout** — mobile-friendly, but desktop-primary
- **Confirmation dialogs** for destructive or costly operations (transfers, mainnet transactions)
- **Copy-to-clipboard** on all IDs and hashes

### API Route Pattern

All Hedera operations should go through server-side API routes. Never expose private keys to the client.

```
User Action → React Component → fetch('/api/...') → API Route → SDK/Agent Kit → Hedera Network → Response → UI Update
```
