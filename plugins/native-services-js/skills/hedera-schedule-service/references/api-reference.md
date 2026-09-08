# Hedera Schedule Service — API Reference

Extracted directly from `@hiero-ledger/sdk@2.86.2` source (`src/schedule/*.js`, `src/KeyList.js`). Method names and behavior confirmed against a live Hedera testnet run — see the skill's `evals/` for the exact scenario.

## `ScheduleCreateTransaction`

| Method | Type | Notes |
|---|---|---|
| `setScheduledTransaction(transaction)` | `Transaction` | The transaction to run once enough signatures arrive. Build it fully (all fields set) but do not call `.execute()` on it yourself. |
| `setPayerAccountId(accountId)` | `AccountId \| string` | Who pays the network fee when the schedule executes. Independent of who must sign — see the skill's Pitfalls section. |
| `setAdminKey(key)` | `Key` | Optional. If set, allows the schedule itself to be deleted (via `ScheduleDeleteTransaction`) before it executes. Omit for an irrevocable schedule. |
| `setScheduleMemo(memo)` | `string` | Free-text memo, visible on-chain and in mirror-node/HashScan views of the schedule. |
| `setExpirationTime(timestamp)` | `Timestamp` | When the network gives up waiting for signatures and deletes the schedule (unless `setWaitForExpiry(true)`). Defaults to the network's configured max if unset. |
| `setWaitForExpiry(bool)` | `boolean` | `true` keeps an under-signed schedule pending until its expiration instead of deleting it as soon as the network can tell it will never collect enough signatures. |

Execute normally (`.execute(client)`), then `.getReceipt(client)` — the receipt's `.scheduleId` (`ScheduleId`) is the handle for every later query/sign/delete call.

## `ScheduleSignTransaction`

| Method | Type | Notes |
|---|---|---|
| `setScheduleId(scheduleId)` | `ScheduleId \| string` | Which schedule this signature applies to. |

Must be frozen and signed with the actual signer's key before executing:
```js
await (await new ScheduleSignTransaction().setScheduleId(id).freezeWith(client).sign(signerKey)).execute(client);
```

## `ScheduleDeleteTransaction`

| Method | Type | Notes |
|---|---|---|
| `setScheduleId(scheduleId)` | `ScheduleId \| string` | Which schedule to delete. Only succeeds if the schedule was created with an `adminKey`, and the transaction must be signed by that key. |

## `ScheduleInfoQuery` -> `ScheduleInfo`

Query: `new ScheduleInfoQuery().setScheduleId(scheduleId).execute(client)`.

Fields on the returned `ScheduleInfo` (all confirmed present in SDK source):

| Field | Type | Notes |
|---|---|---|
| `scheduleId` | `ScheduleId` | |
| `creatorAccountId` | `AccountId` | Who submitted `ScheduleCreateTransaction`. |
| `payerAccountId` | `AccountId` | The fee payer set via `setPayerAccountId`. |
| `schedulableTransactionBody` | protobuf body | The scheduled transaction, in wire form — not generally useful directly in application code. |
| `signers` | `KeyList` | The keys that have signed so far. |
| `scheduleMemo` | `string` | |
| `adminKey` | `Key \| null` | `null` if the schedule is irrevocable. |
| `expirationTime` | `Timestamp` | |
| `executed` | `Timestamp \| null` | **Not a boolean.** `null` until executed, a real timestamp once it has. See the skill's Pitfalls. |
| `deleted` | `boolean` | True if deleted before executing (expired without `waitForExpiry`, or explicitly via `ScheduleDeleteTransaction`). |
| `scheduledTransactionId` | `TransactionId \| null` | The executed transaction's own ID (suffixed `?scheduled` when formatted as a string), set once `executed` is set. `null` before then. |
| `waitForExpiry` | `boolean` | |

## `KeyList`

| Constructor / method | Signature | Notes |
|---|---|---|
| `new KeyList(keys, threshold?)` | `keys: Key[]`, `threshold?: number` | Pass **public** keys. Omit `threshold` for "every key required"; pass a number for m-of-n. |
| `KeyList.of(...keys)` | `(...keys: Key[]) => KeyList` | Shorthand for "every key required" — equivalent to `new KeyList(keys)` with no threshold. |
| `.threshold` | `number \| null` | Getter. `null` if constructed without a threshold. |
| `.setThreshold(n)` | `(n: number) => void` | Mutates an existing `KeyList`'s threshold. Note this only affects a `KeyList` object still being built client-side — it does not retroactively change a threshold key already committed to an account on-chain. |
| `.toArray()` | `() => Key[]` | The member keys, in insertion order. |
| `.push(...keys)` | `(...keys: Key[]) => KeyList` | Adds keys to an existing list. |

A `KeyList` (with or without a threshold) can be used anywhere the SDK accepts a `Key` — most commonly `AccountCreateTransaction.setKeyWithoutAlias(keyList)` to make an account's authorization a threshold/multi-sig, but also as a token's admin/supply/KYC key, or `ScheduleCreateTransaction.setAdminKey(keyList)` to require multiple parties to agree before a schedule can be deleted.
