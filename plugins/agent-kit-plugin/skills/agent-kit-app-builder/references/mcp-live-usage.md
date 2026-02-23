# Hedera MCP Server — Live Development Usage

This reference teaches you how to use the Hedera Agent Kit MCP server during development — not just for building the final app, but for querying accounts, seeding test data, and validating that generated UIs work with real on-chain data.

## MCP Server Setup

The Hedera Agent Kit (`hedera-agent-kit-js`) ships with an MCP server in its `modelcontextprotocol/` directory.

### Installation

```bash
git clone https://github.com/hashgraph/hedera-agent-kit-js.git
cd hedera-agent-kit-js/modelcontextprotocol
npm install && npm run build
```

### Running

```bash
# Testnet (default, free)
node dist/index.js --ledger-id=testnet

# Mainnet (real HBAR costs)
node dist/index.js --ledger-id=mainnet
```

### Environment Variables

Set these in your shell or in a `.env` file inside the `modelcontextprotocol/` directory:

```env
HEDERA_OPERATOR_ID=0.0.XXXXX
HEDERA_OPERATOR_KEY=302e020100300506032b6570...
```

### Platform Configuration

See `templates/mcp-configs/` for ready-to-use config files:

- `claude-code.json` — Claude Code (`.claude/mcp.json`)
- `cursor.json` — Cursor (`.cursor/mcp.json`)
- `vscode.json` — VS Code MCP extension
- `generic-stdio.json` — Any MCP-compatible agent via stdio transport

> **Note:** The MCP server can also be referenced via its built path in `node_modules` if `hedera-agent-kit` is installed as a dependency, or configured as an npx command.

---

## Development-Time MCP Usage Patterns

These patterns make this skill significantly more powerful than read-only API integrations. You use MCP to interact with Hedera **while developing**, so generated apps work with real data from the start.

### Pattern 1: Account Discovery

**When:** Before building any UI.

**Why:** Querying the user's account gives you real data (HBAR balance, associated tokens, NFTs) to populate the initial UI state instead of mock data.

**Workflow:**
1. Call `get_hbar_balance_query_tool` with the operator's account ID
2. Call `get_account_query_tool` for full account details
3. Use the returned balances, token associations, and account metadata as the initial state for the UI being built

**MCP tools:** `get_hbar_balance_query_tool`, `get_account_query_tool`

### Pattern 2: Token Seeding

**When:** After scaffolding a token dashboard or launchpad UI.

**Why:** The UI immediately has real token data to render, so you can verify layouts, sorting, and display logic with actual on-chain state.

**Workflow:**
1. Call `create_fungible_token_tool` — e.g., name: "DemoToken", symbol: "DMT", initialSupply: 10000, decimals: 2
2. Note the returned token ID
3. Call `get_token_info_query_tool` with the new token ID to verify creation
4. The UI can now fetch and display this real token

**MCP tools:** `create_fungible_token_tool`, `get_token_info_query_tool`

### Pattern 3: HCS Testing

**When:** After building a message board or messaging UI.

**Why:** Verifies the message feed renders correctly with real consensus timestamps and sequence numbers.

**Workflow:**
1. Call `create_topic_tool` with memo: "General Discussion"
2. Call `submit_topic_message_tool` with topicId and message: "Hello Hedera!"
3. Repeat with 1-2 more test messages
4. Call `get_topic_messages_query_tool` to verify messages are retrievable
5. Check the UI's message feed renders the messages correctly

**MCP tools:** `create_topic_tool`, `submit_topic_message_tool`, `get_topic_messages_query_tool`

### Pattern 4: NFT Minting

**When:** After building an NFT gallery or minting UI.

**Why:** The gallery immediately has NFTs with metadata to render, testing image display, card layouts, and metadata formatting.

**Workflow:**
1. Call `create_non_fungible_token` — name: "AI Art Collection", symbol: "AIART"
2. Call `mint_non_fungible_token` with metadata containing name, description, and image URL
3. Repeat for 1-2 more NFTs with varied metadata
4. Call `get_token_info` to verify collection stats
5. The gallery grid now has real NFTs to display

**MCP tools:** `create_non_fungible_token`, `mint_non_fungible_token`, `get_token_info`

### Pattern 5: Transfer Verification

**When:** After building a transfer form or transaction history UI.

**Why:** Confirms that the transfer flow works end-to-end and the transaction history displays correctly.

**Workflow:**
1. Call `transfer_hbar_tool` to send a small amount (e.g., 1 HBAR) to a test account
2. Verify the transaction hash is returned
3. Check the UI's transaction history shows the new transfer
4. Verify balance updates in the UI

**MCP tools:** `transfer_hbar_tool`, `get_hbar_balance_query_tool`

### Pattern 6: Capability Exploration

**When:** The user asks "what can I build?" or wants to explore Hedera capabilities.

**Why:** By inspecting the user's actual on-chain state, you can suggest relevant apps based on what they already have.

**Workflow:**
1. Call `get_account_query_tool` to see the user's account state
2. Call `get_hbar_balance_query_tool` to check their HBAR balance
3. Based on what you find, suggest relevant apps:
   - User has tokens → suggest a wallet dashboard or token manager
   - User has HBAR → suggest a token launchpad to create their first token
   - User has NFTs → suggest an NFT gallery to display their collection
   - User has nothing → suggest starting with the token launchpad demo

**MCP tools:** `get_account_query_tool`, `get_hbar_balance_query_tool`

---

## Available MCP Tools

The MCP server exposes the same tools as the SDK. Tool names use `snake_case` (matching the tool `method` values).

### Account Tools

| Tool | Params | Description |
|------|--------|-------------|
| `transfer_hbar_tool` | `toAccountId: string, amount: number` | Transfer HBAR |
| `create_account_tool` | `initialBalance: number` | Create a new Hedera account |
| `update_account_tool` | `accountId: string`, optional fields | Update account properties |
| `approve_hbar_allowance_tool` | `spenderAccountId: string, amount: number` | Approve HBAR spending allowance |
| `approve_token_allowance_tool` | `tokenId: string, spenderAccountId: string, amount: number` | Approve token allowance |

### Account Query Tools

| Tool | Params | Description |
|------|--------|-------------|
| `get_account_query_tool` | `accountId: string` | Get full account info (keys, tokens, balance) |
| `get_hbar_balance_query_tool` | `accountId: string` | Get HBAR balance for an account |
| `get_account_token_balances_query_tool` | `accountId: string` | Get all token balances for account |

### Token (HTS) Tools

| Tool | Params | Description |
|------|--------|-------------|
| `create_fungible_token_tool` | `name, symbol, initialSupply, decimals` + optional keys | Create a fungible token |
| `create_non_fungible_token_tool` | `name, symbol` + optional `maxSupply`, keys | Create an NFT collection |
| `mint_fungible_token_tool` | `tokenId: string, amount: number` | Mint additional fungible supply |
| `mint_non_fungible_token_tool` | `tokenId: string, metadata: string` | Mint an NFT with metadata |
| `airdrop_fungible_token_tool` | `tokenId: string, recipients: array` | Airdrop tokens to multiple recipients |
| `transfer_non_fungible_token_tool` | `tokenId, serialNumber, toAccountId` | Transfer an NFT |
| `associate_token_tool` | `tokenId: string, accountId: string` | Associate a token with an account |
| `dissociate_token_tool` | `tokenId: string, accountId: string` | Dissociate a token from an account |
| `update_token_tool` | `tokenId: string`, optional fields | Update token properties |

### Token Query Tools

| Tool | Params | Description |
|------|--------|-------------|
| `get_token_info_query_tool` | `tokenId: string` | Get token metadata (name, symbol, supply) |
| `get_pending_airdrop_tool` | `accountId: string` | Get pending airdrops for an account |

### Consensus (HCS) Tools

| Tool | Params | Description |
|------|--------|-------------|
| `create_topic_tool` | `memo?: string, adminKey?: string, submitKey?: string` | Create an HCS topic |
| `submit_topic_message_tool` | `topicId: string, message: string` | Post a message to a topic |
| `update_topic_tool` | `topicId: string`, updated fields | Update a topic |
| `delete_topic_tool` | `topicId: string` | Delete a topic |

### Consensus Query Tools

| Tool | Params | Description |
|------|--------|-------------|
| `get_topic_info_query_tool` | `topicId: string` | Get topic metadata |
| `get_topic_messages_query_tool` | `topicId: string` | Get messages from a topic |

### EVM / Smart Contract Tools

| Tool | Params | Description |
|------|--------|-------------|
| `create_erc20_tool` | `name, symbol, totalSupply` | Deploy ERC-20 token |
| `transfer_erc20_tool` | `contractId, toAddress, amount` | Transfer ERC-20 tokens |
| `create_erc721_tool` | `name, symbol` | Deploy ERC-721 NFT contract |
| `mint_erc721_tool` | `contractId, toAddress, tokenURI` | Mint ERC-721 NFT |
| `transfer_erc721_tool` | `contractId, toAddress, tokenId` | Transfer ERC-721 NFT |

### Query Tools

| Tool | Params | Description |
|------|--------|-------------|
| `get_contract_info_query_tool` | `contractId: string` | Get contract info |
| `get_transaction_record_query_tool` | `transactionId: string` | Get transaction details |
| `get_exchange_rate_tool` | none | Get current HBAR exchange rate |

---

## Network Switching

```
Default: --ledger-id=testnet (free, no real cost)

If the user says "use mainnet" or "switch to mainnet":
  1. Update MCP server config to --ledger-id=mainnet
  2. Update .env to HEDERA_NETWORK=mainnet
  3. ALWAYS warn: "⚠️ You are now on Hedera mainnet. Transactions use real HBAR."
  4. For write operations: require explicit user confirmation before executing
```
