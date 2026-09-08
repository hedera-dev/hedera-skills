# Hedera Skills

A marketplace of plugins and skills for AI coding agents. Includes Hedera-specific development tools and general-purpose dev workflow intelligence. Each plugin contains packaged instructions, references, and examples that extend agent capabilities.

## Installation

### Claude Code

```bash
# Add the Hedera marketplace
/plugin marketplace add hedera-dev/hedera-skills

# Install individual plugins
/plugin install agent-kit-plugin
/plugin install system-contracts
/plugin install oracles
/plugin install cross-chain
/plugin install native-services-js
/plugin install hackathon-helper
/plugin install hedera-harness
/plugin install dev-intelligence
/plugin install agent-identity
```

### Other Agents (npx skills)

```bash
npx skills add hedera-dev/hedera-skills
```

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

## Available Plugins

### agent-kit-plugin

Comprehensive guide for creating custom plugins that extend the Hedera Agent Kit. Enables developers to add new tools for Hedera network interactions.

**Use when:**

- Creating a new plugin for Hedera Agent Kit
- Adding custom tools for Hedera network operations
- Learning plugin architecture and patterns
- Building mutation tools (token creation, transfers)
- Building query tools (balance queries, token info)

**Topics covered:**

- Quick start guide (5-step process)
- Plugin interface documentation
- Tool interface specifications
- Zod schema patterns for Hedera types
- Prompt writing patterns
- Error handling and output parsing
- Working code examples (simple-plugin, token-plugin)

**References included:**

- `plugin-interface.md` - Complete interface and type definitions
- `zod-schema-patterns.md` - Parameter validation patterns for Hedera operations
- `prompt-patterns.md` - Effective tool description writing
- `error-handling.md` - Error handling and output parsing patterns

### system-contracts

Technical references for Hedera system contracts — the precompiled smart contract APIs for interacting with Hedera native services from Solidity.

**Skills included:**

- **hts-system-contract** — Hedera Token Service system contract (`0x167`). Token creation (fungible and NFT), minting, burning, transfers, association model, key system, fees, and compliance features.
- **hss-system-contract** — Hedera Schedule Service system contract (`0x16b`). Scheduling native HTS token creation, generalized scheduled contract calls, and schedule signing from contracts (HIP-755, HIP-756, HIP-1215).

**Use when:**

- Writing Solidity contracts that interact with HTS or HSS
- Creating or managing tokens via smart contracts
- Scheduling transactions from within contracts
- Understanding HTS response codes and error handling
- Configuring token keys and permissions
- Working with token fees and compliance features

**References included (HTS):**

- `api.md` - HTS contract API reference (Solidity signatures)
- `structs.md` - Data structure definitions (HederaToken, TokenKey, Expiry)
- `response-codes.md` - Response codes with troubleshooting
- `keys.md` - Token key system reference
- `fees.md` - Fee structure information
- `compliance.md` - Compliance-related features
- `troubleshooting.md` - Common issues and solutions

**References included (HSS):**

- `api.md` - HSS contract API reference (Solidity signatures)

### oracles

Hedera price oracle integrations — one skill per provider, matching the cross-chain plugin layout. Skills stay generic (read/update rules, Hedera quirks, where to source IDs). Project-specific adapter names, deploy runbooks, and feed tables belong in the consuming repo’s `AGENTS.md`.

**Skills included:**

- **chainlink-data-feeds** — AggregatorV3 Data Feeds on Hedera (`latestRoundData` completeness, staleness, decimal normalization). Not CCIP.
- **supra-push-oracle** — Supra S-Value push (`getSvalue`), millisecond timestamps, and USDT-quoted pairs on Hedera.
- **pyth-price-feeds** — Pyth pull feeds: Hermes update payloads, payable `updatePriceFeeds`, `getPriceNoOlderThan`, confidence, and signed `expo` normalization.

**Use when:**

- Reading Chainlink Data Feeds on Hedera testnet (`296`) or mainnet (`295`)
- Integrating Supra push oracles and converting Hedera timestamps to unix seconds
- Pulling Pyth prices via Hermes updates before on-chain reads
- Normalizing provider decimals / exponents to a consumer price scale

**References included:**

- `examples.md` - Provider read / update sketches per skill
- `hedera-feeds.md` - Where to source Hedera feed addresses, Supra pair IDs, and Pyth price IDs

### cross-chain

Cross-chain interoperability patterns for Hedera — Axelar GMP, LayerZero V2 OFT, and Chainlink CCIP CCT bridges, with peer/gas/selector wiring, allowlisting, and bridge-agnostic orchestration seams.

**Skills included:**

- **axelar-gmp** — Axelar Gateway `callContract`, gas service payment, `AxelarExecutable` receivers, Hedera↔EVM wiring, and `IBridgeSender` / handler split (as used by cross-chain DCA orchestration + HSS).
- **layerzero-messaging** — LayerZero V2 OFT / OApp on Hedera: Endpoint peers, ULN/DVN/executor config, `quoteSend`/`send`, and HTS-backed connector OFTs (mint/burn via `0x167`).
- **ccip** — Chainlink CCIP burn-and-mint Cross-Chain Tokens: chain selectors, TokenAdminRegistry, `ccipSend`, and Hedera HTS-backed wrappers vs vanilla ERC-20. Not Data Feeds.

**Use when:**

- Sending cross-chain contract calls from Hedera via Axelar GMP
- Implementing `AxelarExecutable` receivers on EVM destinations
- Wiring destination/source addresses after dual-chain deploys
- Separating bridge transport from destination business logic
- Combining HSS scheduled execution with Axelar message dispatch
- Building Hedera↔EVM OFT bridges with LayerZero V2
- Configuring `setPeer`, send/receive libraries, and enforced options
- Implementing HTS connector OFTs (burn on send / mint on receive)
- Bridging burn-and-mint tokens with Chainlink CCIP
- Registering CCIP token pools and wiring remote chain selectors
- Using an HTS-backed CCIP wrapper (users hold native HTS; CCIP sees the wrapper)

**References included:**

- `examples.md` - Sender, receiver, orchestrator, executor, OFT, CCIP register/wire/send, and HTS dual-approve skeletons
- `hedera-axelar.md` - Testnet gateway/gas addresses, Axelar chain names, env vars
- `hedera-endpoints.md` - LayerZero EIDs, Endpoint V2, ULN, DVN, and executor addresses
- `hedera-ccip.md` - CCIP selectors vs chain IDs, router/registry lookup, HTS wrapper notes

### native-services-js

Comprehensive guides for using Hedera native services with the Hiero JavaScript SDK, plus x402 pay-per-use payment patterns on Hedera.

**Skills included:**

- **hedera-token-service** — Token creation (fungible and NFT), minting, burning, transfers, key roles, compliance operations (KYC, freeze, wipe, pause), airdrops, and custom fees using the Hiero JS SDK.
- **hedera-consensus-service** — Topic creation, message submission with chunking support, subscription patterns via mirror nodes, topic management, and common patterns (event logs, pub/sub).
- **x402-payments** — x402 HTTP 402 pay-per-use with native HBAR: FileRegistry metadata, self-hosted facilitator verify/settle, and HashPack client payment retries.

**Use when:**

- Building JavaScript/TypeScript apps that interact with Hedera Token Service
- Creating, minting, or transferring tokens using the Hiero JS SDK
- Working with Hedera Consensus Service topics and messages
- Setting up custom fees, compliance operations, or airdrops
- Subscribing to topic messages via mirror nodes
- Gating downloads or APIs behind x402 HBAR payments on Hedera
- Wiring a self-hosted x402 facilitator or ExactHederaScheme resource server

**References included (HTS):**

- `api-reference.md` - Hiero JS SDK API reference for HTS
- `custom-fees.md` - Custom fee configuration (fixed, fractional, royalty)

**References included (HCS):**

- `api-reference.md` - Hiero JS SDK API reference for HCS

**References included (x402):**

- `examples.md` - FileRegistry, resource server, and client retry skeletons
- `facilitator.md` - Facilitator endpoints, fee-payer env vars, Docker infra

### hackathon-helper

Two skills for Hedera hackathon participants: project planning and submission validation, both aligned to the official judging criteria. Compatible with any AI coding agent that supports skills (Claude Code, Codex, Gemini CLI, etc.).

**Skills included:**

- **hackathon-prd** - Interactive PRD generator. Asks participants to paste their bounty/track context, gathers project details, then generates a comprehensive PRD (`HACKATHON-PRD.md`) with a predicted score and improvement tips.
- **validate-submission** - Codebase reviewer. Scans the repo for Hedera integration depth, code quality, and documentation, then produces a weighted scorecard against all 7 judging criteria with prioritized action items.

**Use when:**

- Starting a Hedera hackathon project and need a structured plan
- Want to ensure your project addresses all judging criteria
- Ready to validate your submission before the deadline
- Need to identify quick wins to improve your hackathon score

**Judging criteria covered:**

- Innovation (10%) - Novelty in the Hedera ecosystem
- Feasibility (10%) - Web3 necessity, business model, domain knowledge
- Execution (20%) - MVP quality, code quality, UI/UX, strategy
- Integration (15%) - Hedera service depth, ecosystem partners, creativity
- Validation (15%) - Market feedback, early adopters, traction
- Success (20%) - Hedera account growth, TPS impact, audience exposure
- Pitch (10%) - Problem/solution clarity, metrics, Hedera representation

### hedera-harness

Three skills for creating and reviewing [hedera-harness](https://github.com/hedera-dev/hedera-harness) recipes — the PRD, recipe file, validators, Playwright smoke, and evaluate checklist that drive in-place Scaffold HBAR feature work. Schema v3. Works in Claude Code (marketplace plugin) and Cursor / other skill-capable agents.

**Skills included:**

- **harness-spec-anatomy** — Shared vocabulary (recipe / slug / blind / evaluate checklist / stage / needle). Single source of truth for file layout and the mechanical `check-spec.sh` script.
- **create-harness-spec** — Grills a product idea one question at a time, then emits an ASSERT recipe (optional SMOKE / EVALUATE / CHAIN). Prefers Matt Pocock `/grilling` when available; Claude Code uses the inline protocol.
- **review-harness-spec** — Two-axis audit (Wiring via `check-spec.sh` + Eval judgment) before a run.

**Use when:**

- Turning a Hedera feature idea into hedera-harness inputs
- Writing a harness PRD, recipe file, or evaluate checklist
- Reviewing a harness recipe before `hedera-harness run`
- Deciding which validation stages to enable and in what order
- Splitting a feature into ordered `prd:` / `eval:` increments

**Important:** These are **authoring** skills. Recipes do not list skills — product plugins are discovered per run and the generator picks. Keep authoring skills as marketplace plugins.

### dev-intelligence

AI development workflow toolkit — session continuity, quality gates, project scaffolding, and tech debt tracking for any codebase. Works with any language or framework.

**Skills included:**

- **session-management** — Report registry (15 categories), tech debt tracker (P0-P3 priorities), archive strategy for keeping session state lean across conversations.
- **quality-gates** — PostToolUse auto-validation hooks for TypeScript, Python, Rust, and Go. Deploy checklists and local CI pipeline patterns.
- **project-scaffolding** — Generate CLAUDE.md and `.claude/` directory structure for any project. Auto-detects stack, naming conventions, and build commands.

**Commands included:**

- `/continue` — Resume work with full context (git log, registry, tech debt)
- `/init` — Scaffold a project for AI development (interactive setup)
- `/debt` — View and manage tech debt tracker
- `/health` — Run project health check (git, tests, lint, dependencies)

**Use when:**

- Starting a new project and want AI-ready scaffolding
- Resuming work and need to pick up where you left off
- Want automatic validation after every file edit
- Tracking tech debt across sessions
- Running pre-deploy or pre-push quality checks

**Hooks included:**

- PostToolUse (Edit/Write) — Auto-runs stack-appropriate linter/type-checker after every edit

### agent-identity

HCS-14 agent identity, registration, and discovery on Hedera — giving AI agents an on-chain identity using Universal Agent IDs (UAIDs), HCS-2 registry topics, and HCS-11 profiles, with discovery via the Mirror Node REST API and bridging to ERC-8004, A2A, and x402.

**Skills included:**

- **hcs-14-agent-identity** — UAID generation (AID deterministic hash + DID self-sovereign), HCS-2 registry topic creation, agent and provider registration, Mirror Node discovery with pagination and profile resolution, capability/service descriptors, and cross-protocol bridging (ERC-8004, A2A, x402).

**Use when:**

- Giving an AI agent an on-chain identity on Hedera
- Registering an agent or provider to an HCS registry topic
- Discovering agents by reading registry topics via the Mirror Node REST API
- Generating or parsing Universal Agent IDs (UAIDs)
- Bridging Hedera agent identity to ERC-8004, A2A, or x402
- Building agentic payment systems that need identity + discovery

**References included:**

- `uaid-format.md` - UAID grammar, parsing, validation, canonicalization, and generation
- `mirror-node-discovery.md` - Mirror Node REST API endpoints for reading registry topics and resolving profiles
- `erc-8004-bridge.md` - How HCS-14 maps to ERC-8004 on-chain agent identity registries

**Examples included:**

- `register-agent.ts` - Full agent registration flow (registry topic + UAID + profile + registration)
- `discover-agents.ts` - Discovery via Mirror Node REST API with pagination and profile resolution
- `register-provider.ts` - Provider/operator registration with child agent registration

**Design principle:** Identity registration, discovery, and payment evidence (x402) are kept as separate concerns. Trust and reputation are computed downstream from typed claims.

## Marketplace Structure

```
hedera-skills/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace manifest
├── plugins/
│   ├── agent-kit-plugin/     # Agent Kit plugin development
│   │   └── skills/
│   │       └── agent-kit-plugin/
│   │           ├── SKILL.md
│   │           ├── examples/
│   │           └── references/
│   ├── hackathon-helper/     # Hackathon PRD & validation
│   │   └── skills/
│   │       ├── hackathon-prd/
│   │       │   ├── SKILL.md
│   │       │   └── references/
│   │       └── validate-submission/
│   │           ├── SKILL.md
│   │           └── references/
│   ├── system-contracts/     # Hedera system contract references
│   │   └── skills/
│   │       ├── hts-system-contract/
│   │       │   ├── SKILL.md
│   │       │   └── references/
│   │       └── hss-system-contract/
│   │           ├── SKILL.md
│   │           └── references/
│   ├── oracles/              # Price oracles (Chainlink, Supra, Pyth)
│   │   └── skills/
│   │       ├── chainlink-data-feeds/
│   │       │   ├── SKILL.md
│   │       │   └── references/
│   │       ├── supra-push-oracle/
│   │       │   ├── SKILL.md
│   │       │   └── references/
│   │       └── pyth-price-feeds/
│   │           ├── SKILL.md
│   │           └── references/
│   ├── cross-chain/          # Cross-chain interoperability (Axelar, LayerZero)
│   │   └── skills/
│   │       ├── axelar-gmp/
│   │       │   ├── SKILL.md
│   │       │   └── references/
│   │       ├── layerzero-messaging/
│   │       │   ├── SKILL.md
│   │       │   └── references/
│   │       └── ccip/
│   │           ├── SKILL.md
│   │           └── references/
│   ├── native-services-js/   # Hedera native services + x402 payments
│   │   └── skills/
│   │       ├── hedera-token-service/
│   │       │   ├── SKILL.md
│   │       │   └── references/
│   │       ├── hedera-consensus-service/
│   │       │   ├── SKILL.md
│   │       │   └── references/
│   │       └── x402-payments/
│   │           ├── SKILL.md
│   │           └── references/
│   ├── hedera-harness/       # Harness spec authoring & review
│   │   └── skills/
│   │       ├── harness-spec-anatomy/
│   │       │   ├── SKILL.md
│   │       │   ├── GLOSSARY.md
│   │       │   ├── scripts/
│   │       │   └── references/
│   │       ├── create-harness-spec/
│   │       │   ├── SKILL.md
│   │       │   ├── evals/
│   │       │   └── references/
│   │       └── review-harness-spec/
│   │           ├── SKILL.md
│   │           ├── evals/
│   │           └── references/
│   ├── dev-intelligence/     # Dev workflow intelligence
│   │   ├── skills/
│   │   │   ├── session-management/
│   │   │   │   ├── SKILL.md
│   │   │   │   └── references/
│   │   │   ├── quality-gates/
│   │   │   │   ├── SKILL.md
│   │   │   │   └── references/
│   │   │   └── project-scaffolding/
│   │   │       ├── SKILL.md
│   │   │       └── references/
│   │   ├── commands/
│   │   ├── hooks/
│   │   └── scripts/
│   └── agent-identity/       # HCS-14 agent identity, registration & discovery
│       ├── README.md
│       └── skills/
│           └── hcs-14-agent-identity/
│               ├── SKILL.md
│               ├── references/
│               ├── examples/
│               └── evals/
└── README.md
```

Each plugin contains:

- `skills/<name>/SKILL.md` - Instructions for the agent
- `skills/<name>/references/` - Supporting documentation
- `skills/<name>/examples/` - Working code examples (optional)
- `skills/<name>/evals/spec.json` - Structured eval checks (source of truth)
- `skills/<name>/evals/evals.json` - Generated assertions for `agent-skills-eval`

## Skill Evaluations

Skills with automated evals use a two-file layout:

| File | Purpose |
|------|---------|
| `evals/spec.json` | Structured checks (`name`, `type`, `value`, `description`, optional `rubric`) — edit this |
| `evals/evals.json` | Generated string assertions for [agent-skills-eval](https://github.com/darkrishabh/agent-skills-eval) — do not edit by hand |

Compile before running evals:

```bash
npm run evals:compile
```

Verify generated files are up to date (for CI):

```bash
npm run evals:compile:check
```

Run evals for a skill (requires `OPENAI_API_KEY` and optional `OPENAI_BASE_URL` for OpenRouter):

```bash
set -a && source .env && set +a

npx agent-skills-eval ./plugins/native-services-js/skills/hedera-token-service \
  --target deepseek/deepseek-v4-flash \
  --judge deepseek/deepseek-v4-flash \
  --baseline \
  --report
```

Add optional `rubric` on a check when the auto-generated judge text is too brittle (for example regex-based checks).

## License

Apache-2.0
