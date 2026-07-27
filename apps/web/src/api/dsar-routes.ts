import { handleDeleteMyAccount, handleExportMyData } from '@food-marketplace/shared/dsar-handlers';

/**
 * Wire into Next.js route handlers:
 * - POST /api/dsar/export-my-data  -> handleExportMyDataRoute
 * - POST /api/dsar/delete-my-account -> handleDeleteMyAccountRoute
 */
export { handleDeleteMyAccount, handleExportMyData };

export const DSAR_ROUTES = {
  exportMyData: '/api/dsar/export-my-data',
  deleteMyAccount: '/api/dsar/delete-my-account',
} as const;
