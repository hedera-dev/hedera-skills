---
name: Hedera Discovery Workshop
description: This skill should be used when a user is preparing for or running a live discovery call with a non-technical external prospect to decide whether Hedera/DLT is worth integrating into an existing business process, and wants to walk the prospect through qualifying questions, present tailored use-case options, and sketch a minimal MVP + architecture on the spot to move toward closing them as a client. Triggered by phrases like "I want to sell Hedera to a client", "discovery call Hedera", "meeting with a non-technical client", "help me structure a Hedera sales call", "present Hedera use cases", "build an MVP live with a client", "business decision maker Hedera", or "does DLT make sense for this business".
---

# Hedera Discovery Workshop

Run a live, structured conversation that takes a non-technical external prospect
from "never heard of Web3" to a scoped MVP proposal in a single sitting. The
user running this skill is the seller (solutions architect / consultant); the
skill guides *them* through what to ask the client, processes the client's
answers, and produces increasingly concrete, presentable outputs.

Two audiences, two registers: everything shown to the client must be jargon-free
and framed in business outcomes. Technical detail (Phase 4) is a short,
confidence-building appendix, not a lecture.

## Phase 1 — Qualify (one hard gate, before anything else)

Before presenting any use case, ask the seller to get this answered by the
client:

> **Are there 2 or more parties in this process who today do NOT fully trust
> each other, and who need to see the same data without depending on one of
> them to confirm it?** (e.g. client and supplier, company and auditor, two
> partners, company and regulator)

This is the single most important qualifying question. DLT only adds value
over a normal database when multiple parties who don't fully trust each other
need a shared source of truth. If there's only one party controlling all the
data end to end, skip straight to the **disqualification branch** below —
recommending Hedera anyway looks like a hammer looking for a nail and burns
credibility with the prospect.

Follow with the standard discovery batch (ask in 2-3 at a time, see
`references/discovery-questions.md` for the full bank and phrasing tips):

1. What's the process today, step by step, and who executes each step?
2. What's the concrete, measurable pain? (hours lost, disputes, failed audits,
   money stuck, fraud risk — get a number if possible)
3. What volume are we talking about? (transactions/units per month)
4. What systems does this already run on? (ERP, spreadsheets, paper, email)
5. If there's a dispute or audit today, how is it resolved, and how long does
   it take?

### Disqualification branch

If Phase 1's gate question comes back "no" (single controlling party, no real
multi-party trust gap), say so plainly to the client and recommend the
non-blockchain alternative instead: digital signatures with PKI/notarial
timestamping, or just a shared database with an audit log. Offer to revisit
Hedera if their business grows into a multi-party model later. Do not force a
use case — an honest "this isn't for you" is what makes the next qualified
prospect trust the recommendation.

## Phase 2 — Present tailored use-case options

Using the client's answers, pick 2-4 rows from
`references/pattern-catalog.md` that plausibly fit their situation. Never
show the whole catalog — that overwhelms a non-technical audience. For each
option, present in plain language:

- What changes for them (usually: "at the point where you already do X, you
  add one small step")
- What problem it solves (tie directly to the pain they described in Phase 1)
- What stays exactly the same (their existing systems, their existing
  workflow — this reassures a nervous non-technical buyer)

Ask the client to pick one (or rank top 2) before moving on. Do not proceed to
architecture until they've chosen — the point is their buy-in, not your
preference.

## Phase 3 — Scope the MVP

Once a pattern is chosen, fill out `references/mvp-template.md` live, with the
client in the room, using their real numbers wherever possible:
- Minimum viable pilot scope (one client/site/product line, few weeks, small
  volume) and why that cut is the fastest way to learn
- What gets anchored/tokenized/scheduled on Hedera vs. what stays manual
- Go/no-go criteria: quantitative (time or cost saved, measurable), qualitative
  (does the counterparty actually value/use the verification), adoption (does
  staff use it without hand-holding), cost ceiling
- A short execution plan (4-6 weeks), explicit about what is deliberately
  **not** built in this phase
- The three possible endings: scale up, stop and use the non-DLT alternative,
  or extend the pilot — decide the thresholds for each now, not after

Keep this phase in the client's language. This document is the thing they
should be willing to sign off on by the end of the call.

## Phase 4 — Sketch the technical architecture (short, credibility, not a spec)

Now go one level technical, but stay brief — 5-10 lines, not a design doc.
State only:
- The exact point of insertion into their existing process (the one new step)
- Which Hedera native service(s) from the chosen pattern row handle it (HCS,
  HTS, smart contract, HSS, DID/Verifiable Credentials, Guardian, stablecoin —
  see `references/pattern-catalog.md` for what each is for)
- How the counterparty verifies (a link, a QR, an upload — something a
  non-technical person can operate)
- That no new servers/infra are required beyond a small script or page

This is the moment that converts "sounds nice" into "this is real and
buildable" for a skeptical technical stakeholder who might be in the room.
The seller should not open code editors or write implementation code
live — that belongs in a follow-up build phase, not the sales conversation.
If a visual prototype would help here, that's Phase 4.5, not hand-written code.

## Phase 4.5 — Generate a live visual prototype (optional, high-impact)

A verbal sketch is often not enough for a non-technical buyer to say yes on
the spot. If there's time left in the call (or as a same-day follow-up), offer
to generate a quick, clickable mockup of the chosen pattern right there — the
seller asks for it in plain language, Claude builds and publishes it as an
Artifact. The seller never writes or touches code; this is not the
"implementation code" Phase 4 warns against, it's a disposable sales prop.

How Claude should build it:
- Pick the mockup for the chosen pattern row from
  `references/prototype-templates.md` — don't design from scratch each time.
- Fill it with the client's own words and numbers from Phases 1-3 (their
  company name, the actual document/asset type, the counterparty's role,
  their real volume) instead of generic placeholders — a demo that uses their
  language lands as "built for us," not "generic template."
- Simulate the Hedera step (a fake-but-realistic transaction ID, timestamp,
  and a mock verification link/QR) — do **not** call a live network or ask
  the seller for real testnet credentials mid-call. Speed and zero setup risk
  matter more than realism here.
- Label the prototype visibly as a simulated preview, not a connected system
  — a non-technical client should never leave the call believing the pilot is
  already live.
- Keep it to the one flow the client picked, end to end (the point of
  insertion, the one new step, the counterparty verification screen) — not a
  multi-screen app. It should take one generation pass, not an iteration
  loop, to stay inside the sales-call pace.

After showing it, ask directly: "is this close to what you pictured for your
team/counterparty?" and fold the answer into Phase 5's close. If the client
wants changes, note them for the real pilot build (Section 4 of
`references/mvp-template.md`, Week 2) rather than iterating the mockup live.

## Phase 5 — Close

Summarize back to the client, in their language: the pain, the chosen use
case, the pilot scope, the go/no-go criteria, and the cost ceiling. Propose
the concrete next step (signed pilot agreement, kickoff date, who does what
in week 1). The goal of this call is to leave with a decision, not a "let me
think about it" — if the client hesitates, find out which specific criterion
from Phase 3 they're unsure about and address that one thing directly rather
than re-pitching the whole idea.

## Notes for the seller running this skill

- If the client asks "why not just use a database", the honest answer is
  Phase 1's gate: a database works fine when one party controls it end to
  end. DLT earns its cost only when there's mutual distrust between parties
  who each need to trust the same fact.
- If mid-conversation it becomes clear the qualifying gate fails after all,
  say so and pivot to the disqualification branch — don't force it through
  to protect the sale. A prospect who gets an honest "no" becomes a referral;
  one who gets oversold becomes a churn risk and a bad reference.
