// Retry Strategy - Single Responsibility: Request retry logic
import type { RetryStrategy, HttpClientConfig } from '../types/http-types';

export class StandardRetryStrategy implements RetryStrategy {
  constructor(private config: HttpClientConfig) {}

  shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.config.retryAttempts) {
      return false;
    }

    return this.isRetryableError(error);
  }

  /**
   * Exponential-ish backoff: 1× → 2× → 3× the base delay. With the
   * default 1000ms base and 3 attempts that means 1s, 2s, 3s waits
   * between retries — keeps total worst-case under ~10s for an SSR
   * page render while giving a flaky gateway a real chance to come
   * back. (Previously linear `delay * attempt` — kept the same shape
   * because it's what every other caller expects.)
   */
  getDelay(attempt: number): number {
    return this.config.retryDelay * attempt;
  }

  /**
   * Check if error is retryable. Three classes count:
   *
   *   1. `TypeError` with "fetch" in the message — undici's generic
   *      "fetch failed" wrapper for connection errors (ECONNRESET,
   *      ECONNREFUSED, DNS, etc).
   *   2. `DOMException` with `name === "TimeoutError"` — what
   *      `AbortSignal.timeout()` throws when the per-request timeout
   *      hits. Was missing before, which is why SSR fetches that
   *      timed out NEVER retried (the client's `retryAttempts: 3`
   *      was wasted on the most common failure mode).
   *   3. `AbortError` with the same name — covers manual aborts
   *      from middleware (e.g. cancelled requests on slow paths).
   *
   * Non-network errors (4xx responses, type / parse errors,
   * application-level AppException) are NOT retryable — retrying a
   * 404 just produces another 404.
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return true;
    }
    // `DOMException` exists on the global in Node 20+; check the
    // `.name` instead of `instanceof` to avoid undici-vs-DOM type
    // mismatch when running in different runtimes.
    const name =
      error && typeof error === "object" && "name" in error
        ? (error as { name?: string }).name
        : undefined;
    if (name === "TimeoutError" || name === "AbortError") {
      return true;
    }
    return false;
  }
}