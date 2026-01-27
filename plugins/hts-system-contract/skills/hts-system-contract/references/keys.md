# Token Key System Reference

## Key Value Types

Each key specifies how authorization works via `KeyValue` struct:

| Type                    | Field   | When to Use                                    |
| ----------------------- | ------- | ---------------------------------------------- |
| `inheritAccountKey`     | bool    | Token operations require creator's account key |
| `contractId`            | address | Contract must be in call stack (strict)        |
| `ed25519`               | bytes   | External Ed25519 key holder                    |
| `ECDSA_secp256k1`       | bytes   | 33-byte compressed secp256k1 public key        |
| `delegatableContractId` | address | Contract as recipient (more permissive)        |

Set exactly one field.

## KeyHelper Enums

```solidity
enum KeyType { ADMIN, KYC, FREEZE, WIPE, SUPPLY, FEE, PAUSE }
enum KeyValueType { INHERIT_ACCOUNT_KEY, CONTRACT_ID, ED25519, SECP256K1, DELEGATABLE_CONTRACT_ID }
```

## Creating Keys

Single key:

```solidity
IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
keys[0] = getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
token.tokenKeys = keys;
```

Multiple keys:

```solidity
IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](2);
keys[0] = getSingleKey(KeyType.ADMIN, KeyValueType.CONTRACT_ID, address(this));
keys[1] = getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
```

Combined key (one key controls multiple types):

```solidity
uint256 adminAndSupply = (1 << 0) | (1 << 4);  // Bits 0 and 4 = 17
```

## JSON Tuple Format (for ethers.js)

Token keys are nested arrays when calling from TypeScript:

```typescript
// Single SUPPLY key controlled by contract
const tokenKeys = [
  [
    16, // SUPPLY key (1 << 4)
    [
      false, // inheritAccountKey
      contractAddress, // contractId
      "0x", // ed25519
      "0x", // ECDSA_secp256k1
      ethers.ZeroAddress, // delegatableContractId
    ],
  ],
];
```

Multiple keys:

```typescript
const tokenKeys = [
  [1, [false, contractAddress, "0x", "0x", ethers.ZeroAddress]], // ADMIN
  [16, [false, contractAddress, "0x", "0x", ethers.ZeroAddress]], // SUPPLY
  [2, [false, contractAddress, "0x", "0x", ethers.ZeroAddress]], // KYC
];
```

Using secp256k1 public key:

```typescript
[
  [
    1, // ADMIN key
    [
      false,
      ethers.ZeroAddress,
      "0x",
      "0x0371e0a2168120cb5f91335719ad3e46e556d3674f219e943c81cb8928acb10725", // 33-byte compressed
      ethers.ZeroAddress,
    ],
  ],
];
```
