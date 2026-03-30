# Custom Fees Guide

HTS tokens can have custom fee schedules assessed on every transfer. There are three fee types, each suited to different tokenomics models.

## Fee Types

### CustomFixedFee

A flat fee charged per transfer, denominated in Hbar or any token.

```js
import { CustomFixedFee, Hbar } from "@hiero-ledger/sdk";

// Fixed fee in Hbar
const hbarFee = new CustomFixedFee()
    .setFeeCollectorAccountId(collectorId)
    .setHbarAmount(new Hbar(1));

// Fixed fee in a specific token
const tokenFee = new CustomFixedFee()
    .setFeeCollectorAccountId(collectorId)
    .setDenominatingTokenId(feeTokenId)
    .setAmount(50);

// Fixed fee in the same token being transferred
const sameFee = new CustomFixedFee()
    .setFeeCollectorAccountId(collectorId)
    .setDenominatingTokenToSameToken()
    .setAmount(10);
```

**Methods**:
- `setFeeCollectorAccountId(id)` — account receiving fees
- `setHbarAmount(hbar: Hbar)` — fee in Hbar
- `setAmount(amount: number|Long)` — fee amount (in tinybars if Hbar, or token smallest unit)
- `setDenominatingTokenId(tokenId)` — denominate in specific token
- `setDenominatingTokenToSameToken()` — denominate in the transferred token
- `setAllCollectorsAreExempt(bool)` — exempt all fee collectors from this fee

### CustomFractionalFee

A percentage-based fee charged on fungible token transfers. Only valid for fungible tokens.

```js
import { CustomFractionalFee } from "@hiero-ledger/sdk";

// 2.5% fee with min/max bounds
const percentFee = new CustomFractionalFee()
    .setFeeCollectorAccountId(collectorId)
    .setNumerator(25)
    .setDenominator(1000)  // 25/1000 = 2.5%
    .setMin(1)             // minimum 1 unit
    .setMax(5000);         // maximum 5000 units
```

**Methods**:
- `setNumerator(n)` / `setDenominator(d)` — fraction (e.g., 1/100 = 1%)
- `setMin(amount)` — minimum fee floor
- `setMax(amount)` — maximum fee cap (0 = no max)
- `setAssessmentMethod(method)` — `EXCLUSIVE` (added on top) or `INCLUSIVE` (taken from transfer amount)

### CustomRoyaltyFee

A percentage fee on NFT transfers. Only valid for `NonFungibleUnique` tokens. If the NFT transfer has no accompanying fungible value exchange, the fallback fee is charged instead.

```js
import { CustomRoyaltyFee, CustomFixedFee, Hbar } from "@hiero-ledger/sdk";

// 10% royalty with 1 Hbar fallback
const royalty = new CustomRoyaltyFee()
    .setFeeCollectorAccountId(creatorId)
    .setNumerator(10)
    .setDenominator(100)
    .setFallbackFee(
        new CustomFixedFee().setHbarAmount(new Hbar(1))
    );
```

**Methods**:
- `setNumerator(n)` / `setDenominator(d)` — royalty percentage
- `setFallbackFee(fee: CustomFixedFee)` — charged when no fungible value is exchanged alongside the NFT

## Applying Fees

### At Token Creation
```js
await new TokenCreateTransaction()
    .setTokenName("My Token")
    .setTokenSymbol("MTK")
    .setCustomFees([fixedFee, fractionalFee])
    // ... other fields
    .execute(client);
```

### Updating Fee Schedule
Requires the `feeScheduleKey`:
```js
import { TokenFeeScheduleUpdateTransaction } from "@hiero-ledger/sdk";

await new TokenFeeScheduleUpdateTransaction()
    .setTokenId(tokenId)
    .setCustomFees([newFixedFee, newFractionalFee])
    .execute(client);
```

## Fee Rules

- A token can have up to **10 custom fees**.
- Fractional fees apply only to **fungible** tokens.
- Royalty fees apply only to **NFT** tokens.
- Fixed fees apply to both token types.
- Fee collectors are **exempt** from their own fees by default. Use `setAllCollectorsAreExempt(true)` to extend exemption to all collectors.
- Fees are assessed on every `TransferTransaction` and `TokenAirdropTransaction` involving the token.
- Nested fees (fee-on-fee) are limited to **one level** — a fee paid in a token that itself has fees won't trigger cascading fees.
