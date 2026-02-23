# App Blueprints

Pre-designed app architectures for Hedera-powered frontends. Each blueprint is a complete specification you can build from. Pick the blueprint that matches the user's request, or adapt one as a starting point.

---

## Blueprint 1: Token Launchpad

**Description:** Create fungible tokens with custom parameters, mint additional supply, and transfer to other accounts — all from a polished UI.

**Plugins Required:**
```typescript
import {
  coreTokenPlugin,
  coreTokenQueryPlugin,
  coreAccountQueryPlugin,
} from 'hedera-agent-kit';
```

**API Routes:**

| Method | Route | Action |
|--------|-------|--------|
| `POST` | `/api/tokens/create` | Create fungible token (name, symbol, supply, decimals) |
| `POST` | `/api/tokens/mint` | Mint additional supply (tokenId, amount) |
| `POST` | `/api/tokens/transfer` | Transfer tokens (tokenId, toAccountId, amount) |
| `GET` | `/api/account/balance` | Get HBAR and token balances |

**UI Components:**
1. Token creation form — name, symbol, initial supply, decimals fields
2. Token card grid — shows all created tokens with name, symbol, supply, token ID
3. Mint dialog — select token, enter amount, submit
4. Transfer dialog — select token, enter recipient `0.0.XXXXX`, enter amount
5. Sidebar panel — HBAR balance, total token count, operator account ID
6. Transaction history — list of recent operations with HashScan links

**Next.js File Structure:**
```
src/
├── app/
│   ├── page.tsx                    # Main dashboard with token grid
│   └── api/
│       ├── tokens/
│       │   ├── create/route.ts     # POST: create token
│       │   ├── mint/route.ts       # POST: mint supply
│       │   └── transfer/route.ts   # POST: transfer tokens
│       └── account/
│           └── balance/route.ts    # GET: account balances
├── components/
│   ├── token-create-form.tsx
│   ├── token-card.tsx
│   ├── token-grid.tsx
│   ├── mint-dialog.tsx
│   ├── transfer-dialog.tsx
│   ├── balance-sidebar.tsx
│   └── transaction-history.tsx
└── lib/
    ├── hedera.ts                   # Client singleton
    └── types.ts                    # Shared TypeScript types
```

**Data Flow:**
```
User fills token form → POST /api/tokens/create → coreTokenPlugin.CREATE_FUNGIBLE_TOKEN_TOOL
  → Hedera returns token ID → API returns { tokenId, transactionId }
  → UI adds token card to grid, shows success toast with HashScan link
```

**Sample Response — Token Creation:**
```json
{
  "tokenId": "0.0.12345",
  "transactionId": "0.0.98765@1234567890.123456789",
  "name": "DemoToken",
  "symbol": "DMT",
  "initialSupply": 10000,
  "decimals": 2
}
```

**MCP Seeding:** After building, create a test token "DemoToken" (symbol: DMT, supply: 10000, decimals: 2) to populate the UI immediately.

**Demo Prompt:** `demos/token-launchpad/PROMPT.md`

---

## Blueprint 2: Wallet Dashboard

**Description:** Look up any Hedera account and view its full portfolio — HBAR balance, fungible tokens, NFTs, and recent transactions.

**Plugins Required:**
```typescript
import {
  coreAccountQueryPlugin,
  coreTokenQueryPlugin,
  coreMiscQueriesPlugin,
} from 'hedera-agent-kit';
```

**Primary Data Source:** Mirror Node REST API (read-heavy, no private key needed for queries).

**API Routes:**

| Method | Route | Action |
|--------|-------|--------|
| `GET` | `/api/account/[accountId]` | Get account info (balance, keys, creation date) |
| `GET` | `/api/account/[accountId]/tokens` | Get all fungible token holdings |
| `GET` | `/api/account/[accountId]/nfts` | Get all NFTs owned |
| `GET` | `/api/account/[accountId]/transactions` | Get recent transactions |

**UI Components:**
1. Search bar — enter any `0.0.XXXXX` account ID
2. Account overview card — HBAR balance, account ID, key type, creation date
3. Token portfolio table — sortable by name, symbol, balance, token ID
4. NFT gallery grid — thumbnail, collection name, serial number
5. Transaction history timeline — timestamp, type, status, HashScan links
6. Popular accounts section — pre-loaded testnet accounts for quick exploration

**Next.js File Structure:**
```
src/
├── app/
│   ├── page.tsx                         # Search + default account view
│   ├── account/
│   │   └── [accountId]/
│   │       └── page.tsx                 # Account detail page
│   └── api/
│       └── account/
│           └── [accountId]/
│               ├── route.ts             # GET: account info
│               ├── tokens/route.ts      # GET: token balances
│               ├── nfts/route.ts        # GET: NFTs
│               └── transactions/route.ts # GET: transactions
├── components/
│   ├── account-search.tsx
│   ├── account-card.tsx
│   ├── token-table.tsx
│   ├── nft-gallery.tsx
│   ├── transaction-timeline.tsx
│   └── popular-accounts.tsx
└── lib/
    ├── mirror.ts                        # Mirror Node API helpers
    └── types.ts
```

**Data Flow:**
```
User enters account ID → GET /api/account/[id] → Mirror Node API /accounts/{id}
  → Returns account data → UI renders overview card
  → Parallel fetches: /tokens, /nfts, /transactions → UI renders all sections
```

**Sample Response — Mirror Node Account:**
```json
{
  "account": "0.0.12345",
  "balance": { "balance": 125500000000, "timestamp": "1234567890.123456789" },
  "key": { "_type": "ED25519", "key": "302a300506..." },
  "created_timestamp": "1234567890.000000000"
}
```

**Sample Response — Mirror Node Token Balances:**
```json
{
  "tokens": [
    { "token_id": "0.0.11111", "balance": 5000, "decimals": 2 },
    { "token_id": "0.0.22222", "balance": 100, "decimals": 0 }
  ]
}
```

**MCP Seeding:** Query the operator's account to get real data for the initial view.

**Demo Prompt:** `demos/wallet-dashboard/PROMPT.md`

---

## Blueprint 3: HCS Message Board

**Description:** Decentralized message board using Hedera Consensus Service — create topics, post messages, view message history with timestamps and sequence numbers.

**Plugins Required:**
```typescript
import {
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
} from 'hedera-agent-kit';
```

**API Routes:**

| Method | Route | Action |
|--------|-------|--------|
| `POST` | `/api/topics/create` | Create new topic (memo) |
| `POST` | `/api/topics/[topicId]/messages` | Submit message to topic |
| `GET` | `/api/topics/[topicId]/messages` | Get messages (Mirror Node polling) |
| `GET` | `/api/topics/[topicId]` | Get topic info |

**UI Components:**
1. Topic list sidebar — shows all topics with memo and topic ID
2. Create topic form — memo/title input
3. Message feed — messages with content, sequence number, timestamp
4. Compose input — text input with submit button
5. Auto-refresh toggle — polling interval control (default: 5 seconds)
6. Topic header — active topic ID and memo

**Next.js File Structure:**
```
src/
├── app/
│   ├── page.tsx                         # Split-pane: sidebar + message feed
│   └── api/
│       └── topics/
│           ├── create/route.ts          # POST: create topic
│           └── [topicId]/
│               ├── route.ts             # GET: topic info
│               └── messages/
│                   ├── route.ts         # GET: messages (Mirror Node)
│                   └── send/route.ts    # POST: submit message
├── components/
│   ├── topic-list.tsx
│   ├── create-topic-form.tsx
│   ├── message-feed.tsx
│   ├── compose-input.tsx
│   └── auto-refresh-toggle.tsx
└── lib/
    ├── hedera.ts
    ├── mirror.ts
    └── types.ts
```

**Data Flow:**
```
User posts message → POST /api/topics/[id]/messages/send → SUBMIT_TOPIC_MESSAGE_TOOL
  → Hedera consensus → Success toast
  → Auto-refresh polls GET /api/topics/[id]/messages → Mirror Node /topics/{id}/messages
  → Messages decoded from base64 → UI renders message feed
```

**Important:** HCS messages are base64-encoded on the Mirror Node. Always decode before displaying:
```typescript
const decoded = Buffer.from(message.message, 'base64').toString('utf-8');
```

**Sample Response — Mirror Node Topic Messages:**
```json
{
  "messages": [
    {
      "consensus_timestamp": "1234567890.123456789",
      "message": "SGVsbG8gSGVkZXJhIQ==",
      "payer_account_id": "0.0.98765",
      "running_hash": "...",
      "sequence_number": 1,
      "topic_id": "0.0.55555"
    }
  ]
}
```

**MCP Seeding:** Create a topic "General Discussion", post 3 test messages, verify they appear in the feed.

**Demo Prompt:** `demos/hcs-message-board/PROMPT.md`

---

## Blueprint 4: NFT Gallery & Minter

**Description:** Create NFT collections, mint NFTs with metadata, browse in a gallery view.

**Plugins Required:**
```typescript
import {
  coreTokenPlugin,
  coreTokenQueryPlugin,
} from 'hedera-agent-kit';
```

**API Routes:**

| Method | Route | Action |
|--------|-------|--------|
| `POST` | `/api/nfts/create-collection` | Create NFT collection (name, symbol, maxSupply) |
| `POST` | `/api/nfts/mint` | Mint NFT with metadata (tokenId, metadata) |
| `GET` | `/api/nfts/[tokenId]` | Get collection info and all NFTs |
| `GET` | `/api/nfts/[tokenId]/[serialNumber]` | Get single NFT detail |

**UI Components:**
1. Create collection form — name, symbol, max supply (or infinite toggle)
2. Collection list sidebar — all created collections with stats
3. Mint form — metadata fields: name, description, image URL
4. NFT gallery grid — thumbnails with serial number, name from metadata
5. NFT detail modal — full metadata, image, HashScan link
6. Collection stats header — total minted, max supply, collection token ID

**NFT Metadata Format:**
```json
{
  "name": "AI Art #1",
  "description": "A generated artwork",
  "image": "https://example.com/image.png",
  "properties": {
    "artist": "AI Agent",
    "created": "2025-01-01"
  }
}
```

**Next.js File Structure:**
```
src/
├── app/
│   ├── page.tsx                         # Gallery with collection sidebar
│   └── api/
│       └── nfts/
│           ├── create-collection/route.ts
│           ├── mint/route.ts
│           └── [tokenId]/
│               ├── route.ts             # GET: collection + NFTs
│               └── [serialNumber]/
│                   └── route.ts         # GET: single NFT
├── components/
│   ├── collection-form.tsx
│   ├── collection-sidebar.tsx
│   ├── mint-form.tsx
│   ├── nft-gallery-grid.tsx
│   ├── nft-card.tsx
│   ├── nft-detail-modal.tsx
│   └── collection-stats.tsx
└── lib/
    ├── hedera.ts
    ├── mirror.ts
    └── types.ts
```

**Data Flow:**
```
User fills mint form → POST /api/nfts/mint → MINT_NFT_TOOL (metadata as JSON string)
  → Hedera returns serial number → API returns { tokenId, serialNumber, transactionId }
  → UI adds NFT card to gallery, shows success toast
```

**Sample Response — NFT Mint:**
```json
{
  "tokenId": "0.0.33333",
  "serialNumber": 1,
  "transactionId": "0.0.98765@1234567890.123456789",
  "metadata": {
    "name": "AI Art #1",
    "description": "A generated artwork",
    "image": "https://example.com/image.png"
  }
}
```

**Image Handling:** Use placeholder images when no image URL is provided:
```typescript
const imageUrl = metadata.image || `https://placehold.co/400x400?text=NFT+%23${serialNumber}`;
```

**MCP Seeding:** Create collection "AI Art Collection" (AIART, infinite supply), mint 2-3 NFTs with sample metadata, verify gallery renders them.

**Demo Prompt:** `demos/nft-gallery/PROMPT.md`
