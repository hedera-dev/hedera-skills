# Response Codes Reference

## Success

| Code | Name    | Description         |
| ---- | ------- | ------------------- |
| 22   | SUCCESS | Operation succeeded |

## Common Errors

| Code | Name                                | Cause                          | Solution                         |
| ---- | ----------------------------------- | ------------------------------ | -------------------------------- |
| 10   | INSUFFICIENT_TX_FEE                 | Missing HBAR value on creation | Add `{value: msg.value}` to call |
| 167  | INVALID_TOKEN_ID                    | Token doesn't exist            | Verify token address             |
| 169  | INVALID_TREASURY_ACCOUNT_FOR_TOKEN  | Invalid treasury               | Treasury must be valid account   |
| 212  | TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT | Already associated             | Handle as success case           |
| 295  | INSUFFICIENT_TOKEN_BALANCE          | Not enough tokens              | Check balance before transfer    |
| 299  | ACCOUNT_KYC_NOT_GRANTED_FOR_TOKEN   | KYC not granted                | Grant KYC first                  |

## Handling Patterns

Standard check:

```solidity
require(responseCode == HederaResponseCodes.SUCCESS, "Operation failed");
```

Association (allow already-associated):

```solidity
require(
    rc == HederaResponseCodes.SUCCESS ||
    rc == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT,
    "Association failed"
);
```

Using SafeHTS (auto-reverts):

```solidity
import {SafeHTS} from "@hashgraph/smart-contracts/.../SafeHTS.sol";

// Automatically reverts on non-SUCCESS
(int64 newSupply, int64[] memory serials) = safeMintToken(tokenAddress, 1, metadata);
```
