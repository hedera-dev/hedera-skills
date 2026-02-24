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

Use the template from `references/claude-md-template.md` and fill in detected information:

1. **Project Overview** — read `README.md` or `package.json` description
2. **Build & Run Commands** — detected from manifest `scripts` section
3. **Naming Conventions** — select from `references/naming-conventions.md` based on stack
4. **Test Command** — detected or ask user
5. **Lint Command** — detected or ask user

### What Gets Pre-Filled
- Core Behaviors (generic best practices)
- Test-First Development rules
- Git Commit Rules (conventional commits)
- Forbidden Files (.env, credentials, node_modules, etc.)
- Environment Variables rules

### What Needs Detection or User Input
- Project name and description
- Build, test, lint, and dev commands
- Stack-specific naming conventions
- Any custom conventions the user wants

## Directory Structure Creation

Create the following structure:

```
.claude/
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
- CLAUDE.md (project configuration)
- .claude/reports/ (15 category dirs + registry + tech debt tracker)
- .claude/scripts/post-edit-check.sh (auto-validation hook)
- .claude/settings.json (PostToolUse hook wired up)

Ready to start developing with session tracking and auto-validation.
```

## Cross-References

- `references/claude-md-template.md` — Full CLAUDE.md template with placeholder sections
- `references/naming-conventions.md` — Language-specific naming tables (TS, Py, Rust, Go)
- `references/git-workflow.md` — Conventional commits, branching, and PR patterns
