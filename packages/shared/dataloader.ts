/**
 * Minimal DataLoader-style batching for unavoidable nested reads.
 * Repositories should expose batch methods; use this only at service composition boundaries.
 */
export class DataLoader<K, V> {
  private readonly batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>;
  private queue: K[] = [];
  private resolvers = new Map<K, { resolve: (v: V) => void; reject: (e: Error) => void }>();
  private scheduled = false;

  constructor(batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>) {
    this.batchLoadFn = batchLoadFn;
  }

  load(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      this.resolvers.set(key, { resolve, reject });
      this.queue.push(key);
      if (!this.scheduled) {
        this.scheduled = true;
        queueMicrotask(() => {
          void this.dispatch();
        });
      }
    });
  }

  private async dispatch(): Promise<void> {
    this.scheduled = false;
    const keys = [...new Set(this.queue)];
    this.queue = [];
    const pending = this.resolvers;
    this.resolvers = new Map();

    const results = await this.batchLoadFn(keys);
    keys.forEach((key, index) => {
      const handlers = pending.get(key);
      if (!handlers) {
        return;
      }
      const result = results[index];
      if (result instanceof Error) {
        handlers.reject(result);
      } else {
        handlers.resolve(result);
      }
    });
  }
}
