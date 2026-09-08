---
name: hedera-schedule-service
description: "How to create scheduled transactions and threshold-key (multi-sig) accounts on Hedera using the Hiero JavaScript SDK (@hiero-ledger/sdk). Use this skill whenever the user wants multi-signature approval flows, treasury releases requiring multiple signers, delayed or future-dated transactions, m-of-n approval, KeyList/ThresholdKey accounts, or any HSS (Hedera Schedule Service) operation in JavaScript or TypeScript. Also trigger when users mention multisig, multi-sig wallet, scheduled transaction, ScheduleCreateTransaction, threshold signature, or DAO-style approval on Hedera — these are native network features, not something to reimplement as a Solidity contract."
---

# Hedera Schedule Service (HSS) — JavaScript SDK

HSS lets a transaction exist on the network before it has all the signatures it needs, and execute automatically the moment it does. Combined with a `KeyList` threshold key, this gives Hedera native m-of-n multi-sig and delayed/future-dated execution — no Solidity contract, no Gnosis-Safe-style wrapper, no custom escrow logic. This is a genuine Hedera-native capability: plain EVM chains have neither primitive without smart-contract scaffolding.

Do not reach for a Solidity multi-sig contract on Hedera. Reach for `KeyList` + `ScheduleCreateTransaction` instead — it is cheaper, simpler, and enforced by consensus nodes rather than application code.

## Setup

All imports come from `@hiero-ledger/sdk`.

```js
import { Client, AccountId, PrivateKey } from "@hiero-ledger/sdk";

const client = Client.forName(process.env.HEDERA_NETWORK)
    .setOperator(
        AccountId.fromString(process.env.OPERATOR_ID),
        PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY),
    );
```

## Threshold Keys (Multi-Sig)

A `KeyList` is a plain m-of-n list when no threshold is set (every key must sign), or a threshold key when one is. Pass public keys, not private keys — only the public key belongs on an account or in a `KeyList`.

```js
import { PrivateKey, KeyList, AccountCreateTransaction, Hbar } from "@hiero-ledger/sdk";

const key1 = PrivateKey.generateECDSA();
const key2 = PrivateKey.generateECDSA();
const key3 = PrivateKey.generateECDSA();

// 2-of-3: any two of the three keys can authorize this account's transactions.
const thresholdKey = new KeyList([key1.publicKey, key2.publicKey, key3.publicKey], 2);

const receipt = await (
    await new AccountCreateTransaction()
        .setKeyWithoutAlias(thresholdKey)
        .setInitialBalance(new Hbar(10))
        .execute(client)
).getReceipt(client);

const multisigAccountId = receipt.accountId;
```

`KeyList.of(...)` is a shorthand constructor for the no-threshold case (`KeyList.of(key1.publicKey, key2.publicKey)`, every key required). Use the `KeyList` constructor directly when you need a threshold below the full count.

## Scheduling a Transaction

Any transaction can be scheduled instead of executed directly: build it as normal, then hand it to `ScheduleCreateTransaction` instead of calling `.execute()` on it. The schedule itself needs its own payer (who covers the eventual execution fee) — this is often the same operator that creates the schedule, not the multisig account whose funds are moving.

```js
import { TransferTransaction, ScheduleCreateTransaction, Hbar } from "@hiero-ledger/sdk";

// The real transaction, unexecuted — this is what will run once approved.
const transferTx = new TransferTransaction()
    .addHbarTransfer(multisigAccountId, new Hbar(-100))
    .addHbarTransfer(recipientAccountId, new Hbar(100));

const scheduleReceipt = await (
    await new ScheduleCreateTransaction()
        .setScheduledTransaction(transferTx)
        .setPayerAccountId(operatorId)          // pays the network fee when it executes
        .setScheduleMemo("treasury release: Q3 vendor payment")
        .execute(client)
).getReceipt(client);

const scheduleId = scheduleReceipt.scheduleId;
```

The schedule executes automatically — the instant it collects enough valid signatures for the *scheduled* transaction's own required keys, not the schedule creator's. Nothing else needs to poll or trigger it.

## Collecting Signatures

Each required signer submits a separate `ScheduleSignTransaction` referencing the schedule ID. There is no need to coordinate who signs first, or to combine signatures off-chain — the network accumulates them.

```js
import { ScheduleSignTransaction } from "@hiero-ledger/sdk";

await (
    await (
        await new ScheduleSignTransaction()
            .setScheduleId(scheduleId)
            .freezeWith(client)
            .sign(key1)              // one of the threshold key's private keys
    ).execute(client)
).getReceipt(client);
```

Signing with a key that isn't part of the scheduled transaction's required key set is a harmless no-op from the network's perspective, but check `ScheduleInfoQuery` afterward to confirm the schedule actually reflects the intended signer before assuming it counted.

## Checking Whether It Executed

```js
import { ScheduleInfoQuery } from "@hiero-ledger/sdk";

const info = await new ScheduleInfoQuery().setScheduleId(scheduleId).execute(client);
```

**`info.executed` is not a boolean.** It is `null` until the schedule executes, and a `Timestamp` object (`{ seconds, nanos }`) once it has. Code that checks `info.executed === true` is always false, even after real execution — a genuine, live-verified mistake, not a hypothetical one. Check truthiness (`if (info.executed)`) or compare against `null` explicitly, never `=== true`.

Other useful fields on `ScheduleInfo`: `signers` (the keys that have signed so far), `expirationTime` (when Hedera gives up waiting for enough signatures — see Pitfalls), `deleted`, and `scheduledTransactionId` (the executed transaction's own ID, suffixed `?scheduled` — usable to look the execution up on HashScan or a mirror node once `executed` is set).

## Pitfalls

- **`executed` is nullable, not boolean** — see above. Live-verified: `info.executed === true` never matches, even on a genuinely executed schedule.
- **The schedule's payer and the scheduled transaction's signers are different concerns.** `setPayerAccountId` on `ScheduleCreateTransaction` only decides who pays the *execution* fee — it does not need to be, and usually is not, one of the threshold key's holders. Confusing the two produces a schedule that executes but drains the wrong account for fees, or a scheduled transaction that never gets enough of the *right* signatures because the wrong party was asked to sign.
- **Expiration is real, not just documentation.** A schedule with unmet signatures is deleted at `expirationTime` (`ScheduleCreateTransaction.setExpirationTime`, or the network default if unset) unless `setWaitForExpiry(true)` is set to keep it pending instead of deleting it early. A multi-sig flow that assumes "the schedule just sits there forever until signed" without checking this will silently lose pending approvals.
- **Public keys only, in the `KeyList`.** Passing a `PrivateKey` where a `KeyList` expects public keys (a natural mistake, since `PrivateKey` objects expose most of the same shape) leaks nothing hazardous but is a wrong-key-material bug that surfaces as `INVALID_SIGNATURE` on the FIRST attempted sign, not at `KeyList` construction time.
- **Threshold vs. plain list are different constructors, not a flag.** `new KeyList(keys, threshold)` sets a threshold; `KeyList.of(...keys)` does not, and requires every key. There is no `.setThreshold()` shortcut on an already-constructed `KeyList.of(...)` result that changes this after the fact in a way most agents expect — build the threshold list from the start if that's the intent.

## References

- [`api-reference.md`](references/api-reference.md) — full method signatures for `ScheduleCreateTransaction`, `ScheduleSignTransaction`, `ScheduleDeleteTransaction`, `ScheduleInfoQuery`, `ScheduleInfo`, and `KeyList`.
