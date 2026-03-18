#!/usr/bin/env bash
# post-edit-check.sh — Multi-stack auto-validation for PostToolUse hook
# Detects file type from CLAUDE_TOOL_INPUT and runs the appropriate checker.
# Output is truncated to last 20 lines to avoid flooding agent context.

set -euo pipefail

# Extract the file path from the tool input JSON
# CLAUDE_TOOL_INPUT contains the JSON payload of the Edit/Write tool call
FILE=""
if [ -n "${CLAUDE_TOOL_INPUT:-}" ]; then
  # Try to extract file_path from JSON (Edit/Write tools use file_path)
  FILE=$(echo "$CLAUDE_TOOL_INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
fi

# If we couldn't extract a file path, exit silently
if [ -z "$FILE" ]; then
  exit 0
fi

# Get the file extension
EXT="${FILE##*.}"

case "$EXT" in
  ts|tsx)
    # TypeScript — run type checker
    if command -v npx &>/dev/null && [ -f "tsconfig.json" ]; then
      echo "=== TypeScript Check ==="
      npx tsc --noEmit 2>&1 | tail -20 || true
    fi
    ;;
  py)
    # Python — run ruff (fast linter), fallback to py_compile
    if command -v ruff &>/dev/null; then
      echo "=== Python Lint (ruff) ==="
      ruff check "$FILE" 2>&1 | tail -20 || true
    elif command -v python3 &>/dev/null; then
      echo "=== Python Syntax Check ==="
      python3 -m py_compile "$FILE" 2>&1 || true
    elif command -v python &>/dev/null; then
      echo "=== Python Syntax Check ==="
      python -m py_compile "$FILE" 2>&1 || true
    fi
    ;;
  rs)
    # Rust — run cargo check
    if command -v cargo &>/dev/null; then
      echo "=== Rust Check ==="
      cargo check 2>&1 | tail -20 || true
    fi
    ;;
  go)
    # Go — run go vet
    if command -v go &>/dev/null; then
      echo "=== Go Vet ==="
      go vet ./... 2>&1 | tail -20 || true
    fi
    ;;
  *)
    # Unknown file type — silent no-op
    ;;
esac

exit 0
