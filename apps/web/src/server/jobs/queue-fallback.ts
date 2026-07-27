import { withClient } from '../db/with-client';

export interface PendingQueueJobInput {
  jobName: string;
  payload: unknown;
}

export async function enqueueWithReconciliation(
  send: () => Promise<void>,
  fallback: PendingQueueJobInput,
): Promise<void> {
  try {
    await send();
  } catch (error) {
    console.warn('[queue] enqueue failed — persisting for reconciliation', error);
    await withClient(async (client) => {
      await client.query(
        `INSERT INTO pending_queue_jobs (job_name, payload) VALUES ($1, $2::jsonb)`,
        [fallback.jobName, JSON.stringify(fallback.payload)],
      );
    });
  }
}
