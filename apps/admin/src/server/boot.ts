import { validateEnvAtBoot } from '@food-marketplace/config/env';

/**
 * Server boot hook — import from Next.js instrumentation or validate-env script.
 */
export function bootServerEnv(): void {
  validateEnvAtBoot(process.env);
}
