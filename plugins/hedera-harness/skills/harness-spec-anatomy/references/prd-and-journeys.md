# PRD and journeys

The PRD is the product brief the **generator** sees. Keep it product-facing.
Numbered, browser-verifiable pass/fail rules live in the **oracle** — keep the
run **blind**. Default path is `.harness/prd.md`.
Terms: [GLOSSARY.md](../GLOSSARY.md).

## What the PRD carries

| Carry | Examples |
|-------|----------|
| Goal, journeys, services, non-goals, deliverables | Product paragraphs |
| Route names at a product level | `/`, `/feed` |
| Wallet-gated journeys as affordances | "Post a message (needs wallet)" |
| Empty-state and testnet expectations | "Shows empty feed on testnet" |

The **oracle** owns assertion ids (`C1`, …), `howToVerify` steps, severity
labels, and mirror verification recipes. The Acceptance section of the PRD
points at the **oracle** file rather than duplicating it.

## Required sections

```markdown
# <Title> (PRD)

## Goal
One paragraph: what this feature adds to the app, who it is for, and what
"done" looks like in a browser without live credentials.

## Journeys
1. **Browse without a wallet** — what the user can see/do read-only.
2. **Configure / admin (if any)** — setup UI; what requires a wallet.
3. **Wallet-gated actions** — name the affordances; a successful on-chain tx
   is not required for acceptance at tiers 0–3 (unless tier 3.5 is planned).

## Hedera services
- List services (HCS, HTS, …) and how they appear in the UI.
- Default network (usually testnet) and empty-state behavior when nothing is configured.

## Non-goals
- No live operator keys or `.env` required to open the app.
- Call out frameworks you forbid (e.g. Hardhat/Foundry) if this is native/services-only.

## Deliverables
- Routes the **oracle** will visit (names only — not verification steps)
- Components / pages the feature adds
- Any script or README updates the feature implies

## Acceptance
Numbered, browser-verifiable assertions live in the **oracle** JSON.
Keep this document product-facing; keep the **oracle** test-facing.
```

Write about the **delta**: the app already exists and already works. Say what is
added and what must keep working — not how to rebuild the app.

## Splitting read path vs wallet-gated

Ask: *Can a stranger open the app with no wallet and no `.env` and still see something useful?*

| Path | Examples | Oracle posture |
|------|----------|----------------|
| Read / browse | Home copy, network label, empty feed | `walletRequired: false`, `verifiableWithoutCredentials: true` |
| Affordance | Connect button, "needs wallet" messaging | `walletRequired: true`, still verifiable without credentials |
| Write / on-chain | Submit HCS message, mint, contract call | Only with tier 3.5 + `executableWithTestSigner: true` |

Design the PRD so the first journey is always a solid credential-free browse path.

## Increments — splitting one feature across PRDs

When `prd:` is a list, each entry is an **increment**: delivered in order onto a
single branch, each with its own attempt budget, and the first failure stops the
sequence.

```yaml
prd:
  - .harness/prds/01-foundation.md
  - .harness/prds/02-ui.md
  - .harness/prds/03-wallet-actions.md
```

Reach for increments when a single PRD would ask for more than one agent session
can reliably land — typically a data/service layer plus a UI plus wallet flows.

Rules:

- **Each increment must leave the app green.** Baseline and tier 0–1 run per
  increment; an increment that only half-builds a feature fails.
- **Order by dependency, not by size.** Foundation first, UI on top of it.
- **Split by layer, not by file.** "Add the HCS client and a topic list route"
  is an increment; "add three components" is not.
- Keep each increment's PRD self-contained — the generator reads one at a time.
- One **oracle** grades the finished feature; assertions for a later increment
  will fail until that increment lands, which is why order matters.

A single `.harness/prd.md` remains the right default. Do not split a feature
that one session can deliver.

## Journey → oracle mapping (later)

When deepening to tier 3, each PRD journey should produce 1–3 assertions:

| Journey | Typical assertions |
|---------|-------------------|
| Browse without wallet | `C1` critical home load; `C2` major read capability |
| Wallet-gated action | Affordance + clear messaging without connecting |
| On-chain (optional) | `executableWithTestSigner` only if `chainValidation` is enabled |

See [acceptance-contract-guide.md](acceptance-contract-guide.md).
