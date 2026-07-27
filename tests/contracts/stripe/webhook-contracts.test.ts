import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { createStripeWebhookService } from '../../../apps/web/src/server/services/stripe-webhook.service';
import {
  schemaForStripeFixtureType,
  STRIPE_CONTRACT_FIXTURE_TYPES,
  type StripeContractFixtureType,
} from './schemas';

const fixturesDir = join(import.meta.dirname, 'fixtures');

describe('Stripe webhook contract fixtures', () => {
  const files = readdirSync(fixturesDir).filter((f) => f.endsWith('.json'));

  it('includes a fixture for every supported event type', () => {
    for (const type of STRIPE_CONTRACT_FIXTURE_TYPES) {
      expect(files).toContain(`${type}.json`);
    }
  });

  it.each(files)('validates fixture %s against its Zod schema', (file) => {
    const type = file.replace(/\.json$/, '') as StripeContractFixtureType;
    const raw = JSON.parse(readFileSync(join(fixturesDir, file), 'utf8')) as unknown;
    const schema = schemaForStripeFixtureType(type);
    expect(schema.safeParse(raw).success).toBe(true);
  });

  it.each(STRIPE_CONTRACT_FIXTURE_TYPES)(
    'acceptEvent accepts deduped enqueue for %s fixture',
    async (type) => {
      const raw = JSON.parse(readFileSync(join(fixturesDir, `${type}.json`), 'utf8')) as {
        id: string;
        type: string;
        data: unknown;
      };
      const repo = {
        tryAcquire: vi.fn(async () => true),
        markProcessed: vi.fn(),
        markFailed: vi.fn(),
      };
      const queue = { enqueueStripeEvent: vi.fn(async () => undefined) };
      const service = createStripeWebhookService(repo, queue);
      const result = await service.acceptEvent({
        id: raw.id,
        type: raw.type,
        data: raw.data,
      });
      expect(result.ok).toBe(true);
      expect(queue.enqueueStripeEvent).toHaveBeenCalled();
    },
  );
});
