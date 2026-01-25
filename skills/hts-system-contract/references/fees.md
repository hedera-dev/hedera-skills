# Custom Fee Structures

Three fee types enforced at network level.

## Fee Type Overview

| Type           | Applies To      | Collected When  |
| -------------- | --------------- | --------------- |
| Fixed Fee      | Fungible or NFT | Every transfer  |
| Fractional Fee | Fungible only   | Every transfer  |
| Royalty Fee    | NFT only        | Secondary sales |

## Fixed Fees

```solidity
struct FixedFee {
    int64 amount;
    address tokenId;              // Fee token (address(0) for HBAR)
    bool useHbarsForPayment;
    bool useCurrentTokenForPayment;
    address feeCollector;
}
```

HBAR-denominated (1 HBAR per transfer):

```solidity
IHederaTokenService.FixedFee memory fee;
fee.amount = 100_000_000;           // 1 HBAR (8 decimals)
fee.tokenId = address(0);
fee.useHbarsForPayment = true;
fee.useCurrentTokenForPayment = false;
fee.feeCollector = collectorAddress;
```

Same-token fee:

```solidity
fee.amount = 10;
fee.useHbarsForPayment = false;
fee.useCurrentTokenForPayment = true;
fee.feeCollector = collectorAddress;
```

## Fractional Fees

```solidity
struct FractionalFee {
    int64 numerator;
    int64 denominator;
    int64 minimumAmount;
    int64 maximumAmount;
    bool netOfTransfers;          // true = fee from sender extra; false = from transfer amount
    address feeCollector;
}
```

1% fee with min/max:

```solidity
IHederaTokenService.FractionalFee memory fee;
fee.numerator = 1;
fee.denominator = 100;
fee.minimumAmount = 10;
fee.maximumAmount = 1000;
fee.netOfTransfers = false;
fee.feeCollector = collectorAddress;
```

## Royalty Fees

```solidity
struct RoyaltyFee {
    int64 numerator;
    int64 denominator;
    int64 amount;                 // Fallback fee amount
    address tokenId;              // Fallback fee token
    bool useHbarsForPayment;      // Fallback in HBAR
    address feeCollector;
}
```

10% royalty with 1 HBAR fallback:

```solidity
IHederaTokenService.RoyaltyFee memory royalty;
royalty.numerator = 1;
royalty.denominator = 10;
royalty.amount = 100_000_000;       // 1 HBAR fallback
royalty.tokenId = address(0);
royalty.useHbarsForPayment = true;
royalty.feeCollector = creatorAddress;
```

## Creating Tokens with Fees

```solidity
IHederaTokenService.FixedFee[] memory fixedFees = new IHederaTokenService.FixedFee[](1);
fixedFees[0] = fee;

IHederaTokenService.FractionalFee[] memory fractionalFees = new IHederaTokenService.FractionalFee[](0);

(int rc, address token) = createFungibleTokenWithCustomFees{value: msg.value}(
    token,
    initialSupply,
    decimals,
    fixedFees,
    fractionalFees
);
```
