# Glossary

Use these terms exactly. Do not substitute "pack", "benchmark pack", or
"acceptance file" when a glossary word fits.

> **Spec and recipe are the same thing.** hedera-harness 1.2.0 settled on
> **recipe** — the CLI prints `✔ recipe`, and the upstream guide is
> `docs/authoring-a-recipe.md`. These skills keep `spec` in their *names*
> (`create-harness-spec`, `review-harness-spec`, `harness-spec-anatomy`) and in
> the filename `.harness/spec.yaml`, both of which are unchanged in 1.2.0.
> Prefer **recipe** in prose; treat a user who says "spec" as meaning the same
> thing.

**Recipe** — the coupled set of files the harness consumes for one run: PRD,
**recipe file**, static validator, command validator, and optionally a
Playwright smoke plus the **oracle**. Lives under `.harness/` in the project.
_Avoid_: pack, benchmark pack, spec pack.

**Recipe file** — the YAML the CLI loads: `.harness/spec.yaml`. Carries
`schemaVersion`, `name`, `description`, and `baseline`; everything else is
defaulted. One file inside the **recipe**.

**schemaVersion** — the recipe format version. `2` is current. A recipe without
the field is assumed v1 and should be upgraded with `hedera-harness migrate`.
Bumps only on breaking meaning changes, not on additive fields.

**Slug** — the kebab-case feature name in the **recipe file** `name` field
(`proof-wall`, `hcs-message-wall`). `templateMetadata.name`, when present, is
the *host* template identity and may differ from the feature slug.

**Run** — the CLI command (`hedera-harness run`). Operates on the project cwd,
creates or continues a `harness/run-*` branch, then generate → assert → smoke →
evaluate, repairing between attempts. Artifacts under `.harness/runs/`.

**Init** — bootstrap command (`hedera-harness init`) that seeds scaffold-hbar
into a directory, creates a **fresh git repo** (no scaffold history/remote),
and provisions `.harness/`.

**Doctor** — preflight command (`hedera-harness doctor`). With `--recipe-only`
it validates the **recipe file** alone — schema, defaults, baseline, network
rules — and exits non-zero on failure. It is the authority on whether a recipe
loads; do not re-implement its checks by hand.

**Migrate** — upgrade command (`hedera-harness migrate`) that rewrites a v1
recipe to v2 in place: `extend.baseline` → `baseline`, and removal of keys whose
value already equals the new default.

**Baseline** — host-health commands run *before* generation, proving the project
was already working. Must include a command literally named `install`, which is
also used for install fingerprinting across attempts. Distinct from
`validators.commands`, which grade the project *after* the feature lands.

**Agent preset** — the `agent:` field (`cursor` or `claude`) selecting how the
generator and validator are invoked: CLI flags, model choice, and how Playwright
MCP is delivered. Presets ship with the harness, so flag changes arrive with an
upgrade instead of an edit to the recipe.

**Increment** — one entry when `prd:` is a list. Increments deliver in order
onto a single branch, each with its own attempt budget; the first failing
increment stops the sequence.

**Blind** — the generation-integrity property. The PRD is given to the
generator; the **oracle** grades the running app. Pasting assertion ids,
`howToVerify`, or severity labels into the PRD destroys the property. Phrase
the rule as: **keep the run blind**.

**Oracle** — the acceptance contract JSON (`.harness/acceptance-contract.json`).
Source of truth for semantic pass/fail under tier 3. Grades numbered assertions
— not the raw PRD.

**Tier** — a validation stage that can stop a run: 0–1 (deterministic), 2
(Playwright), 3 (semantic / **oracle**), 3.5 (on-chain). Every enabled **tier**
must pass. _Avoid_: gate, when referring to the tier as a whole.

**Finding** — one validation failure, carrying a stable id and a
`status` of `open` or `fixed`. The repair loop reports the per-attempt delta
(opened / fixed / introduced), so ids must stay stable across attempts.

**Needle** — a static text assertion (`textAssertions[].contains`) that pins a
string the project must document (e.g. `yarn next:dev`). Prefer stable script
names over incidental implementation detail.
