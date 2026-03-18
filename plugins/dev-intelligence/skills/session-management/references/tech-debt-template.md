# Tech Debt Tracker Template

> Copy this file to `.claude/reports/_tech-debt.md` in your project to track technical debt.

## Priority Levels

| Priority | Label | Meaning | Action Timeline |
|----------|-------|---------|-----------------|
| P0 | Critical | Blocks development or causes production issues | Fix this session |
| P1 | High | Degrades developer experience or performance | Fix this week |
| P2 | Medium | Code quality issue, maintainability concern | Fix this month |
| P3 | Low | Nice-to-have improvement, minor cleanup | Fix when convenient |

## Item Format

```markdown
### [P{0-3}] Short title describing the debt
- **Added:** YYYY-MM-DD
- **Category:** code-quality | performance | security | architecture | testing | dependency | documentation
- **Location:** `path/to/file.ts:123` or module/area description
- **Impact:** What happens if this isn't addressed
- **Suggested Fix:** Brief description of the approach
- **Status:** Open | In Progress | Resolved
- **Resolved:** YYYY-MM-DD (when fixed)
```

## Review Cadence

- **Every session start:** Scan for P0 items — address before new work
- **Weekly:** Review P1 items — prioritize for upcoming work
- **Monthly:** Review P2/P3 items — promote, resolve, or archive stale entries
- **On resolve:** Update status, add resolved date, keep for 90 days then archive

## Guidelines

- **Be specific** — include file paths, line numbers, or function names
- **Quantify impact** — "adds 200ms latency" beats "is slow"
- **Suggest fixes** — future-you (or your agent) needs actionable direction
- **Don't hoard** — if it won't realistically be fixed, remove it
- **Link related items** — group debt that should be fixed together

## Example Tracker

```markdown
# Tech Debt Tracker

## Critical (P0)

_No critical items._

## High (P1)

### [P1] Database connection pool exhaustion under load
- **Added:** 2025-01-15
- **Category:** performance
- **Location:** `src/db/pool.ts:45`
- **Impact:** API returns 503 errors when concurrent users exceed 50
- **Suggested Fix:** Increase pool size from 10 to 25, add connection timeout, implement queue
- **Status:** Open

## Medium (P2)

### [P2] Duplicated validation logic across API routes
- **Added:** 2025-01-10
- **Category:** code-quality
- **Location:** `src/routes/users.ts`, `src/routes/orders.ts`, `src/routes/products.ts`
- **Impact:** Bug fixes must be applied in 3 places, risk of inconsistency
- **Suggested Fix:** Extract shared validation middleware using zod schemas
- **Status:** Open

## Low (P3)

### [P3] Console.log statements left in production code
- **Added:** 2025-01-08
- **Category:** code-quality
- **Location:** Various files in `src/services/`
- **Impact:** Noisy logs, minor performance overhead
- **Suggested Fix:** Replace with structured logger, add lint rule to catch console.log
- **Status:** Open
```
