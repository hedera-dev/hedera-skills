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

Published package checked 2026-09-15: [`saucer-swap-plugin@0.3.1`](https://www.npmjs.com/package/saucer-swap-plugin/v/0.3.1), targeting `@hashgraph/hedera-agent-kit` v4.

- Read tools: `list_saucerswap_tokens_tool`, `find_saucerswap_token_tool`, `list_saucerswap_pools_tool`, and `get_swap_quote_v2_tool` (`tokenIn`, `tokenOut`, `amountIn` in display units).
- Discovery and quotes require `SAUCERSWAP_API_KEY`. They do not need a signing key.
- `swap_v2_tool` exists, but this release builds swaps with `amountOutMinimum: 0` and offers no slippage/minimum-output input. Do not use it for execution under this skill. Wallet signing and `RETURN_BYTES` do not change that transaction constraint.
- For execution, use the documented direct SwapRouter flow with a fresh quote, the user's approved slippage tolerance, and a nonzero `amountOutMinimum`.
- Network selection follows the Hedera client's ledger id (mainnet/testnet); router, factory, quoter, and WHBAR addresses are pre-configured in the plugin.
- This published release does not include V3 orderbook tools. The separate V3 skill uses the Orderbook API directly.
