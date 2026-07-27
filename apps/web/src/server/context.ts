import { withClient, type Client } from './db/with-client';

import { createCatalogRepository, type CatalogRepository } from './repositories/catalog.repository';
import { createOrderRepository } from './repositories/order.repository';
import { createStripeWebhookEventRepository } from './repositories/stripe-webhook.repository';
import { createCatalogReadService, type CatalogReadService } from './services/catalog-read.service';
import { createOrderService, type OrderService } from './services/order.service';
import {
  createStripeWebhookService,
  type StripeWebhookService,
} from './services/stripe-webhook.service';
import { InngestStripeWebhookQueue } from './jobs/inngest/functions';

export interface AppServices {
  orders: OrderService;
  stripeWebhook: StripeWebhookService;
  catalog: CatalogReadService;
  catalogRepo: CatalogRepository;
}

export function createAppServices(client: Client): AppServices {
  const catalogRepo = createCatalogRepository(client);
  return {
    catalogRepo,
    catalog: createCatalogReadService(catalogRepo),
    orders: createOrderService(createOrderRepository(client)),
    stripeWebhook: createStripeWebhookService(
      createStripeWebhookEventRepository(client),
      new InngestStripeWebhookQueue(),
    ),
  };
}

export async function runWithServices<T>(fn: (services: AppServices) => Promise<T>): Promise<T> {
  return withClient(async (client) => fn(createAppServices(client)));
}
