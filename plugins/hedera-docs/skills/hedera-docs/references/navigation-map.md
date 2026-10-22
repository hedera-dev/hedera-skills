# Routing map

The indexes list pages; this lists decisions — which namespace owns an intent, and where to go when a topic lives in several at once.

Read this when step 1 of the protocol in [`SKILL.md`](../SKILL.md) does not resolve to one namespace on sight.

## Intent to namespace

| The request wants | Go to | Index |
| --- | --- | --- |
| To understand a concept before coding | `learn/core-concepts/` | `llms.txt` |
| A first working script in JS, Java, or Go | `native/quickstart/<lang>.md` | `native-sdks.txt` |
| A first deployed contract | `evm/quickstart/` | `evm-developers.txt` |
| An SDK transaction or query signature | `native/<service>/` | `native-sdks.txt` |
| To call a Hedera service from Solidity | `evm/hedera-services/` | `evm-developers.txt` |
| Why Hedera's EVM differs from Ethereum | `evm/differences/` | `evm-developers.txt` |
| To read historical or indexed on-chain data | `reference/rest-api/` then `api-reference/` | `reference.txt` |
| An exact protobuf message or field | `reference/protobuf/` | `reference.txt` |
| The meaning of a failure code | `reference/network-responses.md` | `reference.txt` |
| A step-by-step walkthrough | `native/tutorials/` or `evm/tutorials/` | matching index |
| An endpoint, node address, or chain ID per network | `networks/` | `llms.txt` |
| A Hedera-built product or framework | `solutions/` | `llms.txt` |
| To host infrastructure | `operators/` | `llms.txt` |
| A term defined, or a docs convention | `support/glossary.md`, `support/contributing/style-guide/` | `llms.txt` |

## Topics that span namespaces

Picking the wrong namespace here yields a page that is correct and useless. Choose by what the request intends to *do*, not by the noun it names.

### Tokens

| Intent | Page or section |
| --- | --- |
| What HTS is, the tokenization models | `learn/core-concepts/tokens/` |
| Create, mint, transfer, freeze, KYC, wipe, airdrop via SDK | `native/tokens/` |
| Custom fees — fixed, fractional, royalty | `native/tokens/custom-fees.md` |
| ERC-20, ERC-721, ERC-1363, ERC-3643, WHBAR | `evm/tokens/` |
| Create or manage HTS tokens from a contract | `evm/hedera-services/hts-solidity/`, `evm/hedera-services/system-contracts/hts.md` |
| One token usable as both HTS and ERC | `evm/hedera-services/hybrid/` |
| Query token or NFT history and holders | `reference/rest-api/tokens/`, `api-reference/tokens/` |
| A managed stablecoin, RWA, or NFT product | `solutions/tokenization/` |

### Accounts and keys

| Intent | Page or section |
| --- | --- |
| The account entity model, properties, auto-creation | `learn/core-concepts/accounts/` |
| ECDSA vs Ed25519, when to use which | `learn/core-concepts/keys.md` |
| Create, update, delete, transfer, allowances via SDK | `native/accounts/` |
| Generate, import, threshold keys, mnemonics | `native/keys/` |
| The account model as an EVM developer meets it | `evm/development/accounts.md` |
| Signature verification and key differences under the EVM | `evm/differences/accounts-and-keys.md` |
| Using an Ed25519 account from a contract | `evm/differences/native-devs/ed25519-integration.md` |
| Account state, allowances, NFTs, rewards by query | `reference/rest-api/accounts/`, `api-reference/accounts/` |

### Smart contracts

| Intent | Page or section |
| --- | --- |
| How the Hedera EVM relates to Ethereum's | `learn/core-concepts/services/smart-contracts.md`, `evm/overview/` |
| Deploy, call, and query contracts **via an SDK** | `native/smart-contracts/` |
| Hedera service libraries callable from Solidity | `native/smart-contracts/solidity-libraries.md` |
| Compile, deploy, verify, gas, rent, security | `evm/development/` |
| Hardhat, Foundry, Remix, Truffle, The Graph | `evm/tools/` |
| Contract results, logs, state, opcode traces | `reference/rest-api/contracts/`, `api-reference/contracts/` |
| Verify a deployed contract over the API | `reference/verification-api.md`, `api-reference/verify-contracts/` |

### Consensus service and topics

| Intent | Page or section |
| --- | --- |
| Create, update, delete topics; submit messages via SDK | `native/consensus/` |
| Subscribe to a topic stream | `reference/hcs-api.md` (gRPC), `native/tutorials/consensus/query-mirror-node.md` |
| Read message history by sequence or timestamp | `reference/rest-api/topics/`, `api-reference/topics/` |
| Per-message topic fees | `native/consensus/create-topic.md` |

### Scheduled transactions

| Intent | Page or section |
| --- | --- |
| What scheduling is, signature collection, expiry | `learn/core-concepts/transactions/scheduled.md` |
| Create, sign, delete, inspect a schedule via SDK | `native/scheduled/` |
| Schedule a contract call from Solidity (HSS) | `evm/hedera-services/system-contracts/schedule-service.md` |
| Schedule state by query | `reference/rest-api/schedules/`, `api-reference/schedules/` |

### Fees

| Intent | Page or section |
| --- | --- |
| The base-fee-plus-extras model (HIP-1261) | `learn/core-concepts/fee-model.md` |
| Estimate a transaction's cost from the SDK | `native/fees/fee-estimation.md` |
| Gas, rent, and EVM cost behavior | `evm/development/gas-fees.md`, `evm/development/rent.md` |
| Live fee schedule and exchange rate | `api-reference/network/get-the-network-fees.md`, `api-reference/network/get-the-network-exchange-rate-to-estimate-costs.md` |
| High-volume throttles and variable-rate pricing | `learn/core-concepts/high-volume-entity-creation.md` |

### Mirror nodes

| Intent | Page or section |
| --- | --- |
| What a mirror node is and why it exists | `learn/core-concepts/mirror-nodes.md` |
| Public endpoints, TLS, rate limits | `operators/mirror-node/index.md` |
| Query one | `reference/rest-api/`, `api-reference/` |
| Run your own | `operators/mirror-node/run-your-own/` |

### JSON-RPC relay

| Intent | Page or section |
| --- | --- |
| Use it from a dApp or tool | `evm/development/json-rpc/` |
| Where it diverges from a stock Ethereum node | `evm/differences/json-rpc-differences.md` |
| Public endpoint configuration (Hashio, Validation Cloud) | `evm/tutorials/intermediate/json-rpc-connections/` |
| Host your own | `operators/json-rpc/` |

### Local development

| Intent | Page or section |
| --- | --- |
| Run a local network with Solo | `native/local-dev/`, `native/fundamentals/local-network.md` |
| localnet properties and endpoints | `networks/` |
| Fork testnet or mainnet for tests | `evm/development/forking.md`, `evm/tools/hardhat/forking-basic.md`, `evm/tools/foundry/forking.md` |

### Errors and failure codes

Two tiers; the per-service tier is usually the one you want:

- **Master table** — `reference/network-responses.md`, every network response code.
- **Per service** — `native/<service>/errors.md`, for accounts, tokens, consensus, files, and smart contracts. Scoped to that service's transactions, so the relevant code is faster to find. Scheduled uses `response-messages.md`.

## The `reference/` and `api-reference/` split

Both are listed in `_llms/reference.txt` and they interleave, which reads as redundancy and is not:

- **`reference/rest-api/<resource>/`** — hand-written guides. Start here: what the resource is, how it is modeled, which endpoints exist.
- **`api-reference/<resource>/<operation>.md`** — generated per-endpoint pages: path, parameters, schemas, responses. Go here for the exact query string or response shape.

Read the guide, then the endpoint page. Where a generated page is thinner than you need, `https://docs.hedera.com/openapi.yaml` is the spec behind it. The other two specs are `https://docs.hedera.com/hedera-status-api.yaml` and `https://docs.hedera.com/smart-contract-verification-api.yaml`.

## URL shortcuts

Service sections under `native/` follow a consistent verb pattern — `create`, `update`, `delete`, `get-info`, `errors` — so a page URL is often predictable once you know the service. Confirm against the index before relying on a constructed URL; the exceptions are real (`native/tokens/define.md`, not `create.md`).

For section-level orientation, read the index headings rather than a summary of them: each `_llms/` file groups its pages under the same headings the site navigation uses.

## Sibling skills in this marketplace

Some areas have a dedicated skill with worked code. Prefer it for implementation, and use the docs to verify its claims against the current pages:

| Docs area | Skill |
| --- | --- |
| `native/tokens/`, `native/consensus/` | `native-services-js` |
| `evm/hedera-services/system-contracts/` | `system-contracts` |
| `solutions/ai/agent-kit/` | `agent-kit-plugin` |
| `solutions/tools/hiero-cli/` | `hiero-cli` |

## Full-corpus fallbacks

Where no index entry matches and search has failed:

- `https://docs.hedera.com/sitemap.xml` — all 605 URLs, no descriptions. Confirms a page exists before you fetch it.
- `https://docs.hedera.com/llms-full.txt` — the whole corpus, 4.6 MB. Last resort, and never worth fetching whole.
