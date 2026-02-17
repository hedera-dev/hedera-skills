# Common Hedera Development Pitfalls

## 1. Forgetting Token Association

```javascript
// WRONG
await transferToken(client, tokenId, sender, recipient, amount);  // FAILS

// CORRECT
await associateTokenToAccount(client, recipient, recipientKey, tokenId);
await transferToken(client, tokenId, sender, recipient, amount);
```

## 2. Approving Wrong Contract

```javascript
// WRONG - Approving the main contract
await setFTAllowance(client, tokenId, user, mainContractId, amount);

// CORRECT - Approve the storage contract that calls transferFrom
await setFTAllowance(client, tokenId, user, storageContractId, amount);
```

## 3. Querying Mirror Too Soon

```javascript
// WRONG
await executeTransaction(client, tx);
const result = await queryMirrorNode(env, txId);  // May fail!

// CORRECT
await executeTransaction(client, tx);
await new Promise(r => setTimeout(r, 5000));  // Wait 5 seconds
const result = await queryMirrorNode(env, txId);
```

## 4. Using Wrong Transaction ID Format

```javascript
// WRONG - SDK format in mirror URL
const url = `${baseUrl}/api/v1/transactions/0.0.123@456.789`;

// CORRECT - Mirror format in mirror URL
const txId = formatTransactionIdForMirror('0.0.123@456.789');
const url = `${baseUrl}/api/v1/transactions/${txId}`;
```

## 5. Assuming ERC-20 Compatibility

```javascript
// WRONG
await token.approve(spender, amount);

// CORRECT - Use Hedera SDK
await new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(tokenId, owner, spender, amount)
    .execute(client);
```

## 6. Not Checking HTS Response Codes

```solidity
// WRONG - Assuming success (HTS doesn't always revert)
HederaTokenService.transferToken(token, from, to, amount);

// CORRECT - Check response
int responseCode = HederaTokenService.transferToken(token, from, to, amount);
require(responseCode == HederaResponseCodes.SUCCESS, "Transfer failed");
```

## 7. Using getRecord() After Multi-Sig

```javascript
// WRONG - Requires signing
const record = await response.getRecord(client);

// CORRECT - Use mirror node (free, no signing)
await new Promise(r => setTimeout(r, 5000));
const result = await queryMirrorNode(env, transactionId);
```

## 8. Missing isApproval Flag in NFT Transfers

```solidity
// WRONG - Transfer fails when using allowances
nftTransfer.isApproval = false;

// CORRECT - When transferring via allowance
nftTransfer.isApproval = true;
```
