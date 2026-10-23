---
name: harness-spec-anatomy
description: Shared vocabulary for hedera-harness 3.x — harness.yaml, the markdown spec, the five stages, and which claims become machine checks. Use when authoring or auditing a harness spec, or when another skill needs the harness vocabulary.
---

# Harness Spec Anatomy

Single source of truth for what hedera-harness consumes. Action skills
(`/create-harness-spec`, `/review-harness-spec`) reach here for vocabulary;
they own workflow. Use the bold terms from [GLOSSARY.md](GLOSSARY.md) exactly.

Targets **hedera-harness 3.x** (`harness --help` prints the four commands
below). Everything the v1/v2 recipe model carried is gone — see
[Migrating from the recipe model](#migrating-from-the-recipe-model).

## Two inputs, and that is all

| Input | Path | Who writes it | Committed? |
| --- | --- | --- | --- |
| **harness.yaml** | repo root | `harness init` or `harness wizard` | Yes — it describes the project |
| **spec** | `specs/<name>.md` | you, or `harness wizard` | Yes |

There is no recipe file, no PRD, no validator JSON, no checklist file. The
**spec** is plain markdown in your own words; the harness works out what is
checkable by reading it.

### harness.yaml

Four commands. Each is a string, or `{ run, cwd }` when it must run somewhere
other than the repo root.

```yaml
install: yarn install
# Root next:build delegates to `next build` in @sh/nextjs, the only
# production build in the repo (hardhat has only compile).
build: yarn next:build
test: yarn test
serve: yarn next:dev
```

- `install`, `build`, `serve` are **required**. `test` may be `null` — a repo
  with no tests is a fact, not an error. `build` has no such escape.
- Comments are the reasoning `wizard` recorded for why this command and not
  the obvious-looking one. The harness never overwrites them.
- `harness init` offers defaults read from `package.json` and the lockfile.
  `harness wizard` has an agent read the project and propose them, which is
  worth it because script names lie: a root may have no `build` at all, and a
  workspace may define `start` as a dev server while `serve` runs the
  production build.
- DOCTOR rejects a `yarn x` / `npm run x` command naming a script that does
  not exist, before any agent runs.

### The spec

Markdown. One rule decides whether a run can pass:

> **Anything the spec asserts has to be checkable by a person using the
> running app** — because a second agent, which is never allowed to see the
> code, is what judges it.

"The hook polls every 10 seconds" is not checkable from outside. "The number
updates without a page reload, roughly every 10 seconds" is.

Name real routes, real element ids, and real directories. Say what is out of
scope. Writing claims so they land as machine checks rather than judgement is
the whole craft: [references/checkable-claims.md](references/checkable-claims.md).

## The five stages

Fixed pipeline, not a menu. Nothing to enable or configure.

```
DOCTOR → DERIVE → GENERATE → TEST → EVALUATE → done
                      ↑         │        │
                      └─────────┴────────┘   repair, up to --max-attempts (default 3)
```

| Stage | Agent? | What happens |
| --- | --- | --- |
| **DOCTOR** | No | git, clean tree, browser, wallet, `harness.yaml` commands exist — then install, build and test on the untouched repo, so a project that was already broken fails here instead of being blamed on the agent |
| **DERIVE** | Yes | Reads the **spec only**, never the code, and writes the **checks** a judge could settle by reading a value. Runs before anything is built, so nothing about the app can shape it |
| **GENERATE** | Yes | Implements the spec. Chooses its own files and whether to write tests |
| **TEST** | No | install, build, test — stopping at the first failure |
| **EVALUATE** | Yes | A second agent judges the running app against the spec, driving a real browser and reading the mirror node. **It cannot see your code** |

Stage detail, artifacts, branches and `--continue`:
[references/run-and-artifacts.md](references/run-and-artifacts.md).

## What DERIVE can take from a spec

A **check** is data, never code — a test file could be edited by the generator
on the next attempt and would mean the harness running the agent's own program
to grade the agent.

Three kinds:

| Kind | `path` | `field` | Use for |
| --- | --- | --- | --- |
| **dom** | a route, `/send` | a CSS selector, `#send-error` | Anything the spec says a user sees. Waits for render, so it works where reading raw HTML does not |
| **http** | a route, `/status` | `status` or `body` | Whether a route exists — not what it shows |
| **chain** | below `/api/v1/`, `accounts/0.0.2` | a dotted path, `balance.balance` | Only where the spec names a specific account, topic or contract |

Each carries one `expect`: `equals`, `matches` (a JavaScript pattern),
`contains`, or `atLeast` — plus `because`, the quoted phrase it came from.

**There are no deltas.** "The balance rose by 2.5" is not a check: the judge
reads its own before and after and stands behind the comparison, rather than
stating it for a machine to confirm.

Everything DERIVE declines still gets judged — by the evaluator, as
judgement. **An empty check list is a fine answer; most specs are mostly
judgement.** `--review` stops the run so you can read the checks before
anything is built.

## Keeping the run honest

These are properties of the harness, not things a spec configures. Know them,
because they decide what a spec can usefully say:

- **The evaluator cannot see your code.** It runs in a directory holding only
  the spec, with the repo denied at the sandbox.
- **A verdict must show its work.** Every claimed failure cites evidence, and
  the harness confirms those files exist before accepting the verdict.
- **A verdict is never re-rolled.** If the evaluator answers, that answer
  stands. Only the *absence* of one earns a second look.
- **Checks are read before anything is built**, so the app cannot shape them.
- **`.env` files can never be staged** — the harness owns the commit.

## Project skills

A run loads skills the **project** carries in `.claude/skills/`, which is what
`npx skills add hedera-dev/hedera-skills` writes. Installing this marketplace
as a Claude Code plugin puts it in your own user settings, which a run
deliberately cannot read — so every teammate gets the same set. `HEDERA_SKILLS_DIR`
points at an extra directory for a project that ships none.

DOCTOR reports the count and carries on: a project without them still runs,
just with less Hedera knowledge behind it.

**These authoring skills are not run skills.** A spec never lists skills.

## Migrating from the recipe model

Harness 1.x/2.x loaded a `.harness/spec.yaml` recipe. Harness 3.x does not
read it at all, so there is nothing to migrate mechanically — write
`harness.yaml` and a markdown spec instead.

| Gone in 3.x | What replaces it |
| --- | --- |
| `.harness/spec.yaml`, `schemaVersion`, `name`, `description` | `harness.yaml` at the repo root; the spec's own title |
| `baseline.commands` | `install` / `build` / `test` / `serve` in `harness.yaml` |
| `.harness/prd.md`, `prd:` lists, **increments** | One markdown spec per run; sequence them with `--continue` |
| `.harness/eval.json`, the evaluate checklist, `E1`/`E2` ids | DERIVE reads checks out of the spec |
| `validators.static`, `validators.commands`, `validators.playwright` | TEST runs your own commands; EVALUATE drives a real browser |
| `requiredFiles`, `forbiddenFiles`, `secretScan`, `constraints` | DOCTOR, and the harness owning the commit |
| ASSERT / SMOKE / EVALUATE / CHAIN stage selection | The fixed five-stage pipeline |
| `maxAttempts`, `agent: cursor` | `--max-attempts`; the agent is Claude Code |
| `harness doctor`, `migrate`, `validate` commands | DOCTOR is a stage of `run`; the other two are gone |
| `templateMetadata`, `chainValidation`, `executableWithTestSigner` | — |

A project still holding a `.harness/spec.yaml` is not an error; it is ignored.
Say so rather than editing it. `.harness/` is now where **runs** are written,
and it is added to `.git/info/exclude`.

## Additional resources

- [GLOSSARY.md](GLOSSARY.md) — the terms, used exactly
- [references/checkable-claims.md](references/checkable-claims.md) — phrasing a spec so claims become checks
- [references/run-and-artifacts.md](references/run-and-artifacts.md) — stages, artifacts, branches, `--continue`
- [references/cli.md](references/cli.md) — commands, flags, environment, requirements
- Upstream: [hedera-harness README](https://github.com/hedera-dev/hedera-harness#readme) and the [docs reference](https://docs.hedera.com/solutions/tools/hedera-harness/reference.md)
