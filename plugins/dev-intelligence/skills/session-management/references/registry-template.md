# Report Registry Template

> Copy this file to `.claude/reports/_registry.md` in your project to enable session continuity.

## Format

Each entry follows this structure:

```markdown
### [Category] Title
- **Date:** YYYY-MM-DD
- **Status:** Active | Resolved | Archived
- **File:** `.claude/reports/<category>/<filename>.md`
- **Summary:** One-line description of findings or changes
```

## Categories

Organize reports into these 15 directories under `.claude/reports/`:

| # | Category | Directory | Use For |
|---|----------|-----------|---------|
| 1 | Architecture | `architecture/` | System design decisions, ADRs, component diagrams |
| 2 | Bug Investigation | `bugs/` | Root cause analysis, reproduction steps, fixes |
| 3 | Code Review | `code-review/` | Review findings, suggested improvements |
| 4 | Configuration | `config/` | Environment setup, tool config, infrastructure |
| 5 | Dependencies | `dependencies/` | Dependency audits, upgrades, vulnerability patches |
| 6 | Documentation | `docs/` | Doc improvements, API documentation, guides |
| 7 | Feature | `features/` | New feature specs, implementation notes |
| 8 | Integration | `integration/` | API integrations, third-party service setup |
| 9 | Performance | `performance/` | Benchmarks, optimization reports, profiling |
| 10 | Refactor | `refactor/` | Code restructuring, pattern migrations |
| 11 | Security | `security/` | Security audits, vulnerability assessments |
| 12 | Testing | `testing/` | Test coverage reports, test strategy changes |
| 13 | CI/CD | `ci/` | Pipeline changes, build improvements |
| 14 | Tech Debt | `tech-debt/` | Debt identification, remediation tracking |
| 15 | Release | `release/` | Release notes, changelog entries, deploy records |

## Registry Guidelines

- **Add an entry** after completing any meaningful work session
- **Update status** when revisiting previous work (Active → Resolved)
- **Keep it lean** — archive entries older than 7 days (see archive strategy)
- **One line summaries** — the registry is an index, not the report itself
- **Link to full reports** — detailed analysis goes in category files

## Example Registry

```markdown
# Report Registry

### [Feature] Add user authentication
- **Date:** 2025-01-15
- **Status:** Active
- **File:** `.claude/reports/features/auth-implementation.md`
- **Summary:** JWT-based auth with refresh tokens, middleware complete, tests pending

### [Bug] Memory leak in WebSocket handler
- **Date:** 2025-01-14
- **Status:** Resolved
- **File:** `.claude/reports/bugs/websocket-memory-leak.md`
- **Summary:** Event listeners not cleaned up on disconnect, fixed with cleanup in close handler

### [Tech Debt] Legacy API compatibility layer
- **Date:** 2025-01-13
- **Status:** Active
- **File:** `.claude/reports/tech-debt/legacy-api-shim.md`
- **Summary:** v1 API shim adds 200ms latency, scheduled for removal in Q2
```
