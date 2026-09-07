# Hedera Knowledge Passport — Examples

Three complete "Passports" showing what this skill produces after analyzing a project, plus a blank template at the end.

---

## Example 1: Stablecoin ("USDA — Digital Dollar")

### Basic Information
- **Project:** USDA — a dollar-backed stablecoin
- **Goal:** Enable digital dollar transfers on Hedera
- **Hackathon:** Hedera 2026 Buenos Aires

### Services Identified

#### 1. Hedera Token Service (HTS) ✅
**What it does in this project:**
```
Creates the USDA token (symbol USDA, decimals 2)
- 1 USDA = 1 USD
- Treasury: company-controlled account
- Initial supply: 1,000,000 USDA
```

**Why it's used:**
- Built-in compliance (freeze/wipe in case of fraud)
- KYC support (transfers can require KYC first)
- 50-100x cheaper than an ERC-20 equivalent
- No need to audit the token logic — HTS is already audited by Hedera

**Alternative considered:**
- ❌ Smart Contract ERC-20: far more expensive, unnecessary complexity

**Cost:**
- Token creation: 1 HBAR ($0.06)
- Each transfer: 0.0001 HBAR ($0.000006)
- Minting new supply: 0.001 HBAR per batch

---

#### 2. Account Management ✅
**What it does in this project:**
```
- Creates a treasury account (where USDA is issued)
- Creates a payer account (covers fees)
- Manages keys:
  - Treasury key: can mint/burn USDA
  - KYC key: can grant KYC to users
```

**Why it's used:**
- KYC is required by regulation
- Freeze support is required for AML compliance

**Cost:**
- Account creation: 1 HBAR ($0.06) per account
- Auto-renewal: 0.1 HBAR/year ($0.006)

---

#### 3. Direct HBAR Transfers ⚠️ (not an explicit choice)
**Notes:**
- The stablecoin itself uses HTS transfers, not HBAR transfers
- HBAR transfers happen internally whenever users pay network fees
- Not an architectural decision — it's automatic

---

### Key Decisions & Justification

| Decision | Justification |
|----------|----------------|
| HTS vs. Smart Contract | HTS is 50-100x cheaper. Stablecoins are HTS's flagship use case. |
| KYC enforcement | Regulation requires it. HTS supports it natively. |
| Freeze/wipe support | AML compliance requires the ability to freeze fraudulent accounts. |
| Single token creation | No need for dynamic token creation — one USDA token is sufficient. |

---

### Understanding Validation

**Questions answered:**

1. "Why use HTS instead of a Smart Contract?"
   - Expected answer: "HTS is 50-100x cheaper and has built-in compliance (freeze, wipe, KYC)."
   - Answer given: ✅ CORRECT

2. "What happens if someone tries to send USDA without passing KYC?"
   - Expected answer: "The transfer fails. They need KYC granted by the treasury first."
   - Answer given: ✅ CORRECT

3. "What's the difference between the Treasury and the Payer account?"
   - Expected answer: "Treasury owns the token and can mint. Payer covers transaction fees."
   - Answer given: ✅ CORRECT

---

### Knowledge Score
- **HTS Understanding:** ⭐⭐⭐⭐⭐ (Excellent)
- **Compliance Design:** ⭐⭐⭐⭐⭐ (Excellent)
- **Cost Optimization:** ⭐⭐⭐⭐ (Strong — alternatives were considered)

### Final Verdict
**✅ READY FOR HACKATHON.** Clear understanding of which services are used and why.

---
---

## Example 2: NFT Marketplace ("Hedera Gallery")

### Basic Information
- **Project:** Hedera Gallery — an NFT marketplace
- **Goal:** Upload art, mint it as an NFT, sell it with royalties
- **Hackathon:** Hedera 2026 Miami

### Services Identified

#### 1. Hedera Token Service (HTS) ✅ (for the NFTs)
**What it does in this project:**
```
Creates an NFT collection (token type NON_FUNGIBLE):
- Each artwork = 1 NFT
- Royalties: artist receives 10% on every resale
- Metadata: IPFS link to a JSON file with image + description
```

**Why it's used:**
- Built-in royalties — no custom contract needed
- Standard NFT semantics (ERC-721-equivalent behavior)
- Very cheap (0.001 HBAR per NFT)

**Alternatives considered:**
- ❌ Smart Contract ERC-721: royalties require custom logic
- ❌ HTS + a redundant custom contract for royalties: over-engineering

**Cost:**
- NFT collection creation: 1 HBAR ($0.06), once
- Minting per NFT: 0.001 HBAR ($0.00006) each
- Transfers: 0.0001 HBAR ($0.000006)

---

#### 2. Smart Contracts (Solidity) ✅ (for marketplace logic)
**What it does in this project:**
```solidity
contract HederaGallery {
    // List an NFT for sale
    // Buyer submits an offer
    // If seller accepts → escrow executes the transfer
    // If not → funds return automatically
}
```

**Why it's used:**
- Complex logic (escrow, offers, acceptance)
- Trustless — the contract guarantees no party can cheat
- Integrates with HTS via precompiles (the contract can move the NFTs)

**Alternative considered:**
- ❌ Off-chain backend: requires trusting a server. Not acceptable when money is involved.

**Cost:**
- Deploy: 20 HBAR ($1.20), once
- List an NFT: 0.01 HBAR ($0.0006)
- Purchase an NFT: 0.05 HBAR ($0.003)

---

#### 3. Direct HBAR Transfers (via Smart Contract) ✅
**What it does in this project:**
```
When a buyer purchases an NFT:
1. The contract receives HBAR from the buyer
2. The contract forwards HBAR to the seller (minus a 2% fee)
```

**Why it's used:**
- HBAR is Hedera's native currency
- Trustless payment flow

**Alternative considered:**
- ❌ Using a stablecoin (USDC): would require HTS + additional contract logic. More complexity for no clear benefit here.

---

### Key Decisions & Justification

| Decision | Justification |
|----------|----------------|
| HTS for NFTs vs. ERC-721 | HTS has royalties built in. ERC-721 requires custom logic. |
| Smart Contract for escrow | Complex logic (offers, acceptance, transfer) needs trustlessness. |
| HBAR instead of a stablecoin | Keeps things simple. HBAR is stable enough for this scope. |
| Automatic royalties | HTS handles this natively — no contract needed. |
| IPFS for metadata | Decentralized and free via NFT.storage. |

---

### Understanding Validation

**Questions answered:**

1. "Why do you need a Smart Contract if HTS already creates NFTs?"
   - Expected answer: "HTS creates and transfers the NFTs. The contract implements the marketplace logic — offers, escrow, acceptance."
   - Answer given: ✅ CORRECT

2. "What happens if a buyer cancels after making an offer?"
   - Expected answer: "The contract returns the HBAR automatically — that's the escrow logic."
   - Answer given: ✅ CORRECT

3. "How are royalties calculated?"
   - Expected answer: "HTS handles royalties natively. When someone buys through the marketplace, HTS automatically routes a percentage to the original creator."
   - Answer given: ✅ CORRECT

---

### Knowledge Score
- **HTS NFT Understanding:** ⭐⭐⭐⭐⭐ (Excellent)
- **Smart Contract Design:** ⭐⭐⭐⭐ (Strong — correct escrow pattern)
- **Architecture Decisions:** ⭐⭐⭐⭐⭐ (Excellent separation of concerns)

### Final Verdict
**✅ READY FOR HACKATHON.** Well-reasoned architecture; clear understanding of what each service does.

---
---

## Example 3: Audit Trail System ("ComplianceLogger")

### Basic Information
- **Project:** ComplianceLogger — a compliance audit system
- **Goal:** Record every compliance event (KYC checks, AML checks, etc.) immutably
- **Hackathon:** Hedera 2026 Singapore

### Services Identified

#### 1. Hedera Consensus Service (HCS) ✅
**What it does in this project:**
```
Creates a "compliance-audit" topic:
- Each event: {"user": "0.0.123", "event": "kyc_approved", "timestamp": "...", "verifier": "..."}
- Messages are ordered, timestamped, and immutable
- A regulator can download the complete audit trail
```

**Why it's used:**
- On-chain proof that event X happened at time Y
- Strictly ordered — no reordering is possible
- Public — regulators can audit independently
- Very cheap (0.0001 HBAR per event)

**Alternatives considered:**
- ❌ PostgreSQL database: centralized. A regulator has no reason to trust it — data can be edited.
- ❌ Smart Contract: overkill. This system doesn't need logic, just a tamper-proof record.

**Cost:**
- Topic creation: 0.01 HBAR ($0.0006), once
- Per message: 0.0001 HBAR ($0.000006)
- 1 million events = 100 HBAR ($6)

---

#### 2. Mirror Node (implicit) ✅
**What it does in this project:**
```
- A user wants to see their audit history
- Query the mirror node for messages on the "compliance-audit" topic
- Filter by user ID
- Get a timeline of events
```

**Why it's used:**
- Efficient queries — no need to query the ledger directly
- Indexed — filterable by user, date, event type
- Free (public mirror of Hedera data)

**Alternative considered:**
- ❌ Direct ledger queries: far too slow. Mirror node is the standard path.

---

#### 3. Account Management (implicit) ✅
**What it does in this project:**
```
- Creates a "compliance-bot" account that submits events to HCS
- This account only holds the SUBMIT key for the topic
- It has no other permissions
```

**Why it's used:**
- Separation of concerns — compliance-bot has minimal, scoped permissions
- If compliance-bot is ever compromised, the blast radius is limited

---

### Key Decisions & Justification

| Decision | Justification |
|----------|----------------|
| HCS vs. database | HCS provides on-chain proof. A database is centralized — regulators need on-chain. |
| HCS vs. Smart Contract | Contracts are for logic. HCS is for recording. This is a record, not logic. |
| Public topic | Regulatory compliance requires the regulator to be able to audit independently — no privacy requirement here. |
| Mirror node queries | Standard Hedera pattern for efficient queries. |

---

### Understanding Validation

**Questions answered:**

1. "Why HCS instead of a regular database?"
   - Expected answer: "HCS is on-chain and immutable. The regulator can verify we didn't alter the audit trail after the fact."
   - Answer given: ✅ CORRECT

2. "What happens if we need to look up events for a specific user?"
   - Expected answer: "Query the mirror node and filter by user ID. It indexes HCS messages."
   - Answer given: ✅ CORRECT

3. "What if we need private events instead of public ones?"
   - Expected answer: "HCS is always public. If privacy is required, encrypt the message before submitting it to HCS."
   - Answer given: ✅ CORRECT

---

### Knowledge Score
- **HCS Understanding:** ⭐⭐⭐⭐⭐ (Excellent — clear on why HCS over a database)
- **Regulatory Design:** ⭐⭐⭐⭐⭐ (Excellent — designed with the auditor in mind)
- **Architecture Simplicity:** ⭐⭐⭐⭐⭐ (Excellent — not over-engineered)

### Final Verdict
**✅ READY FOR HACKATHON.** Deep understanding of why each service was chosen. No vibecoding here.

---
---

## Template: Build Your Own Passport

If your project uses other services, use this template:

### Services Identified

#### Service X ✅
**What it does in this project:**
```
[Describe specifically what it does]
```

**Why it's used:**
- [Advantage 1]
- [Advantage 2]

**Alternative considered:**
- ❌ [Alternative A and why it was rejected]
- ❌ [Alternative B and why it was rejected]

**Cost:**
- [Operation]: X HBAR
