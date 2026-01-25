---
name: hedera-hts
description: Hedera Token Service (HTS) smart contract development. Use when creating, managing, or interacting with Hedera-native tokens via Solidity contracts. Triggers include HTS tokens, Hedera token creation, HTS precompile, token minting/burning on Hedera, KYC/freeze/pause token controls, custom fee schedules, NFT collections on Hedera, or any token operations using the 0x167 precompile.
---

# Hedera Token Service (HTS) System Contract

HTS precompile at `0x167` enables Solidity contracts to create and manage Hedera-native tokens with built-in compliance controls (KYC, freeze, pause) and custom fees.

## Quick Reference

**Imports:**

```solidity
import {HederaTokenService} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/HederaTokenService.sol";
import {KeyHelper} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/KeyHelper.sol";
import {ExpiryHelper} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/ExpiryHelper.sol";
import {HederaResponseCodes} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/HederaResponseCodes.sol";
```

**Safe variants** (auto-revert on failure): `SafeHTS.sol`, `SafeViewHTS.sol`

## Critical: HBAR Payment Required

Token creation requires explicit HBAR value payment (not just gas):

```solidity
// ❌ WRONG - fails with INSUFFICIENT_TX_FEE
(int rc, address token) = createNonFungibleToken(token);

// ✅ CORRECT
(int rc, address token) = createNonFungibleToken{value: msg.value}(token);
```

Call from TypeScript:

```typescript
await contract.createToken(name, symbol, {
  gasLimit: 350_000,
  value: ethers.parseEther("15"), // ~$1-2 USD of HBAR
});
```

## Token Key System

Seven key types control token operations (bit positions for `keyType` field):

| Key    | Bit | Value | Controls                     |
| ------ | --- | ----- | ---------------------------- |
| ADMIN  | 0   | 1     | Update token, keys, deletion |
| KYC    | 1   | 2     | Grant/revoke KYC             |
| FREEZE | 2   | 4     | Freeze/unfreeze accounts     |
| WIPE   | 3   | 8     | Wipe balances                |
| SUPPLY | 4   | 16    | Mint/burn                    |
| FEE    | 5   | 32    | Update fees                  |
| PAUSE  | 6   | 64    | Pause all operations         |

Use `KeyHelper` for key construction:

```solidity
keys[0] = getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
```

See [references/keys.md](references/keys.md) for key value types and JSON tuple format.

## Association Model

Accounts must associate with tokens before receiving them:

```solidity
int rc = associateToken(accountAddress, tokenAddress);
require(
    rc == HederaResponseCodes.SUCCESS ||
    rc == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT,
    "Association failed"
);
```

## Common Patterns

### Fungible Token Creation

```solidity
function createToken() external payable {
    IHederaTokenService.HederaToken memory token;
    token.name = "My Token";
    token.symbol = "MTK";
    token.treasury = address(this);
    token.expiry = createAutoRenewExpiry(address(this), 7776000); // 90 days

    (int rc, address created) = createFungibleToken{value: msg.value}(
        token, 1000000, 18  // initialSupply, decimals
    );
    require(rc == HederaResponseCodes.SUCCESS, "Create failed");
}
```

### Mintable NFT Collection

```solidity
function createNFT() external payable {
    IHederaTokenService.HederaToken memory token;
    token.name = "My NFT";
    token.symbol = "MNFT";
    token.treasury = address(this);
    token.tokenSupplyType = true;  // FINITE
    token.maxSupply = 10000;

    IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
    keys[0] = getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
    token.tokenKeys = keys;
    token.expiry = createAutoRenewExpiry(address(this), 7776000);

    (int rc, address created) = createNonFungibleToken{value: msg.value}(token);
    require(rc == HederaResponseCodes.SUCCESS, "Create failed");
}

function mintNFT(bytes memory metadata) external {
    bytes[] memory metas = new bytes[](1);
    metas[0] = metadata;
    (int rc, , int64[] memory serials) = mintToken(tokenAddress, 0, metas);
    require(rc == HederaResponseCodes.SUCCESS, "Mint failed");
}
```

### KYC-Enabled Token

Treasury must self-grant KYC after creation:

```solidity
// After token creation with KYC key
int kycRc = grantTokenKyc(tokenAddress, address(this));
require(kycRc == HederaResponseCodes.SUCCESS, "Self-KYC failed");
```

## Response Code Handling

Always check response codes. SUCCESS = 22.

```solidity
require(responseCode == HederaResponseCodes.SUCCESS, "Operation failed");
```

Common codes: See [references/response-codes.md](references/response-codes.md)

## Additional References

- **API Reference**: [references/api.md](references/api.md) - All function signatures
- **Custom Fees**: [references/fees.md](references/fees.md) - Fixed, fractional, royalty fees
- **Compliance Controls**: [references/compliance.md](references/compliance.md) - KYC, freeze, pause details
- **Struct Definitions**: [references/structs.md](references/structs.md) - HederaToken, Expiry, etc.
- **Troubleshooting**: [references/troubleshooting.md](references/troubleshooting.md) - Common errors and fixes
