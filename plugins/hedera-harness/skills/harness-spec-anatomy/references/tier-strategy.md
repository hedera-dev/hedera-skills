# Tier strategy

Enable **tiers** in order. The default is **tier 0–1 only** so the first run
stays cheap. Add higher tiers only after the lower ones are green. Terms:
[GLOSSARY.md](../GLOSSARY.md).

Upstream source of truth:
[docs/authoring-a-recipe.md](https://github.com/hedera-dev/hedera-harness/blob/main/docs/authoring-a-recipe.md).
The shipped skeleton (`skeletons/project-harness/spec.yaml`) carries every tier
block as commented YAML — copy from there when the harness is installed rather
than from this page.

## Enable order

| Tier | Recipe file fields | What it checks | Host prerequisites |
|------|--------------------|----------------|--------------------|
| **0–1** | `validators.static`, `validators.commands`, `requiredFiles`, `forbiddenFiles`, `secretScan` | Files, JSON/text, secrets, install/lint/build | Node ≥ 20, yarn, the agent CLI on PATH |
| **2** | `validators.playwright` | Dev server boots; routes reachable and actually rendered; no console errors; no forbidden text | Playwright browser installed |
| **3** | `contract` + `validator.enabled: true` | Semantic agent grades numbered assertions | Playwright MCP usable headless |
| **3.5** | `chainValidation` (+ tier 3) | Ephemeral ECDSA test signer; real txs; mirror verify | Funded **ECDSA** testnet operator exported in the shell |

Pass condition: every enabled **tier** must pass. Semantic **infrastructure**
failures (MCP or browser missing) **abort** the repair loop rather than counting
as app bugs — the harness will not burn attempts fixing code that was never
broken.

Run `hedera-harness doctor` (without `--recipe-only`) to check host
prerequisites — agent CLI, Playwright browser, MCP reachability — before
enabling a tier.

## Tier 2 — thin Playwright smoke

```yaml
validators:
  playwright: .harness/validators/playwright-smoke.yaml
```

Smoke file shape:

```yaml
name: my-feature-smoke

server:
  command: yarn next:dev
  url: http://localhost:3000
  timeoutMs: 120000

defaults:
  failOnConsoleError: true

routes:
  - name: home
    path: /
  - name: feature
    path: /my-feature

forbidden:
  visibleText:
    - Internal Server Error
    - Application error
    - Unhandled Runtime Error
```

Rules:

- `server.command` / `server.url` match how the project actually starts
- one entry per critical route
- `forbidden.visibleText` for crash banners
- keep it thin — rich UX checks belong in the **oracle**

The tier enforces: server up, route reachable, page rendered (it polls for
hydrated body text), no console errors, no forbidden text. It exists to fail
fast before paying for an agent.

## Tier 3 — semantic oracle + validator agent

1. Write `.harness/acceptance-contract.json` (see
   [acceptance-contract-guide.md](acceptance-contract-guide.md)).
2. Enable both keys:

```yaml
contract: .harness/acceptance-contract.json
validator:
  enabled: true
```

Both are required. One without the other is a misconfigured **recipe** — and
note that `hedera-harness doctor --recipe-only` does **not** catch this pairing,
so `check-spec.sh` does.

The validator inherits the **agent preset** from `agent:`, including how it
receives Playwright MCP. Do not hand-write CLI flags or model names into the
recipe: presets ship with the harness so those change on upgrade. If you find a
`validator.provider` / `validator.command` / `validator.args` block, it is a v1
leftover — migrate.

The validator is adversarial and told to fail on uncertainty. If it cannot reach
the browser it fails the assertion rather than guessing, so a passing tier 3
verdict means something.

## Tier 3.5 — on-chain (advanced, opt-in)

Only when the user wants real transactions graded. Requires tier 3. The harness
provisions an ephemeral funded ECDSA testnet account per run, injects it as the
scaffold burner wallet, and verifies effects against the **mirror node** rather
than UI toasts.

```yaml
chainValidation:
  enabled: true
  network: testnet            # mainnet is rejected by the loader
  operator:
    accountIdEnv: HEDERA_OPERATOR_ID
    privateKeyEnv: HEDERA_OPERATOR_KEY
  fundingHbar: 10
  sweepBack: true
  expose:
    browserLocalStorageKey: burnerWallet.pk
    envVars: []               # e.g. [DEPLOYER_PRIVATE_KEY] for Solidity templates
  # deploy:
  #   commands:
  #     - name: deploy-testnet
  #       command: yarn hardhat:deploy --network hederaTestnet
```

Checklist:

- operator is **ECDSA**, not ED25519 — ED25519 has no EVM alias
- env vars exported in the shell; never written into the workspace
- the project keeps the burner connector enabled so headless signing works
- oracle assertions needing a real tx set `executableWithTestSigner: true`
- for Solidity: map `expose.envVars` and `deploy.commands` so contracts are
  deployed before the app is graded

`executableWithTestSigner` assertions are **inert** unless `chainValidation` is
enabled — do not mark them executable "for later" without enabling the block.

Lifecycle: one account per run directory, reused across repair and continue
attempts, best-effort sweep back to the operator at run end.

## Smoke before a full run

```bash
hedera-harness doctor .harness/spec.yaml --recipe-only   # recipe alone
hedera-harness doctor .harness/spec.yaml                 # + host prerequisites
hedera-harness validate .harness/spec.yaml
hedera-harness validate-semantic .harness/spec.yaml
hedera-harness run .harness/spec.yaml --max-attempts 3
```

Prefer `/review-harness-spec` on the **recipe** before burning generator
attempts.
