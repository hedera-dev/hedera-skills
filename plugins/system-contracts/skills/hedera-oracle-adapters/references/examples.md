# Oracle Adapter Examples

Condensed patterns extracted from the Scaffold-HBAR `templates/oracles` Foundry package. Prefer the template’s full contracts for production copy-paste.

## Shared libs

```solidity
library PairLib {
    function pairKey(string memory baseSymbol, string memory quoteSymbol)
        internal
        pure
        returns (bytes32)
    {
        require(bytes(baseSymbol).length != 0 && bytes(quoteSymbol).length != 0);
        return keccak256(abi.encode(baseSymbol, quoteSymbol));
    }
}

library ProviderLib {
    bytes32 internal constant CHAINLINK = keccak256("CHAINLINK");
    bytes32 internal constant SUPRA = keccak256("SUPRA");
    bytes32 internal constant PYTH = keccak256("PYTH");
}

library AssetConversionLib {
    uint256 internal constant PRICE_SCALE = 1e18;

    function baseToQuote(
        uint256 baseAmount,
        uint8 baseDecimals,
        uint8 quoteDecimals,
        uint256 priceE18
    ) internal pure returns (uint256) {
        require(priceE18 != 0);
        uint256 quoteUnits = Math.mulDiv(baseAmount, 10 ** quoteDecimals, 10 ** baseDecimals);
        return Math.mulDiv(quoteUnits, priceE18, PRICE_SCALE);
    }

    function quoteToBase(
        uint256 quoteAmount,
        uint8 baseDecimals,
        uint8 quoteDecimals,
        uint256 priceE18
    ) internal pure returns (uint256) {
        require(priceE18 != 0);
        uint256 baseUnits = Math.mulDiv(quoteAmount, 10 ** baseDecimals, 10 ** quoteDecimals);
        return Math.mulDiv(baseUnits, PRICE_SCALE, priceE18);
    }
}
```

## Decimal normalization helper

```solidity
uint8 constant NORMALIZED_DECIMALS = 18;

function normalizeToE18(uint256 amount, uint8 decimals) pure returns (uint256) {
    if (decimals == NORMALIZED_DECIMALS) return amount;
    if (decimals < NORMALIZED_DECIMALS) {
        return amount * (10 ** (NORMALIZED_DECIMALS - decimals));
    }
    return amount / (10 ** (decimals - NORMALIZED_DECIMALS));
}
```

## Chainlink adapter skeleton

```solidity
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract ChainlinkPriceOracleAdapter is IPriceOracle {
    mapping(bytes32 => AggregatorV3Interface) private feeds;
    bytes32 public immutable PROVIDER_KEY;
    uint256 public immutable MAX_STALENESS;

    struct FeedConfig {
        bytes32 pairKey;
        address feed;
    }

    constructor(FeedConfig[] memory configs, uint256 maxStaleness_) {
        require(configs.length != 0);
        PROVIDER_KEY = ProviderLib.CHAINLINK;
        MAX_STALENESS = maxStaleness_;
        for (uint256 i; i < configs.length; ++i) {
            require(configs[i].pairKey != bytes32(0) && configs[i].feed != address(0));
            require(address(feeds[configs[i].pairKey]) == address(0));
            feeds[configs[i].pairKey] = AggregatorV3Interface(configs[i].feed);
        }
    }

    function latestPrice(bytes32 pairKey) external view returns (PriceData memory) {
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
            priceE18: normalizeToE18(uint256(answer), feed.decimals()),
            updatedAt: updatedAt
        });
    }
}
```

## Supra adapter skeleton

```solidity
interface ISupraSValueFeed {
    struct PriceFeed {
        uint256 round;
        uint256 decimals;
        uint256 time;
        uint256 price;
    }

    function getSvalue(uint256 pairIndex) external view returns (PriceFeed memory);
}

contract SupraPriceOracleAdapter is IPriceOracle {
    ISupraSValueFeed public immutable SUPRA_ORACLE;
    mapping(bytes32 => uint256) private supraPairIds;
    mapping(bytes32 => bool) private configured;

    struct PairConfig {
        bytes32 pairKey;
        uint256 supraPairId;
    }

    constructor(address supraOracle_, PairConfig[] memory configs, uint256 maxStaleness_) {
        require(supraOracle_ != address(0) && configs.length != 0);
        SUPRA_ORACLE = ISupraSValueFeed(supraOracle_);
        // set PROVIDER_KEY = ProviderLib.SUPRA, MAX_STALENESS, configure pairs…
    }

    function latestPrice(bytes32 pairKey) external view returns (PriceData memory) {
        if (!configured[pairKey]) revert OracleUnsupportedPair(pairKey);

        ISupraSValueFeed.PriceFeed memory pf = SUPRA_ORACLE.getSvalue(supraPairIds[pairKey]);
        if (pf.time == 0) revert OracleIncompleteRound();
        if (pf.price == 0) revert OracleInvalidPrice();

        uint256 updatedAt = pf.time > 10_000_000_000 ? pf.time / 1_000 : pf.time;
        if (block.timestamp - updatedAt > MAX_STALENESS) {
            revert OracleStalePrice(updatedAt, MAX_STALENESS);
        }

        return PriceData({
            pairKey: pairKey,
            providerKey: PROVIDER_KEY,
            priceE18: normalizeToE18(pf.price, uint8(pf.decimals)),
            updatedAt: updatedAt
        });
    }
}
```

## Pyth adapter skeleton

```solidity
import { IPyth } from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import { PythStructs } from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract PythPriceOracleAdapter is IPriceOracle {
    IPyth public immutable PYTH;
    mapping(bytes32 => bytes32) private priceIds;

    struct PriceConfig {
        bytes32 pairKey;
        bytes32 priceId;
    }

    function updatePrice(bytes[] calldata updateData) external payable {
        uint256 fee = PYTH.getUpdateFee(updateData);
        if (msg.value < fee) revert PythUpdateFeeTooLow(msg.value, fee);
        PYTH.updatePriceFeeds{ value: msg.value }(updateData);
    }

    function latestPrice(bytes32 pairKey) external view returns (PriceData memory) {
        bytes32 priceId = priceIds[pairKey];
        if (priceId == bytes32(0)) revert OracleUnsupportedPair(pairKey);

        PythStructs.Price memory price = PYTH.getPriceNoOlderThan(priceId, MAX_STALENESS);
        if (price.publishTime == 0) revert OracleIncompleteRound();
        if (price.price <= 0) revert OracleInvalidPrice();
        if (price.conf > uint64(price.price)) revert PythInvalidConfidence();

        return PriceData({
            pairKey: pairKey,
            providerKey: PROVIDER_KEY,
            priceE18: normalizePythToE18(price.price, price.expo),
            updatedAt: price.publishTime
        });
    }
}
```

Pyth exponent normalization (signed `expo`):

```solidity
function normalizePythToE18(int64 price, int32 expo) pure returns (uint256) {
    uint256 positive = uint64(price);
    if (expo >= 0) {
        return positive * (10 ** (18 + uint32(expo)));
    }
    uint256 mag = uint256(-int256(expo));
    if (mag <= 18) return positive * (10 ** (18 - mag));
    return positive / (10 ** (mag - 18));
}
```

## OracleConsumer skeleton

```solidity
contract OracleConsumer is Ownable {
    IPriceOracle public oracle;

    constructor(address oracle_, address initialOwner) Ownable(initialOwner) {
        _setOracle(oracle_);
    }

    function setOracle(address newOracle) external onlyOwner {
        _setOracle(newOracle);
    }

    function baseToQuote(
        bytes32 pairKey,
        uint256 baseAmount,
        uint8 baseDecimals,
        uint8 quoteDecimals
    ) external view returns (uint256) {
        IPriceOracle.PriceData memory data = oracle.latestPrice(pairKey);
        return AssetConversionLib.baseToQuote(baseAmount, baseDecimals, quoteDecimals, data.priceE18);
    }

    function quoteToBase(
        bytes32 pairKey,
        uint256 quoteAmount,
        uint8 baseDecimals,
        uint8 quoteDecimals
    ) external view returns (uint256) {
        IPriceOracle.PriceData memory data = oracle.latestPrice(pairKey);
        return AssetConversionLib.quoteToBase(quoteAmount, baseDecimals, quoteDecimals, data.priceE18);
    }

    function _setOracle(address newOracle) private {
        require(newOracle != address(0));
        oracle = IPriceOracle(newOracle);
    }
}
```

## Deploy script shape

```solidity
FeedConfig[] memory configs = new FeedConfig[](3);
configs[0] = FeedConfig({ pairKey: PairLib.pairKey("HBAR", "USD"), feed: hbarUsdFeed });
configs[1] = FeedConfig({ pairKey: PairLib.pairKey("BTC", "USD"), feed: btcUsdFeed });
configs[2] = FeedConfig({ pairKey: PairLib.pairKey("ETH", "USD"), feed: ethUsdFeed });

ChainlinkPriceOracleAdapter adapter =
    new ChainlinkPriceOracleAdapter(configs, /* maxStaleness */ 1 hours);
```
