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

7. **Report what was created:**
   - List all files and directories created
   - Explain what each component does
   - Suggest running `/continue` to verify setup
