# Hedera Oracle Feed Addresses

Values from Scaffold-HBAR `templates/oracles` `HelperConfig.s.sol`. Always re-check provider docs before mainnet use — addresses can change.

**Sources:**

- [Chainlink Hedera feeds](https://docs.chain.link/data-feeds/price-feeds/addresses?network=hedera)
- [Supra push oracle networks](https://docs.supra.com/oracles/data-feeds/push-oracle/networks)
- [Supra data feeds index](https://docs.supra.com/oracles/data-feeds/data-feeds-index)
- [Pyth EVM contract addresses](https://docs.pyth.network/price-feeds/core/contract-addresses/evm)
- [Pyth Hermes price feeds](https://hermes.pyth.network/v2/price_feeds)

## Chain IDs

| Network | Chain ID |
| ------- | -------- |
| Hedera mainnet | `295` |
| Hedera testnet | `296` |

## Chainlink Data Feeds

| Pair | Mainnet (`295`) | Testnet (`296`) |
| ---- | --------------- | --------------- |
| HBAR/USD | `0xAF685FB45C12b92b5054ccb9313e135525F9b5d5` | `0x59bC155EB6c6C415fE43255aF66EcF0523c92B4a` |
| BTC/USD | `0xaD01E27668658Cc8c1Ce6Ed31503D75F31eEf480` | `0x058fE79CB5775d4b167920Ca6036B824805A9ABd` |
| ETH/USD | `0xd2D2CB0AEb29472C3008E291355757AD6225019e` | `0xb9d461e0b962aF219866aDfA7DD19C52bB9871b9` |

## Supra Push Oracle

| | Mainnet (`295`) | Testnet (`296`) |
| - | --------------- | --------------- |
| Push oracle | `0xD02cc7a670047b6b012556A88e275c685d25e0c9` | `0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917` |

### Supra pair IDs (USDT quotes on Hedera)

| Pair | Pair ID |
| ---- | ------- |
| BTC/USDT | `0` |
| ETH/USDT | `1` |
| HBAR/USDT | `75` |

Supra on Hedera currently exposes **USDT** pairs, not USD. Use `PairLib.pairKey("HBAR", "USDT")` (etc.) to match.

## Pyth

| | Mainnet (`295`) | Testnet (`296`) |
| - | --------------- | --------------- |
| Pyth contract | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` |

### Pyth price IDs

| Pair | Price ID |
| ---- | -------- |
| HBAR/USD | `0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd` |
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |

Fetch update payloads from Hermes before calling `PythPriceOracleAdapter.updatePrice`.
