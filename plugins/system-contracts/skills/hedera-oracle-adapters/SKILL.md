---
name: hedera-oracle-adapters
description: >
  Hedera price oracle adapters. Use when integrating Chainlink, Supra, or Pyth price feeds on
  Hedera (testnet 296 / mainnet 295), implementing IPriceOracle, normalizing prices to 18 decimals,
  building OracleConsumer conversion flows, or switching provider adapters via setOracle.
---

# Hedera Oracle Adapters

**Adapter pattern:** each provider feed is wrapped by a multi-pair adapter that implements one shared `IPriceOracle` interface. Consumers read `latestPrice(pairKey)` and convert amounts with `priceE18` — they never call Chainlink/Supra/Pyth APIs directly.

```text
Provider feed -> Multi-pair provider adapter -> Consumer
```

Switch providers by deploying another adapter and calling `OracleConsumer.setOracle(newAdapter)`.

## Quick Reference

| Concept | Rule |
| ------- | ---- |
| Interface | `IPriceOracle.latestPrice(bytes32 pairKey) → PriceData` |
| Price scale | Always **18 decimals** (`priceE18`) |
| Pair key | `keccak256(abi.encode(BASE, QUOTE))` via `PairLib` — uppercase symbols (`HBAR`, `USD`) |
| Provider key | `keccak256("CHAINLINK" \| "SUPRA" \| "PYTH")` via `ProviderLib` |
| Freshness | Each adapter enforces `MAX_STALENESS`; stale reads **revert** |
| Config | Constructor-only pair maps; no post-deploy pair edits |

**Hedera chain IDs:** testnet `296`, mainnet `295`.

See [references/hedera-feeds.md](references/hedera-feeds.md) for feed / pair / price IDs. See [references/examples.md](references/examples.md) for full adapter and consumer snippets.

## Critical: Normalize And Revert

Adapters must **never** return invalid prices. Revert with shared errors:

| Error | When |
| ----- | ---- |
| `OracleUnsupportedPair(pairKey)` | Pair not configured |
| `OracleIncompleteRound()` | Missing / unfinished upstream round |
| `OracleInvalidPrice()` | Zero or non-positive price |
| `OracleStalePrice(updatedAt, maxStaleness)` | Older than `MAX_STALENESS` |

```solidity
interface IPriceOracle {
    struct PriceData {
        bytes32 pairKey;
        bytes32 providerKey;
        uint256 priceE18;   // one whole BASE in QUOTE units, 18 decimals
        uint256 updatedAt;  // unix seconds
    }

    function latestPrice(bytes32 pairKey) external view returns (PriceData memory data);
}
```

## Pair And Provider Keys

```solidity
// PairLib — casing is significant; do not mix `HBAR` / `hbar`
bytes32 key = keccak256(abi.encode("HBAR", "USD"));

// ProviderLib constants
bytes32 constant CHAINLINK = keccak256("CHAINLINK");
bytes32 constant SUPRA     = keccak256("SUPRA");
bytes32 constant PYTH      = keccak256("PYTH");
```

## Provider Adapters

Deploy **one adapter contract per provider**. Each supports multiple pairs in one deployment.

### Chainlink (push / Data Feeds)

- Map: `pairKey → AggregatorV3Interface feed`
- Read: `latestRoundData()` — require `answeredInRound >= roundId`, `updatedAt != 0`, `answer > 0`
- Normalize feed decimals → 18

```solidity
contract ChainlinkPriceOracleAdapter is IPriceOracle {
    struct FeedConfig { bytes32 pairKey; address feed; }

    constructor(FeedConfig[] memory feedConfigs, uint256 maxStaleness_) { /* set feeds */ }

    function latestPrice(bytes32 pairKey) external view returns (PriceData memory data) {
        AggregatorV3Interface feed = feeds[pairKey];
        if (address(feed) == address(0)) revert OracleUnsupportedPair(pairKey);

        (uint80 roundId, int256 answer,, uint256 updatedAt, uint80 answeredInRound) =
            feed.latestRoundData();

        if (answeredInRound < roundId || updatedAt == 0) revert OracleIncompleteRound();
        if (answer <= 0) revert OracleInvalidPrice();
        if (block.timestamp - updatedAt > MAX_STALENESS) {
            revert OracleStalePrice(updatedAt, MAX_STALENESS);
        }

        return PriceData({
            pairKey: pairKey,
            providerKey: PROVIDER_KEY,
            priceE18: _normalizeToE18(uint256(answer), feed.decimals()),
            updatedAt: updatedAt
        });
    }
}
```

### Supra (push S-Value)

- Map: `pairKey → supraPairId` (+ immutable push-oracle address)
- Read: `ISupraSValueFeed.getSvalue(pairId)`
- **Hedera quirk:** Supra timestamps are often **milliseconds** — convert to seconds when `time > 1e10`
- **Hedera quirk:** current feeds are **USDT** pairs (not USD)

```solidity
ISupraSValueFeed.PriceFeed memory pf = SUPRA_ORACLE.getSvalue(supraPairIds[pairKey]);
uint256 updatedAt = pf.time > 10_000_000_000 ? pf.time / 1_000 : pf.time;
```

### Pyth (pull)

- Map: `pairKey → bytes32 priceId`
- **Pull model:** call payable `updatePrice(updateData)` with Hermes payloads **before** reads when stale
- Read: `PYTH.getPriceNoOlderThan(priceId, MAX_STALENESS)`
- Reject when `conf > uint64(price)` (confidence wider than price)
- Normalize signed price + `expo` → 18 decimals

```solidity
function updatePrice(bytes[] calldata updateData) external payable {
    uint256 fee = PYTH.getUpdateFee(updateData);
    if (msg.value < fee) revert PythUpdateFeeTooLow(msg.value, fee);
    PYTH.updatePriceFeeds{ value: msg.value }(updateData);
}
```

## Consumer Pattern

Keep business logic on a thin consumer that holds one `IPriceOracle` and converts with `AssetConversionLib`:

```solidity
contract OracleConsumer is Ownable {
    IPriceOracle public oracle;

    function setOracle(address newOracle) external onlyOwner { /* ... */ }

    function baseToQuote(
        bytes32 pairKey,
        uint256 baseAmount,
        uint8 baseDecimals,
        uint8 quoteDecimals
    ) external view returns (uint256 quoteAmount) {
        IPriceOracle.PriceData memory data = oracle.latestPrice(pairKey);
        return AssetConversionLib.baseToQuote(
            baseAmount, baseDecimals, quoteDecimals, data.priceE18
        );
    }
}
```

Conversion (rounds down via `Math.mulDiv`):

```text
quoteAmount = baseAmount * 10^quoteDecimals / 10^baseDecimals * priceE18 / 1e18
baseAmount  = quoteAmount * 10^baseDecimals / 10^quoteDecimals * 1e18 / priceE18
```

## Deployment Flow

1. Deploy provider adapter (`DeployChainlinkOracle` / `DeploySupraOracle` / `DeployPythOracle`)
2. Deploy `OracleConsumer` once with the chosen adapter
3. Switch later with `setOracle` (or `SetConsumerOracle` script) — no consumer redeploy

Store network-specific addresses and IDs in a `HelperConfig` (chainId → feeds / pair IDs / price IDs). Unsupported chain IDs should revert.

## Adding A Pair

1. Add feed / pair ID / price ID to `HelperConfig` for the target network
2. Include the pair in the adapter deploy script’s config array
3. Redeploy the adapter (constructor-only config) and point the consumer at it

## Checklist

When implementing or reviewing oracle code on Hedera:

- [ ] Consumer depends only on `IPriceOracle`, not provider SDKs
- [ ] All adapters return `priceE18` and share the same error vocabulary
- [ ] Pair/provider keys use canonical uppercase strings
- [ ] Stale, incomplete, and non-positive prices revert
- [ ] Supra timestamps normalized to unix seconds; USDT pairs where USD unavailable
- [ ] Pyth updates paid with `msg.value` before fresh reads
- [ ] Feeds/IDs taken from Hedera-specific docs (not Ethereum defaults)

## References

- [references/examples.md](references/examples.md) — condensed adapter / consumer implementations
- [references/hedera-feeds.md](references/hedera-feeds.md) — Hedera testnet/mainnet addresses and IDs
- [Chainlink Data Feeds](https://docs.chain.link/data-feeds)
- [Supra push oracle networks](https://docs.supra.com/oracles/data-feeds/push-oracle/networks)
- [Pyth Price Feeds](https://docs.pyth.network/price-feeds/price-feeds)
- Source template: [scaffold-hbar `templates/oracles`](https://github.com/hedera-dev/scaffold-hbar/tree/templates/oracles)
