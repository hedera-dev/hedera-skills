# CI Pipeline Pattern

> Pre-push local CI gate. Run the full quality suite before pushing to remote.

## Purpose

Catch issues locally before they hit CI/CD. This saves time, reduces failed builds, and keeps the main branch clean.

## Pipeline Stages

Run stages sequentially — **exit on first failure**.

```
Lint → Build → Test → Security Scan
```

### Stage 1: Lint

```bash
echo "=== Stage 1: Lint ==="

# TypeScript/JavaScript
npx eslint . --max-warnings 0

# Python
ruff check .

# Rust
cargo clippy -- -D warnings

# Go
golangci-lint run ./...
```

### Stage 2: Build

```bash
echo "=== Stage 2: Build ==="

# TypeScript/JavaScript
npm run build

# Rust
cargo build

# Go
go build ./...
```

### Stage 3: Test

```bash
echo "=== Stage 3: Test ==="

# TypeScript/JavaScript
npm test

# Python
pytest --tb=short

# Rust
cargo test

# Go
go test ./...
```

### Stage 4: Security Scan

```bash
echo "=== Stage 4: Security ==="

# Dependency audit
npm audit --audit-level=high      # Node.js
pip-audit                          # Python
cargo audit                        # Rust
govulncheck ./...                  # Go

# Secret scanning
grep -r "PRIVATE_KEY\|SECRET\|PASSWORD\|API_KEY" --include="*.ts" --include="*.py" -l || true
```

## Local CI Script Template

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Running local CI pipeline..."

# Stage 1: Lint
echo "=== Lint ==="
npm run lint || { echo "❌ Lint failed"; exit 1; }

# Stage 2: Build
echo "=== Build ==="
npm run build || { echo "❌ Build failed"; exit 1; }

# Stage 3: Test
echo "=== Test ==="
npm test || { echo "❌ Tests failed"; exit 1; }

# Stage 4: Security
echo "=== Security ==="
npm audit --audit-level=high || { echo "⚠️ Security warnings found"; }

echo "✅ All CI gates passed"
```

## Reporting

After running the pipeline, save results to `.claude/reports/ci/`:

```markdown
### CI Run — YYYY-MM-DD HH:MM
- **Lint:** Pass/Fail (N warnings)
- **Build:** Pass/Fail (duration)
- **Test:** Pass/Fail (N passed, N failed, N skipped)
- **Security:** Pass/Warn (N advisories)
- **Overall:** Pass/Fail
```

## Best Practices

- **Run before every push** — not just before PRs
- **Fail fast** — stop at the first broken stage
- **Keep it fast** — target under 2 minutes for the full pipeline
- **Don't skip stages** — all four gates matter
- **Fix forward** — if a stage fails, fix it before trying again
