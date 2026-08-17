# Recipe files

Compact tier 0–1 bodies for writing a **recipe** by hand. Terms:
[GLOSSARY.md](../GLOSSARY.md).

Prefer copying the shipped skeleton when the harness is installed — it is always
current and self-documenting:

```bash
cp -r "$(npm root -g)/hedera-harness/skeletons/project-harness/." .harness/
# or, from a local clone: cp -r <harness>/skeletons/project-harness/. .harness/
```

`hedera-harness init <dir>` provisions the same files as part of bootstrapping a
project. Reconstruct from this page only when neither is available.

## File table

Paths relative to the scaffolded project root (parent of `.harness/`). Every
path is the **default** — omit the key unless you are pointing elsewhere.

| File | Required? | Default path |
|------|-----------|--------------|
| **Recipe file** | Yes | `.harness/spec.yaml` |
| PRD | Yes | `.harness/prd.md` |
| Static validator | Tier 0–1 | `.harness/validators/static.json` |
| Command validator | Tier 0–1 | `.harness/validators/yarn.json` |
| Playwright smoke | Tier 2 | `.harness/validators/playwright-smoke.yaml` |
| **Oracle** | Tier 3 | `.harness/acceptance-contract.json` |

## The minimum viable recipe

This is complete and correct. Do not pad it.

```yaml
schemaVersion: 2

name: my-feature
description: What you want the agent to build in this project.

baseline:
  commands:
    - name: install          # required — also used for install fingerprinting
      command: yarn install
    - name: build
      command: yarn next:build
```

## `.harness/spec.yaml` — with the optional blocks

Everything below `baseline` is the harness default. Uncomment only to override;
changing a commented default here changes nothing.

```yaml
schemaVersion: 2

name: my-feature
description: In-place feature for an already-scaffolded app.

baseline:
  commands:
    - name: install
      command: yarn install
      timeoutMs: 300000      # default is 10 minutes
    - name: lint
      command: yarn lint
    - name: build
      command: yarn next:build

# Which coding agent runs the generator. Presets ship with the harness, so flag
# and model changes arrive with an upgrade instead of an edit here.
# agent: cursor              # or: claude

# Feature description. A list delivers ordered increments onto one branch,
# each with its own attempt budget; a failing increment stops the sequence.
# prd: .harness/prd.md
#
# prd:
#   - .harness/prds/01-foundation.md
#   - .harness/prds/02-ui.md

# maxAttempts: 3             # repair attempts per run before stopping

# Generator skills — domain knowledge for the coding agent. Never authoring
# skills. Names come from the harness skills-index.json.
# skills:
#   - hedera-consensus-service
#   - project-scaffolding

# validators:
#   static: .harness/validators/static.json
#   commands: .harness/validators/yarn.json

# Detected from the project when omitted: packageManager comes from
# package.json / lockfiles, and forbiddenCommands is every manager that is not
# the one in use.
# constraints:
#   packageManager: yarn@3.2.3
#   workspaces:
#     - packages/nextjs
#   forbiddenWorkspaces:
#     - packages/hardhat

# Host template identity — may differ from the feature slug in `name`.
# templateMetadata:
#   name: hedera-demo
#   frontend: nextjs-app
#   solidityFramework: none

# Defaults to .env plus one per workspace, for both the file check and the
# content scan.
# forbiddenFiles:
#   - .env
# secretScan:
#   failOnFiles:
#     - .env
#   patterns:
#     - name: private-key-assignment
#       pattern: "(PRIVATE_KEY|OPERATOR_KEY)\\s*=\\s*(0x)?[0-9a-fA-F]{32,}"

# Files the run must produce. Empty by default — the validators are the gate.
# requiredFiles:
#   - packages/nextjs/app/my-feature/page.tsx

# ── Higher tiers (opt-in) ────────────────────────────────────────────────────
# See tier-strategy.md. Tier 3 needs both `contract` and `validator.enabled`.
```

Removed in v2 — never author these: `seed`, `generator`, `logging`, `extend`,
`extend.baseline`. If you find them, the recipe predates v2; run
`hedera-harness migrate .harness/spec.yaml`.

## `.harness/validators/static.json`

```json
{
  "name": "my-feature-static",
  "description": "Static invariants for my-feature. Adjust equals/contains to match the PRD deliverables.",
  "jsonAssertions": [
    {
      "file": "package.json",
      "path": "packageManager",
      "equals": "yarn@3.2.3"
    }
  ],
  "fileAssertions": {
    "required": [
      "README.md",
      "package.json",
      "packages/nextjs/package.json",
      "packages/nextjs/app/my-feature/page.tsx"
    ],
    "forbidden": [".env", "packages/nextjs/.env"]
  },
  "textAssertions": [
    {
      "file": "README.md",
      "contains": ["yarn install", "yarn next:dev"]
    }
  ]
}
```

Pin **needles** to scripts the project will actually document — not incidental
implementation detail that will churn.

Assert on the *feature deliverables*, not on `template.json`:
create-scaffold-hbar removes `template.json` when it scaffolds an app, so an
assertion against it will fail in a scaffolded project.

## `.harness/validators/yarn.json`

```json
{
  "name": "my-feature-yarn",
  "description": "Post-feature command gate for my-feature.",
  "requiresNoSecrets": true,
  "forbiddenCommands": ["npm install", "npm run", "pnpm install", "pnpm run"],
  "commands": [
    {
      "name": "install",
      "command": "yarn install",
      "timeoutMs": 300000,
      "purpose": "Install workspace dependencies."
    },
    {
      "name": "lint",
      "command": "yarn lint",
      "timeoutMs": 180000,
      "purpose": "Run the project lint script."
    },
    {
      "name": "build",
      "command": "yarn next:build",
      "timeoutMs": 300000,
      "purpose": "Production build (includes TypeScript checks for Next.js)."
    }
  ]
}
```

This file grades the project **after** the feature lands. It is separate from
`baseline`, which proves the project was healthy **before** generation. Both
want a command named `install`.

## PRD stub

See [prd-and-journeys.md](prd-and-journeys.md). Write `.harness/prd.md` with
Goal / Journeys / Hedera services / Non-goals / Deliverables / Acceptance
pointer. For **increments**, write one file per increment under
`.harness/prds/` and list them in order.

## Tier 2 / 3 / 3.5 bodies

Do not embed them here — they drift. Follow
[tier-strategy.md](tier-strategy.md) and
[acceptance-contract-guide.md](acceptance-contract-guide.md).
