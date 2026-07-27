#!/usr/bin/env bash
# Staging refresh from production — NEVER run against production from a laptop.
# Requires: anonymized dump produced in a secure CI job with production read-only creds.
set -euo pipefail

if [[ "${APP_ENV:-}" == "production" ]]; then
  echo "Refusing: APP_ENV=production" >&2
  exit 1
fi

DUMP_PATH="${1:-}"
TARGET_DATABASE_URL="${2:-${DATABASE_URL:-}}"

if [[ -z "${DUMP_PATH}" || -z "${TARGET_DATABASE_URL}" ]]; then
  echo "Usage: APP_ENV=staging $0 <anonymized.dump> [database_url]" >&2
  exit 1
fi

echo "Restoring anonymized dump into staging database..."
pg_restore --clean --if-exists --no-owner --dbname="${TARGET_DATABASE_URL}" "${DUMP_PATH}"
echo "Done. Run staging smoke tests before opening traffic."
