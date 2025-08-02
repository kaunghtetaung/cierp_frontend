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

  getDelay(attempt: number): number {
    return this.config.retryDelay * attempt;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return true; // Network error
    }
    return false;
  }
}