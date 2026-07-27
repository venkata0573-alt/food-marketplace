import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  smallserial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/** All timestamps are timestamptz stored in UTC. */
const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: 'string' }).notNull();

export const orderStatusEnum = pgEnum('order_status', [
  'draft',
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
  'disputed',
]);

export const idempotencyScopeEnum = pgEnum('idempotency_scope', ['order', 'payment']);

export const allergens = pgTable(
  'allergens',
  {
    id: smallserial('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
  },
  (table) => [
    uniqueIndex('allergens_code_unique').on(table.code),
    check('allergens_code_not_empty', sql`length(trim(${table.code})) > 0`),
  ],
);

export const chefs = pgTable(
  'chefs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id'),
    slug: text('slug').notNull(),
    displayName: text('display_name').notNull(),
    bio: text('bio').notNull().default(''),
    city: text('city').notNull(),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
    updatedAt: timestamptz('updated_at').default(sql`NOW()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('chefs_slug_unique').on(table.slug),
    index('chefs_deleted_at_idx').on(table.deletedAt),
    check('chefs_slug_not_empty', sql`length(trim(${table.slug})) > 0`),
  ],
);

export const dishes = pgTable(
  'dishes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chefId: uuid('chef_id')
      .notNull()
      .references(() => chefs.id, { onDelete: 'restrict' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    priceCents: integer('price_cents').notNull(),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
    updatedAt: timestamptz('updated_at').default(sql`NOW()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('dishes_chef_slug_unique').on(table.chefId, table.slug),
    index('dishes_chef_id_idx').on(table.chefId),
    check('dishes_price_cents_positive', sql`${table.priceCents} > 0`),
  ],
);

export const dishAllergens = pgTable(
  'dish_allergens',
  {
    dishId: uuid('dish_id')
      .notNull()
      .references(() => dishes.id, { onDelete: 'cascade' }),
    allergenId: smallint('allergen_id')
      .notNull()
      .references(() => allergens.id, { onDelete: 'restrict' }),
  },
  (table) => [primaryKey({ columns: [table.dishId, table.allergenId] })],
);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authUserId: uuid('auth_user_id'),
    emailEncrypted: text('email_encrypted').notNull(),
    displayName: text('display_name').notNull(),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
    updatedAt: timestamptz('updated_at').default(sql`NOW()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('customers_auth_user_id_unique').on(table.authUserId),
    index('customers_deleted_at_idx').on(table.deletedAt),
  ],
);

export const inventoryBatches = pgTable(
  'inventory_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dishId: uuid('dish_id')
      .notNull()
      .references(() => dishes.id, { onDelete: 'restrict' }),
    remainingQuantity: integer('remaining_quantity').notNull(),
    version: integer('version').notNull().default(1),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
    updatedAt: timestamptz('updated_at').default(sql`NOW()`),
  },
  (table) => [
    index('inventory_batches_dish_id_idx').on(table.dishId),
    check('inventory_batches_remaining_gte_zero', sql`${table.remainingQuantity} >= 0`),
    check('inventory_batches_version_positive', sql`${table.version} > 0`),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    chefId: uuid('chef_id')
      .notNull()
      .references(() => chefs.id, { onDelete: 'restrict' }),
    status: orderStatusEnum('status').notNull(),
    subtotalCents: integer('subtotal_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
    updatedAt: timestamptz('updated_at').default(sql`NOW()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('orders_order_number_unique').on(table.orderNumber),
    index('orders_status_idx').on(table.status),
    check('orders_subtotal_cents_gte_zero', sql`${table.subtotalCents} >= 0`),
    check('orders_currency_lower', sql`${table.currency} = lower(${table.currency})`),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    dishId: uuid('dish_id')
      .notNull()
      .references(() => dishes.id, { onDelete: 'restrict' }),
    inventoryBatchId: uuid('inventory_batch_id').references(() => inventoryBatches.id, {
      onDelete: 'set null',
    }),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
  },
  (table) => [
    check('order_items_quantity_positive', sql`${table.quantity} > 0`),
    check('order_items_unit_price_cents_positive', sql`${table.unitPriceCents} > 0`),
  ],
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    key: text('key').primaryKey(),
    scope: idempotencyScopeEnum('scope').notNull(),
    requestHash: text('request_hash').notNull(),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
    expiresAt: timestamptz('expires_at').notNull(),
  },
  (table) => [
    check('idempotency_keys_key_not_empty', sql`length(trim(${table.key})) > 0`),
    index('idempotency_keys_expires_at_idx').on(table.expiresAt),
  ],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    actorId: text('actor_id'),
    actorRole: text('actor_role').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    beforeState: jsonb('before_state'),
    afterState: jsonb('after_state'),
    ipAddress: text('ip_address'),
    createdAt: timestamptz('created_at').default(sql`NOW()`),
  },
  (table) => [index('audit_log_entity_idx').on(table.entityType, table.entityId)],
);

export const schema = {
  allergens,
  chefs,
  dishes,
  dishAllergens,
  customers,
  inventoryBatches,
  orders,
  orderItems,
  idempotencyKeys,
  auditLog,
};
