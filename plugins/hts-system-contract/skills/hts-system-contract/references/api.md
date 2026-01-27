# HTS API Reference

## Token Creation

```solidity
function createFungibleToken(
    HederaToken memory token,
    int64 initialTotalSupply,
    int32 decimals
) external payable returns (int64 responseCode, address tokenAddress);

function createNonFungibleToken(
    HederaToken memory token
) external payable returns (int64 responseCode, address tokenAddress);

function createFungibleTokenWithCustomFees(
    HederaToken memory token,
    int64 initialTotalSupply,
    int32 decimals,
    FixedFee[] memory fixedFees,
    FractionalFee[] memory fractionalFees
) external payable returns (int64 responseCode, address tokenAddress);

function createNonFungibleTokenWithCustomFees(
    HederaToken memory token,
    FixedFee[] memory fixedFees,
    RoyaltyFee[] memory royaltyFees
) external payable returns (int64 responseCode, address tokenAddress);
```

## Minting & Burning

```solidity
function mintToken(
    address token,
    int64 amount,           // For fungible; 0 for NFT
    bytes[] memory metadata // Empty for fungible; one entry per NFT
) internal returns (int responseCode, int64 newTotalSupply, int64[] memory serialNumbers);

function burnToken(
    address token,
    int64 amount,              // For fungible; 0 for NFT
    int64[] memory serialNumbers // Empty for fungible; serials for NFT
) internal returns (int responseCode, int64 newTotalSupply);
```

## Transfers

```solidity
function transferToken(
    address token,
    address sender,
    address recipient,
    int64 amount
) internal returns (int responseCode);

function transferNFT(
    address token,
    address sender,
    address recipient,
    int64 serialNumber
) internal returns (int responseCode);

function cryptoTransfer(
    TransferList memory hbarTransfers,
    TokenTransferList[] memory tokenTransfers
) internal returns (int responseCode);
```

## Association

```solidity
function associateToken(
    address account,
    address token
) internal returns (int responseCode);

function associateTokens(
    address account,
    address[] memory tokens
) internal returns (int responseCode);

function dissociateToken(
    address account,
    address token
) internal returns (int responseCode);

function dissociateTokens(
    address account,
    address[] memory tokens
) internal returns (int responseCode);
```

## Compliance Controls

```solidity
// KYC
function grantTokenKyc(address token, address account) internal returns (int responseCode);
function revokeTokenKyc(address token, address account) internal returns (int responseCode);
function isKyc(address token, address account) internal returns (int responseCode, bool kycGranted);

// Freeze
function freezeToken(address token, address account) internal returns (int responseCode);
function unfreezeToken(address token, address account) internal returns (int responseCode);
function isFrozen(address token, address account) internal returns (int responseCode, bool frozen);

// Pause
function pauseToken(address token) internal returns (int responseCode);
function unpauseToken(address token) internal returns (int responseCode);

// Wipe
function wipeTokenAccount(address token, address account, int64 amount) internal returns (int responseCode);
function wipeTokenAccountNFT(address token, address account, int64[] memory serialNumbers) internal returns (int responseCode);
```

## Approvals

```solidity
// Fungible
function approve(address token, address spender, uint256 amount) internal returns (int responseCode);
function allowance(address token, address owner, address spender) internal returns (int responseCode, uint256 allowance);
function transferFrom(address token, address from, address to, uint256 amount) internal returns (int64 responseCode);

// NFT
function approveNFT(address token, address approved, uint256 serialNumber) internal returns (int responseCode);
function getApproved(address token, uint256 serialNumber) internal returns (int responseCode, address approved);
function transferFromNFT(address token, address from, address to, uint256 serialNumber) internal returns (int64 responseCode);

// Operator
function setApprovalForAll(address token, address operator, bool approved) internal returns (int responseCode);
function isApprovedForAll(address token, address owner, address operator) internal returns (int responseCode, bool approved);
```

## Token Management

```solidity
function deleteToken(address token) internal returns (int responseCode);
function updateTokenInfo(address token, HederaToken memory tokenInfo) internal returns (int responseCode);
function updateTokenKeys(address token, TokenKey[] memory keys) internal returns (int64 responseCode);
function updateTokenExpiryInfo(address token, Expiry memory expiryInfo) internal returns (int responseCode);
```

## Query Functions

```solidity
function getTokenInfo(address token) internal returns (int responseCode, TokenInfo memory tokenInfo);
function getFungibleTokenInfo(address token) internal returns (int responseCode, FungibleTokenInfo memory fungibleTokenInfo);
function getNonFungibleTokenInfo(address token, int64 serialNumber) internal returns (int responseCode, NonFungibleTokenInfo memory nonFungibleTokenInfo);
function getTokenDefaultFreezeStatus(address token) internal returns (int responseCode, bool defaultFreezeStatus);
function getTokenDefaultKycStatus(address token) internal returns (int responseCode, bool defaultKycStatus);
function getTokenCustomFees(address token) internal returns (int64 responseCode, FixedFee[] memory fixedFees, FractionalFee[] memory fractionalFees, RoyaltyFee[] memory royaltyFees);
```
