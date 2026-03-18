---
name: Quality Gates
description: This skill should be used when the user wants to set up linting, configure auto-checking after edits, create a deploy checklist, set up pre-push checks, configure a CI pipeline, add quality gates, set up a hook for typechecking, enable post-edit validation, or auto-validate code changes. Triggered by phrases like "set up linting", "auto check after edits", "deploy checklist", "pre-push checks", "CI pipeline", "quality gates", "hook for typecheck", "post-edit validation", "auto-validate".
---

# Quality Gates

## Purpose

Automatic quality validation at every stage of development — from individual file edits to full deployments. Quality gates catch errors early when they're cheapest to fix.

## PostToolUse Hooks

The most powerful quality gate: automatic validation every time a file is edited or created.

### How It Works
1. Agent uses `Edit` or `Write` to modify a file
2. PostToolUse hook fires automatically
3. Validation script detects the file type and runs the appropriate checker
4. Output is shown to the agent immediately
5. Agent sees errors and can fix them in the same session

### Setting Up
The plugin includes a ready-to-use hook in `hooks/hooks.json` that runs `scripts/post-edit-check.sh`. When installed as a plugin, this works automatically.

For manual setup in a project, add to `.claude/settings.json`:

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

See `references/hook-patterns.md` for stack-specific hook examples.

## Deploy Checklist

Before deploying any application, run through these 5 verification stages:

| Stage | What | Gate |
|-------|------|------|
| 1. Code Quality | Lint + Typecheck + Tests | All pass |
| 2. Build | Full build succeeds | Artifacts exist |
| 3. Environment | Required env vars present | All set (never read values) |
| 4. Container | Image builds and starts | No errors |
| 5. Post-Deploy | Health endpoint, logs | 200 OK, clean logs |

See `references/deploy-checklist.md` for complete verification commands per stack.

## CI Pre-Push Gate

Run the full quality suite locally before pushing to remote:

```
Lint → Build → Test → Security Scan
```

**Key rules:**
- Run stages sequentially
- Exit on first failure
- Target under 2 minutes total
- Don't skip stages
- Save results to `.claude/reports/ci/`

See `references/ci-pipeline.md` for the full pipeline template.

## Stack Detection

The quality gates system auto-detects your project stack to run the right validators.

### Detection Priority

| Check | Detected Stack | Primary Validator |
|-------|---------------|-------------------|
| `tsconfig.json` exists | TypeScript | `npx tsc --noEmit` |
| `package.json` exists (no tsconfig) | JavaScript | `npx eslint` |
| `pyproject.toml` or `setup.py` exists | Python | `ruff check` |
| `Cargo.toml` exists | Rust | `cargo check` |
| `go.mod` exists | Go | `go vet ./...` |

### File Extension Fallback

When editing individual files, detect by extension:

| Extension | Validator |
|-----------|-----------|
| `.ts`, `.tsx` | TypeScript checker |
| `.js`, `.jsx` | ESLint (if configured) |
| `.py` | ruff or py_compile |
| `.rs` | cargo check |
| `.go` | go vet |
| Other | Silent pass |

## Workflow Integration

### During Development
- PostToolUse hooks catch errors on every edit
- Agent fixes issues immediately before they compound

### Before Pushing
- Run the CI pipeline locally: lint → build → test → security
- All stages must pass before pushing

### Before Deploying
- Run through the deploy checklist
- Verify build, environment, and health endpoints
- Ensure rollback plan is ready

## Cross-References

- `references/hook-patterns.md` — PostToolUse hook examples for every stack
- `references/deploy-checklist.md` — 5-stage pre-deploy verification
- `references/ci-pipeline.md` — Local CI pipeline pattern
