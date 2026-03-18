# Parallel Sessions

Guide for running multiple Claude Code sessions on the same project simultaneously.

## Steps

1. **Check current state:**
   ```bash
   git status
   git stash list
   ```

2. **Show the parallel sessions guide:**

   ### When to Use Parallel Sessions vs Agent Teams

   | Use | Parallel Sessions | Agent Teams |
   |-----|------------------|-------------|
   | Duration | Long-running (30+ min) | Short burst (5-15 min) |
   | Coordination | Manual (git commits) | Automatic (TaskList) |
   | Scope | Independent features/modules | Sub-tasks of one feature |
   | State sharing | Via git (commit + pull) | Shared filesystem |
   | Best for | 2 devs on separate features | 3-4 agents on one feature |

3. **Identify file ownership boundaries:**
   - Scan the project structure and group files by subsystem
   - Each session should own one subsystem to avoid conflicts
   - Display a table mapping subsystems to files

4. **Warn about danger zones — shared files that multiple features touch:**
   - Type definitions and shared types
   - Data loading/utility modules
   - `CLAUDE.md`, `.claude/CLAUDE.md`
   - Architecture docs
   - `package.json` / `pyproject.toml` / `Cargo.toml`
   - Config files (CI, linter, bundler)

5. **Share state via git rules:**
   - Before starting: `git pull && git stash list`
   - Commit often — small, atomic commits so the other session can pull
   - Before editing shared files: `git pull` first
   - If conflict: the session that detects it resolves it

6. **Ask:** "Which subsystems will you be working on across sessions?"
