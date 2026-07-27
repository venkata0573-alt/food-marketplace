#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../packages/db/drizzle/migrations" && pwd)"
ups=("$DIR"/*.up.sql)
for up in "${ups[@]}"; do
  [[ -e "$up" ]] || continue
  down="${up%.up.sql}.down.sql"
  if [[ ! -f "$down" ]]; then
    echo "Missing down migration: $down" >&2
    exit 1
  fi
done
echo "All Drizzle migrations have paired down scripts."
