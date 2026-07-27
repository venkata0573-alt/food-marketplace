import { noHardcodedDesignValues } from './no-hardcoded-design-values.mjs';
import { noServerEnvInClient } from './no-server-env-in-client.mjs';
import { requireUseClientJustification } from './require-use-client-justification.mjs';

/** @type {import('eslint').ESLint.Plugin} */
export const foodMarketplacePlugin = {
  meta: {
    name: 'eslint-plugin-food-marketplace',
    version: '0.0.0',
  },
  rules: {
    'no-server-env-in-client': noServerEnvInClient,
    'require-use-client-justification': requireUseClientJustification,
    'no-hardcoded-design-values': noHardcodedDesignValues,
  },
};

export { noHardcodedDesignValues, noServerEnvInClient, requireUseClientJustification };
