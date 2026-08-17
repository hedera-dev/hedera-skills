# LayerZero OFT Examples

Generic OApp/OFT + Hedera HTS connector patterns. Prefer a concrete project template for full deploy/wire copy-paste.

## EVM OFT skeleton

```solidity
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

contract MyOFT is OFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _owner,
        uint256 _preMint
    ) OFT(_name, _symbol, _lzEndpoint, _owner) Ownable(_owner) {
        if (_preMint > 0) {
            _mint(_owner, _preMint);
        }
    }
}
```

`OAppCore` does not initialize OZ Ownable — call `Ownable(_owner)` in the concrete constructor.

## Hedera HTS connector sketch

```solidity
abstract contract HTSConnector is OFTCore, KeyHelper, HederaTokenService {
    address public htsTokenAddress;
    uint8 internal constant HTS_DECIMALS = 18;

    constructor(string memory _name, string memory _symbol, address _lzEndpoint, address _delegate)
        payable
        OFTCore(HTS_DECIMALS, _lzEndpoint, _delegate)
    {
        // createFungibleToken via 0x167 with supply key = this contract
        // store htsTokenAddress
    }

    function approvalRequired() external pure returns (bool) {
        return true;
    }

    function _debit(address _from, uint256 _amountLD, uint256 _minAmountLD, uint32 _dstEid)
        internal
        override
        returns (uint256 amountSentLD, uint256 amountReceivedLD)
    {
        (amountSentLD, amountReceivedLD) = _debitView(_amountLD, _minAmountLD, _dstEid);
        // transferToken(_from → this) then burnToken
    }

    function _credit(address _to, uint256 _amountLD, uint32 /*_srcEid*/)
        internal
        override
        returns (uint256)
    {
        // mintToken then transferToken(this → _to)
        return _amountLD;
    }
}
```

Amounts must fit `int64`. Receiver must associate the HTS token before inbound credits.

## Wire one side

```solidity
bytes32 remotePeer = bytes32(uint256(uint160(remoteOApp)));
IOAppCore(localOApp).setPeer(remoteEid, remotePeer);

IMessageLibManager ep = IMessageLibManager(endpointV2);
ep.setSendLibrary(localOApp, remoteEid, sendUln302);
ep.setReceiveLibrary(localOApp, remoteEid, receiveUln302, 0);

// setConfig: ExecutorConfig (type 1) on send ULN
// setConfig: UlnConfig (type 2) on send + receive ULN (DVN set)

EnforcedOptionParam[] memory enforced = new EnforcedOptionParam[](1);
enforced[0] = EnforcedOptionParam({
    eid: remoteEid,
    msgType: 1,
    options: OptionsBuilder.newOptions().addExecutorLzReceiveOption(lzReceiveGas, 0)
});
IOAppOptionsType3(localOApp).setEnforcedOptions(enforced);
```

Run wiring on **both** chains (local/remote swapped). Verify `peers(remoteEid)` both ways.

## Send (quote + send)

```solidity
using OptionsBuilder for bytes;

SendParam memory sendParam = SendParam({
    dstEid: remoteEid,
    to: bytes32(uint256(uint160(receiver))),
    amountLD: amountLD,
    minAmountLD: (amountLD * 9) / 10,
    extraOptions: OptionsBuilder.newOptions().addExecutorLzReceiveOption(lzReceiveGas, 0),
    composeMsg: "",
    oftCmd: ""
});

MessagingFee memory fee = IOFT(localOFT).quoteSend(sendParam, false);
IOFT(localOFT).send{ value: fee.nativeFee }(sendParam, fee, payable(msg.sender));
```

Hedera → EVM: approve the **HTS token** for the connector, then `send` with quoted native fee (apply wei/tinybar scaling if required by the RPC).

## Deploy order (generic)

```text
1. Deploy OFT on EVM
2. Deploy HTS connector OFT on Hedera (with HTS create value)
3. Deploy workers (Labs or educational mocks) on both chains
4. Wire EVM OApp ↔ Hedera OApp
5. Verify peers(remoteEid) both ways
6. Associate Hedera account with htsTokenAddress
7. Send (+ educational lzReceive relay if using mocks)
8. Sync frontend bridge config if applicable
```
