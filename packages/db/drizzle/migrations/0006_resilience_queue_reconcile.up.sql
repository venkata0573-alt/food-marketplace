-- Layer 8: queue reconciliation when Inngest is unavailable
CREATE TABLE IF NOT EXISTS pending_queue_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  reconciled_at timestamptz
);

CREATE INDEX IF NOT EXISTS pending_queue_jobs_unreconciled_idx
  ON pending_queue_jobs (created_at)
  WHERE reconciled_at IS NULL;
