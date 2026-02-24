# App Blueprints

Two demo architectures for Hedera-powered frontends — each showcasing a distinct way to use the Hedera Agent Kit.

## Two Categories

| | Category A: "Built with Agent Kit" | Category B: "Powered by Agent Kit" |
|---|---|---|
| **Pattern** | Multi-plugin orchestration — fixed pipeline | Runtime AI agent — LLM chooses tools dynamically |
| **LLM at runtime?** | No | Yes |
| **Pipeline** | Predefined steps execute in sequence | Agent reasons and chains tools autonomously |
| **Why Agent Kit?** | Plugins provide capabilities impossible with raw SDK | Agent Kit IS the runtime — LLM + tools |
| **Env vars** | Hedera credentials only | Hedera credentials + LLM API key |

Both demos feature a **pipeline visualizer** showing each agent kit tool call executing in real-time.

---

## Blueprint 1: Meme Coin Launchpad (Category A — Regular App)

**One-line pitch:** One-click meme token launch with bonding curve and community governance — chaining Memejob, HCS, and account query plugins in a visible pipeline.

**Hedera Services:** HTS (tokens via Memejob), HCS (community topic), Account Query (balance verification)

**Why it needs the Agent Kit:** Memejob plugin is the only way to create bonding curve tokens programmatically. Combining Memejob token creation + buying with HCS topic creation and cross-plugin verification in one pipeline is multi-plugin orchestration that raw SDK can't do.

**Required env vars:**
```env
HEDERA_OPERATOR_ID=0.0.XXXXX
HEDERA_OPERATOR_KEY=302e...
HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_NETWORK=testnet
```
No LLM API key needed.

### Plugins Required

```typescript
import {
  coreConsensusPlugin,
  coreTokenQueryPlugin,
  coreAccountQueryPlugin,
  AgentMode,
} from 'hedera-agent-kit';
import { memejobPlugin } from '@buidlerlabs/hak-memejob-plugin';
```

### Pipeline Steps

User fills a config form and clicks "Launch". Six steps execute visually:

| Step | Tool | Plugin | Description | Output |
|------|------|--------|-------------|--------|
| 1 | `create_memejob_token_tool` | Memejob | Create meme token with bonding curve | `tokenId`, bonding curve params |
| 2 | `buy_memejob_token_tool` | Memejob | Buy creator's initial position | Tokens acquired, HBAR spent |
| 3 | `get_token_info_query_tool` | Core Token Query | Confirm token state (supply, metadata) | Token info |
| 4 | `create_topic_tool` | Core Consensus | Create community HCS topic | `topicId` |
| 5 | `submit_topic_message_tool` | Core Consensus | Post launch announcement with token/topic details | Message sequence number |
| 6 | `get_account_token_balances_query_tool` | Core Account Query | Verify meme tokens arrived in creator's wallet | Token balances list |

### Pipeline Step Definitions (for `executePipeline()`)

```typescript
// Note: PipelineStepDef includes a `label` field for human-readable step names in the UI
function buildLaunchSteps(config: LaunchConfig): PipelineStepDef[] {
  return [
    {
      stepId: 'create-token',
      tool: 'create_memejob_token_tool',
      service: 'HTS',
      label: 'Create meme token',
      params: {
        required: {
          name: config.tokenName,
          symbol: config.tokenSymbol,
          memo: config.description || config.tokenName,  // memo cannot be empty
        },
      },
    },
    {
      stepId: 'buy-initial',
      tool: 'buy_memejob_token_tool',
      service: 'HTS',
      label: 'Buy initial position',
      params: {
        required: {
          tokenId: '{{create-token.tokenId}}',
          amount: config.initialBuyHbar,
        },
      },
    },
    {
      stepId: 'verify-token',
      tool: 'get_token_info_query_tool',
      service: 'Query',
      label: 'Verify token on-chain',
      params: {
        tokenId: '{{create-token.tokenId}}',
      },
    },
    {
      stepId: 'create-topic',
      tool: 'create_topic_tool',
      service: 'HCS',
      label: 'Create community topic',
      params: {
        memo: `Community: ${config.tokenName} ($${config.tokenSymbol})`,
      },
    },
    {
      stepId: 'announce',
      tool: 'submit_topic_message_tool',
      service: 'HCS',
      label: 'Post launch announcement',
      params: {
        topicId: '{{create-topic.topicId}}',
        message: JSON.stringify({
          event: 'TOKEN_LAUNCH',
          tokenId: '{{create-token.tokenId}}',
          name: config.tokenName,
          symbol: config.tokenSymbol,
          topicId: '{{create-topic.topicId}}',
          timestamp: new Date().toISOString(),
        }),
      },
    },
    {
      stepId: 'verify-balance',
      tool: 'get_account_token_balances_query_tool',
      service: 'Query',
      label: 'Verify tokens in wallet',
      params: {
        accountId: process.env.HEDERA_OPERATOR_ID!,
      },
    },
  ];
}
```

### API Routes

| Method | Route | Action |
|--------|-------|--------|
| `POST` | `/api/pipeline` | Execute the 6-step launch pipeline (SSE stream) |
| `GET` | `/api/account/balance` | Get operator HBAR balance |

### UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: "Meme Coin Launchpad"  [Testnet badge]                  │
├─────────────────────────┬────────────────────────────────────────┤
│  Config Form (left)     │  Pipeline Visualizer (right)           │
│                         │                                        │
│  Token Name: [_______]  │  Step 1: create_memejob...   ✓ 2.3s    │
│  Symbol:     [_______]  │  Step 2: buy_memejob_...     ✓ 1.8s   │
│  Description:[_______]  │  Step 3: get_token_info...   ⏳        │
│  Image URL:  [_______]  │  Step 4: create_topic_tool   ○         │
│  Initial Buy:[___] HBAR │  Step 5: submit_topic_...    ○         │
│                         │  Step 6: get_account_to...   ○         │
│                         │                                        │
│  [🚀 Launch Token]      │  Each step: collapsible params/result  │
├─────────────────────────┴────────────────────────────────────────┤
│  Launch Card (appears after pipeline completes)                   │
│  Token: $MEME (0.0.12345) | Topic: 0.0.67890 | Balance: ✓       │
│  [HashScan Token] [HashScan Topic] [Community Topic]             │
└──────────────────────────────────────────────────────────────────┘
```

### Next.js File Structure

```
src/
├── app/
│   ├── layout.tsx                     # Root layout with dark theme, network badge
│   ├── page.tsx                       # Main page: config form + pipeline visualizer
│   └── api/
│       ├── pipeline/
│       │   └── route.ts              # POST: execute 6-step launch pipeline (SSE)
│       └── account/
│           └── balance/route.ts      # GET: operator HBAR balance
├── components/
│   ├── launch-form.tsx               # Token config form
│   ├── pipeline-visualizer.tsx       # Step-by-step execution display
│   ├── pipeline-step-card.tsx        # Individual step card with status
│   ├── launch-card.tsx               # Summary card after completion
│   ├── service-badge.tsx             # HTS/HCS/DeFi colored badges
│   └── network-badge.tsx             # Testnet/mainnet indicator
├── hooks/
│   └── use-pipeline.ts              # SSE consumer hook
├── lib/
│   ├── toolkit.ts                    # Agent Kit toolkit with 3 plugins + account query
│   ├── pipeline.ts                   # Pipeline execution engine
│   └── hedera.ts                     # Client singleton
└── types/
    └── pipeline.ts                   # Shared pipeline types
```

### Sample Responses

**Pipeline Step Event (SSE):**
```json
{
  "stepId": "create-token",
  "tool": "create_memejob_token_tool",
  "service": "HTS",
  "status": "success",
  "result": {
    "tokenId": "0.0.12345",
    "name": "DogeCoin2",
    "symbol": "DOGE2",
    "bondingCurve": { "type": "linear", "slope": 0.001 }
  },
  "elapsed": 2340
}
```

**Launch Card Data (after pipeline completes):**
```json
{
  "tokenId": "0.0.12345",
  "tokenName": "DogeCoin2",
  "tokenSymbol": "DOGE2",
  "topicId": "0.0.67890",
  "poolInfo": {
    "lpTokenId": "0.0.11111",
    "tokenAAmount": 10000,
    "tokenBAmount": 50
  },
  "hashScanLinks": [
    { "label": "Token", "url": "https://hashscan.io/testnet/token/0.0.12345" },
    { "label": "Topic", "url": "https://hashscan.io/testnet/topic/0.0.67890" }
  ]
}
```

**Demo Prompt:** `demos/meme-coin-launchpad/PROMPT.md`

---

## Blueprint 2: Hedera DeFi Agent (Category B — Agentic App)

**One-line pitch:** Voice and text-enabled DeFi assistant — tell it what to do in natural language and watch it reason, select tools, and execute across all Hedera services.

**Hedera Services (testnet):** HTS, HCS, Account, Memejob. For mainnet, add SaucerSwap and Bonzo.

**Why it needs the Agent Kit:** This IS the agent kit. The app creates a LangGraph agent (`createReactAgent`) with hedera-agent-kit tools, feeds it natural language from the user, and the LLM reasons about which tools to call. Multi-step operations are handled by the agent autonomously.

**Required env vars:**
```env
HEDERA_OPERATOR_ID=0.0.XXXXX
HEDERA_OPERATOR_KEY=302e...
HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_NETWORK=testnet

# LLM Provider (pick one):
OPENAI_API_KEY=sk-...          # or
ANTHROPIC_API_KEY=sk-ant-...   # or
GROQ_API_KEY=gsk_...
```

### Plugins Required

Load plugins based on network — Groq free tier has a 12k TPM limit, so load fewer plugins:

```typescript
import {
  coreAccountPlugin, coreAccountQueryPlugin,
  coreTokenPlugin, coreTokenQueryPlugin,
  coreConsensusPlugin, coreConsensusQueryPlugin,
  AgentMode,
} from 'hedera-agent-kit';
import { memejobPlugin } from '@buidlerlabs/hak-memejob-plugin';
// Mainnet-only plugins (uncomment for mainnet apps):
// import { saucerswapPlugin } from 'hak-saucerswap-plugin';
// import { bonzoPlugin } from '@bonzofinancelabs/hak-bonzo-plugin';
```

### Architecture

```
User (text or voice input)
  ↓
POST /api/agent { input: "Swap 100 HBAR for SAUCE" }
  ↓
Server: LangGraph createReactAgent with hedera-agent-kit tools
  ↓
Agent reasons: "I need to create the token first, then check the balance"
  ↓
SSE events stream to client via agent.stream():
  → { status: "Agent is thinking..." }
  → { tool_start: "create_memejob_token_tool", input: {...} }
  → { tool_call: "create_memejob_token_tool", output: {...} }
  → { output: "Created meme token PEPE (0.0.12345). Transaction: 0.0.98765@..." }
  ↓
Pipeline visualizer updates in real-time
Account dashboard auto-refreshes
```

### Example Interactions

| User Says | Agent Does | Testnet? |
|-----------|-----------|----------|
| "What's my HBAR balance?" | Calls `get_hbar_balance_query_tool` | ✅ |
| "Create a token called GameCoin with 50000 supply" | Calls `create_fungible_token_tool` | ✅ |
| "Launch a meme coin called PEPE" | Calls `create_memejob_token_tool` | ✅ |
| "Create a topic for our community" | Calls `create_topic_tool` | ✅ |
| "Post a message to topic 0.0.12345" | Calls `submit_topic_message_tool` | ✅ |
| "What tokens do I have?" | Calls `get_account_token_balances_query_tool` | ✅ |
| "Airdrop 100 tokens to these 5 accounts" | Calls `airdrop_fungible_token_tool` | ✅ |
| "Swap 100 HBAR for SAUCE on SaucerSwap" | Calls `saucerswap_get_swap_quote` → `saucerswap_swap_tokens` | ⚠️ Mainnet |

### API Routes

| Method | Route | Action |
|--------|-------|--------|
| `POST` | `/api/agent` | Send natural language input, receive SSE stream of agent actions |
| `GET` | `/api/account/info` | Get operator account info (balance, tokens, recent txns) via Mirror Node |

### UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: "Hedera DeFi Agent"  [Testnet badge]  [LLM: GPT-4o]    │
├──────────────────────────────────────────────────────────────────┤
│  Input Bar: [Type a message...                     ] [🎤] [Send] │
├──────────────────────────────┬───────────────────────────────────┤
│  Pipeline / Chat (center)    │  Account Dashboard (right)        │
│                              │                                   │
│  You: "Swap 100 HBAR for     │  Account: 0.0.12345               │
│        SAUCE"                │  Balance: 925.5 ℏ                 │
│                              │                                   │
│  Agent thinking...           │  Tokens:                          │
│  ┌─ saucerswap_get_swap.. ┐ │  SAUCE    2,450   0.0.67890       │
│  │ status: ✓  1.2s        │ │  USDC     100     0.0.45678       │
│  │ quote: 2,450 SAUCE     │ │                                   │
│  └────────────────────────┘ │  Recent Transactions:              │
│  ┌─ saucerswap_swap_to... ┐ │  SWAP     ✓  just now             │
│  │ status: ✓  3.1s        │ │  TRANSFER ✓  2 min ago            │
│  │ txId: 0.0.98765@...    │ │                                   │
│  └────────────────────────┘ │                                   │
│                              │                                   │
│  Agent: "Done! Swapped 100   │  [Auto-refreshes after each       │
│  HBAR for 2,450 SAUCE."     │   agent operation]                 │
├──────────────────────────────┴───────────────────────────────────┤
│  Suggested: "Check my balance" | "Create a token" | "Swap tokens"│
└──────────────────────────────────────────────────────────────────┘
```

### Next.js File Structure

```
src/
├── app/
│   ├── layout.tsx                     # Root layout with dark theme, providers
│   ├── page.tsx                       # Main page: input bar + chat/pipeline + dashboard
│   └── api/
│       ├── agent/
│       │   └── route.ts              # POST: LangChain agent execution (SSE)
│       └── account/
│           └── info/route.ts         # GET: account info via Mirror Node
├── components/
│   ├── agent-input.tsx               # Text input + mic button + send
│   ├── pipeline-visualizer.tsx       # Dynamic step display (shared component)
│   ├── pipeline-step-card.tsx        # Individual step card (shared component)
│   ├── chat-message.tsx              # User/agent message bubbles
│   ├── account-dashboard.tsx         # Balance, tokens, recent txns panel
│   ├── suggested-actions.tsx         # Quick-action suggestion chips
│   ├── service-badge.tsx             # HTS/HCS/DeFi colored badges
│   └── network-badge.tsx             # Testnet/mainnet indicator
├── hooks/
│   ├── use-agent.ts                  # Agent SSE consumer hook
│   └── use-voice-input.ts           # Web Speech API voice input
├── lib/
│   ├── agent.ts                      # LangChain agent setup (all plugins + LLM)
│   ├── toolkit.ts                    # Agent Kit toolkit with ALL plugins
│   ├── mirror.ts                     # Mirror Node API helpers
│   └── hedera.ts                     # Client singleton
└── types/
    ├── agent.ts                      # Agent-specific types
    └── pipeline.ts                   # Shared pipeline types
```

### Agent Setup (`src/lib/agent.ts`)

See `references/agent-kit-sdk-reference.md` → "LangChain Agent Integration" for the full initialization code. Key points:

1. Auto-detect LLM provider from env vars (`OPENAI_API_KEY` → OpenAI, etc.)
2. Load plugins based on network: core + Memejob for testnet, add SaucerSwap + Bonzo for mainnet
3. Use `createReactAgent` from `@langchain/langgraph/prebuilt` with system prompt
4. Stream responses via `agent.stream()` with `streamMode: 'updates'` for SSE

> **Groq free tier:** Loading all plugins (~38 tools) exceeds Groq's 12k TPM limit. For Groq free tier, load only the plugins your app needs (≤10 tools). OpenAI/Anthropic handle the full set.

### SSE Event Format

```json
// Status update
{ "event": "status", "data": { "message": "Agent is thinking..." } }

// Tool call
{ "event": "tool_call", "data": {
    "tool": "saucerswap_swap_tokens",
    "input": { "fromToken": "HBAR", "toToken": "0.0.67890", "amount": "100" },
    "output": { "transactionId": "0.0.98765@1234567890.123", "amountOut": "2450" }
  }
}

// Final result
{ "event": "result", "data": { "output": "Swapped 100 HBAR for 2,450 SAUCE." } }

// Done
{ "event": "done", "data": {} }
```

### Sample Account Dashboard Response (Mirror Node)

```json
{
  "accountId": "0.0.12345",
  "hbarBalance": "925.50",
  "tokens": [
    { "tokenId": "0.0.67890", "name": "SAUCE", "symbol": "SAUCE", "balance": 2450, "decimals": 6 },
    { "tokenId": "0.0.45678", "name": "USDC", "symbol": "USDC", "balance": 100, "decimals": 6 }
  ],
  "recentTransactions": [
    { "transactionId": "0.0.98765@1234567890.123", "type": "CRYPTOTRANSFER", "status": "SUCCESS", "timestamp": "2025-01-15T10:30:00Z" }
  ]
}
```

**Demo Prompt:** `demos/defi-agent/PROMPT.md`
