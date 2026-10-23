# Writing claims DERIVE can check

DERIVE reads the **spec** — only the spec, never the code — and writes down
the claims a judge could settle by reading a value. Everything it declines is
still judged, as **judgement**. This file is how to phrase a claim so it lands
where you intended.

Two things worth holding on to before the rules:

- **An empty check list is a fine answer, and a better one than a check that
  had to be invented.** Most specs are mostly judgement. The goal is not to
  maximise checks; it is to make the mechanical ones unambiguous.
- **A check that misreads your prose fails an app that is correct.** That is
  the real cost of vague phrasing, and it is worse than having no check.

## The three kinds

| Kind | `path` | `field` | Reach for it when |
| --- | --- | --- | --- |
| **dom** | a route, `/send` | a CSS selector, `#send-error` | The spec says a user *sees* something. Default choice: it waits for the page to render, so it works where reading raw HTML does not |
| **http** | a route, `/status` | `status` or `body` | You mean *does this route exist / respond*, not what it displays |
| **chain** | below `/api/v1/`, `accounts/0.0.2` | a dotted path, `balance.balance` | The spec names a specific, already-existing account, topic or contract |

One `expect` per check:

| `expect` | Means | Note |
| --- | --- | --- |
| `equals: 200` | Exact match | |
| `contains: "testnet"` | Substring | |
| `matches: "[Nn]ot found"` | Pattern | **JavaScript**, evaluated in `node` or the browser console — no inline flags, so write `[Nn]ot`, never `(?i)not` |
| `atLeast: 1` | Numeric floor | The only comparison available |

Chain values arrive **in the units the mirror node reports** — tinybars for a
balance, not HBAR. Say which you mean.

## The rules, and what each one rejects

**Only what the spec states plainly.** DERIVE is reading your words, not
guessing an implementation. A claim needing interpretation is left to the
judge.

**Nothing that depends on what the run creates.** You cannot name an account
the app will make, a contract it will deploy, or a transaction it will send —
none exist when DERIVE runs. Those are judged later by the agent that watched
it happen.

> ✗ `the new topic's sequence number reaches 1`
> ✓ `after submitting, the page shows the topic id in #topic-id` — judgement,
> and correctly so

**A dom check reads text, not state.** It gets what the element *shows*. A
spec saying a control is disabled, a field hidden, or a row highlighted is
describing state; matching `disabled` against `Send` fails an app doing exactly
what was asked.

> ✗ `the submit button is disabled until an amount is entered`
> ✓ `the submit button reads "Enter an amount" until an amount is entered`

**Nothing conditional.** A check has no way to know which moment it is looking
at, so it asserts the condition always held. Take only claims true whenever
the app is up.

> ✗ `once the send completes, the transaction id appears in #tx-id`
> ✗ `before a send, neither element exists`
> ✓ `#tx-id is present on /send at all times, empty until a send completes`

**Nothing vacuous.** `matches: ".*"` and `contains: ""` hold against a blank
page. If you cannot say what would make it fail, it is not a check.

**No deltas.** "The balance rose by 2.5" needs a value from before the action.
The harness does not read one — the judge reads its own before and after, and
stands behind the comparison. Write the relative claim and let it be
judgement; do not try to phrase it into a check.

**Quote-ability.** Every check records `because`: the phrase in the spec it
came from. A sentence carrying two claims produces a check whose `because`
only half explains it. One claim per bullet.

## Phrasing that moves a claim across the line

| Vague — becomes judgement, or a wrong check | Sharp — becomes a check |
| --- | --- |
| the page loads correctly | `/status` returns HTTP 200 |
| the network name is displayed | `#network-name` shows `testnet` |
| errors are handled gracefully | a readable message appears in `#status-error` |
| it shows the balance | `#balance` matches `[0-9]` |
| the treasury is funded | `accounts/0.0.2` has `balance.balance` of at least 1 |
| the list is populated | `#tx-list` contains `0.0.` |
| no raw `undefined` leaks to the user | `#balance` does not… → **not expressible**; say what it *does* show instead |

The last row is the one to internalise: there is no negative expectation. State
the positive thing the element shows.

## Naming selectors and routes

A dom check is only as good as the selector, and DERIVE can only use a
selector the spec gives it.

- Name element ids explicitly — `#network-name`, `#status-error`. "an element
  showing the network" gives DERIVE nothing to select.
- Prefer ids you are asking the generator to create, and say so in the spec, so
  the id is part of the contract rather than an accident of implementation.
- Name routes with their leading slash, as the app serves them.

## Reviewing what DERIVE produced

`harness run --spec <path> --review` stops after DERIVE and prints the checks
before anything is built:

```
  I will also verify, from this spec:
    http:/status:status:equals=200  — "The page at `/status` must return HTTP 200."
```

Read the `because` against your sentence. Three outcomes worth acting on:

| What you see | What it means |
| --- | --- |
| A check you did not intend | The sentence reads more precisely than you meant — loosen it, or accept the check |
| A claim you expected, absent | It needs interpretation. Fine if deliberate; otherwise sharpen the phrasing |
| A check whose `because` only half-matches | One sentence carried two claims. Split the bullet |

The checks land in `runs/<timestamp>/attempt-N/` alongside the verdict, so the
same reading is available after the fact.
