module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:3000/en', 'http://127.0.0.1:3000/en/browse'],
      startServerCommand: 'pnpm --filter @food-marketplace/web start --port 3000',
      startServerReadyPattern: 'Ready',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'server-response-time': ['error', { maxNumericValue: 200 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        interactive: ['error', { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
