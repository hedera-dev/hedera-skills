# Tech Debt

View and manage the project's technical debt tracker.

## Steps

1. **Read the tech debt tracker:**
   ```bash
   cat .claude/reports/_tech-debt.md
   ```

2. **Display summary table:**

   | Priority | Count | Oldest |
   |----------|-------|--------|
   | P0 (Critical) | N | date |
   | P1 (High) | N | date |
   | P2 (Medium) | N | date |
   | P3 (Low) | N | date |

3. **Ask user what they want to do:**
   - **View all** — show the full debt list
   - **Add item** — add a new tech debt entry (ask for title, priority, category, location, impact, suggested fix)
   - **Mark resolved** — update an item's status to Resolved with today's date
   - **Review stale** — find items that haven't been updated in 60+ days

4. **If adding an item**, use this format:
   ```markdown
   ### [P{0-3}] Title
   - **Added:** YYYY-MM-DD
   - **Category:** [category]
   - **Location:** `path/to/file:line`
   - **Impact:** [description]
   - **Suggested Fix:** [approach]
   - **Status:** Open
   ```

5. **If marking resolved**, update the item:
   - Change **Status** to `Resolved`
   - Add **Resolved:** YYYY-MM-DD

6. **If no tracker exists**, offer to create one using the tech-debt-template.
