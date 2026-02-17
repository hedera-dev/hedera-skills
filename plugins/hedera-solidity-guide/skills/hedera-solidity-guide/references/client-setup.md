# Client Setup and Environment

## Standard Client Initialization

```javascript
const { Client, AccountId, PrivateKey } = require('@hashgraph/sdk');
require('dotenv').config();

function initializeClient() {
    const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
    const operatorKey = PrivateKey.fromStringED25519(process.env.PRIVATE_KEY);
    const env = process.env.ENVIRONMENT || 'testnet';

    const envUpper = env.toUpperCase();
    let client;

    if (envUpper === 'MAINNET' || envUpper === 'MAIN') {
        client = Client.forMainnet();
    } else if (envUpper === 'TESTNET' || envUpper === 'TEST') {
        client = Client.forTestnet();
    } else if (envUpper === 'PREVIEWNET' || envUpper === 'PREVIEW') {
        client = Client.forPreviewnet();
    } else if (envUpper === 'LOCAL') {
        const node = { '127.0.0.1:50211': new AccountId(3) };
        client = Client.forNetwork(node).setMirrorNetwork('127.0.0.1:5600');
    } else {
        throw new Error(`Unknown environment: ${env}`);
    }

    client.setOperator(operatorId, operatorKey);
    return { client, operatorId, operatorKey, env };
}
```

## Mirror Node URL Helper

```javascript
function getBaseURL(env) {
    const envLower = env.toLowerCase();
    if (envLower === 'test' || envLower === 'testnet') {
        return 'https://testnet.mirrornode.hedera.com';
    } else if (envLower === 'main' || envLower === 'mainnet') {
        return 'https://mainnet-public.mirrornode.hedera.com';
    } else if (envLower === 'preview' || envLower === 'previewnet') {
        return 'https://previewnet.mirrornode.hedera.com';
    } else if (envLower === 'local') {
        return 'http://localhost:8000';
    }
    throw new Error(`Unknown environment: ${env}`);
}
```

## Environment Variables

```env
# .env file
ENVIRONMENT=testnet
ACCOUNT_ID=0.0.123456
PRIVATE_KEY=302e020100300506032b657004220420...

# Contract addresses
MAIN_CONTRACT_ID=0.0.234567
STORAGE_CONTRACT_ID=0.0.234568

# Token configuration
LAZY_TOKEN_ID=0.0.345678
LAZY_DECIMALS=8
```

## Key Type Detection

Hedera supports ED25519 and ECDSA keys. Detect by DER prefix:

```javascript
function detectKeyType(privateKeyHex) {
    if (privateKeyHex.startsWith('302e')) return 'ED25519';
    if (privateKeyHex.startsWith('3030')) return 'ECDSA';
    return 'UNKNOWN';
}

function loadPrivateKey(keyString) {
    const keyType = detectKeyType(keyString);
    if (keyType === 'ED25519') return PrivateKey.fromStringED25519(keyString);
    if (keyType === 'ECDSA') return PrivateKey.fromStringECDSA(keyString);
    return PrivateKey.fromStringDer(keyString);
}
```

## Account and Address Formats

```
Hedera Account ID: 0.0.123456
                    │  │   │
                    │  │   └── Entity number
                    │  └────── Realm (always 0)
                    └───────── Shard (always 0)
```

### Converting Between Formats

```javascript
const { AccountId, ContractId } = require('@hashgraph/sdk');

// Hedera ID to EVM address
const evmAddress = AccountId.fromString('0.0.123456').toSolidityAddress();
// Returns: 0x000000000000000000000000000000000001e240

// EVM address to Hedera ID
const accountId = AccountId.fromEvmAddress(0, 0, '0x000000000000000000000000000000000001e240');
// Returns: 0.0.123456
```

In Solidity:

```solidity
function hederaAccountToAddress(uint64 accountNum) internal pure returns (address) {
    return address(uint160(accountNum));
}
```
