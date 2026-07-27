export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold: number;
  openDurationMs: number;
  timeoutMs: number;
  maxRetries?: number;
  baseDelayMs?: number;
}

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit "${name}" is open`);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private openedAt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  getState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.openedAt >= this.options.openDurationMs) {
      this.state = 'half_open';
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();
    if (state === 'open') {
      throw new CircuitOpenError(this.options.name);
    }

    const maxRetries = this.options.maxRetries ?? 2;
    const baseDelay = this.options.baseDelayMs ?? 100;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const result = await this.withTimeout(fn);
        this.onSuccess();
        return result;
      } catch (error) {
        lastError = error;
        this.onFailure();
        if (attempt < maxRetries) {
          const jitter = Math.random() * baseDelay;
          await sleep(baseDelay * 2 ** attempt + jitter);
        }
      }
    }

    throw lastError;
  }

  private async withTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`${this.options.name} timeout`)), this.options.timeoutMs);
      }),
    ]);
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const stripeCircuit = new CircuitBreaker({
  name: 'stripe',
  failureThreshold: 5,
  openDurationMs: 30_000,
  timeoutMs: 8_000,
  maxRetries: 2,
  baseDelayMs: 150,
});

export const twilioCircuit = new CircuitBreaker({
  name: 'twilio',
  failureThreshold: 5,
  openDurationMs: 30_000,
  timeoutMs: 5_000,
  maxRetries: 2,
});

export const mapboxCircuit = new CircuitBreaker({
  name: 'mapbox',
  failureThreshold: 3,
  openDurationMs: 20_000,
  timeoutMs: 3_000,
  maxRetries: 1,
});
