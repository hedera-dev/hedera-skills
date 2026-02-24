# Hedera Agent Kit SDK Reference

Condensed API reference for `hedera-agent-kit` v3.7.x / v3.8.x npm package.

## Installation

```bash
npm install hedera-agent-kit @hiero-ledger/sdk @langchain/core langchain dotenv
```

> **Note:** The Hedera SDK was renamed from `@hashgraph/sdk` to `@hiero-ledger/sdk`. Both packages export the same API. Use `@hiero-ledger/sdk` for new projects.

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
import { Client, PrivateKey } from '@hiero-ledger/sdk';

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
import { saucerSwapPlugin } from 'hak-saucerswap-plugin';
import { bonzoPlugin } from '@bonzofinancelabs/hak-bonzo-plugin';
import { memejobPlugin } from '@buidlerlabs/hak-memejob-plugin';

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    plugins: [
      ...corePlugins,
      saucerSwapPlugin,
      bonzoPlugin,
      memejobPlugin,
    ],
    context: { mode: AgentMode.AUTONOMOUS },
  },
});
```

### SaucerSwap Plugin (`saucerSwapPlugin`)

SaucerSwap is Hedera's leading DEX. All tools operate on testnet or mainnet based on the client's network.

| Tool Name | Params | Description |
|-----------|--------|-------------|
| `saucerswap_swap` | `tokenInId: string, tokenOutId: string, amountIn: number, slippage?: number` | Swap tokens on SaucerSwap. Use `"HBAR"` as the token ID for native HBAR. Slippage defaults to 0.5%. |
| `saucerswap_get_quote` | `tokenInId: string, tokenOutId: string, amountIn: number` | Get a price quote without executing a swap. Returns expected output amount and price impact. |
| `saucerswap_add_liquidity` | `tokenAId: string, tokenBId: string, amountA: number, amountB: number` | Add liquidity to a token pair pool. Creates the pool if it doesn't exist. Returns LP token info. |
| `saucerswap_remove_liquidity` | `lpTokenId: string, amount: number` | Remove liquidity by burning LP tokens. Returns withdrawn amounts of both tokens. |
| `saucerswap_get_pools` | none | List available liquidity pools with TVL, volume, and token pair info. |

### Bonzo Finance Plugin (`bonzoPlugin`)

Bonzo is a DeFi lending/borrowing protocol on Hedera. Users supply collateral and borrow against it.

| Tool Name | Params | Description |
|-----------|--------|-------------|
| `bonzo_supply` | `tokenId: string, amount: number` | Supply tokens as collateral to Bonzo. Receives interest-bearing bTokens in return. |
| `bonzo_borrow` | `tokenId: string, amount: number` | Borrow tokens against existing collateral. Requires sufficient collateral ratio. |
| `bonzo_repay` | `tokenId: string, amount: number` | Repay borrowed tokens (partial or full). Reduces outstanding debt. |
| `bonzo_withdraw` | `tokenId: string, amount: number` | Withdraw previously supplied collateral. Fails if it would under-collateralize active borrows. |

### Memejob Plugin (`memejobPlugin`)

Memejob creates meme tokens with built-in bonding curves — a pricing mechanism where token price increases as more tokens are bought.

| Tool Name | Params | Description |
|-----------|--------|-------------|
| `memejob_create` | `name: string, symbol: string, description?: string, imageUrl?: string` | Create a new meme token with an automatic bonding curve. Returns tokenId and bonding curve parameters. |
| `memejob_buy` | `tokenId: string, hbarAmount: number` | Buy meme tokens by spending HBAR. Price determined by bonding curve (more bought = higher price). |
| `memejob_sell` | `tokenId: string, tokenAmount: number` | Sell meme tokens back for HBAR. Price determined by bonding curve. |

> **Testnet support:** All three plugins support Hedera testnet. SaucerSwap has a testnet DEX deployment. Bonzo has a testnet lending market. Memejob supports testnet token creation.

---

## LangChain Agent Integration

For **agentic apps** (Category B) where an LLM reasons about which tools to call at runtime, use LangChain's agent framework with hedera-agent-kit tools.

### Agent Initialization

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
import { saucerSwapPlugin } from 'hak-saucerswap-plugin';
import { bonzoPlugin } from '@bonzofinancelabs/hak-bonzo-plugin';
import { memejobPlugin } from '@buidlerlabs/hak-memejob-plugin';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGroq } from '@langchain/groq';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Client, PrivateKey } from '@hiero-ledger/sdk';

// 1. Initialize Hedera client
const rawKey = process.env.HEDERA_OPERATOR_KEY!.trim().replace(/^0x/, '');
const operatorKey = rawKey.startsWith('302')
  ? PrivateKey.fromStringDer(rawKey)
  : PrivateKey.fromStringECDSA(rawKey);

const client = Client.forTestnet().setOperator(
  process.env.HEDERA_OPERATOR_ID!,
  operatorKey
);

// 2. Create toolkit with ALL plugins
const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    tools: [],
    context: { mode: AgentMode.AUTONOMOUS },
    plugins: [
      coreAccountPlugin, coreAccountQueryPlugin,
      coreTokenPlugin, coreTokenQueryPlugin,
      coreConsensusPlugin, coreConsensusQueryPlugin,
      coreEVMPlugin, coreEVMQueryPlugin,
      coreMiscQueriesPlugin,
      saucerSwapPlugin,
      bonzoPlugin,
      memejobPlugin,
    ],
  },
});

// 3. Choose LLM provider based on available env var
function createLLM() {
  if (process.env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
    });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({
      modelName: 'claude-sonnet-4-20250514',
      temperature: 0,
    });
  }
  if (process.env.GROQ_API_KEY) {
    return new ChatGroq({
      modelName: 'llama-3.3-70b-versatile',
      temperature: 0,
    });
  }
  throw new Error(
    'No LLM API key found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY.'
  );
}

// 4. Create the agent
const llm = createLLM();
const tools = toolkit.getTools();

const prompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a Hedera DeFi assistant. You help users interact with the Hedera network.
You can create tokens, transfer HBAR, swap on SaucerSwap, lend/borrow on Bonzo, and more.
Always confirm what you're about to do before executing transactions.
After each operation, provide the transaction ID and a HashScan link.`],
  ['human', '{input}'],
  ['placeholder', '{agent_scratchpad}'],
]);

const agent = createToolCallingAgent({ llm, tools, prompt });

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,        // logs reasoning to console
  maxIterations: 10,    // safety limit
  returnIntermediateSteps: true,  // needed for pipeline visualization
});

// 5. Execute with user input
const result = await agentExecutor.invoke({
  input: 'What is my HBAR balance?',
});
// result.output — final text response
// result.intermediateSteps — array of { action, observation } pairs
```

### LLM Provider Dependencies

Install the package for your chosen LLM provider:

```bash
# OpenAI
npm install @langchain/openai

# Anthropic
npm install @langchain/anthropic

# Groq (fast, free tier available)
npm install @langchain/groq
```

### Streaming Agent Responses via SSE

For real-time pipeline visualization, stream agent execution steps to the client:

```typescript
// In a Next.js API route (e.g., src/app/api/agent/route.ts)
export async function POST(req: Request) {
  const { input } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send('status', { message: 'Agent is thinking...' });

      const result = await agentExecutor.invoke({ input });

      // Stream each intermediate step
      for (const step of result.intermediateSteps) {
        send('tool_call', {
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation,
        });
      }

      send('result', { output: result.output });
      send('done', {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```
