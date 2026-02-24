---
name: Project Scaffolding
description: This skill should be used when the user wants to set up Claude for a project, create a CLAUDE.md file, scaffold the .claude directory, initialize an AI workflow, configure a project for Claude, set up dev intelligence, initialize a new project, or do a new project setup. Triggered by phrases like "set up claude for this project", "create CLAUDE.md", "scaffold .claude directory", "init AI workflow", "configure project for claude", "set up dev intelligence", "initialize project", "new project setup".
---

# Project Scaffolding

## Purpose

Generate a complete `CLAUDE.md` and `.claude/` directory structure for any project. This gives AI agents the context they need to work effectively from the first session — build commands, conventions, quality gates, and session tracking.

## Stack Detection

Before scaffolding, detect the project's tech stack by scanning for manifest files:

| File Found | Stack Detected | Build Tool |
|------------|---------------|------------|
| `tsconfig.json` | TypeScript | `tsc`, `npm`/`yarn`/`pnpm` |
| `package.json` (no tsconfig) | JavaScript | `npm`/`yarn`/`pnpm` |
| `pyproject.toml` | Python | `pip`/`poetry`/`uv` |
| `setup.py` or `requirements.txt` | Python (legacy) | `pip` |
| `Cargo.toml` | Rust | `cargo` |
| `go.mod` | Go | `go` |
| `Makefile` | Check contents | Varies |
| `Dockerfile` | Container | `docker` |

### Detection Steps
1. List files in project root: check for manifest files above
2. If `package.json` exists, read `scripts` to find build/test/lint commands
3. If `pyproject.toml` exists, read `[tool]` sections for configured tools
4. If multiple stacks detected, note all of them (monorepo pattern)

## CLAUDE.md Generation

Use the template from `references/claude-md-template.md` and fill in detected information. **Target: under 200 lines.** Claude Code truncates CLAUDE.md after ~200 lines in the system prompt, so keep it lean.

1. **Project Overview** — read `README.md` or `package.json` description
2. **Build & Run Commands** — detected from manifest `scripts` section (keep 8-10 most-used, add "See [manifest] for full list")
3. **Triggers** — map file patterns to docs/skills for on-demand deep context
4. **Naming Conventions** — select from `references/naming-conventions.md` based on stack. If the table is large, move to `docs/CONVENTIONS.md` and reference from Triggers
5. **Test Command** — detected or ask user
6. **Lint Command** — detected or ask user

### What Gets Pre-Filled
- Core Behaviors (including self-improvement and parallel session rules)
- Triggers section (generated from detected project structure)
- Test-First Development rules
- Git Commit Rules (conventional commits)
- Forbidden Files (.env, credentials, node_modules, etc.)
- Environment Variables rules

### What Needs Detection or User Input
- Project name and description
- Build, test, lint, and dev commands
- Stack-specific naming conventions
- Any custom conventions the user wants

## Triggers Generation

The Triggers section maps file patterns to deeper documentation, enabling on-demand context loading without bloating CLAUDE.md.

### How to Generate Triggers
1. Scan project structure for distinct directories (e.g., `src/`, `lib/`, `tests/`, `docs/`)
2. Identify existing documentation files (`docs/*.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`)
3. Map each source directory to its most relevant doc or skill
4. Include standard patterns: `Dockerfile` → deployment docs, `tests/` → testing docs, new files → conventions

### Example Generated Triggers
```markdown
| File Pattern | Load |
|---|---|
| src/api/* | Read: docs/API.md |
| src/components/* | Read: docs/COMPONENTS.md |
| tests/* | Read: docs/TESTING.md |
| Dockerfile, docker-compose* | Read: docs/DEPLOYMENT.md |
| New .ts files | Read: docs/CONVENTIONS.md |
```

If no docs exist yet, generate stub documentation files with TODO placeholders during scaffolding.

## MEMORY.md Seeding

Seed the project's MEMORY.md with initial lessons from the detected stack. MEMORY.md is auto-loaded into every Claude Code system prompt, creating a self-improvement loop.

### Location
```
~/.claude/projects/<project-path-with-dashes>/memory/MEMORY.md
```

Where `<project-path-with-dashes>` is the absolute project path with `/` replaced by `-` (e.g., `-Users-dev-myproject`).

### What to Seed
1. **Stack details** — language version, build tool, package manager
2. **Architecture patterns** — module structure discovered during detection
3. **Common pitfalls** for the detected stack:
   - TypeScript: ESM import extensions, `tsconfig` strictness, type-only imports
   - Python: virtual env activation, `__init__.py` requirements, type checking with mypy
   - Rust: borrow checker common mistakes, feature flags, workspace patterns
   - Go: module paths, exported vs unexported, error wrapping
4. **Testing patterns** — framework, mock strategy, test file locations
5. **Owner preferences** — any conventions the user specified during `/init`

### Size Budget
Keep under 55 lines initially — leave room for growth as the agent learns during sessions. The 200-line system prompt limit applies to MEMORY.md too.

## Directory Structure Creation

Create the following structure:

```
.claude/
├── commands/
│   └── parallel.md            ← multi-session coordination guide
├── reports/
│   ├── _registry.md          ← from session-management references
│   ├── _tech-debt.md         ← from session-management references
│   ├── architecture/
│   ├── bugs/
│   ├── code-review/
│   ├── config/
│   ├── dependencies/
│   ├── docs/
│   ├── features/
│   ├── integration/
│   ├── performance/
│   ├── refactor/
│   ├── security/
│   ├── testing/
│   ├── ci/
│   ├── tech-debt/
│   └── release/
└── scripts/
    └── post-edit-check.sh     ← from quality-gates hook
```

### Steps
1. Create all 15 category directories under `.claude/reports/`
2. Copy `registry-template.md` content to `.claude/reports/_registry.md` (empty, ready to use)
3. Copy `tech-debt-template.md` content to `.claude/reports/_tech-debt.md` (empty, ready to use)
4. Copy `post-edit-check.sh` to `.claude/scripts/` and make executable
5. Create `.claude/commands/parallel.md` with project-specific file ownership boundaries
6. Seed MEMORY.md at the auto-memory path (see MEMORY.md Seeding section above)

## Hook Setup

Based on detected stack, wire up the PostToolUse hook:

1. Create or update `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/scripts/post-edit-check.sh"
          }
        ]
      }
    ]
  }
}
```

2. Ensure the validation script matches the detected stack

## Interactive Flow

When running the scaffolding, interact with the user for decisions:

### Step 1: Detect and Confirm
```
Detected stack: TypeScript (package.json + tsconfig.json)
Build: npm run build
Test: npm test
Lint: npm run lint

Does this look correct? Any changes?
```

### Step 2: Custom Conventions
```
Any project-specific conventions I should add to CLAUDE.md?
For example:
- Specific directory structure rules
- Required code patterns
- Forbidden patterns or anti-patterns
```

### Step 3: Generate and Review
1. Generate `CLAUDE.md` with all detected + user-provided info
2. Create `.claude/` directory structure
3. Set up hooks
4. Show summary of what was created

### Step 4: Confirm
```
Created:
- CLAUDE.md (project configuration with Triggers, under 200 lines)
- .claude/reports/ (15 category dirs + registry + tech debt tracker)
- .claude/commands/parallel.md (multi-session coordination)
- .claude/scripts/post-edit-check.sh (auto-validation hook)
- .claude/settings.json (PostToolUse hook wired up)
- MEMORY.md (seeded at ~/.claude/projects/.../memory/MEMORY.md)

Ready to start developing with session tracking, auto-validation,
and self-improvement across sessions.
```

## Cross-References

- `references/claude-md-template.md` — Full CLAUDE.md template with placeholder sections
- `references/naming-conventions.md` — Language-specific naming tables (TS, Py, Rust, Go)
- `references/git-workflow.md` — Conventional commits, branching, and PR patterns
