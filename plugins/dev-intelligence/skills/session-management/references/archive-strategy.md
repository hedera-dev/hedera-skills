# Archive Strategy

> Guidelines for keeping the report registry and tech debt tracker lean and useful.

## Report Registry Archival

### When to Archive
- Reports **older than 7 days** with status `Resolved`
- Reports with status `Active` that haven't been updated in **14 days** (mark stale first)

### How to Archive
1. Create `.claude/reports/archive/` if it doesn't exist
2. Move the report file from its category directory to `archive/`
3. Update the registry entry status to `Archived`
4. Periodically (monthly), remove archive entries older than 90 days from the registry

### Registry Maintenance
```
Active reports    → Keep in registry, review each session
Resolved reports  → Keep 7 days, then archive
Archived reports  → Keep in registry 90 days, then remove entry
```

## Tech Debt Archival

### When to Archive
- Items with status `Resolved` — keep for **90 days** after resolution date, then archive
- Items with status `Open` that haven't been reviewed in **60 days** — mark as stale, ask if still relevant

### How to Archive
1. Move resolved items to a `## Archived` section at the bottom of the tech debt file
2. After 90 days, remove archived items entirely or move to `.claude/reports/archive/tech-debt-archive.md`

### Debt Lifecycle
```
Open          → Actively tracked, review on cadence
In Progress   → Being worked on this session
Resolved      → Fixed, keep 90 days for reference
Archived      → Removed from active tracker
```

## Best Practices

- **Don't let the registry grow beyond 50 active entries** — archive aggressively
- **Don't let tech debt exceed 30 open items** — prioritize or remove stale items
- **Review archive monthly** — delete items that no longer provide reference value
- **Automate when possible** — the `/debt` command helps manage the lifecycle
