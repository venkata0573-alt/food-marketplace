import { z } from 'zod';

/** Contract shapes for Stripe webhook payloads we handle (fixtures must validate). */
export const stripeEventEnvelopeSchema = z.object({
  id: z.string().startsWith('evt_'),
  object: z.literal('event'),
  type: z.string().min(1),
  data: z.object({
    object: z.record(z.unknown()),
  }),
  livemode: z.boolean(),
  created: z.number().int(),
});

export const paymentIntentSucceededSchema = stripeEventEnvelopeSchema.extend({
  type: z.literal('payment_intent.succeeded'),
  data: z.object({
    object: z.object({
      id: z.string().startsWith('pi_'),
      object: z.literal('payment_intent'),
      amount: z.number().int().nonnegative(),
      currency: z.string().length(3),
      status: z.literal('succeeded'),
      metadata: z.record(z.string()).optional(),
    }),
  }),
});

export const payoutPaidSchema = stripeEventEnvelopeSchema.extend({
  type: z.literal('payout.paid'),
  data: z.object({
    object: z.object({
      id: z.string().startsWith('po_'),
      object: z.literal('payout'),
      amount: z.number().int(),
      currency: z.string().length(3),
      status: z.literal('paid'),
    }),
  }),
});

export const chargeRefundedSchema = stripeEventEnvelopeSchema.extend({
  type: z.literal('charge.refunded'),
  data: z.object({
    object: z.object({
      id: z.string().startsWith('ch_'),
      object: z.literal('charge'),
      amount_refunded: z.number().int().nonnegative(),
      refunded: z.boolean(),
    }),
  }),
});

export const accountUpdatedSchema = stripeEventEnvelopeSchema.extend({
  type: z.literal('account.updated'),
  data: z.object({
    object: z.object({
      id: z.string().startsWith('acct_'),
      object: z.literal('account'),
      charges_enabled: z.boolean(),
      payouts_enabled: z.boolean(),
    }),
  }),
});

export const STRIPE_CONTRACT_FIXTURE_TYPES = [
  'payment_intent.succeeded',
  'payout.paid',
  'charge.refunded',
  'account.updated',
] as const;

export type StripeContractFixtureType = (typeof STRIPE_CONTRACT_FIXTURE_TYPES)[number];

export function schemaForStripeFixtureType(type: StripeContractFixtureType) {
  switch (type) {
    case 'payment_intent.succeeded':
      return paymentIntentSucceededSchema;
    case 'payout.paid':
      return payoutPaidSchema;
    case 'charge.refunded':
      return chargeRefundedSchema;
    case 'account.updated':
      return accountUpdatedSchema;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
