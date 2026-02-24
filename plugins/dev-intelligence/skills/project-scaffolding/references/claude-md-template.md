# CLAUDE.md Template

> Generate this file at the root of any project to configure AI agent behavior. Fill in the `[TODO]` sections based on project detection.

```markdown
# CLAUDE.md

## Project Overview

[TODO: Detect from README, package.json, or ask user]
- **Name:** [project name]
- **Description:** [one-line description]
- **Stack:** [detected languages and frameworks]
- **Package Manager:** [npm/yarn/pnpm/pip/cargo/go]

## Build & Run Commands

[TODO: Detect from package.json scripts, Makefile, etc.]

### Build
\`\`\`bash
[build command]
\`\`\`

### Test
\`\`\`bash
[test command]
\`\`\`

### Lint
\`\`\`bash
[lint command]
\`\`\`

### Dev Server
\`\`\`bash
[dev command, if applicable]
\`\`\`

## Core Behaviors

- Read before writing — understand existing code before modifying it
- Prefer editing existing files over creating new ones
- Run tests after changes to verify correctness
- Keep changes focused — don't refactor unrelated code
- Follow existing patterns in the codebase
- Don't add features beyond what was requested

## Naming Conventions

[TODO: Fill based on detected stack — see naming-conventions.md]

| Element | Convention | Example |
|---------|-----------|---------|
| Files | [convention] | [example] |
| Functions | [convention] | [example] |
| Classes/Types | [convention] | [example] |
| Constants | [convention] | [example] |

## Test-First Development

- Write or update tests before implementation when possible
- Run the full test suite before committing
- Never commit with failing tests
- Test command: `[TODO: detected test command]`

## Git Commit Rules

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Stage specific files (never `git add -A` or `git add .`)
- Keep commits focused on a single logical change
- Write commit messages that explain WHY, not just WHAT

## Forbidden Files

Never read, create, commit, or modify:
- `.env` files (use `.env.example` for reference only)
- Private keys, certificates, credentials
- `node_modules/`, `__pycache__/`, `target/`, `.venv/`
- Any file matching patterns in `.gitignore`

## Environment Variables

- Read `.env.example` to understand required variables
- Never read `.env` directly — assume values are set in the environment
- Never log, display, or commit environment variable values
- Check that required variables are SET, not what they contain
```
