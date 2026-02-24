# Continue Session

Resume work on this project by reviewing recent activity and current state.

## Steps

1. **Recent git activity:**
   ```bash
   git log --oneline -15
   ```

2. **Current working state:**
   ```bash
   git status
   git diff --stat
   ```

3. **Recent changes scope:**
   ```bash
   git diff HEAD~3 --stat
   ```

4. **Read the report registry** (if it exists):
   ```bash
   cat .claude/reports/_registry.md
   ```

5. **Read the tech debt tracker** (if it exists):
   ```bash
   cat .claude/reports/_tech-debt.md
   ```

6. **Summarize for the user:**
   - What was worked on recently (from git log and registry)
   - What's currently in progress (uncommitted changes, active registry items)
   - Any P0/P1 tech debt that needs attention
   - Suggest what to work on next

7. **Ask:** "What would you like to work on?"
