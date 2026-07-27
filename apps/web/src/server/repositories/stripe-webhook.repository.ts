import type { Client } from '../db/with-client';

export interface StripeWebhookEventRepository {
  tryAcquire(eventId: string, eventType: string): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
  markFailed(eventId: string, error: string): Promise<void>;
}

export function createStripeWebhookEventRepository(client: Client): StripeWebhookEventRepository {
  return {
    async tryAcquire(eventId, eventType) {
      const result = await client.query(
        `INSERT INTO stripe_webhook_events (event_id, event_type)
         VALUES ($1, $2)
         ON CONFLICT (event_id) DO NOTHING
         RETURNING event_id`,
        [eventId, eventType],
      );
      return (result.rowCount ?? 0) > 0;
    },
    async markProcessed(eventId) {
      await client.query(
        `UPDATE stripe_webhook_events SET processed_at = NOW(), processing_error = NULL WHERE event_id = $1`,
        [eventId],
      );
    },
    async markFailed(eventId, error) {
      await client.query(
        `UPDATE stripe_webhook_events SET processing_error = $2 WHERE event_id = $1`,
        [eventId, error],
      );
    },
  };
}
