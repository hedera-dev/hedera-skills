---
name: review-harness-spec
description: Audit an existing hedera-harness recipe for wiring and oracle problems before a run. Use when the user wants a harness recipe reviewed before running it.
---

# Review Harness Spec

Audit a hedera-harness **recipe** on disk along two axes. Catch mistakes the
harness only surfaces after a generator attempt is already burning.

Load the shared vocabulary first: read
[`../harness-spec-anatomy/SKILL.md`](../harness-spec-anatomy/SKILL.md) and its
[GLOSSARY.md](../harness-spec-anatomy/GLOSSARY.md).

Targets **hedera-harness ≥ 1.2.0** (`schemaVersion: 2`).

Authoring-only skill. The **recipe file** `skills:` list carries generator skills.

## Step 1: Locate the recipe

The recipe is `.harness/spec.yaml` under the project root. Read every file it
resolves to, remembering that v2 **defaults** most paths — an absent key is not
a missing file:

| Key | Default when absent |
|-----|---------------------|
| `prd` | `.harness/prd.md` (a list means **increments**) |
| `validators.static` | `.harness/validators/static.json` |
| `validators.commands` | `.harness/validators/yarn.json` |

If the recipe file is missing, stop and ask. If `schemaVersion` is absent or
`1`, stop and recommend `hedera-harness migrate .harness/spec.yaml` — review the
migrated result, not the v1 original.

## Step 2: Wiring axis

```bash
bash <path-to>/harness-spec-anatomy/scripts/check-spec.sh <project-root>
```

`<project-root>` is the directory containing `.harness/`. The script runs
`hedera-harness doctor --recipe-only` for schema validity, then adds cross-file
coherence checks.

Report its findings **verbatim** under `## Wiring`.

If it reports the schema was **not** validated (harness CLI missing or older
than 1.2.0), say so explicitly in the report — the wiring axis is then partial,
not passed.

## Step 3: Oracle axis

Judgment only — what a script cannot see. Work through
[references/review-checklist.md](references/review-checklist.md). Cover at least:

- Every PRD journey maps to ≥ 1 **oracle** assertion
- Every assertion traces back to a PRD journey (no orphans / scope creep)
- Severity budget sane (prefer ≤ 2 `critical`)
- **Needles** pin real scripts, not brittle implementation strings
- Playwright tier stays thin; deep UX lives in the **oracle**
- Generator `skills:` list is appropriate (no authoring skills)
- The recipe is not padded with values that merely restate a default
- For **increments**: each one leaves the app green on its own, and they are
  ordered by dependency

Report under `## Oracle`. Do **not** merge or rerank with Wiring — a **recipe**
can be perfectly wired and still grade the wrong thing.

## Step 4: Emit the report

```markdown
# Harness Recipe Review — <slug>

## Summary
- **Schema**: v2 | v1 (migrate first)
- **Tier ambition**: 0–1 | +2 | +3 | +3.5
- **Increments**: single PRD | N ordered
- **Ready to run tier 0–1?**: yes / no
- **Wiring findings**: N  (schema validated: yes / no)
- **Oracle findings**: N

## Wiring
- [script output or hand-checked findings]

## Oracle
### Blocker
- [id] <what> — <where> — <fix>
### Warning
- [id] <what> — <where> — <fix>
### OK
- [id] <what>
```

## Step 5: Handoff

If ready for tier 0–1:

```bash
hedera-harness run .harness/spec.yaml --max-attempts 3
# or: yarn harness:run
```

## Additional resources

- [references/review-checklist.md](references/review-checklist.md)
- Companion: `/create-harness-spec`
- Vocabulary: `/harness-spec-anatomy`
