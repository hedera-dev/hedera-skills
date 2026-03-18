# Git Workflow

> Generic git workflow patterns for AI agent development.

## Conventional Commits

Use the conventional commits format for all commit messages:

| Prefix | Use For |
|--------|---------|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `docs:` | Documentation changes only |
| `refactor:` | Code restructuring without behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Build, CI, tooling, dependencies |
| `perf:` | Performance improvement |
| `style:` | Formatting, whitespace (no code change) |

### Format

```
<type>(<optional-scope>): <short description>

<optional body — explain WHY, not WHAT>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Examples

```bash
feat(auth): add JWT refresh token rotation
fix(api): handle null response from upstream service
docs: update API endpoint documentation
refactor(db): extract connection pool into shared module
test(auth): add integration tests for login flow
chore(deps): upgrade express from 4.18 to 4.19
```

## Branch Naming

| Prefix | Use For | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/user-authentication` |
| `fix/` | Bug fixes | `fix/memory-leak-websocket` |
| `chore/` | Maintenance | `chore/upgrade-dependencies` |
| `docs/` | Documentation | `docs/api-reference` |
| `refactor/` | Restructuring | `refactor/extract-shared-utils` |

## Staging Best Practices

```bash
# Stage specific files (preferred)
git add src/auth/middleware.ts src/auth/middleware.test.ts

# Stage by pattern
git add "src/auth/**/*.ts"

# NEVER use these — they can include secrets or unintended files
# git add -A
# git add .
```

## GPG Signing

If GPG signing is configured but fails (common in non-TTY environments):

```bash
# Use --no-gpg-sign when TTY is unavailable
git commit --no-gpg-sign -m "feat: add feature"
```

## Pull Request Conventions

### Title
- Keep under 70 characters
- Use conventional commit format: `feat(scope): short description`

### Body Template

```markdown
## Summary
- [1-3 bullet points explaining the change]

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases verified
```

## Pre-Push Checklist

Before pushing to remote:

1. All tests pass locally
2. Lint passes with no warnings
3. Build succeeds
4. No secrets or credentials in staged files
5. Commit messages follow conventional format
6. Branch is rebased on latest target branch
