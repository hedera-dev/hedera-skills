# Hedera Skills

A marketplace of plugins and skills for AI coding agents working with the Hedera network. Each plugin contains packaged instructions, references, and examples that extend agent capabilities for Hedera development.

## Installation

### Claude Code

```bash
# Add the Hedera marketplace
/plugin marketplace add hedera-dev/hedera-skills

# Install individual plugins
/plugin marketplace add hedera-dev/hedera-skills agent-kit-plugin
/plugin marketplace add hedera-dev/hedera-skills hts-system-contract
/plugin marketplace add hedera-dev/hedera-skills hedera-solidity-guide
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

### hedera-solidity-guide

Comprehensive development guide for Hedera smart contracts, covering the full stack from Solidity to JavaScript/TypeScript SDK integration. Captures patterns, nuances, and best practices learned from real-world Hedera projects.

**Use when:**

- Developing Hedera smart contracts in Solidity
- Integrating with HTS tokens from JavaScript/TypeScript
- Querying the Hedera mirror node
- Setting token allowances (especially the storage contract pattern)
- Writing Hardhat tests for Hedera contracts
- Debugging Hedera-specific errors and edge cases

**Topics covered:**

- Critical differences from Ethereum development
- Token association (the #1 Ethereum developer gotcha)
- The storage contract allowance pattern
- Mirror node architecture, endpoints, and propagation delays
- Transaction ID format conversion (SDK vs mirror)
- Client setup, environment config, and key type detection
- Contract execution, deployment, and free mirror node reads
- Gas estimation and HTS operation costs
- Error handling (HTS response codes, custom errors, panic codes)
- Testing patterns with Hedera-specific timeouts
- Multi-signature transaction flows
- Account and address format conversions

**References included:**

- `token-association.md` - Association patterns, auto-association, status checks
- `allowances.md` - FT/NFT/HBAR allowances, storage contract pattern, isApproval flag
- `mirror-node.md` - Query patterns, retry logic, event parsing, EVM address resolution
- `contract-patterns.md` - Execution, deployment, ethers.js integration, error parsing
- `client-setup.md` - Client initialization, environment config, key detection, address formats
- `error-handling.md` - Error parsing, custom errors, HTS response codes
- `testing.md` - Hardhat config, test setup, mirror node delays
- `multi-sig.md` - Transaction validity, freezing, signature collection
- `pitfalls.md` - The 8 most common Hedera development mistakes

## Flashbacker Integration

This repo also ships a [Flashbacker](https://github.com/agentsea/flashbacker) persona for Hedera Solidity development. Flashbacker is a memory and persona framework for Claude Code — personas shape how Claude approaches specific domains.

### Installation

Flashbacker must already be initialized in your project (`flashback init`). Then copy the persona:

```bash
# From the hedera-skills repo root
cp extras/flashbacker/personas/hedera-solidity.md .claude/flashback/personas/
```

### Usage

```bash
# Activate the persona for a request
/fb:persona hedera-solidity "Review my HTS token transfer logic"
```

The persona applies Hedera-first thinking — it checks for token association, correct allowance targets, HTS response codes, mirror node delays, and other Hedera-specific patterns that trip up Ethereum developers.

## Marketplace Structure

```
hedera-skills/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace manifest
├── extras/
│   └── flashbacker/
│       └── personas/
│           └── hedera-solidity.md  # Flashbacker persona
├── plugins/
│   ├── agent-kit-plugin/     # Individual plugin
│   │   └── skills/
│   │       └── agent-kit-plugin/
│   │           ├── SKILL.md
│   │           ├── examples/
│   │           └── references/
│   ├── hts-system-contract/
│   │   └── skills/
│   │       └── hts-system-contract/
│   │           ├── SKILL.md
│   │           └── references/
│   └── hedera-solidity-guide/
│       └── skills/
│           └── hedera-solidity-guide/
│               ├── SKILL.md
│               └── references/
└── README.md
```

Each plugin contains:

- `skills/<name>/SKILL.md` - Instructions for the agent
- `skills/<name>/references/` - Supporting documentation
- `skills/<name>/examples/` - Working code examples (optional)

## License

Apache-2.0
