import type { Result } from '@food-marketplace/domain';

import type { StripeWebhookEventRepository } from '../repositories/stripe-webhook.repository';

export interface StripeEventPayload {
  id: string;
  type: string;
  data: unknown;
}

export interface StripeWebhookQueue {
  enqueueStripeEvent(payload: StripeEventPayload): Promise<void>;
}

export interface StripeWebhookService {
  acceptEvent(payload: StripeEventPayload): Promise<Result<{ accepted: boolean }>>;
}

export function createStripeWebhookService(
  repo: StripeWebhookEventRepository,
  queue: StripeWebhookQueue,
): StripeWebhookService {
  return {
    async acceptEvent(payload) {
      const acquired = await repo.tryAcquire(payload.id, payload.type);
      if (!acquired) {
        return { ok: true, value: { accepted: false } };
      }
      await queue.enqueueStripeEvent(payload);
      return { ok: true, value: { accepted: true } };
    },
  };
}
