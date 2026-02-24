# Hook Patterns

> PostToolUse hook examples for automatic validation across tech stacks.

## How PostToolUse Hooks Work

PostToolUse hooks run automatically after the agent uses `Edit` or `Write` tools. They validate the change immediately, catching errors before they compound.

**Flow:** Agent edits file → Hook runs → Validation output shown → Agent sees errors immediately

## Hook JSON Format

### Plugin hooks.json

```json
{
  "hooks": [
    {
      "event": "PostToolUse",
      "matcher": "Edit|Write",
      "hooks": [
        {
          "type": "command",
          "command": "bash $CLAUDE_PLUGIN_DIR/scripts/post-edit-check.sh"
        }
      ]
    }
  ]
}
```

### User settings (~/.claude/settings.json)

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

## Stack-Specific Validation Commands

### TypeScript / JavaScript

```bash
# Type checking (TypeScript projects)
npx tsc --noEmit 2>&1 | tail -20

# Linting
npx eslint --no-warn-ignored "$FILE" 2>&1 | tail -20

# Prettier check
npx prettier --check "$FILE" 2>&1 | tail -5
```

### Python

```bash
# Linting (preferred — fast, comprehensive)
ruff check "$FILE" 2>&1 | tail -20

# Fallback — syntax validation only
python -m py_compile "$FILE" 2>&1

# Type checking (if configured)
mypy "$FILE" 2>&1 | tail -20
```

### Rust

```bash
# Full check (types, borrows, lifetimes)
cargo check 2>&1 | tail -20

# Linting
cargo clippy 2>&1 | tail -20
```

### Go

```bash
# Vet (common mistakes)
go vet ./... 2>&1 | tail -20

# Static analysis
staticcheck ./... 2>&1 | tail -20
```

## Stack Detection

Detect the project stack by checking for manifest files:

| File | Stack |
|------|-------|
| `package.json` | TypeScript / JavaScript |
| `tsconfig.json` | TypeScript (confirmed) |
| `pyproject.toml` or `setup.py` or `requirements.txt` | Python |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `Makefile` | Check contents for stack clues |

## File Extension Detection

For per-file validation, detect by extension:

| Extension | Validation |
|-----------|-----------|
| `.ts`, `.tsx` | `npx tsc --noEmit` |
| `.js`, `.jsx` | `npx eslint` (if configured) |
| `.py` | `ruff check` or `python -m py_compile` |
| `.rs` | `cargo check` |
| `.go` | `go vet ./...` |
| Other | Silent no-op (exit 0) |

## Best Practices

- **Tail output** — limit to last 20 lines to avoid flooding the agent context
- **Exit 0 on unknown files** — don't fail on files the validator doesn't understand
- **Prefer fast checks** — `tsc --noEmit` over full builds, `ruff` over `pylint`
- **Non-blocking** — validation output is informational; it doesn't prevent the edit
