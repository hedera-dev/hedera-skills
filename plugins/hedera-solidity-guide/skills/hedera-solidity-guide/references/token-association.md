# Token Association

## Why Association Exists

Hedera requires accounts to explicitly opt-in to each token before receiving it. This prevents spam tokens from being sent to accounts.

## Associating Tokens

```javascript
const { TokenAssociateTransaction } = require('@hashgraph/sdk');

async function associateTokenToAccount(client, accountId, accountKey, tokenId) {
    const transaction = await new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(accountKey);  // MUST be signed by the receiving account

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    return receipt.status.toString();  // Should be 'SUCCESS'
}

// Associate multiple tokens at once
async function associateTokensToAccount(client, accountId, accountKey, tokenIds) {
    const transaction = await new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds(tokenIds)
        .freezeWith(client)
        .sign(accountKey);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    return receipt.status.toString();
}
```

## Auto-Association

Set auto-association slots during account creation:

```javascript
const response = await new AccountCreateTransaction()
    .setInitialBalance(new Hbar(10))
    .setMaxAutomaticTokenAssociations(10)  // Auto-associate up to 10 tokens
    .setKey(privateKey.publicKey)
    .execute(client);
```

## Checking Association Status

```javascript
async function isTokenAssociated(env, accountId, tokenId) {
    const baseUrl = getBaseURL(env);
    const url = `${baseUrl}/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`;

    try {
        const response = await axios.get(url);
        return response.data.tokens.length > 0;
    } catch (e) {
        return false;
    }
}
```

## Critical: Association Order

**Always associate BEFORE sending tokens:**

```javascript
// WRONG order - fails
await sendNFT(client, aliceId, bobId, tokenId, serials);
await associateTokensToAccount(client, bobId, bobPK, [tokenId]);

// CORRECT order
await associateTokensToAccount(client, bobId, bobPK, [tokenId]);  // First
await sendNFT(client, aliceId, bobId, tokenId, serials);          // Then send
```
