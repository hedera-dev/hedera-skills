# Project Health Check

Run a comprehensive health check on the project and report results.

## Steps

1. **Git status:**
   ```bash
   git status --short
   git log --oneline -5
   ```
   - Check for uncommitted changes
   - Check if branch is behind remote
   - Check for untracked files

2. **Test suite:**
   ```bash
   # Detect and run test command from package.json, pyproject.toml, etc.
   npm test          # or pytest, cargo test, go test ./...
   ```
   - Report: pass/fail, count of tests, duration

3. **Lint check:**
   ```bash
   # Detect and run lint command
   npm run lint      # or ruff check ., cargo clippy, golangci-lint run
   ```
   - Report: pass/fail, warning count, error count

4. **Dependency freshness:**
   ```bash
   # Check for outdated dependencies
   npm outdated      # or pip list --outdated, cargo outdated
   ```
   - Report: number of outdated packages, any with security advisories

5. **Output summary table:**

   | Check | Status | Details |
   |-------|--------|---------|
   | Git State | OK/WARN/FAIL | e.g., "3 uncommitted files" |
   | Tests | OK/WARN/FAIL | e.g., "42 passed, 0 failed" |
   | Lint | OK/WARN/FAIL | e.g., "0 errors, 2 warnings" |
   | Dependencies | OK/WARN/FAIL | e.g., "3 outdated, 0 vulnerable" |

6. **Status definitions:**
   - **OK** — all checks pass, no issues
   - **WARN** — minor issues that should be addressed soon
   - **FAIL** — critical issues that need immediate attention

7. **Recommendations:**
   - If any check is FAIL, suggest specific remediation steps
   - If any check is WARN, note it for future attention
   - If all OK, confirm the project is in good health
