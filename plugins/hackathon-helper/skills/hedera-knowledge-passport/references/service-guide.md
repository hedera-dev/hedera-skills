# Hedera Services Deep-Dive Guide

This document explains **what each service is, why it exists, when to use it, when not to, its cost, and its common gotchas.**

---

## 1. Hedera Token Service (HTS)

### What is it?

A native Hedera service for **creating and managing tokens** (fungible and NFTs) without writing Solidity. Compliance is built in: KYC, freeze, wipe, royalties, custom fees, airdrops.

### Why does it exist?

Before HTS, the only way to create a token was to write an ERC-20/ERC-721 contract in Solidity. That means:
- Expensive (contract deployment gas)
- Bug-prone (most exploits happen in contracts)
- No built-in compliance features (freeze, wipe, etc.)

Hedera's answer: make issuing a token as easy and as safe as opening a bank account. That's HTS.

### When to use it

**Whenever you're creating a token or NFT.** There's essentially no exception.

Examples: a stablecoin, an identity NFT, a loyalty token, a governance token.

### When not to use it

Only when you need **ultra-custom logic** HTS doesn't support (rare):
- A token whose properties mutate constantly
- Exotic, non-ERC-20-compatible token mechanics

In 99% of cases: use HTS.

### Cost

- **Token creation:** ~1 HBAR ($0.06)
- **NFT minting:** ~0.001 HBAR per NFT ($0.00006)
- **Transfer:** ~0.0001 HBAR ($0.000006)

**Comparison:** An ERC-20 in Solidity costs roughly 50-100 HBAR to deploy. HTS is **50-100x cheaper.**

### Common gotchas

**1. Association model**
```
Problem: "Why can't this user receive my token?"
Answer: They must ASSOCIATE (opt in) first.
```
- Every account must associate with your token before it can receive it
- This is a feature (prevents spam), not a bug — but it trips people up
- The treasury account auto-associates with its own token; nobody else does

**2. Seven distinct key types**
```
ADMIN  → Can modify token properties
KYC    → Can grant/revoke KYC
FREEZE → Can freeze accounts
WIPE   → Can remove tokens from an account
SUPPLY → Can mint/burn
FEE    → Can modify custom fees
PAUSE  → Can pause/resume transfers
```
Gotcha: reusing the same key for every role is a risk. Separate keys by responsibility.

**3. Decimals confusion**
```
An HTS token with decimals=2 represents "1.00" as the raw amount 100.
Transfers move raw units ("100"), not the display value ("1.00").
```

**4. Treasury auto-association**
- The treasury account (creator) auto-associates
- Every other account needs to opt in
- Forgetting this causes transfers to fail (error `TOKEN_NOT_ASSOCIATED_TO_ACCOUNT`)

### Learn more

- [hedera-skills: agent-kit-plugin token examples](https://github.com/hedera-dev/hedera-skills/tree/main/plugins/agent-kit-plugin)
- [hedera-skills: native-services-js (HTS via Hiero JS SDK)](https://github.com/hedera-dev/hedera-skills/tree/main/plugins/native-services-js)
- [HTS overview](https://hedera.com/blog/hedera-token-service-a-revolutionary-approach-to-tokenization)

---

## 2. Hedera Consensus Service (HCS)

### What is it?

An **immutable, ordered message log** on the ledger. Every message:
- Has an exact consensus timestamp
- Sits in confirmed order
- Cannot be modified
- Is publicly queryable via a mirror node

### Why does it exist?

Some data doesn't need to be a "transaction" (like a token transfer), but still needs proof it existed at a specific moment:
- Audits (who accessed what, when)
- Immutable logs
- Public events
- Chain of custody

Think of HCS as an append-only log, but on-chain.

### When to use it

- "I need proof that X happened on date Y" → HCS
- Audit trails (who did what, when)
- Document notarization
- Real-time pub/sub (subscribers receive messages via mirror node)

### When not to use it

- Private data (HCS is public)
- Ephemeral data that doesn't matter afterward
- Anything a normal database handles more cheaply

**Rule:** "Do I need on-chain proof?" Yes → HCS. No → database.

### Cost

- **Topic creation:** ~0.01 HBAR
- **Message:** ~0.0001 HBAR per message

**At scale:** 1,000 messages = 0.1 HBAR ($0.006). Very cheap.

### Common gotchas

**1. Large messages (>1KB)**
```
Problem: "My 5KB message didn't go through."
Answer: HCS auto-chunks messages over 1KB. The resulting size on the wire is larger.
```

**2. Public data**
```
Everyone can read every message. There's no built-in privacy.
If you need privacy, encrypt the payload before submitting it.
```

**3. Mirror node subscription lag**
```
Problem: "I sent a message 5 minutes ago and don't see it in the mirror node."
Answer: There's typically a 1-3s lag. Mirror nodes are near-real-time, not instantaneous.
```

**4. Topic keys (similar concept to HTS keys)**
```
ADMIN  → Can modify the topic
SUBMIT → Can send messages
```
Leave SUBMIT empty if you want only your own key to be able to publish.

### Learn more

- [hedera-skills: native-services-js (HCS via Hiero JS SDK)](https://github.com/hedera-dev/hedera-skills/tree/main/plugins/native-services-js)
- [Hedera Consensus Service docs](https://docs.hedera.com/hedera/sdks/javascript/consensus-service)

---

## 3. Smart Contracts (Solidity/EVM)

### What is it?

Code that runs **on the ledger** deterministically and trustlessly. Hedera supports Solidity (EVM-compatible) with custom precompiles for HTS and HSS.

### Why does it exist?

Some businesses need logic that doesn't rely on trusting a central server:
- Automated swaps (A gives token X, receives Y)
- Governance (on-chain voting)
- Liquidations (DeFi)

A smart contract is logic nobody can change once it's deployed.

### When to use it

- Logic that must be trustless
- DeFi (swaps, lending, liquidation)
- Governance (voting)
- Logic that enforces token behavior (e.g., automatic burns)

### When not to use it

- Simple logic that a backend can handle
- Data that doesn't need to be on-chain
- Anything where trustlessness isn't actually required

**Rule:** "Could this run in my backend?" If yes, and you don't need trustlessness, don't use a contract.

### Cost

- **Deploy:** 10-100 HBAR (depends on bytecode size)
- **Simple call:** 0.001-0.01 HBAR
- **Complex call:** 0.1-1 HBAR (depends on gas)

**Comparison:** Deployment is 10-100x more expensive than creating an HTS token. Calls are 10-100x more expensive than an HTS transfer.

### Common gotchas

**1. HTS and HSS precompiles**
```
To call HTS from a contract, use the precompile at 0x167 (HTS) or 0x16b (HSS).
This is not the standard ERC-20 ABI — you need the Hedera-specific interface.
```

**2. HBAR required for token creation from a contract**
```
Creating a token from within a contract requires sending HBAR as value.
Example: createTokenExternally{value: 100000000}(...)
```

**3. Gas is not HBAR**
```
Gas measures "operations." HBAR is money. 1M gas does not equal a fixed HBAR amount —
the conversion is dynamic. Always test on testnet before assuming a cost.
```

**4. Contracts can't receive HBAR by default**
```
If your contract needs to receive HBAR, it needs a fallback or receive function.
```

### Learn more

- [hedera-skills: system-contracts](https://github.com/hedera-dev/hedera-skills/tree/main/plugins/system-contracts)
- [Solidity docs](https://solidity.readthedocs.io)
- [Hedera Smart Contract Service docs](https://docs.hedera.com/hedera/smart-contracts)

---

## 4. Hedera Schedule Service (HSS)

### What is it?

A service for **deferring transaction execution** until it collects the required signatures.

Workflow:
1. A creates a "schedule" (a pending transaction)
2. B signs the schedule
3. Once enough signatures accumulate, the transaction executes automatically

### Why does it exist?

Some workflows require **multi-sig governance**:
- Payments that require N-of-M signatures
- Changes to critical parameters that need multi-party sign-off
- Transactions that should execute after a set number of confirmations

### When to use it

- Multi-sig (A and B must both sign before execution)
- Scheduled transactions (execute at a specific future point)
- Critical governance actions

### When not to use it

- Single-signer operations (use a normal transaction)
- Anything that doesn't need to be deferred

**Rule:** Multiple signatures required? → HSS. Otherwise → normal transaction.

### Cost

- **Schedule creation:** ~0.1 HBAR
- **Execution:** transaction price + schedule fee

### Common gotchas

**1. Capacity limits**
```
You can't schedule 100,000 transactions. Hedera enforces limits.
Use scheduling deliberately, not as a default.
```

**2. Expiration**
```
An unsigned schedule expires (30 days by default) and is cancelled automatically.
Plan your multi-sig workflow around this window.
```

**3. Payer separation**
```
The account that creates the schedule is not necessarily the one that pays for it.
Design the incentive structure deliberately.
```

### Learn more

- [hedera-skills: system-contracts (HSS precompile reference)](https://github.com/hedera-dev/hedera-skills/tree/main/plugins/system-contracts)
- [HIP-755, HIP-756, HIP-1215](https://github.com/hashgraph/hedera-improvement-proposals)

---

## 5. Direct HBAR Transfers

### What is it?

Sending **native HBAR** from account A to account B. That's it.

### Why does it exist?

HBAR is Hedera's native currency. Simple transfers need to be as cheap and fast as possible.

### When to use it

**Whenever you need to move money.** No real exceptions.

### Cost

- **Transfer:** ~0.0001 HBAR ($0.000006)

Cheaper than any alternative.

### Common gotchas

**1. Accounts aren't created automatically**
```
If A sends HBAR to B and B doesn't exist yet, the transfer FAILS.
You need to create account B first (costs ~1 HBAR).
```

**2. Allowances**
```
"A authorizes B to spend up to 100 HBAR."
B can then call transferFromWithAllowance(...) and spend within that limit.
Useful for dApps that shouldn't hold user keys.
```

---

## 6. Hedera File Service (HFS)

### What is it?

Storing **small files** (bytecode, config) on-chain, immutably.

### Why does it exist?

Some data — contract bytecode, critical configuration — must live on-chain and be immutable.

### When to use it

**Almost never.** Exceptions:
- Bytecode a contract depends on (rare)
- Critical config that must be on-chain (very rare)

### When not to use it

- Regular documents → IPFS
- Large files → IPFS
- Private data → your own server

**Rule:** HFS is for ultra-specific cases. When in doubt, use IPFS.

### Cost

- **File creation:** ~0.1 HBAR
- **Storage:** ~0.1 HBAR per KB

Expensive relative to IPFS (fractions of a cent, persisted via Filecoin).

---

## 7. Account Management

### What is it?

Creating and managing Hedera accounts. Every account has:
- An address (`0.0.X`)
- Keys (ED25519 or ECDSA)
- An HBAR balance
- Associated tokens

### When to use it

- Creating a new account
- Rotating keys
- Adjusting auto-renew settings
- Querying a balance

### Cost

- **Account creation:** ~1 HBAR
- **Auto-renewal:** 0.01-0.1 HBAR/year (configurable)

### Common gotchas

**1. Auto-renewal**
```
An account with no activity for ~3 months can expire.
The auto-renew fee keeps it alive.
```

**2. Two key types**
```
ED25519 → More common on Hedera, standard choice
ECDSA   → Compatible with Ethereum-style wallets (MetaMask, etc.)

If you want users signing in with MetaMask → use ECDSA.
```

---

## 8. Mirror Nodes

### What is it?

**Publicly queryable indexes** of Hedera ledger data. Mirror nodes store:
- Transactions
- HCS messages
- Account balances
- Contract events

### Why does it exist?

The Hedera ledger is fast (2-3s to finality) but not efficiently queryable directly. Mirror nodes index the data so you can run real queries against it.

### When to use it

**Always, for queries.** Don't query the ledger directly for reads — it's inefficient.

Examples:
- "What was my balance three days ago?"
- "How many messages has this topic received?"
- "What was this account's first transaction?"

### Cost

- **Mirror node queries:** Free (public)
- **Mirror node subscriptions (HCS):** Free

### Common gotchas

**1. 1-3 second lag**
```
Transaction executes → 1-3s → appears on the mirror node.
It's near-real-time, not instantaneous. Plan for it.
```

**2. Rate limits**
```
Public mirror nodes enforce rate limits.
Hammering them with requests will get you temporarily throttled.
```

**3. Multiple mirror node providers**
```
Hedera has several mirror node operators (Hashgraph, Arkhia, and others).
Data can differ slightly between them. Stick to one for consistency.
```

---

## Summary: Which One for My Project?

| I need to... | Service |
|---|---|
| Create a token | HTS |
| Create an NFT | HTS |
| Keep an immutable audit trail | HCS |
| Do real-time pub/sub | HCS |
| Run automatic on-chain logic | Smart Contract |
| Build DeFi (swap, lending) | Smart Contract |
| Enforce multi-sig governance | HSS |
| Send money | HBAR Transfer |
| Query historical data | Mirror Node |
| Store bytecode | HFS (rare) |
