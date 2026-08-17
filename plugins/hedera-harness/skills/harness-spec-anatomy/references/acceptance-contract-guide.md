# Acceptance contract guide

The acceptance contract is the **oracle** for tier 3. The semantic validator
grades the running app against these assertions — not the raw PRD. Keep the
run **blind**. Default path is `.harness/acceptance-contract.json`.
Terms: [GLOSSARY.md](../GLOSSARY.md).

The harness does not ship an acceptance-contract skeleton — the worked example
below is the reference. Enable it with **both** keys, or the tier is
misconfigured:

```yaml
contract: .harness/acceptance-contract.json
validator:
  enabled: true
```

Set `"prd"` to the PRD path (`.harness/prd.md`, or the specific increment file
when `prd:` is a list).

## Derive assertions from PRD journeys

1. List each journey from the PRD.
2. For each journey, write 1–3 assertions that a browser agent can verify.
3. Prefer few **critical** assertions (app loads; core journey possible).
4. Put deep product semantics here — not in the Playwright smoke YAML.

## Assertion fields the loader / grader care about

| Field | Purpose |
|-------|---------|
| `id` | Stable id (`C1`, `C2`, …) — repair prompts cite these |
| `journey` | Human label matching a PRD journey |
| `route` | Path the validator should visit |
| `severity` | `critical` \| `major` \| `minor` |
| `walletRequired` | Whether the flow needs a wallet |
| `verifiableWithoutCredentials` | Can pass with no `.env` / funded account |
| `executableWithTestSigner` | Only with tier 3.5 `chainValidation`; run real tx + mirror check |
| `statement` | What must be true |
| `howToVerify` | Concrete browser (and mirror) steps |

## evaluationRules posture

Keep fail-closed language (matches the worked example below):

- `posture: adversarial`
- `failOnUncertainty` — absence of evidence is a failure
- Credentials must not excuse a broken read path
- Wallet-gated without a test signer = affordance-only
- With a test signer, `executableWithTestSigner: true` assertions must execute
  end-to-end and verify via the testnet mirror node
- Every verdict cites observed evidence

## Severity budget

| Severity | Meaning | Budget tip |
|----------|---------|------------|
| `critical` | Route/app broken or core journey impossible | Prefer 1–2; too many = run almost never passes |
| `major` | Required PRD capability missing on read/affordance level | Most product assertions |
| `minor` | Coherence / docs gap | Optional polish |

## Worked example (HCS feed demo)

PRD journeys: browse empty feed; wallet-gated "post message".

```json
{
  "name": "hcs-feed-acceptance",
  "template": "hcs-feed",
  "prd": ".harness/prd.md",
  "version": 1,
  "description": "Browser-verifiable acceptance contract for hcs-feed.",
  "routes": ["/", "/feed"],
  "evaluationRules": {
    "posture": "adversarial",
    "failOnUncertainty": "If an assertion cannot be positively verified from the running app, mark it FAILED, not passed. Absence of evidence is a failure.",
    "credentials": "The app must load and be browsable without any .env file, private keys, or funded testnet account. Missing credentials must not excuse a broken read path.",
    "walletGatedFlows": "When the harness provides a Test Signer: assertions flagged executableWithTestSigner=true MUST be executed end-to-end and verified via the testnet mirror node. Other walletRequired assertions stay affordance-only. When no Test Signer is provided, treat all walletRequired as affordance-only.",
    "onChainVerification": "For executableWithTestSigner assertions, confirm effects via https://testnet.mirrornode.hedera.com (topics/messages/tokens/contracts as relevant). Poll up to ~30s for mirror lag.",
    "evidence": "Every verdict issue must cite what was observed (route visited, element found/absent, console output, mirror responses for on-chain flows).",
    "severityMeaning": {
      "critical": "Route/app is broken or a core journey is impossible; run cannot pass.",
      "major": "A required PRD capability is missing or non-functional on the read/affordance level.",
      "minor": "Coherence or documentation gap that degrades the demo but does not break a journey."
    }
  },
  "assertions": [
    {
      "id": "C1",
      "journey": "Open the demo",
      "route": "/",
      "severity": "critical",
      "walletRequired": false,
      "verifiableWithoutCredentials": true,
      "statement": "The home route renders the demo primary UI without a wallet and without runtime/console errors.",
      "howToVerify": "Navigate to /. Confirm primary content is visible and the browser console shows no uncaught errors or crash banners (Internal Server Error, Application error, Unhandled Runtime Error)."
    },
    {
      "id": "C2",
      "journey": "Browse feed",
      "route": "/feed",
      "severity": "major",
      "walletRequired": false,
      "verifiableWithoutCredentials": true,
      "statement": "The feed route shows an empty state or message list and a clear network/topic context without requiring a wallet.",
      "howToVerify": "Navigate to /feed. Confirm empty-state or list UI is visible; no crash banners."
    },
    {
      "id": "C3",
      "journey": "Wallet-gated post",
      "route": "/feed",
      "severity": "major",
      "walletRequired": true,
      "verifiableWithoutCredentials": true,
      "statement": "A post/submit control is visible and explains that a wallet/testnet is required; visiting without connecting does not crash.",
      "howToVerify": "Navigate to /feed without connecting. Confirm the affordance and messaging; do not submit an on-chain tx unless a Test Signer is provided and this assertion is marked executableWithTestSigner."
    }
  ]
}
```

Add a fourth assertion with `"executableWithTestSigner": true` only when enabling
`chainValidation` (tier 3.5).
