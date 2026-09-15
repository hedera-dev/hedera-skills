# SaucerSwap V2 Swap Integration — Contract Reference

## Deployed contracts

Source of truth: `https://docs.saucerswap.finance/developerx/contract-deployments.md`

### Hedera Mainnet

| Contract                                   | Id             |
| ------------------------------------------ | -------------- |
| SaucerSwapV2Factory                        | `0.0.3946833`  |
| SaucerSwapV2QuoterV2                       | `0.0.3949424`  |
| SaucerSwapV2SwapRouter                     | `0.0.3949434`  |
| SaucerSwapV2NonfungiblePositionManagerV2   | `0.0.4053945`  |
| WHBAR contract                             | `0.0.1456985`  |
| WHBAR token id                             | `0.0.1456986`  |
| SAUCE token id                             | `0.0.731861`   |
| xSAUCE token id                            | `0.0.1460200`  |

### Hedera Testnet

| Contract                | Id             |
| ----------------------- | -------------- |
| SaucerSwapV2Factory     | `0.0.1197038`  |
| SaucerSwapV2QuoterV2    | `0.0.1390002`  |
| SaucerSwapV2SwapRouter  | `0.0.1414040`  |
| WHBAR contract          | `0.0.15057`    |
| WHBAR token id          | `0.0.15058`    |
| SAUCE token id          | `0.0.1183558`  |

Convert a Hedera contract id to its EVM address with `ContractId.fromString(id).toSolidityAddress()` (Hiero/Hashgraph SDK) before ABI-encoding calls.

## QuoterV2 interface (quote functions)

```solidity
function quoteExactInput(bytes memory path, uint256 amountIn)
  external
  returns (
    uint256 amountOut,
    uint160[] memory sqrtPriceX96AfterList,
    uint32[] memory initializedTicksCrossedList,
    uint256 gasEstimate
  );

function quoteExactOutput(bytes memory path, uint256 amountOut)
  external
  returns (
    uint256 amountIn,
    uint160[] memory sqrtPriceX96AfterList,
    uint32[] memory initializedTicksCrossedList,
    uint256 gasEstimate
  );
```

## Path encoding

`[token, fee, token, fee, token, ...]` — each token is a 20-byte EVM address, each fee a 3-byte (uint24) pool fee in hundredths of a bip:

| Fee hex    | Fee tier |
| ---------- | -------- |
| `0x0001F4` | 0.05%    |
| `0x000BB8` | 0.30%    |

- `quoteExactInput`: path in trade direction (input token first).
- `quoteExactOutput`: path **reversed** (output token first).
- Amounts are `uint256` in the token's smallest unit. Keep them as strings/BigInt in JS.
- For HBAR legs, use the WHBAR token address in the path.

## Quote transports

### Mirror node `contracts/call` (free, rate-limited)

```typescript
const url = `${mirrorNodeBaseUrl}/api/v1/contracts/call`
const body = {
  block: 'latest',
  data: encodedCalldata,          // abi.encodeFunctionData('quoteExactInput', [path, amountIn])
  to: quoterContract.toSolidityAddress(),
}
// POST with content-type: application/json, then decodeFunctionResult on response.data.result
```

Mirror node base URLs: `https://mainnet.mirrornode.hedera.com`, `https://testnet.mirrornode.hedera.com`. Use a paid mirror-node provider for production or high-traffic use; public endpoints have global rate limits.

### JSON-RPC relay (ethers)

```typescript
const provider = new ethers.JsonRpcProvider(hederaJsonRelayUrl, '', { batchMaxCount: 1 })
const result = await provider.call({ to: quoterEvmAddress, data: encodedCalldata })
```

## Official docs (Markdown twins — agent-fetchable)

- Swap quote: `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/swap-quote.md`
- Swap HBAR → tokens: `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/swap-hbar-for-tokens.md`
- Swap tokens → HBAR: `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/swap-tokens-for-hbar.md`
- Swap tokens → tokens: `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/swap-tokens-for-tokens.md`
- Track swap events: `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/track-swap-events.md`
- Full docs index: `https://docs.saucerswap.finance/llms.txt`

## Hedera Agent Kit plugin

npm: `saucer-swap-plugin` (v0.2.0) — "SaucerSwap plugin for Hedera Agent Kit".

- Tools: `get_swap_quote_v2_tool` (`tokenIn`, `tokenOut`, `amountIn`), `swap_v2_tool` (`tokenIn`, `tokenOut`, `amountIn`, optional `recipientAddress`)
- Env: `SAUCERSWAP_API_KEY`, `ACCOUNT_ID`, `PRIVATE_KEY` (ECDSA)
- Network selection is automatic from the Hedera client's ledger id (mainnet/testnet); router, factory, quoter, and WHBAR addresses are pre-configured in the plugin.
- Works with `HederaAIToolkit` and `HederaLangchainToolkit`; supports `RETURN_BYTES` (wallet signs — recommended) and `AUTONOMOUS` modes.
