import { describe, expect, it, vi } from 'vitest';

import { createStripeWebhookService } from '../../apps/web/src/server/services/stripe-webhook.service';

describe('createStripeWebhookService', () => {
  it('deduplicates events via repository acquire', async () => {
    const repo = {
      tryAcquire: vi.fn(async () => false),
      markProcessed: vi.fn(),
      markFailed: vi.fn(),
    };
    const queue = { enqueueStripeEvent: vi.fn() };
    const service = createStripeWebhookService(repo, queue);
    const result = await service.acceptEvent({ id: 'evt_1', type: 'payout.paid', data: {} });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(false);
    }
    expect(queue.enqueueStripeEvent).not.toHaveBeenCalled();
  });

  it('enqueues first-seen events', async () => {
    const repo = {
      tryAcquire: vi.fn(async () => true),
      markProcessed: vi.fn(),
      markFailed: vi.fn(),
    };
    const queue = { enqueueStripeEvent: vi.fn(async () => undefined) };
    const service = createStripeWebhookService(repo, queue);
    const payload = { id: 'evt_2', type: 'payment_intent.succeeded', data: { object: {} } };
    const result = await service.acceptEvent(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
    }
    expect(queue.enqueueStripeEvent).toHaveBeenCalledWith(payload);
  });
});
