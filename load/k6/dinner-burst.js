import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Dinner-hour burst: 20-minute spike at 10x expected peak.
 * Tune BASE_RPS to your launch target (e.g. 50 RPS peak → 500 RPS burst).
 */
const BASE_RPS = Number(__ENV.K6_BASE_RPS ?? 50);
const BURST_MULTIPLIER = Number(__ENV.K6_BURST_MULTIPLIER ?? 10);
const BURST_DURATION = __ENV.K6_BURST_DURATION ?? '20m';

export const options = {
  scenarios: {
    dinner_burst: {
      executor: 'ramping-arrival-rate',
      startRate: BASE_RPS,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 2000,
      stages: [
        { duration: '2m', target: BASE_RPS },
        { duration: BURST_DURATION, target: BASE_RPS * BURST_MULTIPLIER },
        { duration: '2m', target: BASE_RPS },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

const BASE_URL = __ENV.BASE_URL ?? 'http://127.0.0.1:3000';

export default function dinnerBurst() {
  const browse = http.get(`${BASE_URL}/browse`);
  check(browse, { 'browse 200': (r) => r.status === 200 });

  const live = http.get(`${BASE_URL}/health/live`);
  check(live, { 'live 200': (r) => r.status === 200 });

  sleep(0.2);
}
