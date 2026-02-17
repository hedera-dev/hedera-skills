# Mirror Node Queries

## Propagation Delay

**CRITICAL**: After a transaction executes, wait **5 seconds minimum** before querying the mirror node.

```javascript
async function getContractResultWithRetry(env, transactionId, options = {}) {
    const {
        initialDelay = 5000,  // 5 seconds for mirror propagation
        retryDelay = 3000,
        maxRetries = 10,
    } = options;

    await new Promise(resolve => setTimeout(resolve, initialDelay));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await queryMirrorNode(env, transactionId);
            if (result.success) return result;
        } catch (e) {
            // Continue retrying
        }
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    throw new Error('Transaction not available on mirror node after retries');
}
```

## Read-Only Contract Calls (Free)

The preferred way to read contract state:

```javascript
async function readOnlyEVMFromMirrorNode(env, contractId, encodedData, fromAccount) {
    const baseUrl = getBaseURL(env);

    const body = {
        block: 'latest',
        data: encodedData,  // Encoded function call from ethers
        estimate: false,
        from: fromAccount.toSolidityAddress(),
        gas: 300000,
        gasPrice: 100000000,
        to: contractId.toSolidityAddress(),
        value: 0,
    };

    const response = await axios.post(`${baseUrl}/api/v1/contracts/call`, body);
    return response.data?.result;  // Decode with ethers
}
```

### Correct Usage Pattern

```javascript
// WRONG: passing interface and function name directly
const result = await readOnlyEVMFromMirrorNode(env, contractId, iface, 'functionName', [params]);

// CORRECT: encode data first, then pass
const encodedCommand = iface.encodeFunctionData(functionName, params);
const result = await readOnlyEVMFromMirrorNode(env, contractId, encodedCommand, fromId);
const decoded = iface.decodeFunctionResult(functionName, result);
```

### Helper Function

```javascript
async function readContract(iface, contractId, functionName, params = [], fromId = operatorId) {
    const encodedCommand = iface.encodeFunctionData(functionName, params);
    const result = await readOnlyEVMFromMirrorNode(env, contractId, encodedCommand, fromId);
    const decoded = iface.decodeFunctionResult(functionName, result);
    return decoded.length === 1 ? decoded[0] : decoded;
}
```

## EVM Address Resolution

Use mirror node to get actual EVM addresses (important for ECDSA key accounts):

```javascript
const { homebrewPopulateAccountEvmAddress, EntityType } = require('../utils/hederaMirrorHelpers');

// With explicit entity type (preferred - faster)
const tokenEvmAddress = await homebrewPopulateAccountEvmAddress(env, '0.0.12345', EntityType.TOKEN);
const contractEvmAddress = await homebrewPopulateAccountEvmAddress(env, contractId.toString(), EntityType.CONTRACT);
```

**Why not just `toSolidityAddress()`?** Accounts with ECDSA keys have different EVM addresses than their Hedera-derived address. The mirror node returns the actual EVM address used on the network.

## Parsing Events from Mirror Node

```javascript
async function getContractEvents(env, contractId, iface) {
    const baseUrl = getBaseURL(env);
    const url = `${baseUrl}/api/v1/contracts/${contractId}/results/logs?order=desc&limit=100`;

    const response = await axios.get(url);
    const events = [];

    for (const log of response.data.logs) {
        if (log.data === '0x') continue;
        try {
            const event = iface.parseLog({ topics: log.topics, data: log.data });
            events.push({
                name: event.name,
                args: event.args,
                transactionHash: log.transaction_hash,
                blockNumber: log.block_number,
            });
        } catch (e) {
            // Unknown event, skip
        }
    }
    return events;
}
```

## Token Details and Royalty Detection

```javascript
const { getTokenDetails, checkTokenHasFallbackRoyalty } = require('../utils/hederaMirrorHelpers');

const tokenInfo = await getTokenDetails(env, tokenId);
const royaltyInfo = await checkTokenHasFallbackRoyalty(env, tokenId);

if (royaltyInfo.hasFallback) {
    // NFT has fallback royalties - may need special handling
} else {
    // No fallback royalties - can transfer directly
}
```
