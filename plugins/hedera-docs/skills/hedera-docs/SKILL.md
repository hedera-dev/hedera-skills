---
name: hedera-docs
description: "Navigate the official Hedera documentation at docs.hedera.com and read the right page before answering or generating code. Use whenever a task touches Hedera: SDK code in JavaScript, Java, Go, or Python; Solidity, EVM, or JSON-RPC work; mirror node REST or protobuf lookups; HBAR, HTS tokens, HCS topics, accounts, keys, staking, or fees; Agent Kit, Hiero CLI, or x402. Also use to verify a Hedera claim against current docs instead of training data, or to resolve a docs.hedera.com link."
---

# Navigating the Hedera docs

**Your Hedera training data is stale.** The docs were restructured, the JavaScript SDK package was renamed, and SDK methods you recall are deprecated. Read the page; do not answer from memory.

Reading is cheap here. `docs.hedera.com` publishes 605 pages, appending `.md` to any page URL returns clean markdown, and four index files list every page with a one-line description — so you pick the right page before fetching one.

## The protocol

### 1. Route to a namespace

Nine namespaces own the corpus. Pick one before fetching anything. When the topic is ambiguous or spans namespaces (tokens, accounts, and smart contracts each live in three or more), read [`references/navigation-map.md`](references/navigation-map.md) for the intent-to-namespace routing and disambiguation rules.

| Namespace | Pages | Owns | Index |
| --- | --- | --- | --- |
| `learn/` | 38 | Concepts, getting started, fee model, staking, hashgraph | `llms.txt` |
| `networks/` | 12 | mainnet, testnet, previewnet, localnet, release notes | `llms.txt` |
| `native/` | 133 | **Hiero SDK docs** — accounts, tokens, consensus, file, scheduled, keys, transactions, queries, tutorials | `_llms/native-sdks.txt` |
| `evm/` | 90 | **Solidity and EVM path** — quickstarts, EVM differences, ERC standards, system contracts, Hardhat, Foundry, oracles, bridges | `_llms/evm-developers.txt` |
| `reference/` | 161 | Mirror node REST guides, protobuf (146 pages), HCS gRPC, response codes | `_llms/reference.txt` |
| `api-reference/` | 65 | Generated per-endpoint pages: mirror node REST, status API, contract verification | `_llms/reference.txt` |
| `solutions/` | 70 | Agent Kit, x402, Hiero CLI, Scaffold HBAR, Hedera Harness, tokenization studios, HashioDAO, Guardian | `llms.txt` |
| `operators/` | 14 | Running a mirror node, JSON-RPC relay, consensus nodes | `llms.txt` |
| `support/` | 22 | FAQs, glossary, docs style guide, contributing | `llms.txt` |

`llms.txt` is only the top-level index: it covers `learn/`, `networks/`, `solutions/`, `operators/`, and `support/`. The 449 pages under `native/`, `evm/`, `reference/`, and `api-reference/` — most of what code questions need — live only in the three `_llms/` indexes. Reading `llms.txt` alone and concluding a page does not exist is the most common failure here.

Fetch the one index your namespace maps to:

```
https://docs.hedera.com/llms.txt                    40 KB
https://docs.hedera.com/_llms/native-sdks.txt       33 KB
https://docs.hedera.com/_llms/evm-developers.txt    24 KB
https://docs.hedera.com/_llms/reference.txt         33 KB
```

`https://docs.hedera.com/llms-full.txt` is the whole corpus in one 4.6 MB file. Leave it alone: an index plus two pages costs under 2% of it.

Where the `SearchHedera` tool is available (the official Hedera docs MCP server, `https://docs.hedera.com/mcp`), query it first and treat the hits as your routing answer. The indexes stay the fallback, and the way to read a section whole.

**Done when** you hold an index entry whose description matches the task — not a namespace guess.

### 2. Fetch the page as markdown

Take the URL from the index verbatim; index URLs already carry `.md`.

Construct a URL only when no index entry covers it, then verify what comes back: section landing pages exist for some directories and not others. `/native/fundamentals/index.md` is a real page; `/native/tokens/index.md` is not.

**Soft 404s:** a missing page returns **HTTP 200** with `# Page Not Found` as its first heading. Status codes tell you nothing here — read the first heading of every fetch. That body carries a `## Related topics` list; recover through it rather than guessing another URL.

Two properties to use:

- Every page opens with an **Agent Instructions** header carrying the terminology and SDK rules. It is the source of truth for the traps below.
- Body links are root-relative and already end in `.md` (`/native/smart-contracts/solidity-libraries.md`). Follow them directly.

**Done when** the page answers the task, or its links or related topics led you to one that does.

### 3. Answer from the page, and cite it

Quote signatures, parameter names, package names, and response codes from the page you fetched. Where page and recall disagree, the page wins. Link the URL you actually read.

**Done when** every Hedera-specific fact in the answer traces to a page you fetched this session.

## The native-vs-EVM path

The docs ask developers to **choose a path**. Routing to the wrong one is the most expensive mistake available here: both paths create tokens, and the resulting code shares nothing.

- **native** — transactions built and signed with a Hiero SDK (JavaScript, Java, Go, Python), submitted to consensus nodes. `TokenCreateTransaction`, `TopicMessageSubmitTransaction`, IDs shaped `0.0.1234`.
- **EVM** — Solidity contracts deployed over the JSON-RPC relay with Hardhat, Foundry, or Remix. `ethers`, `viem`, ABIs, `0x` addresses, system contracts at fixed addresses.

Read the signals in the request, strongest first:

| Signal | Path |
| --- | --- |
| Hiero or Hedera SDK, `@hiero-ledger/sdk`, `*Transaction` class names | native |
| Solidity, Hardhat, Foundry, Remix, ABI, `ethers`, `viem`, MetaMask, gas, JSON-RPC | EVM |
| A `0x…` address, or an Ethereum-shaped workflow | EVM |
| A `0.0.…` ID with no contract in sight | native |
| ERC-20 or ERC-721 by name | EVM |
| HTS, HCS, or HSS by name, with no Solidity | native |

Two cases that look ambiguous and are not:

- **"HTS from Solidity"** is EVM: `evm/hedera-services/system-contracts/` and `evm/hedera-services/hts-solidity/`. A contract calling the HTS system contract at `0x167` is EVM work even though HTS is a native service.
- **An SDK call that deploys or invokes a contract** is native: `native/smart-contracts/`.

With no signal either way, ask which path. The two answers are not substitutes.

## Traps that silently produce wrong output

Where recall and the current docs diverge.

**Packages**

- JavaScript and TypeScript import from **`@hiero-ledger/sdk`**. `@hashgraph/sdk` is the former name; new releases ship under Hiero. Verify the specifier on the page.
- Java keeps the Maven coordinates **`com.hedera.hashgraph:sdk`**. The rename did not reach it.

**Deprecated SDK surface**

- Balances come from **`MirrorNodeAccountBalanceQuery`**, which replaces `AccountBalanceQuery` and also accepts EVM addresses and aliases. Check `native/accounts/get-balance.md` first.
- Treat any `*Query` you recall against a consensus node as suspect; prefer the mirror node where the docs do.

**Terminology, which the docs enforce**

- Hedera is a **public, proof-of-stake distributed ledger using hashgraph consensus**. Call it a distributed ledger or a network, not a blockchain.
- **HBAR** uppercase and singular — "10 HBAR". **tinybars** lowercase and plural.
- Network names lowercase, including after "Hedera": **Hedera mainnet**, **Hedera testnet**, **Hedera previewnet**.
- The current term is **EVM Address from Public Key**. "EVM alias" and "Account Number Alias" are retired.

**Account and token behavior**

- For EVM-facing accounts, create with an **ECDSA** key and set the EVM Address from Public Key **at creation**. The address is immutable; key rotation does not update it.
- HBAR carries **8 decimals** natively and is presented with 18 inside the EVM. See `evm/differences/hbar-decimals.md` before writing a conversion.
- Token key types (KYC, wipe, freeze, pause, metadata, …) are **fixed at creation**: a type left unset can never be added, a type set can never be removed. Say so whenever you generate a `TokenCreateTransaction`.

**Links**

- Legacy `/hedera/...` URLs redirect, so an old link resolves but tells you nothing about where the page lives now. Resolve it, then cite the final URL.
- Legacy `/guides/...` URLs are gone. Route from an index instead.

## When the docs do not answer it

| Source | Authority on |
| --- | --- |
| `hips.hedera.com` | Protocol behavior and rationale; the docs cite HIPs by number (HIP-1261 fee model, HIP-32 and HIP-542 auto account creation) |
| `docs.hedera.com/openapi.yaml` | Mirror node REST schemas, where a generated `api-reference/` page is thinner than the spec |
| SDK source on GitHub | A signature no page documents |
| `status.hedera.com` | Live network state, incidents, maintenance |

Say plainly that the docs do not cover it rather than filling the gap from recall.
