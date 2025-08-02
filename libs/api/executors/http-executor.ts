// HTTP Executor Strategy - Single Responsibility: Core HTTP request execution
import type { 
  HttpExecutor, 
  HttpRequestContext, 
  HttpResponseContext, 
  HttpClientConfig,
  RetryStrategy 
} from '../types/http-types';

export class StandardHttpExecutor implements HttpExecutor {
  constructor(
    private config: HttpClientConfig,
    private retryStrategy: RetryStrategy
  ) {}

  async execute<T>(context: HttpRequestContext): Promise<HttpResponseContext<T>> {
    return await this.executeWithRetry<T>(context, 1);
  }

  private async executeWithRetry<T>(
    context: HttpRequestContext,
    attempt: number
  ): Promise<HttpResponseContext<T>> {
    try {
      const response = await fetch(context.url, context.options);

      return {
        request: context,
        response,
        data: undefined // Will be populated by response handler
      };
    } catch (error) {
      // Check if we should retry
      if (this.retryStrategy.shouldRetry(error, attempt)) {
        const delay = this.retryStrategy.getDelay(attempt);
        await this.delay(delay);
        return this.executeWithRetry<T>(context, attempt + 1);
      }

      // Return error context
      return {
        request: context,
        response: new Response(null, { status: 500 }), // Valid status code for network errors
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}