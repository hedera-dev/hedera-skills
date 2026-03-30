# Troubleshooting

## INSUFFICIENT_TX_FEE (Code 10)

**Symptom**: Transaction reverts with response code 10

**Cause**: Missing HBAR value on token creation

**Solution**:

```solidity
// ❌ WRONG
(int rc, address token) = createNonFungibleToken(token);

// ✅ CORRECT
(int rc, address token) = createNonFungibleToken{value: msg.value}(token);
```

From TypeScript:

```typescript
await contract.createToken(name, symbol, {
  gasLimit: 350_000,
  value: ethers.parseEther("15"),
});
```

## TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT (Code 212)

**Symptom**: Response code 212 when associating

**Cause**: Account already associated (not actually an error)

**Solution**: Handle as success case:

```solidity
int rc = associateToken(account, token);
require(
    rc == HederaResponseCodes.SUCCESS ||
    rc == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT,
    "Association failed"
);
```

## ACCOUNT_KYC_NOT_GRANTED_FOR_TOKEN (Code 299)

**Symptom**: Transfer fails with response code 299

**Cause**: Account doesn't have KYC approval

**Solution**: Grant KYC first:

```solidity
int kycRc = grantTokenKyc(tokenAddress, accountAddress);
require(kycRc == HederaResponseCodes.SUCCESS, "KYC grant failed");

// Then transfer
int transferRc = transferToken(tokenAddress, sender, recipient, amount);
```

## Treasury Cannot Transfer After Creation

**Symptom**: Treasury fails to transfer tokens with KYC token

**Cause**: Treasury didn't grant itself KYC

**Solution**: Self-grant KYC after creation:

```solidity
// Immediately after token creation
int kycRc = grantTokenKyc(tokenAddress, address(this));
require(kycRc == HederaResponseCodes.SUCCESS, "Self-KYC failed");
```

## Token Creation Fails Silently

**Symptom**: No revert but token address is 0x0

**Cause**: Response code not checked

**Solution**: Always verify response code:

```solidity
(int rc, address token) = createFungibleToken{value: msg.value}(token, supply, decimals);
require(rc == HederaResponseCodes.SUCCESS, "Create failed");
require(token != address(0), "Invalid token address");
```

Or use SafeHTS for auto-revert.

## Dissociation Fails

**Symptom**: Cannot dissociate from token

**Cause**: Non-zero balance

**Solution**: Transfer or burn all tokens first:

- Fungible: Balance must be zero
- NFT: Must own no serials

## Mint Fails on NFT

**Symptom**: mintToken returns error

**Cause**: Missing SUPPLY key or wrong key holder

**Solution**: Verify contract has SUPPLY key:

```solidity
IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
keys[0] = getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
token.tokenKeys = keys;
```

## Gas Estimation Fails

**Symptom**: Cannot estimate gas for HTS operations

**Cause**: HTS precompile requires actual execution

**Solution**: Use fixed gas limits:

- Token creation: 350,000 - 500,000
- Minting: 150,000 - 250,000
- Transfers: 100,000 - 150,000
- Association: 100,000
