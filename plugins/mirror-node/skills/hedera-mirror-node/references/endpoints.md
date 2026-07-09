# Mirror Node REST API — endpoint reference

Base path for every endpoint: `{BASE_URL}/api/v1`. All calls are `GET`, return JSON, and need no key, signature, or fee. Responses for list endpoints share the envelope `{ <collection>: [...], links: { next: string | null } }`.

Interactive spec: `{BASE_URL}/api/v1/docs` (OpenAPI). This file summarizes the endpoints the skill uses most.

## Comparison operators

Most numeric/timestamp/id query params accept an `op:value` prefix. Default (no prefix) is `eq`.

| Operator | Meaning |
|---|---|
| `eq` | equal (default) |
| `ne` | not equal |
| `lt` / `lte` | less than / or equal |
| `gt` / `gte` | greater than / or equal |

Repeat a param to bound a range: `?timestamp=gte:1700000000.0&timestamp=lt:1700086400.0`.

Shared list params: `limit` (1–100, default 25), `order` (`asc`|`desc`).

---

## Accounts

### `GET /accounts/{idOrAliasOrEvmAddress}`
Single account. Key fields:
- `account` — `0.0.x` ID
- `balance.balance` — HBAR balance in **tinybars**; `balance.tokens[]` — `{ token_id, balance }`
- `evm_address`, `key`, `memo`, `auto_renew_period`, `max_automatic_token_associations`
- `created_timestamp`, `expiry_timestamp`, `deleted`

### `GET /accounts`
List/search accounts. Params: `account.id`, `account.publickey`, `balance` (bool, include balances), `limit`, `order`.

### `GET /accounts/{id}/tokens`
Token relationships held by the account. Each: `{ token_id, balance, decimals, freeze_status, kyc_status, automatic_association }`. Params: `token.id`, `limit`, `order`.

### `GET /accounts/{id}/nfts`
NFTs owned. Each: `{ token_id, serial_number, metadata (base64), spender, delegating_spender, modified_timestamp }`. Params: `token.id`, `serialnumber`, `limit`, `order`.

### `GET /accounts/{id}/allowances/crypto` · `/tokens` · `/nfts`
Approved allowances the account has granted.

---

## Balances

### `GET /balances`
Network balance snapshot (periodic; slightly behind `/accounts/{id}`). Each: `{ account, balance, tokens: [{ token_id, balance }] }`. Params: `account.id`, `account.balance`, `account.publickey`, `timestamp`, `limit`, `order`.

> For the freshest single-account balance use `/accounts/{id}` → `.balance.balance`, not `/balances`.

---

## Tokens & NFTs

### `GET /tokens/{id}`
Token entity: `token_id`, `name`, `symbol`, `decimals`, `total_supply`, `max_supply`, `supply_type` (`FINITE`|`INFINITE`), `type` (`FUNGIBLE_COMMON`|`NON_FUNGIBLE_UNIQUE`), `treasury_account_id`, `admin_key`/`supply_key`/`kyc_key`/`freeze_key`/`wipe_key`/`pause_key`, `custom_fees`, `pause_status`, `created_timestamp`.

### `GET /tokens`
Discover tokens. Params: `token.id`, `account.id` (tokens a treasury/account relates to), `name`, `type`, `limit`, `order`.

### `GET /tokens/{id}/nfts`
NFTs minted in a collection. Each: `{ account_id (current owner), token_id, serial_number, metadata, created_timestamp, modified_timestamp, deleted }`. Params: `account.id`, `serialnumber`, `limit`, `order`.

### `GET /tokens/{id}/nfts/{serial}`
One NFT serial (current owner, metadata, delegating spender).

### `GET /tokens/{id}/nfts/{serial}/transactions`
Ownership/transfer history for a single NFT serial.

### `GET /tokens/{id}/balances`
Per-account balances for one token.

---

## Transactions

### `GET /transactions`
Params: `account.id`, `timestamp`, `transactiontype` (e.g. `CRYPTOTRANSFER`, `TOKENMINT`, `CONSENSUSSUBMITMESSAGE`), `result` (`success`|`fail`), `credit` (`credit`|`debit`), `limit`, `order`.
Each transaction: `transaction_id`, `consensus_timestamp`, `name` (type), `result` (e.g. `SUCCESS`, `INSUFFICIENT_ACCOUNT_BALANCE`), `charged_tx_fee`, `transfers[]` (HBAR), `token_transfers[]`, `nft_transfers[]`, `memo_base64`.

### `GET /transactions/{transactionId}`
All records sharing a transaction ID (a scheduled or triggered txn can yield several).
**ID format in the path uses dashes:** `0.0.1234-1700000000-000000000` (convert from the SDK form `0.0.1234@1700000000.000000000`).

---

## HCS topics

### `GET /topics/{id}`
Topic entity: `topic_id`, `memo`, `admin_key`, `submit_key`, `auto_renew_period`, `deleted`.

### `GET /topics/{id}/messages`
Params: `sequencenumber`, `timestamp`, `encoding`, `limit`, `order`.
Each message: `{ consensus_timestamp, topic_id, sequence_number, message (base64), running_hash, running_hash_version, payer_account_id, chunk_info }`.
> `message` is **base64** — decode: `Buffer.from(m.message, "base64").toString("utf8")`.

### `GET /topics/{id}/messages/{sequenceNumber}`
A single message by sequence number.

---

## Smart contracts

### `GET /contracts/{idOrEvmAddress}`
Contract entity: `contract_id`, `evm_address`, `admin_key`, `bytecode`, `runtime_bytecode`, `created_timestamp`, `expiration_timestamp`, `nonce`.

### `GET /contracts/{id}/results`
Executed calls. Each: `{ hash, from, to, function_parameters, gas_used, result, error_message, call_result, block_number, timestamp }`. Params: `from`, `timestamp`, `block.number`, `internal`, `limit`, `order`.

### `GET /contracts/{id}/results/{timestampOrHash}`
One execution result with call trace and access list.

### `GET /contracts/{id}/state`
Contract storage slots at a timestamp.

### `GET /contracts/results/logs`
Event logs across contracts. Params: `topic0..topic3`, `timestamp`, `index`, `limit`, `order`.

---

## Network

| Endpoint | Returns |
|---|---|
| `GET /network/nodes` | Consensus node list, stake, service endpoints |
| `GET /network/supply` | Released/total HBAR supply |
| `GET /network/exchangerate` | Current + next HBAR↔USD cent rate |
| `GET /network/fees` | Current network fee schedule (gas price) |
| `GET /network/stake` | Staking totals, reward rate |

---

## Schedules

### `GET /schedules/{scheduleId}`
Scheduled transaction: `schedule_id`, `creator_account_id`, `payer_account_id`, `transaction_body`, `signatures[]`, `executed_timestamp`, `deleted`, `wait_for_expiry`.

### `GET /schedules`
Params: `account.id`, `schedule.id`, `limit`, `order`.

---

## Notes

- **Consistency:** mirror data lags consensus by a few seconds; poll with backoff after a write.
- **Pagination:** follow `links.next` (a ready-to-use relative path incl. cursor) until `null`.
- **Rate limits:** public hosts throttle; honor `429` + `Retry-After`, prefer `limit=100`, cache where possible.
- **Amounts:** integers in the smallest unit — HBAR in tinybars (÷1e8), fungible tokens ÷ `10 ** decimals`.
