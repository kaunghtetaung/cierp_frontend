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
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 StandardHttpExecutor: Executing request (attempt ${attempt}):`, {
        url: context.url,
        method: context.method,
        headers: context.headers,
        hasBody: !!context.body
      });
    }

    try {
      const response = await fetch(context.url, context.options);

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ StandardHttpExecutor: Fetch completed:`, {
          url: context.url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
      }

      return {
        request: context,
        response,
        data: undefined // Will be populated by response handler
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ StandardHttpExecutor: Fetch failed:`, {
          url: context.url,
          attempt,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      }

      // Check if we should retry
      if (this.retryStrategy.shouldRetry(error, attempt)) {
        const delay = this.retryStrategy.getDelay(attempt);
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 StandardHttpExecutor: Retrying in ${delay}ms (attempt ${attempt + 1})`);
        }
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