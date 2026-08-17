# Axelar GMP Examples

Generic sender / receiver sketches for Hedera↔EVM GMP. Prefer a concrete project template for full orchestrator/handler copy-paste.

## Bridge sender abstraction

Keep the orchestrator bridge-agnostic:

```solidity
interface IBridgeSender {
    function send(/* app-specific args… */) external payable;
}
```

## Gas-then-gateway send sketch

```solidity
require(msg.sender == authorizedCaller, "not authorized");
require(msg.value > 0, "zero value");

bytes memory payload = abi.encode(/* agreed fields… */);

gasService.payNativeGasForContractCall{ value: msg.value }(
    address(this),
    destinationChain,
    destinationAddress,
    payload,
    address(authorizedCaller) // refund
);
gateway.callContract(destinationChain, destinationAddress, payload);
```

Owner-settable after deploy: `setAuthorizedCaller`, `setDestinationAddress` (and destination chain if needed).

## AxelarExecutable receive sketch

```solidity
function _execute(
    bytes32 /* commandId */,
    string calldata srcChain,
    string calldata srcAddress,
    bytes calldata payload
) internal override {
    require(
        keccak256(bytes(_toLower(srcChain))) ==
            keccak256(bytes(_toLower(expectedSourceChain))),
        "invalid source chain"
    );
    require(
        keccak256(bytes(_toLower(srcAddress))) ==
            keccak256(bytes(_toLower(expectedSourceAddress))),
        "invalid source address"
    );

    (/* fields… */) = abi.decode(payload, (/* matching types… */));
    handler.handle(/* fields… */);
}
```

Handler should require `msg.sender == authorizedCaller` (the receiver).

## HSS self-reschedule sketch (source)

```solidity
address constant HSS = address(0x16b);
int64 constant RESPONSE_SUCCESS = 22;

// after dispatching bridge send:
if (!IHederaScheduleService(HSS).hasScheduleCapacity(expiry, gasLimit)) {
    needsReschedule[planId] = true;
    return;
}
(int64 code, ) = IHederaScheduleService(HSS).scheduleCall(
    address(this),
    expiry,
    gasLimit,
    0,
    abi.encodeWithSelector(this.executeCycle.selector, planId)
);
if (code != RESPONSE_SUCCESS) needsReschedule[planId] = true;
```

Expose a manual `reschedule` for owners when capacity/scheduling fails.

## Deploy And Wire Order (generic)

```text
1. Deploy handler (destination)
2. Deploy receiver(gateway, expectedSourceChain, sourcePlaceholder, handler)
3. handler.setAuthorizedCaller(receiver)

4. Deploy sender(gateway, gasService, destinationChain, destPlaceholder)  # source
5. Deploy orchestrator(sender)
6. sender.setAuthorizedCaller(orchestrator)

7. sender.setDestinationAddress(receiver)     # wire source → destination
8. receiver.setExpectedSourceAddress(sender)  # wire destination ← source

9. Fund orchestrator (relay gas)
10. Fund handler (destination capital)
```
