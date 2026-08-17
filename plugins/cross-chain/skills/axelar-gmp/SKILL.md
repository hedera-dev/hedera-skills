---
name: axelar-gmp
description: >
  Axelar General Message Passing (GMP) on Hedera. Use when sending or receiving cross-chain
  contract calls via Axelar Gateway (callContract, payNativeGasForContractCall), building
  AxelarExecutable receivers, wiring Hedera↔EVM destinations, or separating bridge transport
  from destination handlers (orchestrated / scheduled flows).
---

# Axelar GMP (Hedera)

**GMP pattern:** encode a payload on the source chain, pay Axelar gas in native token, call the Gateway, then decode and act on the destination behind an allowlisted source.

```text
Source app → BridgeSender (pay gas + gateway.callContract)
                 → Axelar relayers
                      → AxelarExecutable._execute → Handler
```

On Hedera, orchestration often pairs GMP with **HSS** (`0x16b`) so a contract can self-reschedule and dispatch each cycle. Keep bridge transport behind a thin sender interface so the orchestrator stays bridge-agnostic.

## Quick Reference

| Piece | Role |
| ----- | ---- |
| `IAxelarGateway` | `callContract(destChain, destAddress, payload)` |
| `IAxelarGasService` | `payNativeGasForContractCall{value}` before the gateway call |
| `AxelarExecutable` | Destination base; override `_execute(...)` |
| Chain names | Axelar string IDs — e.g. `"hedera"`, `"ethereum-sepolia"` (not numeric chain IDs) |
| Addresses | EVM string form of the peer contract (checksummed `0x…`) |

See [references/hedera-axelar.md](references/hedera-axelar.md) for chain-name conventions and SDK imports. See [references/examples.md](references/examples.md) for sender / receiver sketches.

## Critical: Gas Then Gateway

Always pay gas **before** `callContract`. Use `msg.value > 0` for relay fees; refund address should be the funded orchestrator (or plan owner), not a random EOA.

```solidity
gasService.payNativeGasForContractCall{ value: msg.value }(
    address(this),       // sender contract
    destinationChain,    // Axelar name string
    destinationAddress,  // receiver 0x… as string
    payload,
    refundAddress        // usually authorizedCaller / orchestrator
);
gateway.callContract(destinationChain, destinationAddress, payload);
```

## Critical: Authorize And Allowlist

| Side | Guard |
| ---- | ----- |
| Source sender | Only `authorizedCaller` (orchestrator) may `send` |
| Destination receiver | Validate `srcChain` + `srcAddress` (case-insensitive) before handling |
| Destination handler | Only the receiver may call business logic (`authorizedCaller`) |

Compare Axelar chain/address strings with a shared lowercase hash — Axelar may vary casing.

```solidity
require(
    keccak256(bytes(_toLower(srcChain))) == keccak256(bytes(_toLower(expectedSourceChain))),
    "invalid source chain"
);
require(
    keccak256(bytes(_toLower(srcAddress))) == keccak256(bytes(_toLower(expectedSourceAddress))),
    "invalid source address"
);
```

## Architecture: Split Transport From Business Logic

```text
Source chain                    Destination chain
─────────────────────────────   ─────────────────────────────
Orchestrator ──send──►          MessageReceiver (_execute)
     │ BridgeSender iface              │ Handler iface
BridgeSender                    Handler (swap / settle / …)
```

1. Deploy **handler** first (no bridge knowledge).
2. Deploy **receiver** with gateway + expected source + handler.
3. Deploy **sender** with gateway + gas service + destination chain/address.
4. Deploy **orchestrator** with sender address; authorize orchestrator on sender.
5. **Wire** after both deploys: set destination on sender; set expected source on receiver.
6. Fund orchestrator (native for Axelar gas) and handler (tokens/capital for destination work).

## Payload Contract

Agree a single ABI encode/decode on both sides. Keep payloads versionable if you evolve fields — mismatched decode bricks the route.

```solidity
bytes memory payload = abi.encode(/* agreed fields… */);
// receiver:
(/* fields… */) = abi.decode(payload, (/* matching types… */));
```

## Hedera Orchestration Hook (HSS)

When the source app schedules itself via HSS (`0x16b`), each cycle should:

1. Enforce interval / plan active
2. Call the bridge sender with native value for Axelar gas
3. Reschedule next expiry with `hasScheduleCapacity` + `scheduleCall` (SUCCESS = `22`)

If scheduling fails, mark a recovery flag and expose a manual reschedule for the plan owner.

## Checklist

- [ ] Gas paid with native value before `callContract`
- [ ] Destination chain name matches Axelar’s ID (string, not numeric chain ID)
- [ ] Peer addresses set after both contracts deploy (wire step)
- [ ] Source allowlist + authorized callers on both ends
- [ ] Payload encode/decode identical
- [ ] Orchestrator funded for relay gas; destination handler funded for work
- [ ] Demo vs production: clarify who owns destination proceeds

## References

- [references/examples.md](references/examples.md) — sender / receiver / allowlist sketches
- [references/hedera-axelar.md](references/hedera-axelar.md) — chain names vs IDs, SDK imports
- [Axelar GMP overview](https://docs.axelar.dev/dev/general-message-passing/overview)
- [axelar-gmp-sdk-solidity](https://github.com/axelarnetwork/axelar-gmp-sdk-solidity)
