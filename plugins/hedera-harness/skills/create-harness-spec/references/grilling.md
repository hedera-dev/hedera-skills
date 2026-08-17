# Grilling a harness recipe

Prefer the Matt Pocock `/grilling` skill when it is available. Otherwise follow
this protocol. Either way, apply the harness decision tree below.

## Protocol

1. Interview relentlessly about every aspect of the feature until you reach a
   shared understanding. Walk down each branch of the decision tree, resolving
   dependencies between decisions one-by-one.
2. Ask **one question at a time**. Wait for the answer before continuing.
   Asking multiple questions at once is bewildering.
3. For each question, provide your **recommended answer**.
4. If a *fact* can be found by exploring the environment, look it up rather
   than asking. Decisions belong to the user.

### Facts to look up (do not ask)

- Is this a scaffolded app ready for a recipe? (`package.json`,
  `packages/nextjs`, `.harness/`)
- Does `.harness/spec.yaml` already exist, and what is its `schemaVersion`?
  (absent or `1` → migrate before editing)
- Which harness version is installed? (`hedera-harness doctor`, package.json pin)
- Which generator skills exist? (read `skills-index.json` from the harness package)
- What scripts does the host app document? (README / package.json — these become
  `baseline` commands and static **needles**)
- Which package manager and workspaces? (the harness detects these; you only
  need them to sanity-check)
- What existing routes and pages does the app already ship?

5. Do **not** write files until the user confirms shared understanding.

## Decision tree (dependency order)

Walk these decisions in order. Later choices depend on earlier answers.

1. **Product goal** — one paragraph: what the feature is, who it is for, and
   what "done" looks like in a browser without live credentials.
   *Recommend:* keep the first journey credential-free. Phrase the goal as a
   **delta** against the existing app — what stays, what is added.

2. **Slug** — kebab-case name for the **recipe file** `name` field.
   *Recommend:* short product noun (`proof-wall`, `x402-pay-to-post`).
   `templateMetadata.name`, if set, stays as the host template id.

3. **Solidity in scope?** — yes / no.
   - Yes → Hardhat/Foundry workspaces allowed; consider `hts-system-contract`
     (and deploy / `chainValidation` later).
   - No → forbid Hardhat/Foundry workspaces via `constraints.forbiddenWorkspaces`;
     prefer native service skills (`hedera-consensus-service`,
     `hedera-token-service`).

4. **Hedera services** — HCS, HTS, HSS, precompiles, mirror reads, …
   *Recommend:* map each service to a generator skill name from
   `skills-index.json`. Only list skills that genuinely help.

5. **Routes** — at least `/`, plus any secondary paths.
   *Recommend:* only routes the first green run will actually ship.

6. **Wallet-gated writes?** — which journeys need a wallet?
   - Read-only / affordance-only → tiers 0–3 are enough; leave 3.5 off.
   - Real on-chain writes must be graded → tier 3.5 +
     `executableWithTestSigner` become meaningful (still opt-in; confirm
     explicitly, and confirm the user has a funded **ECDSA** testnet operator).

7. **One PRD or increments?** — can one agent session land this?
   *Recommend:* **one PRD**. Split into ordered **increments** only when the
   feature spans layers a single session cannot reliably deliver — typically a
   service/data layer, then UI, then wallet flows. Each increment must leave the
   app green on its own, because baseline and tier 0–1 run per increment, and
   the first failure stops the sequence.

8. **Agent preset** — `cursor` (default) or `claude`.
   *Recommend:* whichever CLI the user actually has authenticated. Look up which
   is on PATH rather than asking twice. Never hand-write model names or CLI
   flags into the recipe — the preset owns those so they change on upgrade.

9. **Tier ambition for the first green run** — default **tier 0–1 only**.
   Offer 2 / 3 / 3.5 only after the user opts in. Ambition decides which files
   get written vs left as commented stubs.

10. **Confirm shared understanding** — summarize the decisions (slug, services,
    routes, Solidity, increments, agent, tiers, generator skills). Wait for an
    explicit go-ahead before emitting files.

## Anti-patterns to push back on

- **Padding the recipe.** v2 defaults nearly everything. If the user wants
  `maxAttempts: 3` or `prd: .harness/prd.md` written out explicitly, note that
  it is already the default and adds drift surface for nothing.
- **Splitting a feature one session could deliver.** Increments cost a full
  validation cycle each.
- **Marking assertions `executableWithTestSigner` "for later."** They are inert
  without tier 3.5 and give a false sense of coverage.
- **Putting acceptance detail in the PRD.** That breaks the **blind** rule.
