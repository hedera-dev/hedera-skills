# CLAUDE.md Template

> Generate this file at the root of any project to configure AI agent behavior. Fill in the `[TODO]` sections based on project detection. **Keep the generated file under 200 lines** — move detailed content to docs/ or skills/ and reference via Triggers.

```markdown
# CLAUDE.md

## Project Overview

[TODO: Detect from README, package.json, or ask user]
- **Name:** [project name]
- **Description:** [one-line description]
- **Stack:** [detected languages and frameworks]
- **Package Manager:** [npm/yarn/pnpm/pip/cargo/go]

## Core Behaviors

- Read before writing — understand existing code before modifying it
- Prefer editing existing files over creating new ones
- Run tests after changes to verify correctness
- Keep changes focused — don't refactor unrelated code
- Follow existing patterns in the codebase
- Don't add features beyond what was requested
- **Learn from corrections** — after any correction, update MEMORY.md with the lesson so it persists across sessions
- **Parallel sessions** — before editing files, check `git status` for conflicts. Run `/parallel` for multi-session coordination
- **Load deep context on demand** — check the Triggers section below when editing unfamiliar areas

## Triggers

When editing files matching these patterns, load the referenced context:

[TODO: Generate based on detected project structure]

| File Pattern | Load |
|---|---|
| [source dir]/* | Read: docs/ARCHITECTURE.md |
| [test dir]/* | Read: docs/TESTING.md |
| Dockerfile, docker-compose* | Read: docs/DEPLOYMENT.md |
| [config files] | Read: docs/CONFIGURATION.md |
| New [ext] files | Read: docs/CONVENTIONS.md |

## Build & Run Commands

[TODO: Detect from package.json scripts, Makefile, etc. Keep only 8-10 most-used commands here. Add "See [manifest] for full list" for the rest.]

\`\`\`bash
[build command]            # Build
[test command]             # Test
[lint command]             # Lint
[dev command]              # Dev server (if applicable)
\`\`\`

## Naming Conventions

[TODO: Fill based on detected stack — see naming-conventions.md. Or move to docs/CONVENTIONS.md and reference from Triggers section if the table is large.]

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
```

## Template Notes

**200-line budget:** Claude Code's auto-memory loads CLAUDE.md into every system prompt but truncates after ~200 lines. This template is designed to stay well under that limit. For projects that grow beyond it:

1. **Move detailed sections to docs/** — naming conventions, architecture, deployment guides
2. **Add Triggers** — map file patterns to those docs so context loads on demand
3. **Summarize, don't duplicate** — keep 2-3 line summaries in CLAUDE.md, full details elsewhere

**Triggers section:** The agent scans the Triggers table when editing unfamiliar files and loads the referenced docs/skills. This replaces having everything in CLAUDE.md.

**MEMORY.md:** The "Learn from corrections" behavior writes lessons to `~/.claude/projects/<path>/memory/MEMORY.md`, which is auto-loaded into every system prompt. This creates a self-improvement loop across sessions.
