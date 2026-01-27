# Compliance Controls

## KYC (Know Your Customer)

Tokens with KYC key require accounts to have KYC granted before transfers.

```solidity
// Grant KYC
int rc = grantTokenKyc(tokenAddress, accountAddress);
require(rc == HederaResponseCodes.SUCCESS, "Grant KYC failed");

// Revoke KYC
int rc = revokeTokenKyc(tokenAddress, accountAddress);

// Check status
(int rc, bool kycGranted) = isKyc(tokenAddress, accountAddress);
```

**Critical**: Treasury must self-grant KYC after creation:

```solidity
// After creating token with KYC key
int kycRc = grantTokenKyc(tokenAddress, address(this));
require(kycRc == HederaResponseCodes.SUCCESS, "Self-KYC failed");
```

## Freeze

Tokens with freeze key can freeze individual accounts.

```solidity
// Freeze account
int rc = freezeToken(tokenAddress, accountAddress);

// Unfreeze account
int rc = unfreezeToken(tokenAddress, accountAddress);

// Check status
(int rc, bool frozen) = isFrozen(tokenAddress, accountAddress);
```

`freezeDefault` in HederaToken struct sets default freeze status for new associations.

## Pause

Tokens with pause key can halt all operations network-wide.

```solidity
// Pause all operations
int rc = pauseToken(tokenAddress);

// Resume operations
int rc = unpauseToken(tokenAddress);
```

## Control Interaction Matrix

| KYC            | Freeze    | Pause     | Can Transfer? |
| -------------- | --------- | --------- | ------------- |
| ✅ Granted     | Unfrozen  | Unpaused  | ✅ YES        |
| ❌ Not granted | Unfrozen  | Unpaused  | ❌ No         |
| ✅ Granted     | ❌ Frozen | Unpaused  | ❌ No         |
| ✅ Granted     | Unfrozen  | ❌ Paused | ❌ No         |

## Complete KYC-Enabled Token Pattern

```solidity
contract KYCToken is HederaTokenService, KeyHelper, ExpiryHelper {
    address public tokenAddress;

    function createTokenWithKYC() external payable {
        IHederaTokenService.HederaToken memory token;
        token.name = "KYC Token";
        token.symbol = "KYCT";
        token.treasury = address(this);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = getSingleKey(KeyType.KYC, KeyValueType.CONTRACT_ID, address(this));
        token.tokenKeys = keys;
        token.expiry = createAutoRenewExpiry(address(this), 7776000);

        (int rc, address created) = createFungibleToken{value: msg.value}(token, 1000000, 18);
        require(rc == HederaResponseCodes.SUCCESS, "Create failed");

        // Treasury self-KYC
        int kycRc = grantTokenKyc(created, address(this));
        require(kycRc == HederaResponseCodes.SUCCESS, "Self-KYC failed");

        tokenAddress = created;
    }

    function setupAccount(address account) external {
        // Associate
        int assocRc = associateToken(account, tokenAddress);
        require(
            assocRc == HederaResponseCodes.SUCCESS ||
            assocRc == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT,
            "Association failed"
        );

        // Grant KYC
        int kycRc = grantTokenKyc(tokenAddress, account);
        require(kycRc == HederaResponseCodes.SUCCESS, "KYC grant failed");
    }
}
```
