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
      console.log("\n");
      console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
      console.log("│ 🚀 HTTP EXECUTOR: Making Request (Attempt", attempt + ")");
      console.log("├─────────────────────────────────────────────────────────────────────────────┤");
      console.log("│ 🌐 COMPLETE URL:", context.url);
      console.log("│ 📤 Method:", context.method);
      console.log("│ 🔑 Headers:", JSON.stringify(context.headers, null, 2));
      console.log("│ 📦 Has Body:", !!context.body);
      console.log("└─────────────────────────────────────────────────────────────────────────────┘");
      console.log("\n");
    }

    try {
      const response = await fetch(context.url, context.options);

      if (process.env.NODE_ENV === 'development') {
        console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
        console.log("│ ✅ HTTP EXECUTOR: Response Received");
        console.log("├─────────────────────────────────────────────────────────────────────────────┤");
        console.log("│ 🌐 URL:", context.url);
        console.log("│ 📊 Status:", response.status, response.statusText);
        console.log("│ ✓ Success:", response.ok);
        console.log("└─────────────────────────────────────────────────────────────────────────────┘");
        console.log("\n");
      }

      return {
        request: context,
        response,
        data: undefined // Will be populated by response handler
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // `console.warn` (not `error`) on purpose: Next.js 15's
        // dev error overlay intercepts `console.error` and pops it
        // as a recoverable error, which is misleading here — the
        // fetch failure is caught, surfaced to the caller via the
        // returned `error` field, and may even be retried by the
        // retry strategy below. Use warn so the diagnostic info
        // still reaches the console without raising the overlay.
        console.warn(`⚠️ StandardHttpExecutor: Fetch failed:`, {
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