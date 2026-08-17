# Hedera LayerZero V2 Conventions

Concrete Endpoint / ULN / DVN / executor addresses and EID tables are **project-specific**. Prefer the consuming repo’s `HelperConfig` / `AGENTS.md` (or equivalent). Re-check [LayerZero deployments metadata](https://metadata.layerzero-api.com/v1/metadata/deployments) before mainnet.

## Chain IDs vs EIDs

| Network (example) | EVM chain ID | LayerZero EID (example) |
| ----------------- | ------------ | ----------------------- |
| Hedera testnet | `296` | project `HelperConfig` |
| Ethereum Sepolia | `11155111` | project `HelperConfig` |

Use **EIDs** in `setPeer`, `SendParam.dstEid`, and library config — not EVM chain IDs.

## What To Look Up Per Chain

| Role | Used for |
| ---- | -------- |
| Endpoint V2 | OApp / OFT constructor + message lib manager |
| Send ULN302 | `setSendLibrary` |
| Receive ULN302 | `setReceiveLibrary` |
| Executor | ExecutorConfig (config type `1`) on send lib |
| DVN | UlnConfig (config type `2`) on send + receive libs |

Educational templates may wire **simple worker mocks** instead of LayerZero Labs DVN/executor while still storing Labs addresses as fallbacks.

## Hedera-specific knobs (typical)

| Item | Note |
| ---- | ---- |
| HTS precompile | `0x167` |
| HTS create deploy value | Native value on connector deploy (project env, e.g. tens of HBAR via JSON-RPC rescale) |
| Deploy / transfer gas | Often elevated on Hedera (multi-million gas limit) |
| Enforced `lzReceive` gas | Set via `setEnforcedOptions` / `SendParam.extraOptions` |
| Fee scaling | Hedera `msg.value` may need tinybar↔wei rescale vs forge quote |

## Packages

```text
@layerzerolabs/lz-evm-protocol-v2
@layerzerolabs/lz-evm-oapp-v2
@layerzerolabs/lz-evm-messagelib-v2
```

## Ops

- Track messages on [LayerZero Scan](https://layerzeroscan.com) / [testnet](https://testnet.layerzeroscan.com)
- Production delivery uses LayerZero’s verification network; mock workers + manual `lzReceive` are educational only
