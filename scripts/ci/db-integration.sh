#!/usr/bin/env bash
# Layer 11 — integration tests against real Postgres (Docker).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/food_marketplace}"

echo "Starting Postgres (docker compose)…"
docker compose up -d postgres

echo "Waiting for Postgres health…"
for _ in $(seq 1 60); do
  if docker compose exec -T postgres pg_isready -U postgres -d food_marketplace >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Migrate + seed…"
pnpm --filter @food-marketplace/db seed

echo "Running integration + RLS suites…"
export RUN_DB_INTEGRATION=1
pnpm exec vitest run tests/db --reporter=verbose
