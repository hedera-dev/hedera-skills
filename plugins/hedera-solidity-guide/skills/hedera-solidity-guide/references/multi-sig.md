# Multi-Signature Transactions

## Transaction Validity Window

Hedera transactions are only valid for **119 seconds** after creation.

```javascript
const HEDERA_TX_VALIDITY = 119;  // seconds
const SAFE_TIMEOUT = 110;        // Leave 9 second buffer

function getRemainingTime(transaction) {
    const validStart = transaction.transactionValidStart;
    const now = Date.now() / 1000;
    const elapsed = now - validStart.seconds;
    return HEDERA_TX_VALIDITY - elapsed;
}
```

## Freezing Transactions for Signatures

```javascript
async function freezeTransactionForSignatures(client, transaction) {
    const frozenTx = await transaction.freezeWith(client);
    const txBytes = frozenTx.toBytes();

    return {
        frozenTransaction: frozenTx,
        bytes: txBytes,
        transactionId: frozenTx.transactionId.toString(),
    };
}

function signTransactionBytes(txBytes, privateKey) {
    const signature = privateKey.sign(txBytes);
    return {
        publicKey: privateKey.publicKey.toStringRaw(),
        signature: Buffer.from(signature).toString('hex'),
    };
}
```

## Getting Results After Multi-Sig

**Problem**: After multi-sig execution, you can't call `getRecord()` without signing again.

**Solution**: Use mirror node (free, no signing required):

```javascript
async function getTransactionResultAfterMultiSig(env, transactionId) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const mirrorTxId = formatTransactionIdForMirror(transactionId);
    const baseUrl = getBaseURL(env);
    const url = `${baseUrl}/api/v1/transactions/${mirrorTxId}`;

    const response = await axios.get(url);
    return response.data;
}
```
