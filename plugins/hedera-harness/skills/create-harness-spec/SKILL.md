---
name: create-harness-spec
description: Write a hedera-harness spec — a markdown feature description whose every claim is checkable from outside the app. Use when the user wants to turn a Hedera feature idea into something `harness run` can build and judge.
---

# Create Harness Spec

Turn a Hedera feature idea into a **spec**
[hedera-harness](https://github.com/hedera-dev/hedera-harness) can build and
judge: one markdown file at `specs/<name>.md`.

Load the shared vocabulary first: read
[`../harness-spec-anatomy/SKILL.md`](../harness-spec-anatomy/SKILL.md) and its
[GLOSSARY.md](../harness-spec-anatomy/GLOSSARY.md). Use those terms exactly.

Targets **hedera-harness 3.x**. A project still holding a `.harness/spec.yaml`
is on the old recipe model; harness 3.x ignores that file. Say so rather than
editing it, and write the two v3 inputs instead.

Everything here is authoring. A spec never lists skills — a run loads what the
project carries in `.claude/skills/`.

## Step 1: Decide whether to write it at all

The harness ships an interviewer. Check before doing this by hand:

| Situation | Do this |
| --- | --- |
| The user has no clear idea yet, and the harness is installed | `harness wizard <name>` — an agent reads the project, proposes the four commands with reasoning, then interviews one question at a time and drafts `specs/<name>.md`. Then review it with `/review-harness-spec` |
| The user knows what they want, or wants the spec in this conversation | Carry on here |
| The harness is not installed | Carry on here, and say that `harness run` needs `npm install -g hedera-harness` |

Recommending the wizard is not a failure to help — it reads the project, which
you may not have, and its draft is the better starting point. Offer it, take
the user's answer, and move on.

## Step 2: Confirm the project can be run

A spec is worthless without the config beside it. Check the repo root for
`harness.yaml`:

| State | Do this |
| --- | --- |
| Present | Read it. The four commands tell you the real routes and build setup, which the spec should name |
| Absent | Tell the user to run `harness init` (four questions) or `harness wizard`. Do not hand-write `harness.yaml` — `init` reads the lockfile and manifest and commits it |
| Present but `test:` is `null` | Fine. A repo with no tests is a fact |

Also confirm the tree is clean and there is a `package.json` at the root —
DOCTOR refuses otherwise, and that is cheaper to say now than to discover on
the first run.

## Step 3: Grill the idea into checkable claims

Follow [references/grilling.md](references/grilling.md). Prefer the `/grilling`
skill when it is installed; otherwise use the inline protocol there.

The whole purpose is the detail the user has not thought to give yet: which
element shows the value, what appears while it is loading, what happens when it
fails, what is deliberately out of scope.

**Do not write the file until the user confirms shared understanding.**

**Done when** you can state every claim the feature makes, and for each one say
whether a person using the app could check it without reading the code.

## Step 4: Write `specs/<name>.md`

Markdown, in the user's words, naming this project's real routes and
directories. A shape that works:

```markdown
# Network status page

The page at `/status` shows which Hedera network the app is pointed at.

## What a user sees
- the network name, in an element with id `network-name`
- the latest consensus timestamp, fetched live from the mirror node

## Behaviour
- while the request is in flight the page shows a loading state, not `undefined`
- if the mirror node is unreachable, a readable error appears in `#status-error`

## Constraints
- read-only; no transaction, no operator key
```

Four things decide whether the spec works:

1. **Every assertion is checkable by a person using the running app.** A second
   agent that cannot see the code is what judges it. "The hook polls every 10
   seconds" is not checkable; "the number updates without a page reload,
   roughly every 10 seconds" is.
2. **Name real element ids and routes.** `#network-name`, `/status`. "An
   element showing the network" gives DERIVE nothing to select, so the claim
   falls to judgement when you wanted a check.
3. **One claim per bullet.** A sentence carrying two claims produces a check
   whose quoted origin only half explains it.
4. **Say what is out of scope.** It is the cheapest way to stop the generator
   inventing work the judge will then fail.

Which phrasings become machine checks and which stay judgement:
[`../harness-spec-anatomy/references/checkable-claims.md`](../harness-spec-anatomy/references/checkable-claims.md).
Read it before writing the bullets, not after.

Mark anything you had to guess with an obvious placeholder. An unmarked guess
is the one failure mode the user cannot see.

## Step 5: Completion criterion

There is no schema to validate — a spec is prose. Two real checks instead:

```bash
# 1. Do the derived checks match what you meant? Stops before anything is built.
harness run --spec specs/<name>.md --review

# 2. Does the spec hold up as prose?
#    /review-harness-spec
```

`--review` prints each check with the phrase it came from. Read the quote
against your sentence: a check you did not intend means the sentence reads more
precisely than you meant, and a claim you expected to see missing means it
needs interpretation.

**Done when** `--review` shows checks whose quoted origins you recognise, and
every placeholder is resolved.

## Step 6: Handoff

```bash
harness run --spec specs/<name>.md                  # default 3 attempts
harness run --spec specs/<name>.md --max-attempts 5
harness report                                      # read the finished run
```

A second feature stacks on the first with `--continue`, which branches from the
passing run's work rather than from yours.

## Additional resources

- [references/grilling.md](references/grilling.md)
- Vocabulary: [`../harness-spec-anatomy/SKILL.md`](../harness-spec-anatomy/SKILL.md)
- Phrasing: [`../harness-spec-anatomy/references/checkable-claims.md`](../harness-spec-anatomy/references/checkable-claims.md)
- CLI and environment: [`../harness-spec-anatomy/references/cli.md`](../harness-spec-anatomy/references/cli.md)
- Companion: `/review-harness-spec`
