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
1. Call `get_hbar_balance` with the operator's account ID
2. Call `get_account_info` for full account details
3. Use the returned balances, token associations, and account metadata as the initial state for the UI being built

**MCP tools:** `get_hbar_balance`, `get_account_info`

### Pattern 2: Token Seeding

**When:** After scaffolding a token dashboard or launchpad UI.

**Why:** The UI immediately has real token data to render, so you can verify layouts, sorting, and display logic with actual on-chain state.

**Workflow:**
1. Call `create_fungible_token` — e.g., name: "DemoToken", symbol: "DMT", initialSupply: 10000, decimals: 2
2. Note the returned token ID
3. Call `get_token_info` with the new token ID to verify creation
4. The UI can now fetch and display this real token

**MCP tools:** `create_fungible_token`, `get_token_info`, `get_token_balance`

### Pattern 3: HCS Testing

**When:** After building a message board or messaging UI.

**Why:** Verifies the message feed renders correctly with real consensus timestamps and sequence numbers.

**Workflow:**
1. Call `create_topic` with memo: "General Discussion"
2. Call `submit_topic_message` with topicId and message: "Hello Hedera!"
3. Repeat with 1-2 more test messages
4. Call `get_topic_messages` to verify messages are retrievable
5. Check the UI's message feed renders the messages correctly

**MCP tools:** `create_topic`, `submit_topic_message`, `get_topic_messages`

### Pattern 4: NFT Minting

**When:** After building an NFT gallery or minting UI.

**Why:** The gallery immediately has NFTs with metadata to render, testing image display, card layouts, and metadata formatting.

**Workflow:**
1. Call `create_nft` — name: "AI Art Collection", symbol: "AIART"
2. Call `mint_nft` with metadata containing name, description, and image URL
3. Repeat for 1-2 more NFTs with varied metadata
4. Call `get_token_info` to verify collection stats
5. The gallery grid now has real NFTs to display

**MCP tools:** `create_nft`, `mint_nft`, `get_token_info`

### Pattern 5: Transfer Verification

**When:** After building a transfer form or transaction history UI.

**Why:** Confirms that the transfer flow works end-to-end and the transaction history displays correctly.

**Workflow:**
1. Call `transfer_hbar` to send a small amount (e.g., 1 HBAR) to a test account
2. Verify the transaction hash is returned
3. Check the UI's transaction history shows the new transfer
4. Verify balance updates in the UI

**MCP tools:** `transfer_hbar`, `transfer_token`, `get_hbar_balance`

### Pattern 6: Capability Exploration

**When:** The user asks "what can I build?" or wants to explore Hedera capabilities.

**Why:** By inspecting the user's actual on-chain state, you can suggest relevant apps based on what they already have.

**Workflow:**
1. Call `get_account_info` to see the user's account state
2. Call `get_hbar_balance` to check their HBAR balance
3. Based on what you find, suggest relevant apps:
   - User has tokens → suggest a wallet dashboard or token manager
   - User has HBAR → suggest a token launchpad to create their first token
   - User has NFTs → suggest an NFT gallery to display their collection
   - User has nothing → suggest starting with the token launchpad demo

**MCP tools:** `get_account_info`, `get_hbar_balance`

---

## Available MCP Tools

### Account Tools

| Tool | Params | Description |
|------|--------|-------------|
| `get_hbar_balance` | `accountId: string` | Get HBAR balance for an account |
| `get_account_info` | `accountId: string` | Get full account info (keys, tokens, balance) |
| `create_account` | `initialBalance: number` | Create a new Hedera account with initial HBAR |

### Token (HTS) Tools

| Tool | Params | Description |
|------|--------|-------------|
| `create_fungible_token` | `name: string, symbol: string, initialSupply: number, decimals: number` + optional treasury, admin/supply/freeze/wipe/kyc keys | Create a fungible token |
| `create_nft` | `name: string, symbol: string` + optional `maxSupply: number`, keys | Create an NFT collection |
| `mint_fungible_token` | `tokenId: string, amount: number` | Mint additional fungible token supply |
| `mint_nft` | `tokenId: string, metadata: string` | Mint an NFT with metadata |
| `transfer_token` | `tokenId: string, fromAccountId: string, toAccountId: string, amount: number` | Transfer fungible tokens |
| `transfer_nft` | `tokenId: string, serialNumber: number, fromAccountId: string, toAccountId: string` | Transfer an NFT |
| `associate_token` | `tokenId: string, accountId: string` | Associate a token with an account |
| `get_token_info` | `tokenId: string` | Get token metadata (name, symbol, supply, etc.) |
| `get_token_balance` | `tokenId: string, accountId: string` | Get token balance for a specific account |

### Consensus (HCS) Tools

| Tool | Params | Description |
|------|--------|-------------|
| `create_topic` | `memo?: string, adminKey?: string, submitKey?: string` | Create an HCS topic |
| `submit_topic_message` | `topicId: string, message: string` | Post a message to a topic |
| `get_topic_info` | `topicId: string` | Get topic metadata |
| `get_topic_messages` | `topicId: string` | Get all messages from a topic |

### Transfer Tools

| Tool | Params | Description |
|------|--------|-------------|
| `transfer_hbar` | `toAccountId: string, amount: number` | Transfer HBAR to another account |

### Smart Contract (EVM) Tools

| Tool | Params | Description |
|------|--------|-------------|
| `deploy_contract` | `bytecode: string, gas: number` | Deploy a smart contract |
| `call_contract_function` | `contractId: string, functionName: string, params: any[], gas: number` | Call a contract function |

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
