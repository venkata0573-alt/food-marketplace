import { withClient } from '../../db/with-client';
import { Inngest } from 'inngest';

import { enqueueWithReconciliation } from '../queue-fallback';
import { processDishImageUpload, type ImageProcessPayload } from '../image-processing';
import { createStripeWebhookEventRepository } from '../../repositories/stripe-webhook.repository';
import type { StripeEventPayload } from '../../services/stripe-webhook.service';

export const inngest = new Inngest({ id: 'food-marketplace-web' });

export const processStripeWebhookEvent = inngest.createFunction(
  {
    id: 'stripe-webhook-process',
    retries: 5,
  },
  { event: 'stripe/webhook.received' },
  async ({ event, step }) => {
    const payload = event.data as StripeEventPayload;
    await step.run('process-event', async () => {
      await withClient(async (client) => {
        const repo = createStripeWebhookEventRepository(client);
        try {
          // Business logic runs async — never inline in the HTTP webhook handler.
          void payload;
          await repo.markProcessed(payload.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'processing failed';
          await repo.markFailed(payload.id, message);
          throw error;
        }
      });
    });
  },
);

export const inngestFunctions = [
  processStripeWebhookEvent,
  inngest.createFunction(
    { id: 'send-transactional-email', retries: 5 },
    { event: 'email/send' },
    async () => {},
  ),
  inngest.createFunction(
    { id: 'process-uploaded-image', retries: 5 },
    { event: 'image/process' },
    async ({ event }) => {
      const payload = event.data as ImageProcessPayload;
      await processDishImageUpload(payload);
    },
  ),
];

export class InngestStripeWebhookQueue {
  async enqueueStripeEvent(payload: StripeEventPayload): Promise<void> {
    await enqueueWithReconciliation(
      async () => {
        await inngest.send({
          name: 'stripe/webhook.received',
          data: payload,
        });
      },
      { jobName: 'stripe/webhook.received', payload },
    );
  }
}
