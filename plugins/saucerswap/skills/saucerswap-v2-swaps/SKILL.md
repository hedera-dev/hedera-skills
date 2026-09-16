---
name: saucerswap-v2-swaps
description: "Quote and execute token swaps on SaucerSwap V2, the concentrated-liquidity AMM on Hedera. Use this skill whenever the user wants to swap tokens on Hedera, get a swap quote (exact input or exact output), integrate the SaucerSwap QuoterV2 or SwapRouter contracts, or wire SaucerSwap swaps into an AI agent via the Hedera Agent Kit saucer-swap-plugin. Triggers include SaucerSwap swap, Hedera DEX swap, quoteExactInput, HBAR to SAUCE swap, WHBAR routing, or AMM trading on Hedera."
---

# SaucerSwap V2 AMM Swaps

SaucerSwap V2 is a Uniswap-V3-style concentrated-liquidity AMM on Hedera. Integrations use two on-chain surfaces: **QuoterV2** for gas-free quotes via `eth_call`, and **SwapRouter** for execution. For AI-agent integrations, the official Hedera Agent Kit plugin wraps both.

## Contracts

| Contract              | Mainnet        | Testnet        |
| --------------------- | -------------- | -------------- |
| SaucerSwapV2QuoterV2  | `0.0.3949424`  | `0.0.1390002`  |
| SaucerSwapV2SwapRouter| `0.0.3949434`  | `0.0.1414040`  |
| WHBAR token id        | `0.0.1456986`  | `0.0.15058`    |

Full list: `https://docs.saucerswap.finance/developerx/contract-deployments.md`

When a route involves HBAR, use the **WHBAR token id** in the path — the router wraps/unwraps at the edges.

## Quotes (QuoterV2, read-only)

Quote functions run as `eth_call` — no gas, no state change:

- `quoteExactInput(bytes path, uint256 amountIn)` → `amountOut` (+ `sqrtPriceX96AfterList`, `initializedTicksCrossedList`, `gasEstimate`)
- `quoteExactOutput(bytes path, uint256 amountOut)` → `amountIn` — **the path must be reversed** (first token in the encoded path is the output token)

**Path encoding:** `[token(20 bytes), fee(3 bytes), token(20 bytes), ...]` — token EVM addresses interleaved with pool fee tiers. Fee examples: `0x0001F4` = 0.05%, `0x000BB8` = 0.30%. All amounts are in the token's smallest unit.

Two transports for the `eth_call`:

1. **Hedera Mirror Node** — `POST {mirrorNodeBaseUrl}/api/v1/contracts/call` with `{ block: 'latest', data: <encoded calldata>, to: <quoter EVM address> }`
2. **Hedera JSON-RPC Relay** — a standard `ethers` provider `call` (with `batchMaxCount: 1` as an ethers v6 workaround)

> **Production note:** use a paid mirror node / RPC provider for production traffic. Hedera's public mirror node is globally rate-limited and only suited to development or low-rate usage.

Worked TypeScript examples for both transports: `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/swap-quote.md`

## Execution

### Option A — Hedera Agent Kit plugin for discovery and quotes

The published [`saucer-swap-plugin@0.3.1`](https://www.npmjs.com/package/saucer-swap-plugin/v/0.3.1) provides these read tools:

- **`list_saucerswap_tokens_tool`** — list tradable tokens, with optional search and limit
- **`find_saucerswap_token_tool`** — resolve a symbol, name, token id, or EVM address; ask the user when ambiguous
- **`list_saucerswap_pools_tool`** — list pools, optionally filtered by token
- **`get_swap_quote_v2_tool`** — `tokenIn`, `tokenOut`, `amountIn` in display units → indicative output and rate

The package also exposes `swap_v2_tool`, but version 0.3.1 sets `amountOutMinimum` to `0` and has no slippage or minimum-output parameter. **Do not use that tool to execute swaps under this skill.** A prior quote, wallet approval, or `RETURN_BYTES` mode does not add an on-chain minimum-output constraint. Use the direct router flow below with the user's approved slippage limit.

The package targets `@hashgraph/hedera-agent-kit` v4. Keep plugin setup and network selection aligned with that installed version. Discovery and quotes use `SAUCERSWAP_API_KEY`; do not request a private key for these read operations. This npm release has no V3 orderbook tools; use the separate `saucerswap-v3-orderbook` skill for that API.

### Option B — Direct SwapRouter calls

Call SwapRouter `0.0.3949434` directly (`exactInput`/`exactOutput` and HBAR variants). Follow the step-by-step docs, which cover token association, approvals, deadline, and `amountOutMinimum` slippage protection:

- `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/swap-hbar-for-tokens.md`
- `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/swap-tokens-for-hbar.md`
- `https://docs.saucerswap.finance/v/developer/saucerswap-v2/swap-operations/swap-tokens-for-tokens.md`

Always derive `amountOutMinimum` from a fresh QuoterV2 quote minus the user's slippage tolerance. Never submit a swap with `amountOutMinimum: 0`.

## Safety Conventions

- **Read-only by default.** Quote freely; execute a swap only when the user explicitly asks for execution.
- **Never ask the user to paste a private key into chat or into a config file the agent reads.** Keys belong in environment variables or a secret store loaded by the user's own process; prefer `RETURN_BYTES` so keys never leave the user's wallet.
- **Testnet first.** Validate the full quote-and-swap flow against testnet contracts before pointing at mainnet.
- Recheck quotes immediately before execution; AMM prices move.

## Additional References

- `references/contracts.md` — contract ids, path/fee encoding, quote transports, doc links
