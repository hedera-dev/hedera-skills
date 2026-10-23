# Hedera Harness

Agent skills for **writing and reviewing** [hedera-harness](https://github.com/hedera-dev/hedera-harness) specs — the markdown feature description `harness run` builds and judges.

Targets **hedera-harness 3.x**. Harness 3 replaced the recipe model with two inputs: `harness.yaml` at the repo root, and a markdown spec. A project still holding a `.harness/spec.yaml` is on the old model — harness 3.x ignores that file; there is nothing to migrate mechanically.

These skills are for the human or agent writing the spec **before** a run. They are not run skills: a spec never lists skills. A run loads what the project carries in `.claude/skills/`.

## Installation

### Claude Code

```bash
/plugin marketplace add hedera-dev/hedera-skills
/plugin install hedera-harness
```

Invoke with `/create-harness-spec` or `/review-harness-spec`.

Matt Pocock `/grilling` is optional and usually absent in Claude Code. The create skill ships an inline one-question-at-a-time protocol for that case.

### Cursor and other agents

```bash
npx skills add hedera-dev/hedera-skills
```

Note that `npx skills add` is also how a **project** gets the Hedera product skills a run can load. Installing this marketplace as a Claude Code plugin puts it in your own user settings, which a run deliberately cannot read.

## The two inputs

| Input | Path | Written by |
| --- | --- | --- |
| `harness.yaml` | repo root, committed | `harness init` (four questions) or `harness wizard` (an agent reads the project) |
| spec | `specs/<name>.md`, committed | you, or `harness wizard` |

`harness.yaml` carries four commands — `install`, `build`, `test` (nullable), `serve`. The spec is markdown in your own words, and its one rule is:

> Anything the spec asserts has to be checkable by a person using the running app — because a second agent, which is never allowed to see the code, is what judges it.

## Skills

| Skill | Purpose |
| --- | --- |
| `harness-spec-anatomy` | Shared vocabulary: `harness.yaml`, the spec, the five stages, and which claims become machine checks |
| `create-harness-spec` | Grill an idea → write `specs/<name>.md` |
| `review-harness-spec` | Two-axis audit (Checkability + Scope) before a run |

### harness-spec-anatomy

Model-invoked vocabulary layer. Defines **spec**, **harness.yaml**, **check**, **expectation**, **judgement**, **DOCTOR**, **DERIVE**, **GENERATE**, **TEST**, **EVALUATE**, **evaluator**, **verdict**, **evidence**, **finding**, **attempt**, **run**, **baseline**, **init**, **wizard**, and **continue**.

**References:**

- `references/checkable-claims.md` — the three check kinds, the rules each claim is tested against, and a phrasing table that moves a claim across the line
- `references/run-and-artifacts.md` — the five stages, the artifact tree, branches, `--continue`, and why a verdict is believable
- `references/cli.md` — commands, flags, environment variables, requirements

### create-harness-spec

Triggers when you say: "create a harness spec", "turn this feature into something harness can build", "write a spec for harness run".

**Provides:**

- Routing to `harness wizard` when the user has no idea yet — it has read the project and its draft is the better starting point
- A check that `harness.yaml` exists, deferring to `harness init` rather than hand-writing it
- Grilling that pushes for the things users skip: element ids, loading states, failure states, and what is out of scope
- A spec written to `specs/<name>.md`, with every guess marked
- Completion criterion: `harness run --spec <path> --review` shows checks whose quoted origins you recognise

### review-harness-spec

Triggers when you say: "review my harness spec", "is this spec ready to run", "will the judge be able to check this".

**Provides:**

- **Checkability** axis — every claim bucketed as **check**, **judgement**, or **unjudgeable**. Unjudgeable is always a blocker, and the report gives the rewrite rather than only the objection
- **Scope** axis — one run's work or a sequence, out-of-scope stated, no file prescriptions, routes consistent with `harness.yaml`, no unresolved placeholders
- Verification against the real DERIVE output via `--review`, rather than predicting it
- Side-by-side report (axes stay separate)

## Glossary (leading words)

| Term | Meaning |
| --- | --- |
| **spec** | The markdown feature description at `specs/<name>.md` |
| **harness.yaml** | The committed four commands at the repo root |
| **check** | A claim a judge can settle by reading a value. Data, never code |
| **judgement** | A claim the evaluator must weigh. Most of a good spec |
| **unjudgeable** | A claim nobody outside the code could settle. Always a blocker |
| **DERIVE** | The stage that reads the spec, and only the spec, and writes the checks |
| **EVALUATE** | The stage where a second agent judges the running app, unable to see the code |
| **verdict** | What the evaluator answered, with evidence for each item. Never re-rolled |
| **attempt** | One pass of GENERATE → TEST → EVALUATE, committed to the run's branch |
| **baseline** | install/build/test on the untouched repo, so prior breakage is not charged to the agent |
| **wizard** | `harness wizard` — an agent proposes the commands, then interviews you into a spec |

Full definitions: `skills/harness-spec-anatomy/GLOSSARY.md`.

> The v1/v2 words — **recipe**, **PRD**, **evaluate checklist**, **increment**, **needle**, **stage ambition** — name things harness 3.x does not have. The skills keep `spec` in their names, which is now also the harness's own word.

## Works With

- **Claude Code** (marketplace plugin — `/plugin install hedera-harness`)
- Cursor, Codex CLI, Gemini CLI, and any agent that supports the skills/plugin format
- [hedera-harness](https://github.com/hedera-dev/hedera-harness) 3.x CLI (`init`, `wizard`, `run`, `report`)
- Optional: [mattpocock/skills](https://github.com/mattpocock/skills) `/grilling` (preferred when present; Claude Code uses the inline protocol)

## License

Apache-2.0
