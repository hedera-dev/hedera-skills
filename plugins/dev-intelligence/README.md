# Dev Intelligence

AI development workflow toolkit — session continuity, quality gates, project scaffolding, and tech debt tracking for any codebase.

## Installation

### Claude Code

```bash
/plugin marketplace add hedera-dev/hedera-skills dev-intelligence
```

### Other Agents (npx skills)

```bash
npx skills add hedera-dev/hedera-skills
```

## Quick Start

Run `/init` on any project to scaffold the full setup:

```
/init
```

This detects your stack, generates `CLAUDE.md`, creates the `.claude/` directory structure, and wires up auto-validation hooks. You're ready to go.

## Components

| Type | Name | Purpose |
|------|------|---------|
| Skill | session-management | Work tracking, tech debt, session continuity |
| Skill | quality-gates | Auto-validation hooks, deploy checklists, CI gates |
| Skill | project-scaffolding | CLAUDE.md generation, .claude/ structure, stack detection |
| Command | `/continue` | Resume work with full context from last session |
| Command | `/init` | Scaffold a project for AI-assisted development |
| Command | `/debt` | View and manage tech debt tracker |
| Command | `/health` | Run project health check (git, tests, lint, deps) |
| Hook | PostToolUse | Auto-validate files after every Edit/Write |

## Skills

### Session Management

Triggers when you say: "resume work", "continue from last session", "what was I working on", "track this work", "tech debt", "session history"

**Provides:**
- Report registry with 15 categories for organizing work
- Tech debt tracker with P0-P3 priority levels
- Archive strategy to keep tracking lean
- Session start/end workflows

### Quality Gates

Triggers when you say: "set up linting", "auto check after edits", "deploy checklist", "pre-push checks", "CI pipeline", "quality gates"

**Provides:**
- PostToolUse hook patterns for TypeScript, Python, Rust, Go
- 5-stage deploy checklist (lint, build, env, container, post-deploy)
- Local CI pipeline pattern (lint → build → test → security)
- Automatic stack detection

### Project Scaffolding

Triggers when you say: "set up claude for this project", "create CLAUDE.md", "scaffold .claude directory", "initialize project"

**Provides:**
- CLAUDE.md template with auto-detected build/test/lint commands
- Language-specific naming conventions (TS, Python, Rust, Go)
- Git workflow patterns (conventional commits, branch naming)
- Full `.claude/` directory structure with 15 report categories

## Commands

### `/continue`

Resume work with full context. Reads git log, working state, report registry, and tech debt tracker, then summarizes what's active and suggests next steps.

### `/init`

Bootstrap a project for AI development. Detects stack, generates CLAUDE.md, creates `.claude/` directory structure, and sets up validation hooks. Interactive — asks for confirmation and custom conventions.

### `/debt`

View and manage tech debt. Shows summary by priority, supports adding items, marking resolved, and reviewing stale entries.

### `/health`

Project health dashboard. Checks git state, test suite, lint status, and dependency freshness. Reports OK/WARN/FAIL for each with remediation suggestions.

## Hooks

### PostToolUse Auto-Validation

Every time the agent edits or creates a file, the hook automatically runs the appropriate validator:

| File Type | Validator |
|-----------|-----------|
| `.ts`, `.tsx` | `npx tsc --noEmit` |
| `.py` | `ruff check` (fallback: `python -m py_compile`) |
| `.rs` | `cargo check` |
| `.go` | `go vet ./...` |
| Other | Silent pass |

Output is truncated to 20 lines to avoid context flooding.

## Customization

All templates and patterns are in `references/` directories. To customize:

- **Naming conventions** — edit `skills/project-scaffolding/references/naming-conventions.md`
- **CLAUDE.md template** — edit `skills/project-scaffolding/references/claude-md-template.md`
- **Git workflow** — edit `skills/project-scaffolding/references/git-workflow.md`
- **Registry categories** — edit `skills/session-management/references/registry-template.md`
- **Tech debt format** — edit `skills/session-management/references/tech-debt-template.md`
- **Hook validation** — edit `scripts/post-edit-check.sh` to add custom validators

## Works With

- Claude Code
- Codex CLI
- Gemini CLI
- Any AI agent that supports the skills/plugin format

## License

Apache-2.0
