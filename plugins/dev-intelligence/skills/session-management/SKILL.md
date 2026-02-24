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

## Self-Improvement via MEMORY.md

MEMORY.md is Claude Code's auto-memory file — it's loaded into every system prompt automatically. Use it as a self-improvement loop that accumulates project-specific lessons across sessions.

### Location
```
~/.claude/projects/<project-path-with-dashes>/memory/MEMORY.md
```

### When to Update MEMORY.md
- **After any correction from the user** — the most important trigger. If the user corrects your approach, save the lesson immediately.
- After discovering a non-obvious pattern or pitfall in the codebase
- After learning a user preference (e.g., "always use X library", "never auto-commit")
- After resolving a tricky bug whose root cause wasn't obvious

### MEMORY.md Structure
Organize by topic, not chronologically:
```markdown
# Project — Lessons Learned

## Build & Tooling
- [lesson]

## Architecture Patterns
- [lesson]

## Testing
- [lesson]

## Common Pitfalls
- [lesson]

## Owner Preferences
- [lesson]
```

### Size Budget
Keep under 200 lines — this is loaded into every system prompt. If it grows too large:
1. Merge related entries
2. Remove lessons that are now obvious from context
3. Create separate topic files (e.g., `debugging.md`) and link from MEMORY.md

### What NOT to Save
- Session-specific context (current task, in-progress work)
- Information already in CLAUDE.md or project docs
- Speculative or unverified conclusions
- Temporary workarounds that have been properly fixed

## Session Start Workflow

When resuming work on a project with session management set up:

1. **Read the registry:** `cat .claude/reports/_registry.md`
2. **Read tech debt:** `cat .claude/reports/_tech-debt.md`
3. **Check git state:** `git log --oneline -10` and `git status`
4. **Review MEMORY.md lessons** relevant to the area being worked on (MEMORY.md is auto-loaded in system prompt)
5. **Summarize:** Tell the user what's active, what's pending, and suggest what to work on
6. **Check for P0 debt:** If any P0 items exist, flag them for immediate attention

## Session End Workflow

Before ending a session:

1. **Update registry** with any work completed this session
2. **Add tech debt** for anything discovered but not addressed
3. **Update MEMORY.md** with any corrections or lessons learned this session
4. **Archive** any resolved items past their retention period
5. **Summarize** what was accomplished and what's next

## Cross-References

- `references/registry-template.md` — Full registry template with 15 categories
- `references/tech-debt-template.md` — Tech debt tracker template with examples
- `references/archive-strategy.md` — Archival rules and lifecycle management
