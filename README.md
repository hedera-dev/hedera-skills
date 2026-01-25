# Hedera Agent Skills

A collection of skills for AI coding agents working with the Hedera network. Skills are packaged instructions, references, and examples that extend agent capabilities for Hedera development.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

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

## Installation

```bash
npx add-skill hedera-dev/hedera-agent-skills
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**

```
Create a Hedera plugin that checks account balances
```

```
Help me write a tool that creates fungible tokens
```

```
How do I handle HTS response codes in my smart contract?
```

```
What's the struct definition for HederaToken?
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent
- `references/` - Supporting documentation
- `examples/` - Working code examples (optional)

## License

Apache-2.0
