#!/usr/bin/env bash
# check-spec.sh — coherence checks for a hedera-harness recipe (schemaVersion 2).
#
# Two layers:
#   1. `hedera-harness doctor --recipe-only` owns schema, defaults, baseline,
#      and network validity. It is authoritative; this script does not
#      re-implement it.
#   2. Local checks for cross-file coherence doctor does not perform — most
#      importantly the tier-3 contract/validator pairing, which doctor passes.
#
# Line-oriented only (grep/awk). No YAML/JSON parser. Treat findings as leads.
#
# Usage: bash check-spec.sh <project-root>
#   <project-root> is the directory containing .harness/
# Exit 0 = clean. Exit 1 = findings. Exit 2 = usage error.

set -uo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: check-spec.sh <project-root>" >&2
  exit 2
fi

ROOT="${1%/}"
FINDINGS=0
DEGRADED=0

fail() {
  echo "FAIL: $*"
  FINDINGS=$((FINDINGS + 1))
}

note() { echo "NOTE: $*"; }

SPEC_FILE="$ROOT/.harness/spec.yaml"
if [[ ! -f "$SPEC_FILE" ]]; then
  fail "recipe file missing: $SPEC_FILE"
  echo "check-spec: 1 finding(s)"
  exit 1
fi

# --- helpers -----------------------------------------------------------------

# First non-comment scalar value for a top-level-ish YAML key.
yaml_scalar() {
  local file="$1" key="$2"
  grep -E "^[[:space:]]*${key}:[[:space:]]*[^[:space:]]" "$file" 2>/dev/null \
    | grep -v '^[[:space:]]*#' \
    | head -1 \
    | sed -E "s/^[[:space:]]*${key}:[[:space:]]*//; s/[\"']//g; s/[[:space:]]+#.*//; s/[[:space:]]*$//"
}

# True if an uncommented line matching pattern exists.
has_active() {
  grep -E "$2" "$1" 2>/dev/null | grep -v '^[[:space:]]*#' | grep -q .
}

# True if `enabled: true` appears inside the given top-level block.
block_enabled() {
  awk -v key="$2" '
    /^[[:space:]]*#/ { next }
    $0 ~ "^[[:space:]]*" key ":[[:space:]]*$" { in_b=1; next }
    in_b && /^[^[:space:]#]/ { exit }
    in_b && /^[[:space:]]*enabled:[[:space:]]*true/ { found=1; exit }
    END { exit found ? 0 : 1 }
  ' "$1"
}

# Resolve a path key, falling back to the v2 default when the key is absent.
resolve_path() {
  local key="$1" default="$2" value
  value="$(yaml_scalar "$SPEC_FILE" "$key")"
  [[ -z "$value" ]] && value="$default"
  echo "$ROOT/$value"
}

# --- layer 1: delegate schema validity to the harness -------------------------

echo "== recipe (hedera-harness doctor --recipe-only) =="

# Prefer a harness on PATH, else one installed in the project.
DOCTOR_OUT=""
DOCTOR_RC=0
if command -v hedera-harness >/dev/null 2>&1; then
  DOCTOR_OUT="$(hedera-harness doctor "$SPEC_FILE" --recipe-only 2>&1)"; DOCTOR_RC=$?
elif [[ -x "$ROOT/node_modules/.bin/hedera-harness" ]]; then
  DOCTOR_OUT="$("$ROOT/node_modules/.bin/hedera-harness" doctor "$SPEC_FILE" --recipe-only 2>&1)"; DOCTOR_RC=$?
else
  DOCTOR_RC=127
fi

if [[ "$DOCTOR_RC" -eq 127 ]]; then
  DEGRADED=1
  note "hedera-harness not on PATH and not installed in $ROOT — schema not validated."
  note "Install it, or run: npx hedera-harness@latest doctor .harness/spec.yaml --recipe-only"
elif grep -q 'Expected command' <<<"$DOCTOR_OUT"; then
  # A pre-1.2.0 harness has no `doctor` verb.
  DEGRADED=1
  note "the installed hedera-harness is older than 1.2.0 (no 'doctor' command) — schema not validated."
  note "Upgrade it, or run: npx hedera-harness@latest doctor .harness/spec.yaml --recipe-only"
else
  echo "$DOCTOR_OUT"
  [[ "$DOCTOR_RC" -ne 0 ]] && FINDINGS=$((FINDINGS + 1))
fi

if [[ "$DEGRADED" -eq 1 ]]; then
  # Minimal stand-in so an unusable CLI does not hide an obviously broken recipe.
  SCHEMA="$(yaml_scalar "$SPEC_FILE" "schemaVersion")"
  if [[ "$SCHEMA" != "2" ]]; then
    fail "schemaVersion is '${SCHEMA:-absent}', expected 2 — run: hedera-harness migrate"
  fi
  if ! has_active "$SPEC_FILE" '^[[:space:]]*baseline:'; then
    fail "recipe requires a baseline: block"
  elif ! awk '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*baseline:/ { in_b=1; next }
    in_b && /^[^[:space:]#]/ { exit }
    in_b && /name:[[:space:]]*install[[:space:]]*$/ { found=1; exit }
    END { exit found ? 0 : 1 }
  ' "$SPEC_FILE"; then
    fail "baseline must include a command literally named \"install\""
  fi
fi

echo
echo "== coherence =="

# --- removed-in-v2 keys -------------------------------------------------------

for dead in seed generator logging extend; do
  if has_active "$SPEC_FILE" "^[[:space:]]*${dead}:"; then
    fail "'${dead}:' was removed in schema v2 — run: hedera-harness migrate .harness/spec.yaml"
  fi
done

# --- resolve the recipe's files (honouring v2 defaults) -----------------------

STATIC="$(resolve_path static .harness/validators/static.json)"
COMMANDS="$(resolve_path commands .harness/validators/yarn.json)"
CONTRACT_REL="$(yaml_scalar "$SPEC_FILE" "contract")"
PLAY_REL="$(yaml_scalar "$SPEC_FILE" "playwright")"

# `prd` may be a scalar or a list of increments.
PRDS=()
PRD_SCALAR="$(yaml_scalar "$SPEC_FILE" "prd")"
if [[ -n "$PRD_SCALAR" ]]; then
  PRDS+=("$ROOT/$PRD_SCALAR")
else
  while IFS= read -r line; do
    [[ -n "$line" ]] && PRDS+=("$ROOT/$line")
  done < <(awk '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*prd:[[:space:]]*$/ { in_p=1; next }
    in_p && /^[[:space:]]*-[[:space:]]*/ {
      sub(/^[[:space:]]*-[[:space:]]*/, ""); gsub(/["'\'']/, ""); print; next
    }
    in_p { exit }
  ' "$SPEC_FILE")
  [[ ${#PRDS[@]} -eq 0 ]] && PRDS+=("$ROOT/.harness/prd.md")
fi

for prd in "${PRDS[@]}"; do
  [[ -f "$prd" ]] || fail "prd missing on disk: $prd"
done
[[ -f "$STATIC" ]]   || fail "static validator missing: $STATIC"
[[ -f "$COMMANDS" ]] || fail "command validator missing: $COMMANDS"

# --- post-feature command validator needs an install --------------------------

if [[ -f "$COMMANDS" ]]; then
  grep -E '"name"[[:space:]]*:[[:space:]]*"install"' "$COMMANDS" >/dev/null \
    || fail "command validator missing a command literally named \"install\""
fi

# --- REPLACE_ME ---------------------------------------------------------------

SCAN=("$SPEC_FILE")
for f in "${PRDS[@]}" "$STATIC" "$COMMANDS"; do
  [[ -f "$f" ]] && SCAN+=("$f")
done
while IFS= read -r line; do
  [[ -n "$line" ]] && fail "REPLACE_ME leftover: $line"
done < <(grep -Rn "REPLACE_ME" "${SCAN[@]}" 2>/dev/null || true)

# --- tier 3 pairing (doctor does NOT catch this) ------------------------------

HAS_CONTRACT=false
has_active "$SPEC_FILE" '^[[:space:]]*contract:[[:space:]]*[^[:space:]]' && HAS_CONTRACT=true

HAS_VALIDATOR=false
block_enabled "$SPEC_FILE" "validator" && HAS_VALIDATOR=true

if $HAS_CONTRACT && ! $HAS_VALIDATOR; then
  fail "tier 3 incomplete: contract present but validator.enabled is not true"
fi
if $HAS_VALIDATOR && ! $HAS_CONTRACT; then
  fail "tier 3 incomplete: validator.enabled true but contract missing"
fi

CONTRACT=""
if [[ -n "$CONTRACT_REL" ]]; then
  CONTRACT="$ROOT/$CONTRACT_REL"
  [[ -f "$CONTRACT" ]] || fail "oracle missing: $CONTRACT"
fi

if [[ -n "$PLAY_REL" ]] && [[ ! -f "$ROOT/$PLAY_REL" ]]; then
  fail "playwright smoke missing: $ROOT/$PLAY_REL"
fi

# --- v1 validator agent block -------------------------------------------------

if awk '
  /^[[:space:]]*#/ { next }
  /^[[:space:]]*validator:[[:space:]]*$/ { in_v=1; next }
  in_v && /^[^[:space:]#]/ { exit }
  in_v && /^[[:space:]]*(provider|command|args|model):/ { found=1; exit }
  END { exit found ? 0 : 1 }
' "$SPEC_FILE"; then
  fail "validator carries v1 agent flags — use the 'agent:' preset instead"
fi

# --- executableWithTestSigner requires chainValidation ------------------------

if [[ -n "$CONTRACT" ]] && [[ -f "$CONTRACT" ]]; then
  if grep -E '"executableWithTestSigner"[[:space:]]*:[[:space:]]*true' "$CONTRACT" >/dev/null; then
    block_enabled "$SPEC_FILE" "chainValidation" \
      || fail "executableWithTestSigner=true in oracle but chainValidation.enabled is not true"
  fi
fi

# --- oracle ↔ PRD traceability ------------------------------------------------

if [[ -n "$CONTRACT" ]] && [[ -f "$CONTRACT" ]]; then
  # Count occurrences, not matching lines — contracts may be compact JSON.
  ASSERTIONS=$(grep -oE '"id"[[:space:]]*:[[:space:]]*"C[0-9]+"' "$CONTRACT" 2>/dev/null | wc -l | tr -d ' ')
  [[ "${ASSERTIONS:-0}" -eq 0 ]] && fail "oracle has no numbered assertions (C1, C2, …)"

  CRITICAL=$(grep -oE '"severity"[[:space:]]*:[[:space:]]*"critical"' "$CONTRACT" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "${CRITICAL:-0}" -gt 2 ]]; then
    fail "oracle has ${CRITICAL} critical assertions (prefer <= 2; the run will rarely pass)"
  fi

  grep -E '"failOnUncertainty"' "$CONTRACT" >/dev/null \
    || fail "oracle missing evaluationRules.failOnUncertainty (fail-closed posture)"

  # Journeys are numbered list items under a "## Journeys" heading.
  JOURNEYS=0
  for prd in "${PRDS[@]}"; do
    [[ -f "$prd" ]] || continue
    n=$(awk '/^##[[:space:]]*Journeys/ { in_j=1; next }
             in_j && /^##/ { exit }
             in_j && /^[[:space:]]*[0-9]+\./ { c++ }
             END { print c+0 }' "$prd")
    JOURNEYS=$((JOURNEYS + n))
  done
  if [[ "$JOURNEYS" -gt 0 ]] && [[ "${ASSERTIONS:-0}" -lt "$JOURNEYS" ]]; then
    fail "oracle has ${ASSERTIONS} assertion(s) for ${JOURNEYS} PRD journey(s) — some journey is ungraded"
  fi
fi

# --- authoring skills must not leak into the generator list -------------------

if awk '
  /^[[:space:]]*#/ { next }
  /^[[:space:]]*skills:[[:space:]]*$/ { in_s=1; next }
  in_s && /^[^[:space:]#-]/ { exit }
  in_s && /(create-harness-spec|review-harness-spec|harness-spec-anatomy)/ { found=1; exit }
  END { exit found ? 0 : 1 }
' "$SPEC_FILE"; then
  fail "skills: lists an authoring skill — that list is for generator skills only"
fi

# --- blind check on every PRD -------------------------------------------------

for prd in "${PRDS[@]}"; do
  [[ -f "$prd" ]] || continue
  label="$(basename "$prd")"
  grep -E '\bC[0-9]+\b' "$prd" >/dev/null \
    && fail "blind: $label contains an assertion id (C1, C2, …)"
  grep -E 'howToVerify' "$prd" >/dev/null \
    && fail "blind: $label contains howToVerify"
  grep -Ei 'severity[[:space:]]*:[[:space:]]*(critical|major|minor)' "$prd" >/dev/null \
    && fail "blind: $label contains a severity label"
done

# --- summary ------------------------------------------------------------------

echo
if [[ "$FINDINGS" -gt 0 ]]; then
  echo "check-spec: $FINDINGS finding(s)"
  [[ "$DEGRADED" -eq 1 ]] && echo "check-spec: schema NOT validated (see NOTE above)"
  exit 1
fi

if [[ "$DEGRADED" -eq 1 ]]; then
  echo "check-spec: coherence OK, but schema NOT validated (see NOTE above)"
  exit 1
fi

echo "check-spec: OK"
exit 0
