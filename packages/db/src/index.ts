export { getDatabaseUrl, runMigrations, withClient } from './client.js';
export type { Client } from 'pg';
export { decrementBatchQuantity } from './inventory/decrement-batch.js';
export { listMigrationPairs, runLastMigrationDown, runMigrationsUp } from './migrate/runner.js';
export { schema } from './schema/index.js';
export { PII_COLUMN_COMMENTS } from './schema/pii-comments.js';
export {
  countRows,
  verifyPairedDownMigrations,
  withRlsContext,
  type AppRole,
} from './testing/rls-session.js';
export {
  ALLERGEN_TAXONOMY,
  buildSeedPlan,
  DETERMINISTIC_SEED,
  ORDER_STATUSES,
  SEED_COUNTS,
  seedPlanFingerprint,
  type OrderStatus,
  type SeedPlan,
} from './seed/plan.js';
