# Testing Patterns

## Hardhat Configuration for Hedera

```javascript
// hardhat.config.js
module.exports = {
    solidity: {
        version: '0.8.18',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    mocha: {
        timeout: 100000,  // 100 seconds - Hedera operations are slower
        slow: 100000,
    },
    contractSizer: {
        strict: true,  // Fail if any contract exceeds 24KB
    },
};
```

## Test Setup Pattern

```javascript
const { expect } = require('chai');

describe('MyContract', function() {
    let client;
    let operatorId, operatorKey;
    let contractId;
    let testAccounts = [];

    before(async function() {
        operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
        operatorKey = PrivateKey.fromStringED25519(process.env.PRIVATE_KEY);
        client = Client.forTestnet().setOperator(operatorId, operatorKey);
        contractId = await deployContract(client, ...);
    });

    beforeEach(async function() {
        const aliceKey = PrivateKey.generateED25519();
        const aliceId = await accountCreator(client, aliceKey, 100);
        testAccounts.push({ id: aliceId, key: aliceKey });
    });

    after(async function() {
        client.close();
    });
});
```

## Mirror Node Delays in Tests

Always wait after transactions before querying mirror node:

```javascript
const result = await contractExecuteFunction(...);
expect(result[0]?.status.toString()).to.equal('SUCCESS');
await sleep(4000);  // Wait for mirror node to update

const balance = await checkMirrorBalance(env, address, tokenId);
```

## Test Timeouts

Use generous timeouts for testnet operations:

```javascript
describe('Deployment: ', function () {
    it('Should deploy...', async function () {
        this.timeout(900000);  // 15 minutes for testnet
        // ...
    });
});
```
