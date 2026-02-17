---
name: Hedera Solidity Development Guide
description: Use when developing Hedera smart contracts, writing Solidity for Hedera, interacting with HTS tokens from JavaScript/TypeScript, using the Hedera SDK, querying the mirror node, setting token allowances, associating tokens, deploying contracts to Hedera, writing Hardhat tests for Hedera, handling multi-sig transactions, or debugging Hedera-specific errors. Triggers include "hedera contract", "hedera solidity", "mirror node", "token association", "HTS allowance", "hedera SDK", "hedera testing", "hedera deploy", "ethers hedera".
version: 1.0.0
---

# Hedera Solidity Development Guide

Comprehensive patterns and best practices for Hedera smart contract development. Covers the full stack: Solidity contracts with HTS precompiles, JavaScript/TypeScript SDK integration, mirror node queries, and testing.

## Critical Differences from Ethereum

**Read this first.** These are the most common mistakes when applying Ethereum patterns to Hedera:

| Aspect | Ethereum | Hedera |
|--------|----------|--------|
| Token transfers | Just send | Must **associate** token first |
| Allowances | Approve the contract you call | May need to approve a **different** contract (storage pattern) |
| Reading data | Call the node (costs gas) | Use **mirror node** (free) |
| Transaction records | Available immediately | Wait **5+ seconds** for mirror node |
| Account format | 0x address only | `0.0.XXXXX` AND 0x address |
| Token standard | ERC-20/721 | HTS via precompile at `0x167` |
| NFT allowance transfers | Just use allowance | Must set `isApproval = true` in HTS call |
| Random numbers | Chainlink VRF / block hash | PRNG precompile at `0x169` |

## Token Association

**The #1 gotcha for Ethereum developers.** Accounts MUST associate with a token BEFORE receiving it. This is an anti-spam mechanism.

```javascript
const { TokenAssociateTransaction } = require('@hashgraph/sdk');

// Associate BEFORE sending tokens
await new TokenAssociateTransaction()
    .setAccountId(recipientId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(recipientKey);  // Must be signed by the RECEIVING account
```

Auto-association slots can be set during account creation with `setMaxAutomaticTokenAssociations()`.

See [references/token-association.md](references/token-association.md) for full patterns.

## The Storage Contract Allowance Pattern

In many Hedera contracts, users must approve tokens to a **storage contract**, not the main contract:

```
User ──approve──> StorageContract (does transferFrom)
                       ↑
MainContract ─────calls─┘
```

If transfers fail with allowance errors, check which contract actually calls `transferFrom()` — that's the one that needs the allowance.

```javascript
// WRONG: approving main contract
await setFTAllowance(client, tokenId, user, mainContractId, amount);

// CORRECT: approve the storage contract
await setFTAllowance(client, tokenId, user, storageContractId, amount);
```

See [references/allowances.md](references/allowances.md) for allowance and NFT transfer patterns.

## Mirror Node Architecture

- **Consensus Network**: Where transactions execute. Costs gas/fees. Requires signing.
- **Mirror Node**: Read-only copy. Queries are **free**. No signing required.

**CRITICAL**: Wait **5 seconds minimum** after a transaction before querying the mirror node.

### Mirror Node URLs

| Network | URL |
|---------|-----|
| Testnet | `https://testnet.mirrornode.hedera.com` |
| Mainnet | `https://mainnet-public.mirrornode.hedera.com` |
| Previewnet | `https://previewnet.mirrornode.hedera.com` |
| Local | `http://localhost:8000` |

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/accounts/{id}` | Account balance, info |
| `/api/v1/accounts/{id}/tokens` | Token balances |
| `/api/v1/accounts/{id}/allowances/tokens` | FT allowances |
| `/api/v1/accounts/{id}/allowances/nfts` | NFT approvals |
| `/api/v1/contracts/call` | Read-only EVM calls (free) |
| `/api/v1/contracts/results/{txId}` | Contract execution results |
| `/api/v1/tokens/{id}` | Token details |

See [references/mirror-node.md](references/mirror-node.md) for query patterns and retry logic.

## Transaction ID Formats

Hedera has TWO transaction ID formats — converting between them is essential:

| Format | Pattern | Used In |
|--------|---------|---------|
| SDK | `0.0.123@456.789` | Hedera SDK |
| Mirror | `0.0.123-456-789` | REST API URLs |

```javascript
function formatTransactionIdForMirror(txId) {
    if (!txId.includes('@')) return txId;
    const [account, time] = txId.split('@');
    const [secs, nanos] = time.split('.');
    return `${account}-${secs}-${nanos}`;
}
```

## Client Setup

```javascript
const { Client, AccountId, PrivateKey } = require('@hashgraph/sdk');

const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringED25519(process.env.PRIVATE_KEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
```

Key type detection by DER prefix: `302e` = ED25519, `3030` = ECDSA.

See [references/client-setup.md](references/client-setup.md) for full initialization and environment patterns.

## Contract Interaction

### Execute (state-changing)

```javascript
const encoded = iface.encodeFunctionData('functionName', [params]);
const tx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(300_000)
    .setFunctionParameters(Buffer.from(encoded.slice(2), 'hex'));
const response = await tx.execute(client);
```

### Query (free via mirror node)

```javascript
const encoded = iface.encodeFunctionData('balanceOf', [address]);
const result = await readOnlyEVMFromMirrorNode(env, contractId, encoded, fromAccount);
const decoded = iface.decodeFunctionResult('balanceOf', result);
```

See [references/contract-patterns.md](references/contract-patterns.md) for deployment, ethers.js integration, and error parsing.

## Gas Constants

| Operation | Gas |
|-----------|-----|
| Base contract call | 400,000 |
| Per token association | +950,000 |
| Token creation | 350,000 - 500,000 |
| Minting | 150,000 - 250,000 |
| Transfers | 100,000 - 150,000 |
| Contract size limit | 24KB |

## Error Handling

**Do NOT use try/catch for Hedera SDK errors** — check result status instead:

```javascript
const result = await contractExecuteFunction(contractId, iface, client, gas, 'fn', [params]);
const status = result[0]?.status;
// Check status.name for custom error names, or status.toString() for 'SUCCESS'/'REVERT'
```

In Solidity, always check HTS response codes:

```solidity
int rc = HederaTokenService.transferToken(token, from, to, amount);
require(rc == HederaResponseCodes.SUCCESS, "Transfer failed");
```

See [references/error-handling.md](references/error-handling.md) for error parsing and global error interfaces.

## Testing Patterns

- Set mocha timeout to **100,000ms** minimum (Hedera operations are slower)
- Add **5-second delays** after transactions before mirror node queries
- Use `this.timeout(900000)` (15 min) for deployment tests on testnet
- Contract size limit: 24KB (use optimizer with `runs: 200` and `viaIR: true`)

See [references/testing.md](references/testing.md) for Hardhat config and test setup patterns.

## Multi-Signature Transactions

- Transaction validity window: **119 seconds** (use 110 for safety buffer)
- After multi-sig execution, use mirror node instead of `getRecord()` (avoids re-signing)
- Freeze transactions with `freezeWith(client)` before collecting signatures

See [references/multi-sig.md](references/multi-sig.md) for freezing, signing, and result retrieval patterns.

## Account and Address Formats

```javascript
// Hedera ID to EVM: accountId.toSolidityAddress()
// EVM to Hedera ID: AccountId.fromEvmAddress(0, 0, evmAddress)
```

For accounts with ECDSA keys, use mirror node to get the actual EVM address (it differs from `toSolidityAddress()`).

## Additional References

- **[references/token-association.md](references/token-association.md)** — Association patterns, auto-association, checking status
- **[references/allowances.md](references/allowances.md)** — FT/NFT/HBAR allowances, storage contract pattern, isApproval flag
- **[references/mirror-node.md](references/mirror-node.md)** — Query patterns, retry logic, event parsing, EVM address resolution
- **[references/contract-patterns.md](references/contract-patterns.md)** — Execution, deployment, ethers.js, ABI encoding/decoding
- **[references/client-setup.md](references/client-setup.md)** — Client initialization, environment config, key detection
- **[references/error-handling.md](references/error-handling.md)** — Error parsing, custom errors, response codes
- **[references/testing.md](references/testing.md)** — Hardhat config, test setup, mirror node delays
- **[references/multi-sig.md](references/multi-sig.md)** — Transaction validity, freezing, signature collection
- **[references/pitfalls.md](references/pitfalls.md)** — The 8 most common Hedera development mistakes

## Credits

Created by [Deejay / Stowerling](https://github.com/burstall/) ([@fuzbucket](https://x.com/fuzbucket)) and the [LazySuperheroes](https://github.com/lazysuperheroes) team ([@SuperheroesLazy](https://x.com/SuperheroesLazy)) — [lazysuperheroes.com](https://www.lazysuperheroes.com/).

Based on patterns and best practices learned from real-world Hedera smart contract development.
