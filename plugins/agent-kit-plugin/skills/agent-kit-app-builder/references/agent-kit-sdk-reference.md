# Hedera Agent Kit SDK Reference

Condensed API reference for `hedera-agent-kit` v3.7.x npm package.

## Installation

```bash
npm install hedera-agent-kit @hashgraph/sdk @langchain/core langchain dotenv
```

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
const operatorKey = process.env.HEDERA_OPERATOR_KEY!.trim().startsWith('302')
  ? PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!)
  : PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);

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
| `CREATE_ACCOUNT_TOOL` | `initialBalance: number` (HBAR) | Create a new Hedera account |
| `UPDATE_ACCOUNT_TOOL` | `accountId: string`, optional fields | Update account properties |
| `APPROVE_ALLOWANCE_TOOL` | `spenderAccountId: string, amount: number`, optional `tokenId: string` | Approve HBAR or token allowance |
| `DELETE_ALLOWANCE_TOOL` | `ownerAccountId: string, spenderAccountId: string` | Delete an allowance |
| `TRANSFER_HBAR_TOOL` | `toAccountId: string, amount: number` (HBAR) | Transfer HBAR |

### Core Account Query Plugin (`coreAccountQueryPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_ACCOUNT_QUERY_TOOL` | `accountId: string` | Get full account info |
| `GET_HBAR_BALANCE_QUERY_TOOL` | `accountId: string` | Get HBAR balance |
| `GET_ACCOUNT_TOKENS_QUERY_TOOL` | `accountId: string` | Get all token balances for account |

### Core Token Plugin (`coreTokenPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `CREATE_FUNGIBLE_TOKEN_TOOL` | `name: string, symbol: string, initialSupply: number, decimals: number`. Optional: `treasuryAccountId`, `adminKey`, `supplyKey`, `freezeKey`, `wipeKey`, `kycKey` | Create fungible token |
| `CREATE_NFT_TOOL` | `name: string, symbol: string`. Optional: `maxSupply: number` (omit for infinite), `treasuryAccountId`, keys | Create NFT collection |
| `MINT_FUNGIBLE_TOKEN_TOOL` | `tokenId: string, amount: number` | Mint additional supply |
| `MINT_NFT_TOOL` | `tokenId: string, metadata: string` (or byte array) | Mint NFT with metadata |
| `TRANSFER_TOKEN_TOOL` | `tokenId: string, toAccountId: string, amount: number` | Transfer fungible tokens |
| `TRANSFER_NFT_TOOL` | `tokenId: string, serialNumber: number, toAccountId: string` | Transfer an NFT |
| `ASSOCIATE_TOKEN_TOOL` | `tokenId: string, accountId: string` | Associate token with account |
| `DISSOCIATE_TOKEN_TOOL` | `tokenId: string, accountId: string` | Dissociate token from account |
| `REJECT_TOKEN_TOOL` | `tokenId: string` | Reject an airdropped token |

### Core Token Query Plugin (`coreTokenQueryPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_TOKEN_INFO_QUERY_TOOL` | `tokenId: string` | Get token metadata (name, symbol, supply, etc.) |
| `GET_TOKEN_BALANCE_QUERY_TOOL` | `tokenId: string, accountId: string` | Get token balance for account |
| `GET_NFT_INFO_QUERY_TOOL` | `tokenId: string, serialNumber: number` | Get NFT info and metadata |

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
| `DEPLOY_CONTRACT_TOOL` | `bytecode: string, gas: number` | Deploy smart contract |
| `CALL_CONTRACT_FUNCTION_TOOL` | `contractId: string, functionName: string, parameters: any[], gas: number` | Call contract function |
| `CREATE_ERC20_TOOL` | `name: string, symbol: string, totalSupply: number` | Deploy ERC-20 token |
| `CREATE_ERC721_TOOL` | `name: string, symbol: string` | Deploy ERC-721 NFT contract |

### Core EVM Query Plugin (`coreEVMQueryPlugin`)

| Tool Constant | Params | Description |
|---------------|--------|-------------|
| `GET_CONTRACT_INFO_QUERY_TOOL` | `contractId: string` | Get contract info |
| `GET_CONTRACT_BYTECODE_QUERY_TOOL` | `contractId: string` | Get contract bytecode |

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
| SaucerSwap | `hak-saucerswap-plugin` | DEX swaps, liquidity pools |
| Bonzo Finance | `@bonzofinancelabs/hak-bonzo-plugin` | DeFi lending and borrowing |
| Memejob | `@buidlerlabs/hak-memejob-plugin` | Meme token creation |

Install and register like any core plugin:

```typescript
import { saucerSwapPlugin } from 'hak-saucerswap-plugin';

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    plugins: [...corePlugins, saucerSwapPlugin],
    context: { mode: AgentMode.AUTONOMOUS },
  },
});
```
