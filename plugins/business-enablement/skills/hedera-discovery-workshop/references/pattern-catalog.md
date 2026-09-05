# Pattern Catalog — Generic Business Pain → Hedera Service

Match by *pattern*, never by industry name. The same row applies whether the
client is a bakery, a cattle ranch, a metalworking shop, or a law firm — only
the concrete example changes. Never show this whole table to the client;
pick the 2-4 rows that fit their Phase 1 answers.

| Generic pattern | Hedera service | When it applies | Example across industries |
|---|---|---|---|
| Prove a document's integrity and exact timestamp | **HCS** (Consensus Service) | A document (cert, contract, invoice, report) gets disputed or audited later and today there's no tamper-proof proof of when/what it said | Quality dossier (manufacturing), signed delivery note (bakery), health certificate (cattle) |
| Trace a physical good through multiple hands | **HCS** (chain of timestamped events) | A good changes custody across several parties who don't share one system, and provenance matters (recalls, compliance, premium pricing) | Batch of meat/milk (cattle ranch), steel plate lot (metalworking), flour batch (bakery) |
| A unique, serialized asset changes ownership | **HTS NFT** | Each unit is distinct and its ownership history has value (not fungible/interchangeable) | Individual animal ID (cattle ranch), land title, unique contract instance (law firm) |
| Fractional points or credits move between parties | **HTS fungible token** | Value units are interchangeable and need to move between wallets/accounts cheaply | Loyalty points (bakery), co-op shares (cattle ranch), retainer credits (law firm) |
| Conditional payment between parties who don't fully trust each other | **Smart contract (EVM)** | Payment/action should trigger automatically only when a verifiable condition is met, without a manual intermediary | Escrow on delivery (metalworking), pay-on-verified-weight (cattle ranch), fee release on milestone (law firm) |
| Multi-party approval that can't be coordinated into one meeting | **HSS (Scheduled Transactions)** | Several signers need to approve the same action at different times without a live coordination call | Multi-partner contract sign-off (law firm), board approval (any SME) |
| Verify a professional license/credential without one central registry everyone trusts | **DID / Verifiable Credentials** | A qualification (license, certification, training) needs to be checked by third parties who don't want to call the issuer every time | Certified welder (metalworking), bar-admitted lawyer (law firm), vet certification (cattle ranch) |
| Report environmental/ESG impact with third-party-auditable trace | **Hedera Guardian** | Carbon credits, deforestation-free sourcing, sustainability claims that a buyer or regulator will want to audit independently | Carbon credits / deforestation-free beef (cattle ranch), sustainable sourcing (agro exporter) |
| Cross-border payment without banking friction/delay | **Stablecoin (native USDC on Hedera)** | Paying or getting paid across borders is slow/expensive through normal banking rails | Paying an overseas flour supplier (bakery), paying an overseas steel supplier (metalworking) |

## Reading the table with a client

For each candidate row, translate to their words:
- "Prove a document's integrity" → "so nobody can argue later about whether
  this certificate was swapped or backdated"
- "Trace a physical good" → "so you can answer in minutes, not days, exactly
  where a batch/lot came from and who touched it"
- "Unique asset changes ownership" → "so the history of this specific item is
  never lost or disputed"
- "Conditional payment" → "so payment happens automatically the moment the
  agreed condition is met, with no manual chasing"
- "Multi-party approval" → "so people can sign off on their own time without
  a scheduling headache"
- "Verify a credential" → "so a client doesn't have to call you to confirm
  someone is really certified"
- "ESG/carbon reporting" → "so your sustainability claim survives a buyer's
  or auditor's scrutiny"
- "Cross-border payment" → "so paying a supplier abroad doesn't cost you days
  and a wire fee"
