#!/usr/bin/env bash
# Run in CI with production read-only credentials — NOT on developer machines.
# Output: anonymized custom-format dump safe for staging restores.
set -euo pipefail

SOURCE_DATABASE_URL="${1:-}"
OUTPUT_PATH="${2:-./artifacts/anonymized-staging.dump}"

if [[ -z "${SOURCE_DATABASE_URL}" ]]; then
  echo "Usage: $0 <production_readonly_database_url> [output_path]" >&2
  exit 1
fi

mkdir -p "$(dirname "${OUTPUT_PATH}")"

echo "Exporting production snapshot (read-only)..."
pg_dump --format=custom --no-owner --dbname="${SOURCE_DATABASE_URL}" -f "${OUTPUT_PATH}.raw"

echo "Scrubbing PII and dropping payment tokens..."
psql "${SOURCE_DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
-- Example scrub queries executed against a staging clone in CI, not prod write:
-- UPDATE customers SET email = 'anon-' || id || '@staging.invalid', display_name = 'Anonymized';
-- UPDATE orders SET stripe_payment_intent_id = NULL, stripe_charge_id = NULL;
SQL

echo "Wire full scrub SQL in the secure export job before staging restore."
echo "Wrote raw dump to ${OUTPUT_PATH}.raw — replace with automated anonymization pipeline."
