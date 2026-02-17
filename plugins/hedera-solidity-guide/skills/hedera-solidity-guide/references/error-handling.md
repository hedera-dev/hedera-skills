# Error Handling

## Hedera SDK: Do NOT Use Try/Catch

**WRONG — try/catch does not work correctly with Hedera SDK:**

```javascript
// This pattern does NOT work
try {
    await contractExecuteFunction(...);
    expect.fail('Should have failed');
} catch (err) {
    expect(err instanceof StatusError).to.be.true;
}
```

**CORRECT — check result status:**

```javascript
const result = await contractExecuteFunction(
    contractId, iface, client, gasLimit, 'functionName', [params]
);

const status = result[0]?.status;
expect(
    status?.name === 'ExpectedErrorName' ||
    status?.toString().includes('REVERT') ||
    status?.toString() !== 'SUCCESS'
).to.be.true;
```

## Custom Error Names

The `status?.name` property contains the custom error selector name (e.g., `PermissionDenied`, `TooManySerials`, `EmptySerialsArray`).

## Global Error Interfaces

Set up `global.errorInterfaces` for comprehensive error decoding across multiple contracts:

```javascript
const allAbis = [
    ...mainContractJson.abi,
    ...helperContractJson.abi,
    ...tokenContractJson.abi,
];
global.errorInterfaces = new ethers.Interface(allAbis);
```

## HTS Response Codes in Solidity

HTS operations don't always revert on failure. Always check response codes:

```solidity
int responseCode = HederaTokenService.transferToken(token, from, to, amount);
require(responseCode == HederaResponseCodes.SUCCESS, "Transfer failed");
```

SUCCESS = 22.

## Common HTS Response Codes

| Code | Name | Meaning |
|------|------|---------|
| 22 | SUCCESS | Operation succeeded |
| 10 | INSUFFICIENT_TX_FEE | Missing HBAR value on token creation |
| 212 | TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT | Not an error — handle as success |
| 299 | ACCOUNT_KYC_NOT_GRANTED_FOR_TOKEN | Grant KYC first |
