import { expect, test } from '@playwright/test';

const flows = [
  'chef-signup',
  'dish-publish',
  'customer-order',
  'allergen-block',
  'payout',
] as const;

for (const flow of flows) {
  test(`critical path: ${flow}`, async ({ request }) => {
    const api = await request.post('/api/e2e/flows', { data: { flow } });
    expect(api.ok(), `flow ${flow} HTTP`).toBeTruthy();
    const body = (await api.json()) as { ok: boolean; flow: string };
    expect(body.flow).toBe(flow);
    expect(body.ok).toBe(true);
  });
}

test('customer browse UI loads (mobile baseline)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/en/browse');
  await expect(page.getByRole('heading', { name: 'Browse' })).toBeVisible();
});

test('checkout cart page exposes place order control', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/en/cart');
  await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();
  await expect(page.getByRole('button', { name: /place order/i })).toBeVisible();
});
