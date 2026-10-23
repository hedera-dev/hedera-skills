# Glossary

Use these terms exactly. The v1/v2 words — **recipe**, **recipe file**,
**PRD**, **evaluate checklist**, **increment**, **needle**, **stage ambition**,
**oracle** — name things harness 3.x does not have. Do not carry them over.

**Spec** — the markdown file describing one feature, at `specs/<name>.md`. The
only thing `harness run` is pointed at (`--spec <path>`). Written in your own
words; its one constraint is that what it asserts be checkable by a person
using the running app. _Avoid_: recipe, pack, PRD.

**harness.yaml** — the committed file at the repo root naming the four
commands: `install`, `build`, `test` (nullable), `serve`. Describes the
project, not a run, which is why it is committed and why its comments survive.
Written by `init` or `wizard`; editable by hand.

**Check** — one claim DERIVE read out of the spec that a judge can settle by
reading a value, with no judgement. Data, never code. Carries `kind`
(`chain` / `http` / `dom`), `path`, `field`, one `expect`, and `because` — the
quoted phrase in the spec it came from. Identified as
`chain:accounts/0.0.2:balance.balance`.

**Expectation** — the one assertion inside a check: `equals`, `matches` (a
JavaScript pattern, so no inline flags), `contains`, or `atLeast`. There is no
delta form; a relative claim is judgement, not a check.

**Judgement** — everything in the spec that is not a check. Not a lesser
outcome: the evaluator verifies it, cites evidence, and stands behind it. Most
of a good spec is judgement.

**DOCTOR** — the first stage. Deterministic, no agent: git, a clean tree, the
browser, the wallet, and that `harness.yaml` names commands that exist, then
install/build/test on the untouched repo. Proves the project was healthy before
the agent touched it, so pre-existing breakage is never charged to a generator
attempt. A *stage*, not a command — `harness doctor` no longer exists.

**DERIVE** — the stage that reads the spec, and only the spec, and writes the
checks. Runs before anything is built so the app cannot shape them. `--review`
stops here for confirmation.

**GENERATE** — the stage where an agent implements the spec, choosing its own
files and whether to write tests.

**TEST** — install, build, test, stopping at the first failure. No agent.

**EVALUATE** — the stage where a second agent judges the running app against
the spec, driving a real browser and reading the mirror node. It cannot see the
code: it runs in a directory holding only the spec, with the repo denied at the
sandbox. _Avoid_: validator, grader.

**Evaluator** / **judge** — the agent EVALUATE runs. Selected by
`--judge-model`, which defaults to `--model`.

**Verdict** — what the evaluator answered, written to
`attempt-N/verdict.json` with its accounting of every check: both readings,
whether it held, and the evidence for each. Not accepted until every item is
accounted for. Never re-rolled — only the *absence* of an answer earns a
second look.

**Evidence** — the screenshots, page snapshots and saved responses under
`attempt-N/evidence/` that a claimed failure cites. The harness confirms the
files exist before accepting the verdict.

**Finding** — one failure in a verdict, hashed to a stable id so the report can
say open / fixed / new across attempts.

**Attempt** — one pass of GENERATE → TEST → EVALUATE, committed to the run's
branch. Bounded by `--max-attempts` (default 3).

**Run** — one invocation of `harness run --spec <path>`. Writes
`.harness/runs/<timestamp>/`, works on a `harness/<timestamp>` branch, and
returns you to the branch you started on.

**Baseline** — the install/build/test/serve output DOCTOR captured from the
untouched repo, under `runs/<timestamp>/baseline/`. The comparison point for
everything the agent then does.

**Init** — `harness init`. Writes `harness.yaml` by asking four questions with
defaults read from the project. Refuses if the file already exists.

**Wizard** — `harness wizard [name]`. An agent reads the project and proposes
the four commands with reasoning, then interviews you one question at a time
and drafts `specs/<name>.md`. The path to take when there is no spec yet.

**Continue** — `--continue`. Carries on from the last run started from, or
made on, this branch: its work, and what it ended up failing on. Also how a
second spec builds on a run that passed.
