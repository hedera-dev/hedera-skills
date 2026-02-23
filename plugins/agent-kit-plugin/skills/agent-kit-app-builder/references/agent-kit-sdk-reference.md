# Hedera Agent Kit SDK Reference

Condensed API reference for `hedera-agent-kit` v3.7.x / v3.8.x npm package.

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
| `CREATE_FUNGIBLE_TOKEN_TOOL` | `name: string, symbol: string, initialSupply: number, decimals: number`. Optional: `treasuryAccountId`, `adminKey`, `supplyKey`, `freezeKey`, `wipeKey`, `kycKey` | Create fungible token |
| `CREATE_NON_FUNGIBLE_TOKEN_TOOL` | `name: string, symbol: string`. Optional: `maxSupply: number` (omit for infinite), `treasuryAccountId`, keys | Create NFT collection |
| `MINT_FUNGIBLE_TOKEN_TOOL` | `tokenId: string, amount: number` | Mint additional fungible supply |
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
