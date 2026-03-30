# HTS API Reference

All classes are imported from `@hiero-ledger/sdk`.

## Table of Contents
- [Token Lifecycle](#token-lifecycle)
- [Token Management](#token-management)
- [Transfers](#transfers)
- [Airdrops](#airdrops)
- [Queries](#queries)
- [ID & Info Classes](#id--info-classes)
- [Enums](#enums)

---

## Token Lifecycle

### TokenCreateTransaction
Creates a new token (fungible or NFT).

| Method | Description |
|--------|-------------|
| `setTokenName(name: string)` | Token name (ASCII only) |
| `setTokenSymbol(symbol: string)` | Token symbol (UTF-8) |
| `setDecimals(n: number)` | Decimal places (fungible only, 0 for NFT) |
| `setInitialSupply(amount: number\|Long)` | Initial supply (fungible only, 0 for NFT) |
| `setTreasuryAccountId(id: AccountId\|string)` | Treasury account (required) |
| `setTokenType(type: TokenType)` | `FungibleCommon` or `NonFungibleUnique` |
| `setSupplyType(type: TokenSupplyType)` | `Infinite` or `Finite` |
| `setMaxSupply(amount: number\|Long)` | Max supply (required when `Finite`) |
| `setTokenMemo(memo: string)` | Description memo |
| `setMetadata(bytes: Uint8Array)` | Token-level metadata |
| `setFreezeDefault(bool: boolean)` | Default freeze status for new associations |
| `setAutoRenewAccountId(id: AccountId)` | Auto-renewal payer |
| `setAutoRenewPeriod(duration: Duration\|number)` | Auto-renewal period |
| `setCustomFees(fees: CustomFee[])` | Custom fee schedule |
| **Key setters** | |
| `setAdminKey(key)` | Admin key |
| `setSupplyKey(key)` | Supply key (mint/burn) |
| `setFreezeKey(key)` | Freeze/unfreeze key |
| `setKycKey(key)` | KYC grant/revoke key |
| `setWipeKey(key)` | Wipe key |
| `setPauseKey(key)` | Pause/unpause key |
| `setFeeScheduleKey(key)` | Fee schedule update key |
| `setMetadataKey(key)` | Metadata update key |

**Receipt returns**: `tokenId`

### TokenMintTransaction
Mints new units of a token.

| Method | Description |
|--------|-------------|
| `setTokenId(id: TokenId\|string)` | Token to mint |
| `setAmount(amount: number\|Long)` | Amount to mint (fungible) |
| `addMetadata(metadata: Uint8Array)` | Add NFT serial metadata |
| `setMetadata(metadata: Uint8Array[])` | Set all NFT metadata at once |

**Receipt returns**: `serials` (Long[]) for NFTs, `totalSupply`

### TokenBurnTransaction
Burns/removes token units from treasury.

| Method | Description |
|--------|-------------|
| `setTokenId(id: TokenId\|string)` | Token to burn from |
| `setAmount(amount: number\|Long)` | Amount to burn (fungible) |
| `setSerials(serials: Long[]\|number[])` | NFT serials to burn |

### TokenDeleteTransaction
Permanently deletes a token. Requires admin key.

| Method | Description |
|--------|-------------|
| `setTokenId(id: TokenId\|string)` | Token to delete |

### TokenUpdateTransaction
Updates token properties. Requires admin key (or specific key for key-only updates).

| Method | Description |
|--------|-------------|
| `setTokenId(id: TokenId\|string)` | Token to update |
| `setTokenName(name)` | New name |
| `setTokenSymbol(symbol)` | New symbol |
| `setTokenMemo(memo)` | New memo |
| `setMetadata(bytes: Uint8Array)` | New metadata |
| `setTreasuryAccountId(id)` | New treasury |
| `setAutoRenewAccountId(id)` | New auto-renewal account |
| `setAutoRenewPeriod(duration)` | New period |
| `setKeyVerificationMode(mode)` | Key verification strategy |
| All key setters from create | Update respective keys |

### TokenUpdateNftsTransaction
Updates metadata on specific NFT serials.

| Method | Description |
|--------|-------------|
| `setTokenId(id: TokenId\|string)` | Token |
| `setSerials(serials: Long[]\|number[])` | Serial numbers to update |
| `setMetadata(bytes: Uint8Array)` | New metadata for those serials |

---

## Token Management

### TokenAssociateTransaction
Associates an account with one or more tokens.

| Method | Description |
|--------|-------------|
| `setAccountId(id: AccountId\|string)` | Account to associate |
| `setTokenIds(ids: TokenId[])` | Token(s) to associate with |

**Signing**: account owner must sign.

### TokenDissociateTransaction
Removes token association. Account balance must be zero.

| Method | Description |
|--------|-------------|
| `setAccountId(id: AccountId\|string)` | Account to dissociate |
| `setTokenIds(ids: TokenId[])` | Token(s) to dissociate |

### TokenFreezeTransaction / TokenUnfreezeTransaction
Freeze or unfreeze an account from transferring a specific token.

| Method | Description |
|--------|-------------|
| `setTokenId(id)` | Token |
| `setAccountId(id)` | Account to freeze/unfreeze |

### TokenGrantKycTransaction / TokenRevokeKycTransaction
Grant or revoke KYC compliance status.

| Method | Description |
|--------|-------------|
| `setTokenId(id)` | Token with KYC key |
| `setAccountId(id)` | Account to grant/revoke KYC |

### TokenWipeTransaction
Removes tokens from an account (not treasury). Requires wipe key.

| Method | Description |
|--------|-------------|
| `setTokenId(id)` | Token |
| `setAccountId(id)` | Account to wipe from |
| `setAmount(amount)` | Amount to wipe (fungible) |
| `setSerials(serials)` | NFT serials to wipe |

### TokenPauseTransaction / TokenUnpauseTransaction
Pause or unpause all operations on a token.

| Method | Description |
|--------|-------------|
| `setTokenId(id)` | Token to pause/unpause |

### TokenFeeScheduleUpdateTransaction
Updates custom fee schedule. Requires fee schedule key.

| Method | Description |
|--------|-------------|
| `setTokenId(id)` | Token |
| `setCustomFees(fees: CustomFee[])` | New fee schedule |

---

## Transfers

### TransferTransaction
Transfers Hbar and/or tokens between accounts.

| Method | Description |
|--------|-------------|
| `addHbarTransfer(accountId, amount: Hbar)` | Add Hbar transfer |
| `addTokenTransfer(tokenId, accountId, amount)` | Add fungible token transfer (signed amount) |
| `addNftTransfer(tokenId, serial, sender, receiver)` | Add NFT transfer |
| `addApprovedTokenTransfer(tokenId, accountId, amount)` | Approved/allowance transfer |
| `addApprovedNftTransfer(tokenId, serial, sender, receiver)` | Approved NFT transfer |

---

## Airdrops

### TokenAirdropTransaction
Distributes tokens to multiple recipients. Pending if recipient lacks association.

Same methods as TransferTransaction: `addTokenTransfer()`, `addNftTransfer()`.

### TokenClaimAirdropTransaction
Recipient claims a pending airdrop.

| Method | Description |
|--------|-------------|
| `addPendingAirdropId(id)` | Pending airdrop ID from record |

### TokenCancelAirdropTransaction
Sender cancels a pending airdrop.

| Method | Description |
|--------|-------------|
| `addPendingAirdropId(id)` | Pending airdrop ID |

### TokenRejectTransaction
Recipient rejects/returns tokens they already received.

| Method | Description |
|--------|-------------|
| `setOwnerId(accountId)` | Account rejecting tokens |
| `addTokenId(tokenId)` | Fungible token to reject |
| `addNftId(nftId: NftId)` | NFT to reject |

---

## Queries

### TokenInfoQuery
Returns full token metadata as `TokenInfo`.

| Method | Description |
|--------|-------------|
| `setTokenId(id)` | Token to query |

**TokenInfo properties**: `tokenId`, `name`, `symbol`, `decimals`, `totalSupply`, `treasuryAccountId`, `adminKey`, `kycKey`, `freezeKey`, `wipeKey`, `supplyKey`, `pauseKey`, `feeScheduleKey`, `metadataKey`, `metadata`, `defaultFreezeStatus`, `defaultKycStatus`, `pauseStatus`, `isDeleted`, `tokenMemo`, `customFees`, `tokenType`, `supplyType`, `maxSupply`, `autoRenewAccountId`, `autoRenewPeriod`, `expirationTime`.

### TokenNftInfoQuery
Returns individual NFT metadata as `TokenNftInfo`.

| Method | Description |
|--------|-------------|
| `setNftId(id: NftId)` | Specific NFT to query |

**TokenNftInfo properties**: `nftId`, `accountId` (current owner), `creationTime`, `metadata`, `ledgerId`.

---

## ID & Info Classes

### TokenId
Represents a token identifier (`shard.realm.num`).

| Method | Description |
|--------|-------------|
| `TokenId.fromString("0.0.123")` | Parse from string |
| `TokenId.fromBytes(bytes)` | Decode from protobuf |
| `toString()` | "0.0.123" format |

### NftId
Represents a unique NFT (`tokenId/serial`).

| Constructor | Description |
|-------------|-------------|
| `new NftId(tokenId, serial)` | Create from token ID and serial |
| `NftId.fromString("0.0.123/1")` | Parse from string |

---

## Enums

### TokenType
| Value | Description |
|-------|-------------|
| `TokenType.FungibleCommon` | Standard fungible token |
| `TokenType.NonFungibleUnique` | NFT |

### TokenSupplyType
| Value | Description |
|-------|-------------|
| `TokenSupplyType.Infinite` | No max supply limit |
| `TokenSupplyType.Finite` | Fixed max supply (requires `setMaxSupply`) |
