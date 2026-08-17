---
name: harness-spec-anatomy
description: Shared vocabulary for hedera-harness recipes — the files, the v2 defaults, the tiers, and the blind/oracle rule. Use when authoring or auditing a harness recipe, or when another skill needs the recipe vocabulary.
---

# Harness Spec Anatomy

Single source of truth for what a hedera-harness **recipe** is. Action skills
(`/create-harness-spec`, `/review-harness-spec`) reach here for vocabulary;
they own workflow. Use the bold terms from [GLOSSARY.md](GLOSSARY.md) exactly.

Targets **hedera-harness ≥ 1.2.0** (`schemaVersion: 2`). For an older recipe,
run `hedera-harness migrate .harness/spec.yaml` first — do not hand-edit a v1
recipe into v2.

**These skills are for authoring — not for generator runs.** The `skills:` list
in a **recipe file** carries generator skills (domain knowledge for the coding
agent). Name skills like `hedera-consensus-service`, `hts-system-contract`,
`project-scaffolding`. Keep authoring skills out of that list.

## Layout

One layout: `.harness/` inside a scaffolded app (from `hedera-harness init` or
Scaffold HBAR). The workspace is the project itself — there is no seed and no
isolated clone. Paths in the **recipe file** are relative to the project root.

| File | Required? | Default path | Consumed by |
|------|-----------|--------------|-------------|
| **Recipe file** | Yes | `.harness/spec.yaml` | Harness CLI |
| PRD | Yes | `.harness/prd.md` | Generator |
| Static validator | Tier 0–1 | `.harness/validators/static.json` | Static validator |
| Command validator | Tier 0–1 | `.harness/validators/yarn.json` | Command validator |
| Playwright smoke | Tier 2 | `.harness/validators/playwright-smoke.yaml` | Playwright tier |
| **Oracle** | Tier 3 | `.harness/acceptance-contract.json` | Semantic validator |

Every path above is a **default**. Omit the key and the harness uses it; name a
key only to point somewhere else. Artifacts always land in `.harness/runs/`,
which is not configurable.

Handoff: `yarn harness:run` or `hedera-harness run .harness/spec.yaml`.

## What the recipe file must carry

Only four things are required:

```yaml
schemaVersion: 2
name: my-feature
description: What you want the agent to build in this project.

baseline:
  commands:
    - name: install          # required, and used for install fingerprinting
      command: yarn install
    - name: build
      command: yarn next:build
```

Everything else — `prd`, `validators.*`, `maxAttempts`, `agent`, `constraints`,
`forbiddenFiles`, `secretScan`, `requiredFiles` — is defaulted or detected.
A v2 recipe that sets none of them is complete and correct. Compact bodies and
the full commented template: [references/spec-files.md](references/spec-files.md).

**`baseline` is not `validators.commands`.** Baseline proves the project was
healthy *before* generation; `validators.commands` grades it *after*. A command
named `install` is mandatory in baseline.

## Defaults worth knowing

| Key | Default |
|-----|---------|
| `agent` | `cursor` (or `claude`) — selects CLI flags, model, and MCP delivery |
| `prd` | `.harness/prd.md`; a **list** delivers ordered **increments** |
| `maxAttempts` | `3` |
| `constraints.packageManager` | detected from `package.json` / lockfiles |
| `constraints.forbiddenCommands` | every package manager that is not the one in use |
| `forbiddenFiles` / `secretScan` | `.env` plus one per workspace |
| `requiredFiles` | empty — the validators are the gate |

Unknown keys are ignored with a warning, so a typo degrades rather than crashes.
Treat any such warning as a finding.

## Tiers

Enable in order. Default is **tier 0–1 only**, so the first run stays cheap.

| Tier | Recipe file fields | What it checks |
|------|--------------------|----------------|
| **0–1** | `validators.static`, `validators.commands`, `requiredFiles`, `forbiddenFiles`, `secretScan` | Files, JSON/text, secrets, install/lint/build |
| **2** | `validators.playwright` | Dev server boots; routes HTTP OK; console / forbidden text |
| **3** | `contract` + `validator.enabled: true` | Semantic agent grades numbered assertions in the **oracle** |
| **3.5** | `chainValidation` (+ tier 3) | Ephemeral ECDSA test signer; real txs; mirror verify |

Full enable order, host prerequisites, and YAML blocks:
[references/tier-strategy.md](references/tier-strategy.md).

## Cross-file coherence

The v2 defaults removed most path-level coupling. What still must agree:

| Keep in sync | Why |
|--------------|-----|
| **Oracle** `routes` ↔ Playwright `routes` ↔ PRD deliverable routes | The validator visits what the PRD promised |
| Every PRD journey ↔ ≥ 1 **oracle** assertion | Unverified journeys pass silently |
| Every **oracle** assertion ↔ a PRD journey | Orphan assertions are scope creep |
| `forbiddenFiles` ↔ static `fileAssertions.forbidden` | Two gates, one intent |
| `constraints.packageManager` ↔ static assertion on `package.json` | Only if you override the detected value |
| `contract` ↔ `validator.enabled: true` | Either alone is a misconfigured recipe |
| **Oracle** `executableWithTestSigner` ↔ `chainValidation.enabled` | Flagged assertions are inert without tier 3.5 |

`templateMetadata.name` is the host template identity and may differ from the
feature **slug** in `name`. That is not a finding.

## Blind / oracle rule

Keep the run **blind**. The PRD carries journeys and outcomes; the **oracle**
lives in the acceptance contract. See [GLOSSARY.md](GLOSSARY.md) and
[references/prd-and-journeys.md](references/prd-and-journeys.md).

## Drift-sensitive loader fields

When the harness renames these, update this skill and its evals in the same
change set:

`schemaVersion`, `agent`, `baseline`, `prd`, `validators.static`,
`validators.commands`, `validators.playwright`, `contract`, `validator`,
`chainValidation`, `constraints`, `templateMetadata`, `requiredFiles`,
`forbiddenFiles`, `secretScan`, `skills`, `executableWithTestSigner`,
`maxAttempts`.

Removed in v2 — flag them as upgrade debt, do not author them: `seed`,
`generator`, `logging`, `extend`, `extend.baseline`.

## Mechanical check

```bash
bash <path-to>/harness-spec-anatomy/scripts/check-spec.sh <project-root>
```

Resolve the script path relative to the installed skill. It runs
`hedera-harness doctor --recipe-only` for schema and loader validity, then adds
the cross-file coherence checks doctor does not perform. Exit zero means the
wiring is clean; non-zero prints one finding per line.

If the harness CLI is unavailable the script still runs its coherence checks and
says so — treat that as a partial result, not a pass.

## Additional resources

- [GLOSSARY.md](GLOSSARY.md)
- [references/spec-files.md](references/spec-files.md)
- [references/prd-and-journeys.md](references/prd-and-journeys.md)
- [references/acceptance-contract-guide.md](references/acceptance-contract-guide.md)
- [references/tier-strategy.md](references/tier-strategy.md)
- [scripts/check-spec.sh](scripts/check-spec.sh)
- Upstream: [docs/authoring-a-recipe.md](https://github.com/hedera-dev/hedera-harness/blob/main/docs/authoring-a-recipe.md)
