# MVP Scope Template

Fill this out live with the client once a pattern from `pattern-catalog.md`
has been chosen. Every `[bracket]` should end the call filled with the
client's actual numbers and words, not placeholders — an MVP scope with
vague fields is not something they can sign off on.

## 1. Minimum scope

- **Pilot boundary:** [one client / one product line / one site], for
  [4-6 weeks], covering [small volume, e.g. "~10-15 units"].
- **Why this cut is right:** pick the toughest/most demanding counterparty or
  highest-friction case — it produces the clearest signal fastest, and if it
  works there, it works everywhere easier.
- **What gets touched by Hedera:** [the specific document/asset/payment from
  the chosen pattern row] — only the hash/token/schedule, nothing else.
- **What stays exactly as-is:** [their ERP, their manual process for
  assembling/producing the thing, their existing communication channel with
  the counterparty]. The only new visible step for staff should be one
  button/action at the point they already finish their existing work.

## 2. Technical flow (keep this section short — see SKILL.md Phase 4)

- **Insertion point:** the exact moment in their current process where the
  new step happens.
- **Tool:** a small script or a minimal internal page — no new servers, no
  new platform to learn.
- **Verification for the counterparty:** a link or QR that lets them check
  without needing any Web3 knowledge.

## 3. Go / no-go criteria

- **Quantitative:** [specific pain metric from discovery] goes from
  [current, e.g. "4 days"] to [target, e.g. "under 4 hours"].
- **Qualitative:** the counterparty confirms the verification mechanism is
  useful and reduces their own manual confirmation work.
- **Adoption:** staff use the new step without extra support after
  [week 3 of the pilot].
- **Cost:** pilot does not exceed [budget ceiling from discovery Q11].

## 4. Short execution plan

- **Week 1:** confirm pilot counterparty/client participation, define exactly
  what gets sealed/tokenized/scheduled.
- **Week 2:** build the script/page. If a simulated prototype was generated
  live in the call (SKILL.md Phase 4.5), start from the client feedback on
  that mockup instead of building from zero.
- **Week 3:** internal dry run on already-completed cases (retroactive, not
  exposed to the counterparty yet).
- **Weeks 4-5:** live pilot on new real cases.
- **Week 6:** measure against Section 3, decide.
- **Explicitly not done in this phase:** [ERP integration, onboarding other
  parties to anchor their own data, automating the underlying document/asset
  creation, extending to other clients/products] — list what's deliberately
  cut so scope doesn't creep mid-pilot.

## 5. Decision at the end

- **Scale up** if at least 3 of the 4 Section 3 criteria are met → next step:
  [extend to remaining volume / bring in other counterparties].
- **Don't scale** if the counterparty doesn't value the verification or
  cost/benefit doesn't beat the manual process → fallback: [PKI/notarial
  timestamp signatures on the same documents, no blockchain].
- **Ambiguous** (metric improves but counterparty doesn't use verification) →
  extend the pilot [4 more weeks] with a second counterparty before deciding.
