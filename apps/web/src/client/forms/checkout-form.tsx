'use client';
// client-justification: checkout form uses React Hook Form with shared Zod schema.

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@food-marketplace/ui';
import {
  createOrderInputSchema,
  type CreateOrderInput,
} from '@food-marketplace/shared-types/order';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { createOrderAction } from '../../../app/actions/orders';
import { useCartStore, persistCartOptimistic } from '../stores/cart-store';

export function CheckoutForm({ chefId, submitLabel }: { chefId: string; submitLabel: string }) {
  const t = useTranslations('Checkout');
  const lines = useCartStore((s) => s.lines);
  const rollback = useCartStore((s) => s.optimisticRollback);

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderInputSchema),
    defaultValues: {
      chefId,
      lines: lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity })),
    },
  });

  return (
    <form
      aria-describedby="checkout-sr-instructions"
      onSubmit={form.handleSubmit(async (values) => {
        const snapshot = [...lines];
        await persistCartOptimistic(
          async () => {
            const result = await createOrderAction(values);
            if (!result.ok) {
              throw new Error(result.body.error.message);
            }
          },
          () => rollback(snapshot),
        );
      })}
    >
      <p id="checkout-sr-instructions" className="sr-only">
        {t('srInstructions')}
      </p>
      <p>{lines.length} items in cart</p>
      <Button type="submit" fullWidth disabled={form.formState.isSubmitting || lines.length === 0}>
        {submitLabel}
      </Button>
      {form.formState.errors.lines ? (
        <p role="alert">{form.formState.errors.lines.message}</p>
      ) : null}
    </form>
  );
}
