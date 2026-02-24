---
name: Session Management
description: This skill should be used when the user wants to resume previous work, continue from a last session, check what was being worked on, track completed work, log session activity, manage tech debt, review pending items, view session history, or maintain a work log. Triggered by phrases like "resume work", "continue from last session", "what was I working on", "track this work", "log what we did", "tech debt", "what's pending", "session history", "work log".
---

# Session Management

## Purpose

Maintain continuity across AI agent sessions by providing structured work tracking, tech debt management, and report archival. This skill ensures no context is lost between sessions — the agent always knows what was done, what's pending, and what needs attention.

## The Report Registry

The report registry (`.claude/reports/_registry.md`) is the central index of all work performed across sessions.

### When to Add Entries
- After completing a meaningful unit of work (bug fix, feature, refactor, investigation)
- After an investigation that produced findings worth preserving
- When identifying an issue that needs future attention

### How to Use
1. Read the registry at session start to understand recent work
2. Add entries as work is completed during the session
3. Update entry status when revisiting previous work (`Active` → `Resolved`)
4. Follow the 15-category structure for organization

### Entry Format
```markdown
### [Category] Short descriptive title
- **Date:** YYYY-MM-DD
- **Status:** Active | Resolved | Archived
- **File:** `.claude/reports/<category>/<filename>.md`
- **Summary:** One-line description of findings or changes
```

See `references/registry-template.md` for the full template with all 15 categories.

## The Tech Debt Tracker

The tech debt tracker (`.claude/reports/_tech-debt.md`) captures technical debt discovered during development.

### When to Add Debt
- When you notice code that should be improved but isn't the current focus
- When a workaround is used instead of a proper solution
- When tests are skipped or coverage gaps are identified
- When dependency updates are deferred
- When architectural concerns are discovered

### Priority Levels
| Priority | Meaning | Action |
|----------|---------|--------|
| P0 | Blocks development or production | Fix this session |
| P1 | Degrades DX or performance | Fix this week |
| P2 | Code quality concern | Fix this month |
| P3 | Nice-to-have improvement | Fix when convenient |

### Item Format
```markdown
### [P{0-3}] Short title
- **Added:** YYYY-MM-DD
- **Category:** code-quality | performance | security | architecture | testing | dependency | documentation
- **Location:** `path/to/file.ts:123`
- **Impact:** What happens if this isn't addressed
- **Suggested Fix:** Brief approach description
- **Status:** Open | In Progress | Resolved
```

See `references/tech-debt-template.md` for the full template with examples.

## Archive Strategy

Keep the registry and debt tracker lean:

- **Reports:** Archive resolved items older than 7 days to `.claude/reports/archive/`
- **Tech Debt:** Keep resolved items 90 days for reference, then archive
- **Registry Size:** Don't exceed 50 active entries — archive aggressively
- **Monthly Cleanup:** Remove archived items that no longer provide value

See `references/archive-strategy.md` for detailed archival guidelines.

## Session Start Workflow

When resuming work on a project with session management set up:

1. **Read the registry:** `cat .claude/reports/_registry.md`
2. **Read tech debt:** `cat .claude/reports/_tech-debt.md`
3. **Check git state:** `git log --oneline -10` and `git status`
4. **Summarize:** Tell the user what's active, what's pending, and suggest what to work on
5. **Check for P0 debt:** If any P0 items exist, flag them for immediate attention

## Session End Workflow

Before ending a session:

1. **Update registry** with any work completed this session
2. **Add tech debt** for anything discovered but not addressed
3. **Archive** any resolved items past their retention period
4. **Summarize** what was accomplished and what's next

## Cross-References

- `references/registry-template.md` — Full registry template with 15 categories
- `references/tech-debt-template.md` — Tech debt tracker template with examples
- `references/archive-strategy.md` — Archival rules and lifecycle management
