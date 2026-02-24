# Initialize Project

Set up this project for AI-assisted development with session tracking, quality gates, and conventions.

## Steps

1. **Detect project stack:**
   - Scan for `package.json`, `tsconfig.json`, `pyproject.toml`, `setup.py`, `Cargo.toml`, `go.mod`
   - Read manifest files to detect build/test/lint commands
   - Identify the primary language and framework

2. **Show detected configuration:**
   - Stack and language
   - Build, test, lint commands
   - Package manager
   - Ask user to confirm or adjust

3. **Ask for custom conventions:**
   - Any project-specific rules?
   - Directory structure conventions?
   - Forbidden patterns?
   - Additional test or lint requirements?

4. **Generate CLAUDE.md:**
   - Use the project-scaffolding skill's CLAUDE.md template
   - Fill in detected information
   - Add user-provided conventions
   - Place at project root

5. **Create .claude/ directory structure:**
   - Create `.claude/reports/` with all 15 category directories
   - Create `.claude/reports/_registry.md` (empty registry)
   - Create `.claude/reports/_tech-debt.md` (empty tracker)
   - Create `.claude/scripts/post-edit-check.sh` (validation script)
   - Make scripts executable

6. **Set up hooks:**
   - Create `.claude/settings.json` with PostToolUse hook
   - Wire up the auto-validation script

7. **Seed MEMORY.md:**
   - Determine the MEMORY.md path for Claude Code's auto-memory:
     `~/.claude/projects/<project-path-with-dashes>/memory/MEMORY.md`
   - Create the directory structure if it doesn't exist
   - Seed with initial lessons from the project:
     - Stack and build tool details
     - Key architectural patterns discovered during detection
     - Common pitfalls for the detected stack (e.g., ESM gotchas for TypeScript, virtual env issues for Python)
     - Testing patterns (framework, mock strategy)
   - Keep under 200 lines — this file is loaded into every system prompt

8. **Generate Triggers section for CLAUDE.md:**
   - Scan project structure for distinct subsystems (directories under `src/`, `lib/`, etc.)
   - Map file patterns to skills or doc files that provide deeper context
   - Add the Triggers table to the generated CLAUDE.md
   - Goal: CLAUDE.md stays under 200 lines; deep context loaded on demand

9. **Report what was created:**
   - List all files and directories created
   - Explain what each component does
   - Mention MEMORY.md location and that it persists across sessions
   - Suggest running `/continue` to verify setup
