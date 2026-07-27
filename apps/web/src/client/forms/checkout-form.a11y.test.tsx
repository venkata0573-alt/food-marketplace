import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';

import { CheckoutForm } from './checkout-form';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('../../app/actions/orders', () => ({
  createOrderAction: vi.fn(async () => ({ ok: true, body: {} })),
}));

vi.mock('../stores/cart-store', () => ({
  useCartStore: (selector: (s: { lines: unknown[]; optimisticRollback: () => void }) => unknown) =>
    selector({ lines: [{ dishId: 'd1', quantity: 1 }], optimisticRollback: () => undefined }),
  persistCartOptimistic: async (fn: () => Promise<void>) => fn(),
}));

describe('Checkout accessibility (axe)', () => {
  it('checkout form has no axe violations', async () => {
    const { container } = render(
      <CheckoutForm chefId="11111111-1111-4111-8111-111111111111" submitLabel="Place order" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
