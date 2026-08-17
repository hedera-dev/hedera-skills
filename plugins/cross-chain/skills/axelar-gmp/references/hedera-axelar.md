# Hedera ↔ Axelar Conventions

Concrete gateway/gas addresses and env var values are **project-specific**. Prefer the consuming repo’s `.env` / `AGENTS.md` (or equivalent). Re-check [Axelar network configs](https://docs.axelar.dev/resources/contract-addresses/testnet) before mainnet.

## Chain IDs vs Axelar names

| Network (example) | EVM chain ID | Axelar GMP name (typical) |
| ----------------- | ------------ | ------------------------- |
| Hedera testnet | `296` | `hedera` |
| Ethereum Sepolia | `11155111` | `ethereum-sepolia` |

Pass **Axelar names** to `callContract` / allowlists — not numeric chain IDs.

## Wiring peers

Destination / source **contract** addresses are set at deploy/wire time:

- Source sender → `setDestinationAddress(destinationReceiver)` (string `0x…`)
- Destination receiver → `setExpectedSourceAddress(sourceSender)` (+ matching source chain name)

Gas is paid on the **source** chain via `payNativeGasForContractCall` (destination often has no gas-service env).

## SDK dependency

```text
@axelar-network/axelar-gmp-sdk-solidity
```

Common imports:

- `contracts/interfaces/IAxelarGateway.sol`
- `contracts/interfaces/IAxelarGasService.sol`
- `contracts/executable/AxelarExecutable.sol`

## Operational notes

- Fund the **orchestrator** with native gas token so each `send{value: …}` can pay Axelar relay fees.
- Fund the **destination handler** with whatever capital it spends (tokens, etc.).
- Track delivery on [Axelarscan](https://axelarscan.io/) / testnet explorers when debugging stuck GMP messages.
- Demo apps may keep destination proceeds in the handler contract — document ownership before production.
