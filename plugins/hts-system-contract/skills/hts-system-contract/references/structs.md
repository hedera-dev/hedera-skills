# Struct Definitions

## HederaToken

```solidity
struct HederaToken {
    string name;                    // ≤100 bytes UTF-8
    string symbol;                  // ≤100 bytes UTF-8
    address treasury;               // Required, receives initial supply
    string memo;                    // ≤100 bytes UTF-8
    bool tokenSupplyType;           // false=INFINITE, true=FINITE
    int64 maxSupply;                // Required if FINITE
    bool freezeDefault;             // Default freeze for new associations
    TokenKey[] tokenKeys;           // Array of token keys
    Expiry expiry;                  // Expiry configuration
}
```

## TokenKey

```solidity
struct TokenKey {
    uint256 keyType;    // Bitmask: ADMIN=1, KYC=2, FREEZE=4, WIPE=8, SUPPLY=16, FEE=32, PAUSE=64
    KeyValue key;
}

struct KeyValue {
    bool inheritAccountKey;
    address contractId;
    bytes ed25519;
    bytes ECDSA_secp256k1;         // 33-byte compressed
    address delegatableContractId;
}
```

## Expiry

```solidity
struct Expiry {
    int64 second;                   // Unix timestamp (or 0)
    address autoRenewAccount;       // Account charged for renewal
    int64 autoRenewPeriod;          // Seconds (default: 7776000 = 90 days)
}
```

Using ExpiryHelper:

```solidity
token.expiry = createAutoRenewExpiry(address(this), 7776000);  // 90 days
token.expiry = createSecondExpiry(1735689600);                  // Fixed timestamp
```

Common periods:

- 90 days: `7776000`
- 1 year: `31536000`
- 10 years: `315360000`
- Max (100 years): `3153600000`

## Transfer Structs

```solidity
struct TransferList {
    AccountAmount[] transfers;
}

struct AccountAmount {
    address accountID;
    int64 amount;          // Negative = send, Positive = receive
    bool isApproval;
}

struct TokenTransferList {
    address token;
    AccountAmount[] transfers;
    NftTransfer[] nftTransfers;
}

struct NftTransfer {
    address senderAccountID;
    address receiverAccountID;
    int64 serialNumber;
    bool isApproval;
}
```

## Limits

| Item         | Limit                |
| ------------ | -------------------- |
| Token name   | 100 bytes UTF-8      |
| Token symbol | 100 bytes UTF-8      |
| Token memo   | 100 bytes UTF-8      |
| NFT metadata | 100 bytes per serial |
| Max supply   | 2^63 - 1             |
