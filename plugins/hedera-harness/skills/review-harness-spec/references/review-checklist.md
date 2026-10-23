# Spec review checklist

Work every claim in the spec through part 1, then the spec as a whole through
parts 2 and 3. Severity is fixed per row: **unjudgeable is always a blocker**,
because a claim nobody outside the code can settle cannot be graded and will
either pass vacuously or fail a correct app.

## 1. Per claim

| Test | Fails when | Severity | Rewrite toward |
| --- | --- | --- | --- |
| **Observable from outside** | The claim is about code: a hook, a library, memoisation, a polling interval, "no re-renders" | Blocker | What a user observes instead — "updates without a page reload, roughly every 10s" |
| **Names its element** | A displayed value with no id or selector | Warning | Add the id: `#network-name`. State it as part of the contract |
| **Positive** | "never shows `undefined`", "no console errors" | Warning | What the element *does* show in that state |
| **Text, not state** | "disabled", "hidden", "highlighted", "greyed out" | Warning | What the control *says*: "reads `Enter an amount`" |
| **Unconditional** | "once X completes…", "before any send…" | Warning | A claim true whenever the app is up, or accept it as judgement |
| **No delta** | "rises by 2.5", "increments", "doubles" | Warning | Keep it — but expect judgement, not a check |
| **Names only existing entities** | A check anchored to an account, topic or contract the run will create | Warning | Move to judgement, or name a known existing entity |
| **Not vacuous** | "works correctly", "loads properly", "handles errors" | Blocker | A specific reading: status 200, a substring, a floor |
| **One claim per bullet** | A bullet carrying two assertions joined by "and" | Warning | Split the bullet |
| **Units stated** | A chain amount with no unit | Warning | Say tinybars or HBAR — mirror node values arrive in the units it reports |
| **JavaScript patterns** | A regex using `(?i)` or other inline flags | Warning | `[Nn]ot` — the judge evaluates patterns in JavaScript |
| **Loading state given** | A fetched value with no in-flight behaviour described | Warning | What shows while the request is in flight |
| **Failure state given** | A fetched value with no failure behaviour described | Warning | What shows, and where, when it fails |

The last two are the highest-yield rows in practice. A spec that names its
element and its three states converts almost entirely into checks; one that
names only the happy path converts into judgement and ships `undefined`.

## 2. The spec as a whole

| Test | Fails when | Severity |
| --- | --- | --- |
| Out of scope stated | No section says what not to build | Warning |
| No placeholders | A `harness wizard` guess marker is unresolved | Blocker |
| No file prescriptions | The spec dictates components, files or libraries GENERATE should choose | Warning |
| Routes exist or are being added | A route is named that the app neither serves nor is asked to add | Blocker |
| Consistent with `harness.yaml` | The spec assumes a dev server or build the four commands contradict | Blocker |
| One run's work | The spec spans a data layer, UI and wallet flows | Warning — recommend a sequence with `--continue` |
| Wallet need is intentional | The first green state needs an operator key the feature did not require | Warning |
| Title and intent match | The heading describes something the body does not | Warning |

## 3. Inputs beside the spec

| Test | Fails when | Severity |
| --- | --- | --- |
| `harness.yaml` present | Absent — `harness run` cannot start | Blocker |
| `build` and `serve` set | Either is missing; both are required | Blocker |
| `test` honest | Set to a script that does not exist, rather than `null` | Blocker |
| Tree clean | Uncommitted changes — DOCTOR refuses | Warning (fixable before the run) |
| `package.json` at root | Absent | Blocker |
| Chromium installed | EVALUATE needs it: `npx playwright install chromium` | Warning |
| Project skills present | No `.claude/skills/` and no `HEDERA_SKILLS_DIR` — the run works with less Hedera knowledge. Fix: `npx skills add hedera-dev/hedera-skills` | Warning |

## What not to report

Absences that are correct in 3.x, and were findings under the old recipe model:

- No `schemaVersion`, `name:` or `description:` — there is no recipe file.
- No PRD, evaluate checklist, validator JSON or Playwright config.
- No stage selection — the five stages are fixed.
- No `maxAttempts` in a file — it is `--max-attempts`.
- No `skills:` list — a run loads what the project carries.
- A spec with **no machine checks at all**. Most specs are mostly judgement;
  an empty check list is a fine answer. Report it only when the spec clearly
  meant to pin a value and failed to.
