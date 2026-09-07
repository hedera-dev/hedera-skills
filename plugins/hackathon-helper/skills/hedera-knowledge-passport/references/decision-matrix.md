# Hedera Services: Decision Matrix

Quick reference for "which service should I use?" — pair with `service-guide.md` for the full reasoning behind each row.

## I need to... issue a token / NFT

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **Hedera Token Service (HTS)** | Built-in compliance (freeze, wipe, KYC), custom fees, royalties, airdrops. Purpose-built for tokens. 50-100x cheaper than a contract. | Less flexible than a contract. Association model (users must opt in). | **Always — this is the correct default unless you need a feature HTS doesn't support.** |
| Smart Contract (ERC-20/721) | Maximum flexibility. Any custom logic. | 50-100x more expensive. No built-in compliance features. Gas overhead. | Only if HTS genuinely doesn't have the feature you need (rare). |

**Quick call:** Standard token/NFT? → HTS. Need ultra-custom logic? → Contract.

---

## I need to... log events / an audit trail / pub-sub

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **Hedera Consensus Service (HCS)** | Immutable on-chain proof. Ordered timestamps. Real-time subscribers via mirror node. Custom fees. | Per-message cost. Data is public, not private. Needs a mirror node for queries. | **When you need on-chain proof that something happened.** Audits, immutable logs, public events. |
| Regular database | Cheap. Private. Fast queries. | Centralized. Data can be modified or deleted. No on-chain proof. | When the event doesn't need to live on-chain. |
| Smart Contract events | On-chain. Indexed. | Limited to contract calls. Less flexible than HCS. | Events that occur inside a contract already. |

**Quick call:** Need immutable proof something happened? → HCS. Private or ephemeral data? → Database. Inside a contract? → Contract events.

---

## I need to... enforce a business rule on top of a token transfer

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **HTS custom fees (fixed/fractional/royalty)** | Native, cheap, enforced automatically on every transfer. No custom code. | Only covers fee-shaped rules: a fixed cut, a percentage, a royalty on resale. Can't express arbitrary conditions. | The rule is "take a fee" — e.g., a resale royalty, a fixed service charge. |
| **Smart Contract wrapping the transfer** | Can express any condition — price caps, allow/deny lists, time windows, multi-step approval. | Users must transact through the contract, not a plain wallet-to-wallet transfer. Adds gas cost and deployment overhead. | The rule is a *condition*, not just a fee — e.g., "resale price can't exceed face value," "only KYC'd wallets may buy," "must wait 24h after purchase." |
| Off-chain enforcement (backend checks before submitting) | Cheap, flexible. | Not trustless — a user who transfers directly on-chain, bypassing your backend, skips the rule entirely. | Only acceptable when you fully control the transfer path (e.g., a custodial app where users never hold keys). |

**Quick call:** Is the rule just "take a cut"? → HTS custom fee. Is it a *condition* on the transfer (price cap, allow-list, timing)? → Smart Contract, since plain HTS can't refuse a transfer based on arbitrary logic. Note HTS and a wrapping contract are usually combined, not exclusive — the contract enforces the condition, HTS still handles the actual token mechanics.

---

## I need to... run automatic logic / complex calculations

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **Smart Contracts (Solidity/EVM)** | Arbitrary logic. On-chain automation. HTS/HSS precompiles available. | Expensive. Deployment + audit overhead. Synchronous execution. | **When the logic must run trustlessly on-chain.** DeFi, automated swaps, business-critical logic. |
| Backend (off-chain) | Cheap. Flexible. Sync or async. | Centralized. Less secure. | Logic that doesn't need to live on-chain. |

**Quick call:** Must the logic be trustless/on-chain? → Contract. Can it be off-chain? → Backend.

---

## I need to... execute a transaction later / require multiple signatures

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **Hedera Schedule Service (HSS)** | Deferred execution. Multi-sig. Scheduled token creation. Signed by multiple parties. | Complexity (keys, expiration). Capacity limits. | **When multiple parties must sign before execution.** Conditional payments, N-of-M signature operations. |
| Execute now | Simple. Synchronous. | No multi-sig. No deferral. | Most cases. |

**Quick call:** Multiple signatures required, or future execution? → HSS. Single signer, now? → Normal transaction.

---

## I need to... transfer HBAR / money

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **Direct HBAR Transfer** | Simple. Fast. Standard. | No advanced features. | **Always** — the correct way to move HBAR. |
| Smart Contract | Unnecessary. Gas overhead. | — | Never for a simple transfer. |
| Allowances | Pre-approved spending limit. Secure. | Owner can revoke. | When A wants B able to spend up to X HBAR on their behalf. |

**Quick call:** Simple HBAR transfer? → Direct transfer. Allowance model? → Allowances.

---

## I need to... store a file on-chain

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **Hedera File Service (HFS)** | On-chain. Timestamped. Expiration support. | Costly. Limited size (not for large files). | **Rare:** contracts that need critical immutable data (bytecode, critical config). |
| IPFS / off-chain storage | Cheap. Scalable. | Not on-chain. | **Almost always** — use this instead of HFS. |

**Quick call:** Small critical data that must be on-chain? → HFS. Normal file? → IPFS/off-chain.

---

## I need to... query / explore historical data

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **Mirror Nodes** | Historical queries. Real-time HCS subscriptions. Indexed. | External dependency. Rate limits. | **Always for queries.** Never query the ledger directly for reads. |
| Direct on-chain queries | — | Inefficient. Costs gas. | Avoid. Mirror node is the standard path. |

**Quick call:** Need historical data? → Mirror node.

---

## Approximate Cost Matrix

| Service | Base cost | Scaling cost | Notes |
|---------|-----------|---------------|-------|
| HTS token creation | 1 HBAR | 1 HBAR | Fungible or NFT |
| HTS minting (NFT) | 0.001 HBAR | Per NFT | Very cheap |
| HTS transfer | 0.0001 HBAR | Linear | Stablecoin transfers cost cents |
| HCS message | 0.0001 HBAR | Per message | Cheap audit trail |
| Smart Contract deploy | 10-100 HBAR | Depends on bytecode | High initial overhead |
| Smart Contract call | 0.001-1 HBAR | Depends on complexity | Gas overhead |
| HSS schedule | 0.1 HBAR | + payer fee | Deferred-execution tax |
| HFS file | 0.1-1 HBAR | Per KB | Expensive storage |

**Rule of thumb:** HTS < HCS < Smart Contracts. If HTS can do it, use HTS.

---

## Common Architecture Traps

| Trap | What it looks like | Why it's a problem | How to avoid it |
|------|---------------------|---------------------|------------------|
| "I'll use Smart Contracts for everything" | Simple logic goes in a contract | Very expensive gas. Unnecessary complexity. | Use HTS for tokens. Contracts only when you genuinely need them. |
| "HCS is a better database" | Data goes into HCS "because it's on-chain" | HCS is an audit trail, not a database. Costly and publicly visible. | Use a database for private data. HCS only for immutable events. |
| "Token = ERC-20 in Solidity" | Reimplementing tokens with a contract | 50-100x more expensive. No built-in compliance. | Use native HTS — it already has this. |
| "Schedule everything, it's cool" | Scheduled transactions for simple operations | Signing overhead, complexity, capacity limits. | Use HSS only when you need multi-sig. |
| "I don't need a mirror node" | On-chain queries, or no queries at all | Inefficient. Goes against Hedera's design principles. | Mirror node is the standard — use it. |
| "I'll store my app data in HFS" | Large files pushed to Hedera File Service | HFS is expensive, slow, and size-limited. | Use IPFS. HFS only for tiny bytecode/config. |
