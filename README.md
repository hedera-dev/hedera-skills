# Hedera Skills

A marketplace of plugins and skills for AI coding agents. Includes Hedera-specific development tools and general-purpose dev workflow intelligence. Each plugin contains packaged instructions, references, and examples that extend agent capabilities.

## Installation

### Claude Code

```bash
# Add the Hedera marketplace
/plugin marketplace add hedera-dev/hedera-skills

# Install individual plugins
/plugin marketplace add hedera-dev/hedera-skills agent-kit-plugin
/plugin marketplace add hedera-dev/hedera-skills hts-system-contract
/plugin marketplace add hedera-dev/hedera-skills hackathon-helper
/plugin marketplace add hedera-dev/hedera-skills dev-intelligence
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

### hts-system-contract

Technical reference for the Hedera Token Service (HTS) system contract - the core smart contract API for token operations on Hedera.

**Use when:**

- Writing Solidity contracts that interact with HTS
- Creating or managing tokens via smart contracts
- Understanding HTS response codes and error handling
- Configuring token keys and permissions
- Working with token fees and compliance features

**Topics covered:**

- Token creation functions (fungible and NFT)
- Minting, burning, and transfer operations
- HederaToken and TokenKey struct definitions
- Response codes with causes and solutions
- Key value types and KeyHelper patterns
- Fee structures and compliance features

**References included:**

- `api.md` - HTS contract API reference (Solidity signatures)
- `structs.md` - Data structure definitions (HederaToken, TokenKey, Expiry)
- `response-codes.md` - Response codes with troubleshooting
- `keys.md` - Token key system reference
- `fees.md` - Fee structure information
- `compliance.md` - Compliance-related features
- `troubleshooting.md` - Common issues and solutions

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
│   ├── hts-system-contract/  # HTS smart contract reference
│   │   └── skills/
│   │       └── hts-system-contract/
│   │           ├── SKILL.md
│   │           └── references/
│   └── dev-intelligence/     # Dev workflow intelligence
│       ├── skills/
│       │   ├── session-management/
│       │   │   ├── SKILL.md
│       │   │   └── references/
│       │   ├── quality-gates/
│       │   │   ├── SKILL.md
│       │   │   └── references/
│       │   └── project-scaffolding/
│       │       ├── SKILL.md
│       │       └── references/
│       ├── commands/
│       ├── hooks/
│       └── scripts/
└── README.md
```

Each plugin contains:

- `skills/<name>/SKILL.md` - Instructions for the agent
- `skills/<name>/references/` - Supporting documentation
- `skills/<name>/examples/` - Working code examples (optional)

## License

Apache-2.0
