# Validation Rubrics

Phase 3 (Knowledge Validation) shouldn't be graded on vibes. For each service, this file defines the questions to ask, what a correct answer must contain, and the specific gaps that mean "re-teach, don't pass."

**Scoring per service:** 2 questions, each graded ✅ Pass / ⚠️ Partial / ❌ Fail.
- 2x ✅ → Service passes. Knowledge Score: ⭐⭐⭐⭐⭐ or ⭐⭐⭐⭐
- 1x ✅ + 1x ⚠️/❌ → Re-explain the missed question's topic, then re-ask a variant. Knowledge Score: ⭐⭐⭐ once re-passed
- 0x ✅ → Re-teach the whole service section from `service-guide.md`, then restart both questions

A project's Knowledge Passport only reaches **✅ READY FOR HACKATHON** when every detected service has passed both its questions (first try or after re-teaching).

---

## Hedera Token Service (HTS)

**Q1: "Why use HTS instead of a Smart Contract (ERC-20/721) for this token?"**
- Must include: a cost comparison (HTS is roughly 50-100x cheaper) AND at least one built-in compliance feature (freeze, wipe, KYC, royalties) relevant to their project
- ❌ Fails if: the answer is only "because it's native" or "because it's easier" with no cost or compliance reasoning
- ⚠️ Partial if: cost is mentioned but no compliance feature, or vice versa

**Q2: "What happens if an account tries to receive your token without associating first?"**
- Must include: the transfer fails, and association is an explicit opt-in step (`TOKEN_NOT_ASSOCIATED_TO_ACCOUNT`)
- ❌ Fails if: they say the transfer "just works" or don't mention association at all
- ⚠️ Partial if: they know it fails but can't explain why (don't mention association)

---

## Hedera Consensus Service (HCS)

**Q1: "Why HCS instead of a regular database for this data?"**
- Must include: on-chain/immutable proof of timing and content — something a database can't provide because it's centralized and mutable
- ❌ Fails if: the answer is "because it's blockchain" or "because it's cooler" with no reference to immutability or proof
- ⚠️ Partial if: they mention immutability but not why their specific use case needs it (vs. just could use it)

**Q2: "Is the data you're putting on this topic private or public? What did you do about it?"**
- Must include: acknowledgment that HCS is public by default, plus either "this data is fine being public" (with a reason) or "I encrypt it before submitting"
- ❌ Fails if: they believe HCS has built-in privacy, or haven't considered the question at all
- ⚠️ Partial if: they know it's public but haven't decided what to do about sensitive fields

---

## Smart Contracts (Solidity/EVM)

**Q1: "What part of your logic specifically requires trustlessness, and why can't it be a backend?"**
- Must include: a concrete reason a central server would be unacceptable for this specific logic (not "it's more secure" in the abstract)
- ❌ Fails if: they can't name what the contract actually enforces, or the logic is something a backend clearly could do (e.g., simple metadata storage)
- ⚠️ Partial if: they name the logic but the trustlessness argument is generic, not tied to their project

**Q2: "How does your contract interact with HTS, and what precompile address does that go through?"** *(only ask if the project combines HTS + a contract)*
- Must include: mention of the HTS precompile (`0x167`) or equivalent Hedera-specific interface — not a plain ERC-20 call
- ❌ Fails if: they think they're calling a standard ERC-20 ABI on their HTS token
- ⚠️ Partial if: they know it's "different" from ERC-20 but can't say how

---

## Hedera Schedule Service (HSS)

**Q1: "Why does this transaction need to be scheduled instead of executing immediately?"**
- Must include: multi-party signing requirement or a genuine need for deferred/future execution
- ❌ Fails if: the transaction has a single signer and no timing requirement (HSS is unnecessary here)
- ⚠️ Partial if: they can describe what HSS does but not why *their* transaction specifically needs it

**Q2: "What happens if not everyone signs before the schedule expires?"**
- Must include: the schedule is cancelled/never executes; expiration is a real constraint to design around (default 30 days)
- ❌ Fails if: they assume it executes anyway, or don't know schedules expire
- ⚠️ Partial if: they know it expires but haven't thought about what their app does when that happens

---

## Direct HBAR Transfers

**Q1: "What happens if you send HBAR to an account that doesn't exist yet?"**
- Must include: the transfer fails; the recipient account must be created first
- ❌ Fails if: they assume the account gets auto-created
- ⚠️ Partial if: they know it fails but not why

**Q2: "If you're using allowances, what can the owner do after granting one?"**
- Must include: the owner can revoke the allowance; the grantee can only spend up to the approved limit
- ❌ Fails if: they think an allowance is irrevocable or unlimited
- ⚠️ Partial if: they know it's limited but don't mention revocation

---

## Hedera File Service (HFS)

**Q1: "Why does this specific data need to be in HFS instead of IPFS or off-chain storage?"**
- Must include: a concrete reason the data must be on-chain and immutable at the protocol level (e.g., contract bytecode dependency, critical config a contract reads directly)
- ❌ Fails if: the reason is "it needs to be permanent" or "decentralized" — IPFS satisfies that more cheaply
- ⚠️ Partial if: they can't articulate why IPFS wouldn't work just as well

**Q2: "What does storing this file in HFS actually cost, and did you size it accordingly?"**
- Must include: awareness that HFS charges roughly per KB stored (~0.1 HBAR per KB) on top of a creation fee, so it's priced for small files, not general document storage
- ❌ Fails if: they assume HFS storage is free or flat-rate regardless of file size
- ⚠️ Partial if: they know it costs something but haven't checked it against the actual file size they're storing

---

## Account Management

**Q1: "Why ED25519 or ECDSA for your account keys — what drove that choice?"**
- Must include: ECDSA if they need MetaMask/Ethereum-wallet compatibility; ED25519 otherwise, as the Hedera-native default
- ❌ Fails if: they picked one without knowing the tradeoff, or think they're interchangeable with no consequence
- ⚠️ Partial if: they know the names but not which one their wallet integration requires

**Q2: "What happens to an account that's inactive for several months?"**
- Must include: accounts can expire without auto-renewal funding; auto-renew fees keep the account alive
- ❌ Fails if: they assume accounts persist indefinitely for free with no upkeep
- ⚠️ Partial if: they know renewal exists but haven't budgeted for it

---

## Mirror Nodes

**Q1: "Why query a mirror node instead of the ledger directly for this data?"**
- Must include: efficiency/indexing — direct ledger queries for historical data are impractical or unsupported for this use case
- ❌ Fails if: they don't know why mirror nodes exist, or think they're optional
- ⚠️ Partial if: they use mirror nodes correctly but can't explain why direct queries wouldn't work

**Q2: "How fresh is the data you're reading from the mirror node?"**
- Must include: awareness of the 1-3 second consensus-to-mirror-node lag, and that this is not a bug
- ❌ Fails if: they assume mirror node data is truly real-time with zero lag
- ⚠️ Partial if: they know there's lag but haven't accounted for it in their UX (e.g., showing a "confirming..." state)
