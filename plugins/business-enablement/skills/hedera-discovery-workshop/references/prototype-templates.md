# Prototype Templates — one mockup per pattern row

Used only in SKILL.md Phase 4.5. Each entry below is a spec for a small,
single-flow HTML mockup, not a build guide — when generating the Artifact,
follow the artifact-design/artifact-diagramming guidance for visual quality,
but keep the scope to exactly what's listed here. Every mockup:

- Runs entirely client-side, no real network calls, no API keys.
- Uses the client's real words/numbers from Phases 1-3 wherever a field below
  says "[their X]" — never leave a raw bracket visible in the shown demo.
- Shows a clearly labeled "Simulated preview — not connected to a live
  network" notice somewhere persistent (footer or banner), so it's never
  mistaken for the real pilot.
- Ends on a **verification view**: the screen a non-technical counterparty
  would see, since that's the moment that makes the value tangible.

## Prove a document's integrity and exact timestamp (HCS)

1. Upload screen: a drop zone for "[their document type]" (label it exactly,
   e.g. "Quality Dossier," "Delivery Note").
2. Processing state: brief animation, then a result card showing a mock hash
   (short hex string), a timestamp (use "now"), and a fake sequence/topic ID
   in Hedera's real ID shape (`0.0.xxxxxx`).
3. Verification view: a public-looking page reachable by a link/QR from the
   result card, showing "Document hash matches — sealed on [date/time]" and
   the same mock ID, framed as what "[the counterparty]" would see.

## Trace a physical good through multiple hands (HCS event chain)

1. A horizontal timeline/stepper with 3-5 stops named after the client's real
   process steps (e.g. their custody handoffs), each with a timestamp and a
   short actor label.
2. Clicking a stop expands a small card: mock event ID, timestamp, "recorded
   by [that party]."
3. Verification view: a single page listing the full chain top to bottom, as
   "[the counterparty/auditor]" would see it when asked to confirm
   provenance — framed as "answered in seconds, not days."

## A unique, serialized asset changes ownership (HTS NFT)

1. An asset card for "[the specific unit, e.g. animal ID / land title]" with
   a photo placeholder, its serial/ID, and current owner.
2. A simple "Transfer" action (button, not a form) that produces a mock
   transaction ID and updates the "current owner" field.
3. Verification view: an ownership history list under the asset card (owner,
   date, mock transaction ID per row) — the thing that has value precisely
   because it can't be quietly edited.

## Fractional points or credits move between parties (HTS fungible token)

1. Two simple balance cards (e.g. "[Party A]" and "[Party B]") with a
   starting balance in the client's real unit name (points, credits, shares).
2. A "Send [N] to [Party B]" action producing a mock transaction ID and
   updating both balances live.
3. Verification view: a short transaction list (from, to, amount, mock ID)
   either party could pull up to settle a dispute without calling the other.

## Conditional payment between parties who don't trust each other (Smart contract)

1. A condition card stating the plain-language trigger (e.g. "Payment
   releases when [X] confirms delivery"), with a status pill: Waiting /
   Met / Released.
2. A "Simulate: mark condition met" action that flips the pill and produces a
   mock payment-released event with a mock transaction ID and amount.
3. Verification view: both parties' read-only status page showing the same
   state at the same time — no phone calls needed to confirm "did they pay."

## Multi-party approval that can't be coordinated into one meeting (HSS scheduled tx)

1. A list of named signers (the client's real approvers) each with a
   pending/signed toggle and a timestamp once toggled.
2. A progress indicator ("2 of 3 signed") that completes and reveals a mock
   "Executed" state once all toggle.
3. Verification view: the signed record itself (who signed, when, mock
   schedule ID) as the audit trail anyone could pull later.

## Verify a professional license/credential (DID / Verifiable Credentials)

1. A credential card for "[the license/certification]" holder, with issuer
   name and a status pill (Valid).
2. A "Third party checks this credential" action — a separate simple
   verifier view where entering/scanning an ID returns Valid/Invalid without
   contacting the issuer.
3. Verification view: same as step 2 — that's the whole point of this
   pattern, so don't add a separate screen.

## Report environmental/ESG impact with third-party-auditable trace (Guardian)

1. A claim card (e.g. "[deforestation-free sourcing / carbon credit batch]")
   with the underlying data points that support it (origin, method, date).
2. A "Generate auditable report" action producing a mock policy/report ID.
3. Verification view: an auditor-facing page showing the claim plus every
   underlying data point traceable back to its source — "so the claim
   survives scrutiny, not just an assertion."

## Cross-border payment without banking friction/delay (Stablecoin)

1. A payment form pre-filled with "[their supplier's name/country]" and an
   amount in USD.
2. A "Send" action showing a near-instant mock confirmation with a
   transaction ID and settlement timestamp (contrast this against their
   current wire time, stated earlier in Phase 1).
3. Verification view: a receipt screen both sides could screenshot — no bank
   confirmation call required.
