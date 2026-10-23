# The run, and what it leaves behind

Stage detail, the artifact tree, branch behaviour, and how `--continue`
decides what to carry on from.

## Stages, in order

**DOCTOR** — deterministic, no agent. A check belongs here only if failing it
would abort a run rather than fail a test; the point is to spend four seconds
instead of forty minutes.

| Checks | Fails the run when |
| --- | --- |
| git present, repo with a commit | — |
| **working tree clean** | anything is uncommitted. The spec file itself is exempt when it lives in the repo |
| browser | Chromium is missing — `npx playwright install chromium` |
| wallet | `HEDERA_OPERATOR_ID` names an account that does not exist or has no balance |
| `harness.yaml` exists | no config — run `harness init` or `harness wizard` |
| each command's script exists | a `yarn x` / `npm run x` names a script absent from the manifest |
| **baseline**: install, build, test on the untouched repo | the project was already broken |
| project skills in `.claude/skills/` | never — it reports the count and carries on |

The baseline runs on **every** run, not just the first, so pre-existing
breakage is never charged to the generator as a failed attempt.

**DERIVE** — an agent reads the spec, and only the spec, and writes the
**checks**. Before anything is built, so the app cannot shape them.
`--review` stops here to confirm.

**GENERATE** — an agent implements the spec, choosing its own files and
whether to write tests.

**TEST** — install, build, test, stopping at the first failure. Later attempts
skip a reinstall nothing has invalidated, by comparing
`install-fingerprint.txt`.

**EVALUATE** — a second agent judges the running app, driving a real browser
and reading chain state from the public mirror node. It reads chain state
before it touches the app and again after, so a change is only visible against
a value written down beforehand.

Failure in TEST or EVALUATE feeds a repair attempt, up to `--max-attempts`
(default 3).

## Artifacts

```
.harness/runs/<timestamp>/
  events.jsonl              every event of the run, one JSON object per line
  spec.md                   what the run was asked to build
  install-fingerprint.txt   manifests as they were, so later attempts skip a
                            reinstall nothing has invalidated
  baseline/                 install.txt, build.txt, test.txt, serve.txt — from
                            before the agent touched anything
  attempt-N/
    generate.jsonl          every message from the building agent
    install.txt             command output, one file per stage that ran
    build.txt
    test.txt
    evaluate.jsonl          every message from the judging agent
    verdict.json            what the evaluator answered, with its accounting of
                            the checklist: both readings and the evidence for each
    feedback.json           what this attempt was told went wrong
    evidence/               screenshots, page snapshots, saved responses
  result.json               { passed, attempts, branch, timings, skills, history }
```

`result.json`'s `history` is one entry per attempt with the failures it
produced and the id each hashes to — which is how a report can say open /
fixed / new.

`.harness/` is added to `.git/info/exclude`, so it never appears in your diffs
and never needs a `.gitignore` entry.

## Reading a finished run

```bash
harness report          # the latest
harness report <run>    # a specific one
harness report --full   # add both agents' full tool feeds
```

A run is watched; a finished run is sat with. `report` answers what the live
output cannot: what each attempt did, what it cost in total, and why you
should believe the verdict.

```
ATTEMPT 2  failed
  generate   20.0s  8 turns · 3 tool calls · ~$0.10
  evaluate   25.0s  verdict: fail — 2 finding(s)
  ! no verdict — asking the same evaluator to finish

  1 open · 1 fixed · 1 new
    /status: still shows undefined [c.png]  (still open)
    test: `yarn test` exited 1

  evidence  attempt-2/evidence/  16 files, 3 screenshots
```

Reach for `--full` when you want to read exactly what the evaluator checked
rather than taking its word.

## Why a verdict is believable

- **The evaluator cannot see the code.** It runs in a directory holding only
  the spec, with the repo denied at the sandbox. Judging the code instead of
  the app is what makes a passing run worthless.
- **A verdict must show its work.** Every failure cites evidence, and the
  harness confirms those files exist before accepting the verdict.
- **The checklist is read before anything is built**, so nothing about the app
  shaped it.
- **The judge checks; the harness keeps the books.** The verdict is not
  accepted until every item is accounted for — both readings, whether it held,
  and the evidence that shows it.
- **A verdict is never re-rolled.** If the evaluator answers, that answer
  stands. Only the *absence* of one earns a second look.

## Branches and interrupting

Each attempt is committed to a `harness/<timestamp>` branch. When the run ends
you are back on the branch you started from.

A run that stops early — interrupted, or out of budget — has already committed
every attempt it completed. Ctrl-C commits the work in progress rather than
discarding it, because a clean tree is what lets you run again.

`harness run --spec <path> --continue` picks up from there: it branches from
that work rather than from yours, and the first attempt starts by repairing
what the last one failed on instead of reading the spec against code that
already exists.

| Situation | What `--continue` does |
| --- | --- |
| The last run failed partway | Repairs what it ended up failing on |
| The last run **passed** | Builds on it — this is how a second spec stacks on the first |
| The run died before any attempt was judged | Tells the first attempt its work is on the branch and to carry it on, rather than handing it the spec as if nothing existed |
| The newest run belongs to another branch | Refuses, and says which branch it belongs to. `.harness/` is shared by every branch, so in a repo holding several apps the newest run may not be yours |
| The run's branch is behind the one you are on | Refuses — switching would drop your commits and the agent would write them again. Merge your branch into the run's first, or drop `--continue` |

## Limits

Every stage is bounded by a clock: generation, evaluation, each command, and
the dev server becoming ready. A breach ends that stage with a reason rather
than hanging the run. A run stops starting new attempts after **four hours**.

There is deliberately **no spend limit by default** — pass `--max-spend` if you
want one.
