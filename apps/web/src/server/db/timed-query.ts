import type { QueryResult, QueryResultRow } from 'pg';

export class QueryLatencyBudgetError extends Error {
  readonly queryName: string;
  readonly durationMs: number;

  constructor(queryName: string, durationMs: number) {
    super(`Query "${queryName}" exceeded 100ms budget (${durationMs.toFixed(1)}ms)`);
    this.name = 'QueryLatencyBudgetError';
    this.queryName = queryName;
    this.durationMs = durationMs;
  }
}

const DEFAULT_MAX_MS = 100;

export interface TimedQueryOptions {
  maxMs?: number;
  enforceBudget?: boolean;
}

export async function timedQuery<R extends QueryResultRow>(
  queryName: string,
  run: () => Promise<QueryResult<R>>,
  options: TimedQueryOptions = {},
): Promise<QueryResult<R>> {
  const maxMs = options.maxMs ?? DEFAULT_MAX_MS;
  const enforce =
    options.enforceBudget ??
    (process.env.ENFORCE_QUERY_BUDGET === '1' || process.env.CI === 'true');

  const start = performance.now();
  const result = await run();
  const durationMs = performance.now() - start;

  if (durationMs > maxMs) {
    if (enforce) {
      throw new QueryLatencyBudgetError(queryName, durationMs);
    }
    console.warn(`[query-budget] ${queryName} took ${durationMs.toFixed(1)}ms`);
  }

  return result;
}
