---
name: review-harness-spec
description: Audit a hedera-harness spec before a run — whether each claim is checkable from outside the app, and whether the scope is one run's work. Use when the user wants a harness spec reviewed before running it.
---

# Review Harness Spec

Audit a hedera-harness **spec** along two axes, to catch what the harness only
surfaces after a generator attempt is already burning.

Load the shared vocabulary first: read
[`../harness-spec-anatomy/SKILL.md`](../harness-spec-anatomy/SKILL.md) and its
[GLOSSARY.md](../harness-spec-anatomy/GLOSSARY.md).

Targets **hedera-harness 3.x**. A spec is prose, so there is no schema to
validate — the two axes below are both judgement, and that is the point.

## Step 1: Locate the inputs

| Input | Where | If missing |
| --- | --- | --- |
| **spec** | `specs/<name>.md`, or wherever the user points | Stop and ask which file to review |
| **harness.yaml** | repo root | Report as a blocker: `harness run` cannot start. Fix is `harness init` or `harness wizard` |

Read `harness.yaml` as well as the spec. The commands tell you how the app
builds and serves, which is how you spot a spec naming routes the app does not
expose or a dev-server setup it contradicts.

If the project holds a `.harness/spec.yaml`, note once that harness 3.x ignores
it, and review the markdown spec. Do not review the stale recipe.

## Step 2: Checkability axis

For every claim in the spec, decide which of three buckets it lands in. This is
the axis that decides whether a passing run means anything.

| Bucket | What it is |
| --- | --- |
| **Check** | A judge can settle it by reading a value — a dom selector, a route's status, a mirror node field |
| **Judgement** | The evaluator must weigh it, and can: it is observable from outside. A fine and expected outcome |
| **Unjudgeable** | Nobody who cannot see the code could settle it. **Always a blocker** |

Work through [references/review-checklist.md](references/review-checklist.md).
The rules each claim is tested against live in
[`../harness-spec-anatomy/references/checkable-claims.md`](../harness-spec-anatomy/references/checkable-claims.md).

Report under `## Checkability`. Quote the claim, name its bucket, and for
anything unjudgeable give the rewrite rather than only the objection.

When the harness is installed, run DERIVE and read what it actually produced
instead of predicting it:

```bash
harness run --spec specs/<name>.md --review
```

It stops before anything is built and prints each check with the phrase it came
from. A claim you bucketed as a check that DERIVE did not take is a finding;
so is a check whose quoted origin only half-matches its sentence.

## Step 3: Scope axis

Judgement about size and shape, not about observability:

- One run's work? The repair loop gets `--max-attempts` (default 3) at the
  whole spec. A spec spanning a data layer, UI and wallet flows wants splitting
  into a sequence run with `--continue`.
- Is anything out of scope stated at all? Its absence is how the generator
  invents work the judge then fails.
- Does the spec prescribe files, components or libraries? GENERATE chooses
  those; prescribing them constrains it for nothing.
- Does the first green state need an operator key or funded wallet? Legitimate,
  but it means DOCTOR's wallet check gates every run — worth flagging if the
  feature did not need it.
- Are routes and element ids consistent with what `harness.yaml` serves and
  what the app already ships?
- Any unresolved placeholders left by `harness wizard`? Each is a blocker.

Report under `## Scope`. Do **not** merge or rerank with Checkability — a spec
can be perfectly checkable and still be three runs of work.

## Step 4: Emit the report

```markdown
# Harness Spec Review — <name>

## Summary
- **harness.yaml**: present / missing
- **Claims**: N check · N judgement · N unjudgeable
- **Scope**: one run / split recommended (N specs)
- **Ready to run?**: yes / no — <one line>

## Checkability
### Blocker
- "<claim, quoted>" — unjudgeable: <why> — rewrite: "<the fix>"
### Warning
- "<claim, quoted>" — <what it becomes vs. what was likely wanted> — <fix>
### OK
- "<claim, quoted>" — check: `dom:/status:#network-name`

## Scope
### Blocker
### Warning
### OK
```

Lead the summary with the count of unjudgeable claims. It is the number that
decides whether running is worth it.

## Step 5: Handoff

When it is ready:

```bash
harness run --spec specs/<name>.md --review   # confirm the checks first
harness run --spec specs/<name>.md
harness report                                # read the finished run
```

When it is not, hand back the rewrites from the Checkability blockers as a
patch to the spec, not as prose for the user to translate.

## Additional resources

- [references/review-checklist.md](references/review-checklist.md)
- Phrasing rules: [`../harness-spec-anatomy/references/checkable-claims.md`](../harness-spec-anatomy/references/checkable-claims.md)
- Run behaviour: [`../harness-spec-anatomy/references/run-and-artifacts.md`](../harness-spec-anatomy/references/run-and-artifacts.md)
- Companion: `/create-harness-spec`
