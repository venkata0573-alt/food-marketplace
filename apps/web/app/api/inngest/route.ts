import { serve } from 'inngest/next';

import { inngest, inngestFunctions } from '../../../src/server/jobs/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
