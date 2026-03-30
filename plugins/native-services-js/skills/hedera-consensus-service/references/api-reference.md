# HCS API Reference

All classes are imported from `@hiero-ledger/sdk`.

## Table of Contents
- [Transactions](#transactions)
- [Queries & Subscriptions](#queries--subscriptions)
- [Model Classes](#model-classes)
- [ID Class](#id-class)

---

## Transactions

### TopicCreateTransaction
Creates a new consensus topic.

| Method | Description |
|--------|-------------|
| `setTopicMemo(memo: string)` | Public memo/description |
| `setAdminKey(key: Key)` | Admin key (update/delete control) |
| `setSubmitKey(key: Key)` | Submit key (message posting control) |
| `setFeeScheduleKey(key: Key)` | Fee schedule update key |
| `setAutoRenewAccountId(id: AccountId\|string)` | Account paying renewal fees |
| `setAutoRenewPeriod(period: Duration\|number)` | Renewal period (default: 90 days) |
| `setCustomFees(fees: CustomFixedFee[])` | Per-message custom fees |
| `addCustomFee(fee: CustomFixedFee)` | Add single custom fee |
| `setFeeExemptKeys(keys: Key[])` | Keys exempt from custom fees |
| `addFeeExemptKey(key: Key)` | Add single exempt key |
| `clearCustomFees()` | Remove all custom fees |
| `clearFeeExemptKeys()` | Remove all exempt keys |

**Default max transaction fee**: 25 Hbar
**Receipt returns**: `topicId`

### TopicUpdateTransaction
Updates topic properties. Requires admin key.

| Method | Description |
|--------|-------------|
| `setTopicId(id: TopicId\|string)` | Topic to update (required) |
| `setTopicMemo(memo: string)` | New memo |
| `setAdminKey(key: Key)` | New admin key (both old and new must sign) |
| `setSubmitKey(key: Key)` | New submit key |
| `setFeeScheduleKey(key: Key)` | New fee schedule key |
| `setAutoRenewAccountId(id: AccountId\|string)` | New renewal account (must sign) |
| `setAutoRenewPeriod(period: Duration\|number)` | New renewal period |
| `setExpirationTime(time: Timestamp\|Date)` | Set topic expiration |
| `setCustomFees(fees: CustomFixedFee[])` | Replace custom fees |
| `addCustomFee(fee: CustomFixedFee)` | Add custom fee |
| `setFeeExemptKeys(keys: Key[])` | Replace exempt keys |
| `addFeeExemptKey(key: Key)` | Add exempt key |
| `clearAdminKey()` | Remove admin key (irreversible!) |
| `clearSubmitKey()` | Remove submit key (open to all) |
| `clearFeeScheduleKey()` | Remove fee schedule key |
| `clearAutoRenewAccountId()` | Remove renewal account |
| `clearTopicMemo()` | Clear memo |
| `clearCustomFees()` | Remove all fees |
| `clearFeeExemptKeys()` | Remove all exempt keys |

### TopicDeleteTransaction
Permanently deletes a topic. Requires admin key.

| Method | Description |
|--------|-------------|
| `setTopicId(id: TopicId\|string)` | Topic to delete |

### TopicMessageSubmitTransaction
Submits a message to a topic. Auto-chunks large messages.

| Method | Description |
|--------|-------------|
| `setTopicId(id: TopicId\|string)` | Target topic |
| `setMessage(message: string\|Uint8Array)` | Message content |
| `setMaxChunks(n: number)` | Max chunks allowed (default: 20) |
| `setChunkSize(bytes: number)` | Chunk size in bytes (default: 1024) |
| `setCustomFeeLimits(limits: CustomFeeLimit[])` | Max custom fees willing to pay |
| `addCustomFeeLimit(limit: CustomFeeLimit)` | Add single fee limit |
| `execute(client)` | Execute (returns first chunk response) |
| `executeAll(client)` | Execute all chunks (returns TransactionResponse[]) |

**Receipt returns**: `topicSequenceNumber`, `topicRunningHash`

---

## Queries & Subscriptions

### TopicInfoQuery
Returns full topic state as `TopicInfo`.

| Method | Description |
|--------|-------------|
| `setTopicId(id: TopicId\|string)` | Topic to query |

### TopicMessageQuery
Real-time subscription to topic messages via mirror node. Not a standard Query — uses `subscribe()` instead of `execute()`.

| Method | Description |
|--------|-------------|
| `setTopicId(id: TopicId\|string)` | Topic to subscribe to |
| `setStartTime(time: Timestamp\|Date\|number)` | Receive from this time (0 = beginning) |
| `setEndTime(time: Timestamp\|Date\|number)` | Stop after this time |
| `setLimit(limit: number\|Long)` | Max messages to receive |
| `setMaxAttempts(n: number)` | Retry attempts (default: 20) |
| `setMaxBackoff(ms: number)` | Max retry backoff in ms (default: 8000) |
| `setErrorHandler(fn)` | `(message?, error) => void` callback |
| `setCompletionHandler(fn)` | `() => void` fires on limit/endTime |
| `subscribe(client, errorHandler?, listener)` | Returns `SubscriptionHandle` |

**Retry behavior**: Retries on `NOT_FOUND`, `RESOURCE_EXHAUSTED`, `UNAVAILABLE`, and RST_STREAM errors with exponential backoff (250ms * 2^attempt, capped at maxBackoff).

---

## Model Classes

### TopicInfo
Returned by `TopicInfoQuery`. All properties are read-only.

| Property | Type | Description |
|----------|------|-------------|
| `topicId` | `TopicId` | The topic's ID |
| `topicMemo` | `string` | Public memo |
| `runningHash` | `Uint8Array` | SHA-384 running hash |
| `sequenceNumber` | `Long` | Message count (starts at 1) |
| `expirationTime` | `Timestamp\|null` | When topic expires |
| `adminKey` | `Key\|null` | Admin key |
| `submitKey` | `Key\|null` | Submit key |
| `feeScheduleKey` | `Key\|null` | Fee schedule key |
| `feeExemptKeys` | `Key[]\|null` | Keys exempt from fees |
| `autoRenewPeriod` | `Duration\|null` | Renewal duration |
| `autoRenewAccountId` | `AccountId\|null` | Renewal payer |
| `customFees` | `CustomFixedFee[]\|null` | Per-message fees |
| `ledgerId` | `LedgerId\|null` | Network identifier |

### TopicMessage
Received via `TopicMessageQuery` subscription. Immutable (frozen).

| Property | Type | Description |
|----------|------|-------------|
| `consensusTimestamp` | `Timestamp` | Consensus time |
| `contents` | `Uint8Array` | Message body (auto-reassembled) |
| `runningHash` | `Uint8Array` | Running hash at this message |
| `sequenceNumber` | `Long` | Position in topic |
| `initialTransactionId` | `TransactionId\|null` | Original txn ID (chunked msgs) |
| `chunks` | `TopicMessageChunk[]` | Individual chunks |

### TopicMessageChunk
Individual chunk of a multi-part message.

| Property | Type | Description |
|----------|------|-------------|
| `consensusTimestamp` | `Timestamp` | Chunk consensus time |
| `contents` | `Uint8Array` | Chunk data |
| `runningHash` | `Uint8Array` | Running hash after this chunk |
| `sequenceNumber` | `Long` | Chunk sequence number |

### SubscriptionHandle
Returned by `TopicMessageQuery.subscribe()`.

| Method | Description |
|--------|-------------|
| `unsubscribe()` | Stop receiving messages and clean up |

---

## ID Class

### TopicId
Represents a topic identifier (`shard.realm.num`).

| Method | Description |
|--------|-------------|
| `TopicId.fromString("0.0.123")` | Parse from string |
| `TopicId.fromBytes(bytes)` | Decode from protobuf |
| `TopicId.fromEvmAddress(shard, realm, address)` | From EVM address |
| `toString()` | "0.0.123" format |
| `toStringWithChecksum(client)` | With checksum |
| `toEvmAddress()` | To EVM address |
| `validateChecksum(client)` | Validate checksum |
| `compare(other)` | Compare two TopicIds |
| `clone()` | Create a copy |

Properties: `shard`, `realm`, `num`, `checksum`
