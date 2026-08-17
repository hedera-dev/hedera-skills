# Hedera Harness

Agent skills for **creating and reviewing** [hedera-harness](https://github.com/hedera-dev/hedera-harness) recipes — PRD, recipe file, validators, Playwright smoke, and acceptance contracts (oracle) that drive in-place feature work under `.harness/` in a Scaffold HBAR app.

These skills are for the human or agent writing the **recipe** **before** a `run`. They are **not** generator skills: do not list them in a recipe's `skills:` field (that list is for the coding agent that builds the feature).

Targets **hedera-harness ≥ 1.2.0** (`schemaVersion: 2`). For an older recipe, run `hedera-harness migrate .harness/spec.yaml` first.

## Installation

### Claude Code

```bash
# Step 1: Add the Hedera marketplace (skip if already added)
/plugin marketplace add hedera-dev/hedera-skills

# Step 2: Install the plugin
/plugin install hedera-harness
```

### Other Agents (npx skills)

```bash
npx skills add hedera-dev/hedera-skills
```

## Skills

| Skill | Purpose |
|-------|---------|
| `harness-spec-anatomy` | Shared vocabulary, the v2 defaults, and `check-spec.sh` |
| `create-harness-spec` | Grill an idea → emit a runnable **recipe** under `.harness/` |
| `review-harness-spec` | Two-axis audit (Wiring + Oracle) before `hedera-harness run` |

### harness-spec-anatomy

Model-invoked vocabulary layer. Defines **recipe**, **recipe file**, **slug**,
**run**, **init**, **doctor**, **migrate**, **baseline**, **agent preset**,
**increment**, **blind**, **oracle**, **tier**, **finding**, and **needle**.
Houses the mechanical checker:

```bash
bash skills/harness-spec-anatomy/scripts/check-spec.sh <project-root>
```

The script delegates schema validity to `hedera-harness doctor --recipe-only`
and adds the cross-file coherence checks doctor does not perform — notably the
tier-3 `contract` ↔ `validator.enabled` pairing, which doctor passes.

### create-harness-spec

Triggers when you say: "create a harness recipe", "turn this feature into harness inputs", "author a hedera-harness PRD", "add a recipe under .harness".

**Provides:**

- Locate or bootstrap the target (`hedera-harness init`, or `migrate` when v1)
- Hybrid grilling (prefer `/grilling` when installed; else inline one-question-at-a-time protocol)
- Dependency-ordered decision tree (goal → slug → Solidity → services → routes → wallet → increments → agent → tiers)
- Emit tier 0–1 by default, leaving v2 defaults commented out; deepen optionally
- Completion criterion: `check-spec.sh` exits clean
- Handoff: `yarn harness:run` / `hedera-harness run .harness/spec.yaml`

### review-harness-spec

Triggers when you say: "review my harness recipe", "is this ready to run", "audit my acceptance contract", "review my .harness recipe".

**Provides:**

- **Wiring** axis — `doctor` output plus coherence: defaulted paths, tier pairing, blind scan, removed-in-v2 keys, `REPLACE_ME`, severity budget
- **Oracle** axis — journey↔assertion traceability, needles, thin Playwright, recipe padding, increment ordering
- Side-by-side report (axes stay separate)

## Glossary (leading words)

| Term | Meaning |
|------|---------|
| **recipe** | The coupled set of files for one run (a.k.a. "spec") |
| **recipe file** | `.harness/spec.yaml` |
| **schemaVersion** | Recipe format version; `2` is current |
| **slug** | Kebab name for the recipe file `name` field |
| **run** | The CLI command (`hedera-harness run`) |
| **init** | Bootstrap a scaffolded project + `.harness/` |
| **doctor** | Preflight; `--recipe-only` validates the recipe alone |
| **migrate** | Rewrite a v1 recipe to v2 in place |
| **baseline** | Host-health commands run before generation |
| **agent preset** | `cursor` / `claude` — CLI flags, model, MCP delivery |
| **increment** | One entry when `prd:` is a list; delivered in order |
| **blind** | Keep oracle text out of the PRD |
| **oracle** | Acceptance contract JSON |
| **tier** | Validation stage that can stop a run (0–1, 2, 3, 3.5) |
| **finding** | One validation failure, with a stable id and open/fixed status |
| **needle** | Static text assertion |

Full definitions: `skills/harness-spec-anatomy/GLOSSARY.md`.

> "Spec" and "recipe" mean the same thing. The harness settled on **recipe**;
> these skills keep `spec` in their names and in `.harness/spec.yaml`.

## Works With

- Claude Code
- Codex CLI
- Gemini CLI
- Cursor and any agent that supports the skills/plugin format
- [hedera-harness](https://github.com/hedera-dev/hedera-harness) CLI (`init`, `run`, `doctor`, `migrate`, `validate`, `validate-semantic`)
- Optional: [mattpocock/skills](https://github.com/mattpocock/skills) `/grilling` (preferred when present)

## License

Apache-2.0
