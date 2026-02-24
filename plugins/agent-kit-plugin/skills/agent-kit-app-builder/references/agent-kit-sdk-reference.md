# Hedera Agent Kit SDK Reference

Condensed API reference for `hedera-agent-kit` v3.7.x / v3.8.x npm package.

## Installation

```bash
npm install hedera-agent-kit @hashgraph/sdk @langchain/core langchain dotenv
```

> **Note:** While the SDK was renamed to `@hiero-ledger/sdk`, hedera-agent-kit and its plugins still import from `@hashgraph/sdk` internally. To avoid `instanceof` mismatches, use `@hashgraph/sdk` when building apps with hedera-agent-kit. Both packages export the same API.

## Initialization

```typescript
import {
  HederaLangchainToolkit,
  coreAccountPlugin, coreAccountQueryPlugin,
  coreTokenPlugin, coreTokenQueryPlugin,
  coreConsensusPlugin, coreConsensusQueryPlugin,
  coreEVMPlugin, coreEVMQueryPlugin,
  coreMiscQueriesPlugin,
  AgentMode,
} from 'hedera-agent-kit';
import { Client, PrivateKey } from '@hashgraph/sdk';

// Auto-detect key format: DER (starts with "302") vs hex (ECDSA)
// Strip "0x" prefix if present (common with MetaMask/wallet exports)
const rawKey = process.env.HEDERA_OPERATOR_KEY!.trim().replace(/^0x/, '');
const operatorKey = rawKey.startsWith('302')
  ? PrivateKey.fromStringDer(rawKey)
  : PrivateKey.fromStringECDSA(rawKey);

// Client setup
const client = Client.forTestnet().setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  operatorKey
);
// For mainnet: Client.forMainnet()

// Toolkit with all plugins
const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    tools: [],  // empty = load ALL tools from plugins
    context: { mode: AgentMode.AUTONOMOUS },
    plugins: [
      coreAccountPlugin, coreAccountQueryPlugin,
      coreTokenPlugin, coreTokenQueryPlugin,
      coreConsensusPlugin, coreConsensusQueryPlugin,
      coreEVMPlugin, coreEVMQueryPlugin,
      coreMiscQueriesPlugin,
    ],
  },
});

// Get LangChain-compatible tools
const tools = toolkit.getTools();
```

## Execution Modes

| Mode | Behavior | Best For |
|------|----------|----------|
| `AgentMode.AUTONOMOUS` | Transactions execute immediately using the operator account | Backend agents, testnet development |
| `AgentMode.RETURN_BYTES` | Returns transaction bytes for external signing | User-facing apps, security-sensitive flows |

---

## Plugin & Tool Reference

### Core Account Plugin (`coreAccountPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `TRANSFER_HBAR_TOOL` | `toAccountId: string, amount: number` (HBAR) | Transfer HBAR |
| `CREATE_ACCOUNT_TOOL` | `initialBalance: number` (HBAR) | Create a new Hedera account |
| `UPDATE_ACCOUNT_TOOL` | `accountId: string`, optional fields | Update account properties |
| `DELETE_ACCOUNT_TOOL` | `accountId: string` | Delete account and transfer remaining assets |
| `APPROVE_HBAR_ALLOWANCE_TOOL` | `spenderAccountId: string, amount: number` | Approve HBAR spending allowance |
| `DELETE_HBAR_ALLOWANCE_TOOL` | `spenderAccountId: string` | Delete HBAR allowance |
| `TRANSFER_HBAR_WITH_ALLOWANCE_TOOL` | `fromAccountId: string, toAccountId: string, amount: number` | Transfer HBAR using existing allowance |
| `APPROVE_TOKEN_ALLOWANCE_TOOL` | `tokenId: string, spenderAccountId: string, amount: number` | Approve fungible token allowance |
| `DELETE_TOKEN_ALLOWANCE_TOOL` | `tokenId: string, spenderAccountId: string` | Delete fungible token allowance |
| `SIGN_SCHEDULE_TRANSACTION_TOOL` | `scheduleId: string` | Sign a scheduled transaction |
| `SCHEDULE_DELETE_TOOL` | `scheduleId: string` | Delete a scheduled transaction |

### Core Account Query Plugin (`coreAccountQueryPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_ACCOUNT_QUERY_TOOL` | `accountId: string` | Get full account info |
| `GET_HBAR_BALANCE_QUERY_TOOL` | `accountId: string` | Get HBAR balance |
| `GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL` | `accountId: string` | Get all token balances for account |

### Core Token Plugin (`coreTokenPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `CREATE_FUNGIBLE_TOKEN_TOOL` | `name: string, symbol: string, initialSupply: number, decimals: number`. Optional: `treasuryAccountId`, `adminKey`, `supplyKey`, `freezeKey`, `wipeKey`, `kycKey` | Create fungible token. **Important:** `initialSupply` is in smallest units (multiply by `10^decimals`). Must set `supplyKey` if minting later. |
| `CREATE_NON_FUNGIBLE_TOKEN_TOOL` | `name: string, symbol: string`. Optional: `maxSupply: number` (omit for infinite), `treasuryAccountId`, keys | Create NFT collection |
| `MINT_FUNGIBLE_TOKEN_TOOL` | `tokenId: string, amount: number` | Mint additional fungible supply. `amount` is in smallest units. Receipt `totalSupply` can be null — use optional chaining. |
| `MINT_NON_FUNGIBLE_TOKEN_TOOL` | `tokenId: string, metadata: string` (or byte array) | Mint NFT with metadata |
| `AIRDROP_FUNGIBLE_TOKEN_TOOL` | `tokenId: string, recipients: array` | Airdrop fungible tokens to multiple recipients |
| `TRANSFER_NON_FUNGIBLE_TOKEN_TOOL` | `tokenId: string, serialNumber: number, toAccountId: string` | Transfer an NFT |
| `TRANSFER_FUNGIBLE_TOKEN_WITH_ALLOWANCE_TOOL` | `tokenId: string, fromAccountId: string, toAccountId: string, amount: number` | Transfer fungible tokens using allowance |
| `TRANSFER_NON_FUNGIBLE_TOKEN_WITH_ALLOWANCE_TOOL` | `tokenId: string, serialNumber: number, fromAccountId: string, toAccountId: string` | Transfer NFT using allowance |
| `APPROVE_NFT_ALLOWANCE_TOOL` | `tokenId: string, spenderAccountId: string, serialNumber: number` | Approve NFT allowance |
| `DELETE_NFT_ALLOWANCE_TOOL` | `tokenId: string, spenderAccountId: string, serialNumber: number` | Delete NFT allowance |
| `ASSOCIATE_TOKEN_TOOL` | `tokenId: string, accountId: string` | Associate token with account |
| `DISSOCIATE_TOKEN_TOOL` | `tokenId: string, accountId: string` | Dissociate token from account |
| `UPDATE_TOKEN_TOOL` | `tokenId: string`, optional fields | Update token properties |

### Core Token Query Plugin (`coreTokenQueryPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_TOKEN_INFO_QUERY_TOOL` | `tokenId: string` | Get token metadata (name, symbol, supply, etc.) |
| `GET_PENDING_AIRDROP_TOOL` | `accountId: string` | Get pending airdrops for an account |

### Core Consensus Plugin (`coreConsensusPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `CREATE_TOPIC_TOOL` | Optional: `memo: string, adminKey: string, submitKey: string` | Create HCS topic |
| `UPDATE_TOPIC_TOOL` | `topicId: string`, updated fields | Update topic properties |
| `DELETE_TOPIC_TOOL` | `topicId: string` | Delete a topic |
| `SUBMIT_TOPIC_MESSAGE_TOOL` | `topicId: string, message: string` | Post message to topic |

### Core Consensus Query Plugin (`coreConsensusQueryPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_TOPIC_INFO_QUERY_TOOL` | `topicId: string` | Get topic metadata (memo, keys, sequence number) |
| `GET_TOPIC_MESSAGES_QUERY_TOOL` | `topicId: string`. Optional: `sequenceNumber: number` | Get messages from topic |

### Core EVM Plugin (`coreEVMPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `CREATE_ERC20_TOOL` | `name: string, symbol: string, totalSupply: number` | Deploy ERC-20 token via factory |
| `TRANSFER_ERC20_TOOL` | `contractId: string, toAddress: string, amount: number` | Transfer ERC-20 tokens |
| `CREATE_ERC721_TOOL` | `name: string, symbol: string` | Deploy ERC-721 NFT contract |
| `MINT_ERC721_TOOL` | `contractId: string, toAddress: string, tokenURI: string` | Mint ERC-721 NFT |
| `TRANSFER_ERC721_TOOL` | `contractId: string, toAddress: string, tokenId: number` | Transfer ERC-721 NFT |

### Core EVM Query Plugin (`coreEVMQueryPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_CONTRACT_INFO_QUERY_TOOL` | `contractId: string` | Get contract info |

### Core Transaction Query Plugin (`coreTransactionQueryPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_TRANSACTION_RECORD_QUERY_TOOL` | `transactionId: string` | Get transaction details by ID |

### Core Misc Queries Plugin (`coreMiscQueriesPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_EXCHANGE_RATE_TOOL` | none | Get current HBAR exchange rate |

---

## Private Key Formats

```typescript
// DER-encoded (default, recommended)
PrivateKey.fromStringDer(key)

// ECDSA hex format
PrivateKey.fromStringECDSA(key)

// ED25519 format
PrivateKey.fromStringED25519(key)
```

## Scheduled Transactions

Any mutation tool supports scheduling by passing `schedulingParams`:

```typescript
{
  schedulingParams: {
    isScheduled: true,
    scheduledTransactionMemo: "My scheduled tx",
    expirationTime: "2025-12-31T00:00:00Z",
  }
}
```

## Third-Party Plugins

These community plugins extend the Agent Kit with DeFi and ecosystem integrations:

| Plugin | Package | Capabilities |
|--------|---------|-------------|
| SaucerSwap | `hak-saucerswap-plugin` | DEX swaps, liquidity pools, price quotes |
| Bonzo Finance | `@bonzofinancelabs/hak-bonzo-plugin` | DeFi lending and borrowing |
| Memejob | `@buidlerlabs/hak-memejob-plugin` | Meme token creation with bonding curves |

Install and register like any core plugin:

```typescript
import { saucerswapPlugin } from 'hak-saucerswap-plugin';
import { bonzoPlugin } from '@bonzofinancelabs/hak-bonzo-plugin';
import { memejobPlugin } from '@buidlerlabs/hak-memejob-plugin';

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    plugins: [
      ...corePlugins,
      saucerswapPlugin,
      bonzoPlugin,
      memejobPlugin,
    ],
    context: { mode: AgentMode.AUTONOMOUS },
  },
});
```

### SaucerSwap Plugin (`saucerswapPlugin`)

SaucerSwap is Hedera's leading DEX. **⚠️ Mainnet only** — the plugin defaults to the mainnet API (`api.saucerswap.finance`) and returns 401 on testnet. Only include in mainnet-targeting apps.

> **Import name:** `saucerswapPlugin` (lowercase 's' in swap).

| Tool Name | Params | Description |
|-----------|--------|-------------|
| `saucerswap_swap_tokens` | `fromToken: string, toToken: string, amount: string, slippageTolerance?: number` | Swap tokens on SaucerSwap. Use `"HBAR"` for native HBAR. Amount is a decimal string (e.g., `"100"`). Slippage defaults to 0.5%. |
| `saucerswap_get_swap_quote` | `fromToken: string, toToken: string, amount: string, slippageTolerance?: number` | Get a price quote without executing. Returns expected output and price impact. |
| `saucerswap_add_liquidity` | `tokenA: string, tokenB: string, amountA: string, amountB: string, slippageTolerance?: number` | Add liquidity to a pool. Amounts are decimal strings. |
| `saucerswap_remove_liquidity` | `tokenA: string, tokenB: string, lpTokenAmount: string, minAmountA: string, minAmountB: string` | Remove liquidity by specifying token pair and LP amount to burn. |
| `saucerswap_get_pools` | `tokenA?: string, tokenB?: string, version?: string, limit?: number` | Query liquidity pools. All params optional — omit for all pools. |
| `saucerswap_get_farms` | `poolId?: string` | Get active farming/staking opportunities. Optional pool ID filter. |

### Bonzo Finance Plugin (`bonzoPlugin`)

Bonzo is a DeFi lending/borrowing protocol on Hedera (Aave v2 fork). Users supply collateral and borrow against it.

| Tool Name | Params | Description |
|-----------|--------|-------------|
| `bonzo_market_data_tool` | none | Fetch current market data: supported tokens, supply/borrow APYs, liquidity. Read-only. |
| `bonzo_deposit_tool` | `required: { tokenSymbol: string, amount: number \| string }` | Supply tokens as collateral (called "deposit"). Uses token symbol (e.g., `"HBAR"`, `"USDC"`), not token ID. |
| `bonzo_borrow_tool` | `required: { tokenSymbol: string, amount: number \| string }` | Borrow tokens against existing collateral. Requires sufficient collateral ratio. |
| `bonzo_repay_tool` | `required: { tokenSymbol: string, amount: number \| string }` | Repay borrowed tokens (partial or full). |
| `bonzo_withdraw_tool` | `required: { tokenSymbol: string, amount: number \| string }` | Withdraw previously supplied collateral. Fails if it would under-collateralize borrows. |

> **Bonzo param pattern:** Bonzo tools use **nested objects** with `required` and optional `optional` keys, and identify tokens by **symbol** (e.g., `"HBAR"`) not token ID.

### Memejob Plugin (`memejobPlugin`)

Memejob creates meme tokens with built-in bonding curves — a pricing mechanism where token price increases as more tokens are bought.

| Tool Name | Params | Description |
|-----------|--------|-------------|
| `create_memejob_token_tool` | `required: { name: string, symbol: string, memo: string }, optional?: { amount?: number, distributeRewards?: boolean }` | Create a meme token. `memo` is required — a description or IPFS metadata path for the token (cannot be empty). Optional `amount` buys an initial position. |
| `buy_memejob_token_tool` | `required: { tokenId: string, amount: number }, optional?: { autoAssociate?: boolean }` | Buy meme tokens by spending HBAR. Amount in HBAR. Price determined by bonding curve. |
| `sell_memejob_token_tool` | `required: { tokenId: string, amount: number }, optional?: { instant?: boolean }` | Sell meme tokens back for HBAR. If `instant: true`, auto-approves token allowance before selling. |

> **Memejob param pattern:** Memejob tools use **nested objects** with `required` and optional `optional` keys. Always wrap params in `{ required: { ... } }`.

> **Testnet Compatibility:**
>
> | Plugin | Testnet Support | Notes |
> |--------|----------------|-------|
> | **Core plugins** (account, token, consensus, EVM, query) | ✅ Full support | All core plugins work on testnet out of the box |
> | **Memejob** | ✅ Full support | Token creation, buying, selling all work on testnet |
> | **SaucerSwap** | ⚠️ Mainnet only | The plugin defaults to the mainnet API (`api.saucerswap.finance`). Testnet returns 401. Only include in apps targeting mainnet. |
> | **Bonzo** | ⚠️ Requires setup | Needs a `bonzo-contracts.json` config file with deployed contract addresses. Not plug-and-play on testnet. |
>
> **For testnet demos:** Use core plugins + Memejob. Add SaucerSwap/Bonzo only when targeting mainnet or when their testnet setup is configured.

---

## LangChain Agent Integration

For **agentic apps** (Category B) where an LLM reasons about which tools to call at runtime, use LangGraph's `createReactAgent` with hedera-agent-kit tools.

> **Important:** The old `langchain/agents` path (`createToolCallingAgent` + `AgentExecutor`) is no longer exported in langchain v1.x. Use `createReactAgent` from `@langchain/langgraph/prebuilt` instead — it's a simpler, more powerful API that returns a compiled graph you can invoke or stream directly.

### Agent Initialization

```typescript
import {
  HederaLangchainToolkit,
  coreAccountPlugin, coreAccountQueryPlugin,
  coreTokenPlugin, coreTokenQueryPlugin,
  coreConsensusPlugin, coreConsensusQueryPlugin,
  AgentMode,
} from 'hedera-agent-kit';
import { memejobPlugin } from '@buidlerlabs/hak-memejob-plugin';
// Optional mainnet-only plugins (see Testnet Compatibility above):
// import { saucerswapPlugin } from 'hak-saucerswap-plugin';
// import { bonzoPlugin } from '@bonzofinancelabs/hak-bonzo-plugin';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGroq } from '@langchain/groq';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { Client, PrivateKey } from '@hashgraph/sdk';

// 1. Initialize Hedera client
const rawKey = process.env.HEDERA_OPERATOR_KEY!.trim().replace(/^0x/, '');
const operatorKey = rawKey.startsWith('302')
  ? PrivateKey.fromStringDer(rawKey)
  : PrivateKey.fromStringECDSA(rawKey);

const client = Client.forTestnet().setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  operatorKey
);

// 2. Create toolkit with plugins
// IMPORTANT: Loading all plugins (38+ tools) sends ~34k tokens of schemas to the LLM.
// Groq free tier has a 12k TPM limit — load only the plugins you need.
// OpenAI and Anthropic handle the full set without issues.
const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    tools: [],
    context: { mode: AgentMode.AUTONOMOUS },
    plugins: [
      coreAccountPlugin, coreAccountQueryPlugin,
      coreTokenPlugin, coreTokenQueryPlugin,
      coreConsensusPlugin, coreConsensusQueryPlugin,
      memejobPlugin,
      // Add these for mainnet apps:
      // saucerswapPlugin,
      // bonzoPlugin,
    ],
  },
});

// 3. Choose LLM provider based on available env var
function createLLM() {
  if (process.env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0,
    });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({
      model: 'claude-sonnet-4-20250514',
      temperature: 0,
    });
  }
  if (process.env.GROQ_API_KEY) {
    return new ChatGroq({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
    });
  }
  throw new Error(
    'No LLM API key found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY.'
  );
}

// 4. Create the agent using LangGraph's createReactAgent
const llm = createLLM();
const tools = toolkit.getTools();

// IMPORTANT: TypeScript may throw "Type instantiation is excessively deep and possibly infinite"
// on createReactAgent({ llm, tools }). Fix with `as any` cast:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agent = createReactAgent({ llm, tools } as any);

// 5. Execute with user input
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What is my HBAR balance?' }],
});
// result.messages — array of BaseMessage objects (user, AI, tool calls, tool results)
// The last AI message contains the final response

// 6. Or stream for real-time updates (use 'updates' mode for SSE)
const stream = await agent.stream(
  { messages: [{ role: 'user', content: 'What is my HBAR balance?' }] },
  { streamMode: 'updates' },
);
for await (const rawChunk of stream) {
  // IMPORTANT: LangGraph stream chunks have typed Messages that aren't directly
  // iterable with for...of. Cast to `any` and use Array.isArray():
  const chunk = rawChunk as any;

  if (chunk.agent?.messages) {
    const msgs = Array.isArray(chunk.agent.messages) ? chunk.agent.messages : [chunk.agent.messages];
    for (const msg of msgs) {
      // msg.content = AI text response
      // msg.tool_calls = array of { name, args } the agent wants to invoke
    }
  }
  if (chunk.tools?.messages) {
    const msgs = Array.isArray(chunk.tools.messages) ? chunk.tools.messages : [chunk.tools.messages];
    for (const msg of msgs) {
      // msg.name = tool name, msg.content = tool result (JSON string)
    }
  }
}
```

> **Groq free tier limitation:** Loading all plugins generates ~38 tools (~34k tokens of schemas). Groq's free tier has a 12k TPM limit. To use Groq free tier, load only the plugins your app needs (≤10 tools). OpenAI and Anthropic paid tiers handle the full tool set.

### LLM Provider Dependencies

Install the LangGraph agent framework and your chosen LLM provider:

```bash
# Required for all Category B apps:
npm install @langchain/langgraph @langchain/core

# Then install ONE LLM provider:
npm install @langchain/openai      # OpenAI (most reliable tool calling)
npm install @langchain/anthropic   # Anthropic (strong reasoning)
npm install @langchain/groq        # Groq (fast, free tier — see token limits below)
```

> **Note:** `langchain` (the main package) is NOT needed. The agent is created entirely with `@langchain/langgraph` + `@langchain/core` + your LLM provider package.

### Streaming Agent Responses via SSE

For real-time pipeline visualization, stream agent execution via `agent.stream()`:

```typescript
// In a Next.js API route (e.g., src/app/api/agent/route.ts)
export async function POST(req: Request) {
  const { input } = await req.json();

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send('status', { message: 'Agent is thinking...' });

      // Stream using LangGraph's agent.stream()
      const agentStream = await agent.stream(
        { messages: [{ role: 'user', content: input }] },
        { streamMode: 'updates' },
      );

      let finalResponse = '';
      for await (const rawUpdate of agentStream) {
        // IMPORTANT: Cast to `any` — LangGraph's Messages type isn't directly
        // iterable. Also use Array.isArray() as messages may not always be an array.
        const update = rawUpdate as any;

        // Tool node updates contain tool call results
        if (update.tools?.messages) {
          const msgs = Array.isArray(update.tools.messages) ? update.tools.messages : [update.tools.messages];
          for (const msg of msgs) {
            send('tool_end', { tool: msg.name, output: msg.content });
          }
        }
        // Agent node updates contain AI responses and tool call requests
        if (update.agent?.messages) {
          const msgs = Array.isArray(update.agent.messages) ? update.agent.messages : [update.agent.messages];
          for (const msg of msgs) {
            if (msg.tool_calls?.length) {
              for (const tc of msg.tool_calls) {
                send('tool_start', { tool: tc.name, input: tc.args });
              }
            }
            if (typeof msg.content === 'string' && msg.content) {
              finalResponse = msg.content;
            }
          }
        }
      }

      send('result', { output: finalResponse });
      send('done', {});
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```
