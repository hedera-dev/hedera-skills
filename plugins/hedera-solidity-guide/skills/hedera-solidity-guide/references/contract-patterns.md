# Contract Interaction Patterns

## Ethers.js Integration

Ethers.js works with Hedera for ABI encoding/decoding.

### Creating an Interface

```javascript
const { ethers } = require('ethers');
const fs = require('fs');

// From compiled artifact
const contractJson = JSON.parse(
    fs.readFileSync('./artifacts/contracts/MyContract.sol/MyContract.json')
);
const iface = new ethers.Interface(contractJson.abi);

// From ABI file
const abi = JSON.parse(fs.readFileSync('./abi/MyContract.json'));
const iface = new ethers.Interface(abi);
```

### Encoding Function Calls

```javascript
const encoded = iface.encodeFunctionData('transfer', [recipient, amount]);

// With complex parameters
const encoded = iface.encodeFunctionData('createPool', [
    tokenAddress,
    BigInt(1000000),
    true,
    [addr1, addr2],
]);
```

### Decoding Results

```javascript
const decoded = iface.decodeFunctionResult('balanceOf', result);
const balance = decoded[0];

// Multiple return values
const [name, balance, isActive] = iface.decodeFunctionResult('getPoolInfo', result);
```

## Standard Contract Execution

```javascript
const { ContractExecuteTransaction, Hbar } = require('@hashgraph/sdk');

async function executeContract(client, contractId, iface, functionName, params, gas = 300000, payableHbar = 0) {
    const encoded = iface.encodeFunctionData(functionName, params);

    let tx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gas)
        .setFunctionParameters(Buffer.from(encoded.slice(2), 'hex'));

    if (payableHbar > 0) {
        tx = tx.setPayableAmount(new Hbar(payableHbar));
    }

    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);

    if (receipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Transaction failed: ${receipt.status}`);
    }
    return { response, receipt };
}
```

## Query Contract State (Free via Mirror)

```javascript
async function queryContract(env, contractId, iface, functionName, params = []) {
    const encoded = iface.encodeFunctionData(functionName, params);

    const result = await readOnlyEVMFromMirrorNode(
        env,
        contractId,
        encoded,
        AccountId.fromString('0.0.1'),  // Dummy "from" address for queries
    );

    return iface.decodeFunctionResult(functionName, result);
}
```

## Contract Deployment

```javascript
const json = JSON.parse(fs.readFileSync('./artifacts/contracts/Contract.sol/Contract.json'));
const iface = new ethers.Interface(json.abi);
const bytecode = json.bytecode;

const [contractId, contractAddress] = await contractDeployFunction(
    client,
    bytecode,
    6_000_000,  // Gas limit
    new ContractFunctionParameters()
        .addAddress(param1Address)
        .addAddress(param2Address)
);
```

## Parsing Errors

```javascript
function parseError(iface, errorData) {
    if (!errorData) return 'Unknown error: no data';

    // Standard revert with string message
    if (errorData.startsWith('0x08c379a0')) {
        const content = `0x${errorData.substring(10)}`;
        const message = ethers.AbiCoder.defaultAbiCoder().decode(['string'], content);
        return `Revert: ${message}`;
    }

    // Panic error (from Solidity compiler)
    if (errorData.startsWith('0x4e487b71')) {
        const content = `0x${errorData.substring(10)}`;
        const code = ethers.AbiCoder.defaultAbiCoder().decode(['uint'], content);

        const panicCodes = {
            0x00: 'Generic compiler panic',
            0x01: 'Assert failed',
            0x11: 'Arithmetic overflow/underflow',
            0x12: 'Division by zero',
            0x21: 'Invalid enum value',
            0x32: 'Array index out of bounds',
            0x41: 'Too much memory allocated',
            0x51: 'Called invalid internal function',
        };
        return `Panic: ${panicCodes[Number(code)] || `Unknown code ${code}`}`;
    }

    // Try custom error from contract ABI
    try {
        const parsed = iface.parseError(errorData);
        if (parsed) {
            const args = parsed.args.map(a => a.toString()).join(', ');
            return `${parsed.name}(${args})`;
        }
    } catch (e) {
        // Not a known custom error
    }
    return `Unknown error: ${errorData}`;
}
```
