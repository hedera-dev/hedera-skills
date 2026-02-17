# Allowances and the Storage Contract Pattern

## The Storage Contract Pattern

In many Hedera contracts, users approve tokens to a **storage contract**, not the main contract they interact with.

### Why This Exists

- Main contracts often delegate HTS operations to a library/storage contract
- The storage contract is the one actually calling `transferFrom()`
- If you approve the wrong contract, transfers fail

### The Pattern

```
┌─────────────────┐        ┌──────────────────────┐
│   MainContract  │───────>│  StorageContract     │
│   (Entry Point) │        │  (Does HTS calls)    │
└─────────────────┘        └──────────────────────┘
                                     │
                                     │ transferFrom()
                                     ▼
                           ┌──────────────────────┐
                           │   User's Tokens      │
                           └──────────────────────┘

Users must approve StorageContract, NOT MainContract!
```

## Setting Fungible Token Allowances

```javascript
const { AccountAllowanceApproveTransaction } = require('@hashgraph/sdk');

async function setFTAllowance(client, tokenId, ownerId, spenderId, amount) {
    const transaction = new AccountAllowanceApproveTransaction()
        .approveTokenAllowance(
            tokenId,
            ownerId,    // Token owner (user)
            spenderId,  // STORAGE CONTRACT - not main contract!
            amount,
        )
        .freezeWith(client);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    return receipt.status.toString();
}
```

## Setting HBAR Allowances

```javascript
async function setHbarAllowance(client, ownerId, spenderId, amountHbar) {
    const transaction = new AccountAllowanceApproveTransaction()
        .approveHbarAllowance(ownerId, spenderId, new Hbar(amountHbar))
        .freezeWith(client);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    return receipt.status.toString();
}
```

## Checking Existing Allowances

```javascript
async function checkTokenAllowance(env, ownerId, tokenId) {
    const baseUrl = getBaseURL(env);
    const url = `${baseUrl}/api/v1/accounts/${ownerId}/allowances/tokens`;

    const response = await axios.get(url);

    for (const allowance of response.data.allowances || []) {
        if (allowance.token_id === tokenId.toString()) {
            return {
                spender: allowance.spender,
                amount: allowance.amount,
            };
        }
    }
    return null;
}
```

## NFT Transfers with Allowances

### Contract-Side: isApproval Flag

When a contract transfers NFTs on behalf of a user via allowance, the HTS transfer **must** include `isApproval = true`:

```solidity
nftTransfer.senderAccountID = senderAddress;
nftTransfer.receiverAccountID = receiverAddress;
nftTransfer.serialNumber = int64(serials[i].toInt256());
nftTransfer.isApproval = true;  // CRITICAL: Required for allowance-based NFT transfers
```

### Setting NFT Allowances

```javascript
const contractAccountId = AccountId.fromString(contractId.toString());
await setNFTAllowanceAll(client, [tokenId], ownerId, contractAccountId);
```

### SDK Version Note

Use SDK v2.78.0+ for full NFT allowance support:
- `deleteTokenNftAllowanceAllSerials` — requires SDK v2.78.0+
- `TokenNftAllowance` improvements — v2.70.0+
