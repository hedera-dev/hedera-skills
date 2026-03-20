# Hedera Schedule Service – API Reference

System contract address: **`0x16b`**

Source: [hedera-smart-contracts/hedera-schedule-service](https://github.com/hashgraph/hedera-smart-contracts/tree/main/contracts/system-contracts/hedera-schedule-service)

SUCCESS response code: **22** (`HederaResponseCodes.SUCCESS`)

**Usage:** Inherit `HederaScheduleService` (abstract contract) to get `internal` helper functions. `IHederaScheduleService` is an empty base interface — the actual function definitions are in `IHRC755`, `IHRC756`, and `IHRC1215`.

```solidity
import {HederaScheduleService} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-schedule-service/HederaScheduleService.sol";

contract MyContract is HederaScheduleService {
    // Call scheduleCall(...), authorizeSchedule(...), etc. directly as internal functions
}
```

---

## HIP-755: Schedule Service System Contract

### authorizeSchedule

Signs the schedule with the calling contract's key (ContractKey `0.0.<ContractId>`).

| Selector   | HIP   | Release |
| ---------- | ----- | ------- |
| `0xf0637961` | 755   | 0.57    |

```solidity
function authorizeSchedule(address schedule) external returns (int64 responseCode);
```

### signSchedule

Adds protobuf-encoded signatures to a schedule. Message signed = concatenation of shard, realm, and schedule transaction ID.

| Selector   | HIP   | Release |
| ---------- | ----- | ------- |
| `0x358eeb03` | 755   | 0.59    |

```solidity
function signSchedule(address schedule, bytes memory signatureMap) external returns (int64 responseCode);
```

**Facade (EOA):** Call `signSchedule()` on the schedule's address (selector `0x06d15889`) to sign without a deployed contract.

---

## HIP-756: Contract Scheduled Token Create

### scheduleNative

Creates a scheduled transaction for a system contract call. Supports HTS (`0x167`) with: `createFungibleToken`, `createNonFungibleToken`, `createFungibleTokenWithCustomFees`, `createNonFungibleTokenWithCustomFees`, `updateToken`.

| Selector   | HIP   | Release |
| ---------- | ----- | ------- |
| `0xca829811` | 756   | 0.59    |

```solidity
function scheduleNative(
    address systemContractAddress,
    bytes memory callData,
    address payer
) external returns (int64 responseCode, address scheduleAddress);
```

### getScheduledCreateFungibleTokenInfo

Returns token info for a scheduled fungible token create.

| Selector   | HIP   | Release |
| ---------- | ----- | ------- |
| `0xda2d5f8f` | 756   | 0.59    |

```solidity
function getScheduledCreateFungibleTokenInfo(address scheduleAddress)
    external
    returns (int64 responseCode, IHederaTokenService.FungibleTokenInfo memory fungibleTokenInfo);
```

### getScheduledCreateNonFungibleTokenInfo

Returns token info for a scheduled non-fungible token create.

| Selector   | HIP   | Release |
| ---------- | ----- | ------- |
| `0xd68c902c` | 756   | 0.59    |

```solidity
function getScheduledCreateNonFungibleTokenInfo(address scheduleAddress)
    external
    returns (int64 responseCode, IHederaTokenService.NonFungibleTokenInfo memory nonFungibleTokenInfo);
```

---

## HIP-1215: Generalized Scheduled Contract Calls

These functions **do not revert**. On failure they return `(responseCode, address(0))`. Check both `responseCode == HederaResponseCodes.SUCCESS` (22) and `scheduleAddress != address(0)`.

### scheduleCall

Schedules a contract call with the **calling contract** as payer. Executes when consensus time ≥ `expirySecond` (and all required signatures collected, if any). `expirySecond` is both the earliest execution time and the expiration — if not executed before it, the schedule expires. Passing `address(0)` as `to` returns `INVALID_CONTRACT_ID`.

| Selector   | HIP    | Release |
| ---------- | ------ | ------- |
| `0x6f5bfde8` | 1215   | 0.68    |

```solidity
function scheduleCall(
    address to,
    uint256 expirySecond,
    uint256 gasLimit,
    uint64 value,
    bytes memory callData
) external returns (int64 responseCode, address scheduleAddress);
```

### scheduleCallWithPayer

Schedules a contract call with a specified payer. Requires payer signatures. **Waits until consensus time ≥ `expirySecond`** before executing, even if all signatures are gathered earlier. `expirySecond` is the earliest execution time and the expiration — if not executed before it, the schedule expires.

| Selector   | HIP    | Release |
| ---------- | ------ | ------- |
| `0xe6599c18` | 1215   | 0.68    |

```solidity
function scheduleCallWithPayer(
    address to,
    address payer,
    uint256 expirySecond,
    uint256 gasLimit,
    uint64 value,
    bytes memory callData
) external returns (int64 responseCode, address scheduleAddress);
```

### executeCallOnPayerSignature

Schedules a contract call with a specified payer. **Executes as soon as the payer signs** (unless consensus time is already past `expirySecond`). Does not wait for `expirySecond`. `expirySecond` is the expiration — if consensus time passes it without execution, the schedule expires.

| Selector   | HIP    | Release |
| ---------- | ------ | ------- |
| `0x105772b2` | 1215   | 0.68    |

```solidity
function executeCallOnPayerSignature(
    address to,
    address payer,
    uint256 expirySecond,
    uint256 gasLimit,
    uint64 value,
    bytes memory callData
) external returns (int64 responseCode, address scheduleAddress);
```

### deleteSchedule (address)

Deletes a scheduled transaction. Call on HSS address `0x16b`.

| Selector   | HIP    | Release |
| ---------- | ------ | ------- |
| `0x72d42394` | 1215   | 0.68    |

```solidity
function deleteSchedule(address scheduleAddress) external returns (int64 responseCode);
```

### deleteSchedule (redirect)

Deletes a scheduled transaction by calling this parameter-less function **on the schedule's address**. Use `IHRC1215ScheduleFacade.sol`.

| Selector   | HIP    | Release |
| ---------- | ------ | ------- |
| `0xc61dea85` | 1215   | 0.68    |

```solidity
function deleteSchedule() external returns (int64 responseCode);
```

### hasScheduleCapacity

View function. Returns `true` iff the given second has capacity to schedule a call with the specified gas limit. Returns `false` for invalid expiry (e.g. not after current consensus time, or too far in future). Use for retry pattern before scheduling.

| Selector   | HIP    | Release |
| ---------- | ------ | ------- |
| `0xdfb4a999` | 1215   | 0.68    |

```solidity
function hasScheduleCapacity(uint256 expirySecond, uint256 gasLimit) external view returns (bool hasCapacity);
```

---

## Types & Structs

- **FungibleTokenInfo** / **NonFungibleTokenInfo**: From `IHederaTokenService`. Used by `getScheduledCreateFungibleTokenInfo` and `getScheduledCreateNonFungibleTokenInfo`.
- **ResponseCodeEnum**: Standard HAPI response codes. `22` = SUCCESS. `SCHEDULE_EXPIRY_IS_BUSY` when throttled. `INVALID_CONTRACT_ID` when `to` is `address(0)` in scheduleCall variants.

---

## HIP References

- [HIP-755](https://hips.hedera.com/hip/hip-755): Schedule Service System Contract
- [HIP-756](https://hips.hedera.com/hip/hip-756): Contract Scheduled Token Create
- [HIP-1215](https://hips.hedera.com/hip/hip-1215): Generalized Scheduled Contract Calls
