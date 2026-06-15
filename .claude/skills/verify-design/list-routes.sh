#!/usr/bin/env bash
# Dump the app's concrete (non-parameterised) protected route paths from
# routes-path.ts — a reference menu for choosing what to drive. Routes with
# params (":id" etc.) are listed too but need a real id to visit.
set -euo pipefail

RP="src/routes/routes-path.ts"
[ -f "$RP" ] || { echo "✗ $RP not found (run from repo root)" >&2; exit 1; }

# Extract every "/..." string literal; sort unique; mark param routes.
grep -oE '"/[^"]*"' "$RP" \
  | tr -d '"' \
  | sort -u \
  | awk '{ if ($0 ~ /:/) print $0 "   (needs a param)"; else print $0 }'
