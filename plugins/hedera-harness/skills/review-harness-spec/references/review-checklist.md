# Oracle review checklist

Judgment checks only. Mechanical wiring (schema validity, baseline `install`,
defaulted paths, tier-3 pairing, `chainValidation.network`,
`executableWithTestSigner`, **blind** PRD scan, `REPLACE_ME`, authoring skills
in `skills:`) lives in `harness-spec-anatomy/scripts/check-spec.sh` — do not
re-check those here.

Mark each item pass / fail / n/a.

## Journey ↔ assertion traceability

- [ ] **O1** Every PRD journey maps to at least one **oracle** assertion
- [ ] **O2** Every oracle assertion traces to a PRD journey (no orphans / scope creep)
- [ ] **O3** Assertions have stable ids (`C1`, `C2`, …), non-empty `statement` and
      `howToVerify`, and the Acceptance section of the PRD points at the oracle
      rather than duplicating it

Ids must stay stable across attempts — the repair loop reports the per-attempt
**finding** delta by id, so renumbering makes fixed work look new.

## Severity and thinness

- [ ] **O4** Prefer ≤ 2 `critical` assertions; flag recipes where most assertions are `critical`
- [ ] **O5** Playwright tier stays thin (server + routes + forbidden crash text);
      deep UX belongs in the **oracle**
- [ ] **O6** If the oracle exists: `evaluationRules.failOnUncertainty` (or equivalent
      fail-closed posture) is present

## Needles and product fit

- [ ] **O7** Static **needles** match scripts the project actually documents
      (`yarn install`, `yarn next:dev`, …) — not brittle implementation strings
- [ ] **O8** If Solidity is a non-goal: `constraints.forbiddenWorkspaces` and forbidden
      Hardhat/Foundry paths align with the PRD; if Solidity is in scope, needed
      workspaces are not forbidden
- [ ] **O9** `skills:` (if any) lists generator skills from `skills-index.json`
      only — never `create-harness-spec` / `review-harness-spec` / `harness-spec-anatomy`
- [ ] **O10** Static assertions target the feature deliverables, not `template.json`
      (create-scaffold-hbar removes it when scaffolding)

## Recipe shape (v2)

- [ ] **O11** No real private keys or account ids anywhere in the recipe
- [ ] **O12** The recipe is **not padded**: keys that merely restate a default
      (`maxAttempts: 3`, `prd: .harness/prd.md`, detected `constraints`) are
      removed. Every explicit key should be a deliberate override
- [ ] **O13** `baseline` proves pre-existing host health and is distinct from
      `validators.commands`, which grades the finished feature. Both want an
      `install` command; baseline timeouts are generous enough for cold CI
      (install ≥ 300s typical)
- [ ] **O14** `agent:` matches a CLI the user has authenticated, and the recipe
      carries **no** hand-written model names or agent flags — those belong to
      the preset
- [ ] **O15** `templateMetadata.name` may differ from the feature slug in `name`
      (host template identity). That is not a finding

## Increments (only when `prd:` is a list)

- [ ] **O16** Each increment leaves the app green on its own — baseline and
      tier 0–1 run per increment
- [ ] **O17** Increments are ordered by dependency (foundation → UI → wallet flows),
      not by size
- [ ] **O18** The feature genuinely needs splitting; a single PRD one session can
      deliver should not be split
- [ ] **O19** Oracle assertions covering later increments are expected to fail until
      those land — confirm the ordering makes that sequence coherent

## Quick oracle-blocker shortlist

Fail the review as not-runnable if **O1**, **O2**, or **O11** fail, plus any
Wiring blockers from `check-spec.sh`.

If `check-spec.sh` reported that the schema was **not** validated, the review is
partial regardless of the oracle axis — say so in the Summary.
