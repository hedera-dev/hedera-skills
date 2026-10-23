# Grilling an idea into a spec

Prefer the Matt Pocock `/grilling` skill when it is available (Cursor /
`npx skills`). **Claude Code** usually will not have it — use this protocol
instead. Either way, walk the decision tree below.

The harness has its own interviewer, `harness wizard <name>`, which has read
the project. When the user has no clear idea yet, that is the better tool —
see step 1 of the skill. This protocol is for when the spec is being written
here.

## Protocol

1. Interview until you reach a shared understanding of the feature. Walk the
   decision tree in order, resolving each dependency before the next.
2. Ask **one question at a time** and wait for the answer. A list of questions
   is bewildering and gets a thin answer to each.
3. Give your **recommended answer** with each question.
4. If a *fact* can be found by reading the repo, look it up rather than asking.
   Decisions belong to the user; facts do not.
5. Do **not** write files until the user confirms shared understanding.

### Facts to look up, never ask

- Does `harness.yaml` exist, and what are its four commands? They name the real
  build and dev-server setup the spec should be consistent with.
- What routes and pages does the app already ship? Absorb them. Do not quiz the
  user about the scaffold or ask them to phrase the feature around it.
- Where do components, hooks and pages live, and what conventions would someone
  adding a feature follow?
- Is the tree clean, and is there a `package.json` at the root? DOCTOR refuses
  otherwise.
- Is `hedera-harness` installed, and at what version? `harness --help`.
- Does a stale `.harness/spec.yaml` exist? Harness 3.x ignores it — mention it
  once, do not edit it.

## Decision tree

**1. Product goal.** One paragraph: what the feature is, who it is for, and
what "done" looks like **in a browser**.

*Recommend:* a first feature whose green state needs no operator key, `.env`,
or funded wallet. If the first thing a visitor sees requires credentials, the
judge has a harder time reaching any passing state. Name that cost, then accept
whatever they choose.

**2. Spec name.** Kebab-case; becomes `specs/<name>.md`.
*Recommend:* a short product noun — `network-status`, `proof-wall`.

**3. Routes.** Which paths does the feature add or change? Name them with the
leading slash, as the app serves them.
*Recommend:* only the routes this run will actually ship.

**4. What a user sees, element by element.** The highest-value part of the
interview, and the part users skip. For each value the feature displays:

- Which element shows it? **Ask for an id** — `#network-name`, `#status-error`.
  An id in the spec is part of the contract; "an element showing the network"
  gives DERIVE nothing to select, so the claim falls to judgement when a check
  was wanted.
- What does it show while the data is in flight?
- What does it show when the request fails?
- What does it show before the user has done anything?

Push for the loading and failure answers specifically. "It shows the balance"
with no loading state is how `undefined` ships.

**5. Hedera services and direction.** HCS, HTS, HSS, mirror reads, system
contracts — and for each, read or write.

*Recommend:* name the services in the spec so the generator picks the right
project skills. Reads are checkable against the mirror node when the spec names
a **specific existing** account, topic or contract; writes create entities that
do not exist when DERIVE runs, so they are judged rather than checked.

**6. Wallet and operator.** Which journeys need a connected wallet or a funded
operator?

*Recommend:* if any do, confirm the user has a funded **ECDSA** testnet account
and that `HEDERA_OPERATOR_ID` / `HEDERA_OPERATOR_KEY` are set — DOCTOR checks
the account exists and has a balance, and fails the run before any agent
starts if not. A read-only first feature avoids this entirely.

**7. Out of scope.** What should the generator deliberately not build?

*Recommend:* always answer this. It is the cheapest way to stop the generator
inventing work the judge then fails the run on.

**8. Scope.** Can one run land this?

*Recommend:* **one spec**. The repair loop gets three attempts at it. Split only
when the feature spans layers one session cannot reliably deliver — a data
layer, then UI, then wallet flows — and then sequence them as separate specs
run with `--continue`, each leaving the app green on its own. There is no
multi-increment spec format in 3.x.

**9. Confirm shared understanding.** Summarise: name, routes, the elements and
their three states, services, wallet need, out of scope, and whether this is
one spec or a sequence. Wait for an explicit go-ahead before writing.

## Anti-patterns to push back on

- **Claims about the implementation.** "The hook polls every 10 seconds", "uses
  React Query", "the component is memoised". The judge cannot see the code, so
  these are unjudgeable. Convert to what a user observes: "the number updates
  without a page reload, roughly every 10 seconds".
- **No element ids.** The most common reason a claim the user expected to be
  checked ends up as judgement.
- **Negative claims.** "Never shows `undefined`", "no errors in the console".
  There is no negative expectation; state what the element *does* show.
- **Deltas.** "The balance rises by 2.5" needs a before-value the harness does
  not read. Write it anyway if it is what they mean, and expect it to be
  judgement rather than a check.
- **Naming entities the run will create.** "The new topic's sequence number
  reaches 1" cannot be checked — the topic does not exist when the checks are
  written.
- **State phrased as text.** "The button is disabled" cannot be read from an
  element's text. Ask what the control *says* instead.
- **Conditional claims phrased as absolutes.** "Once the send completes the id
  appears" describes a moment; a check asserts the condition always held.
- **Splitting what one run could deliver.** Each extra run is a full
  DOCTOR-to-EVALUATE cycle.
- **Prescribing files.** GENERATE decides which files to touch and whether to
  write tests. A spec that dictates a file layout constrains it for nothing.
- **Hand-writing `harness.yaml`.** `harness init` reads the lockfile and
  manifest and commits the result.
