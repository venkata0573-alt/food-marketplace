import { noServerEnvInClient } from './no-server-env-in-client.mjs';

/** @type {import('eslint').ESLint.Plugin} */
export const foodMarketplacePlugin = {
  meta: {
    name: 'eslint-plugin-food-marketplace',
    version: '0.0.0',
  },
  rules: {
    'no-server-env-in-client': noServerEnvInClient,
  },
};

export { noServerEnvInClient };
