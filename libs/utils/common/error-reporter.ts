// Error Reporter - Consistent error reporting and monitoring
import type { ApplicationError, ErrorReporter } from './error-types';
import { ERROR_CONSTANTS } from './error-types';

export interface ErrorReportingConfig {
  readonly enableConsoleLogging: boolean;
  readonly enableRemoteReporting: boolean;
  readonly remoteEndpoint?: string;
  readonly apiKey?: string;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly batchSize: number;
  readonly flushInterval: number;
  readonly logFormat: 'json' | 'pretty'; // 'json' for Loki/production, 'pretty' for development
}

const DEFAULT_CONFIG: ErrorReportingConfig = {
  enableConsoleLogging: true,
  enableRemoteReporting: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.ERROR_REPORTING_ENDPOINT,
  apiKey: process.env.ERROR_REPORTING_API_KEY,
  maxRetries: 3,
  timeout: ERROR_CONSTANTS.ERROR_REPORT_TIMEOUT,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  logFormat: (process.env.LOG_FORMAT as 'json' | 'pretty') ||
             (process.env.NODE_ENV === 'production' ? 'json' : 'pretty')
};

export class StandardErrorReporter implements ErrorReporter {
  private config: ErrorReportingConfig;
  private errorQueue: ApplicationError[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupPeriodicFlush();
  }

  async report(error: ApplicationError): Promise<void> {
    // Always log to console in development or if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(error);
    }

    // Queue for remote reporting if enabled
    if (this.config.enableRemoteReporting && this.config.remoteEndpoint) {
      this.queueForRemoteReporting(error);
    }
  }

  private logToConsole(error: ApplicationError): void {
    const logData = {
      level: this.getSeverityLevel(error.severity),
      timestamp: error.context.timestamp.toISOString(),
      service: error.context.service,
      hostname: error.context.hostname,
      appName: error.context.appName,
      type: error.type,
      code: error.code,
      message: error.message,
      severity: error.severity,
      category: error.category,
      operation: error.context.operation,
      component: error.context.component,
      tenantId: error.context.tenantId,
      userId: error.context.userId,
      sessionId: error.context.sessionId,
      requestId: error.context.requestId,
      path: error.context.path,
      method: error.context.method,
      userAgent: error.context.userAgent,
      retryable: error.retryable,
      cause: error.cause?.message,
      stack: error.cause?.stack,
      metadata: error.context.metadata
    };

    if (this.config.logFormat === 'json') {
      // JSON format for Loki/Grafana (structured logging)
      console.log(JSON.stringify(logData));
    } else {
      // Pretty format for development (human-readable with emojis)
      switch (error.severity) {
        case 'critical':
          console.error('🔥 CRITICAL ERROR:', logData);
          break;
        case 'high':
          console.error('❌ HIGH SEVERITY ERROR:', logData);
          break;
        case 'medium':
          console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
          break;
        case 'low':
          console.log('ℹ️ LOW SEVERITY ERROR:', logData);
          break;
        default:
          console.error('❓ UNKNOWN SEVERITY ERROR:', logData);
      }

      // Log stack trace separately in pretty mode
      if (error.cause?.stack) {
        console.error('Stack trace:', error.cause.stack);
      }
    }
  }

  private getSeverityLevel(severity: string): string {
    switch (severity) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warn';
      case 'low': return 'info';
      default: return 'error';
    }
  }

  private queueForRemoteReporting(error: ApplicationError): void {
    this.errorQueue.push(error);

    // Flush immediately for critical errors
    if (error.severity === 'critical') {
      this.flushErrorQueue();
    }
    // Flush when batch size is reached
    else if (this.errorQueue.length >= this.config.batchSize) {
      this.flushErrorQueue();
    }
  }

  private setupPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.flushErrorQueue();
      }
    }, this.config.flushInterval);
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errorsToReport = this.errorQueue.splice(0, this.config.batchSize);
    
    try {
      await this.sendToRemoteEndpoint(errorsToReport);
    } catch (error) {
      // If reporting fails, log locally and re-queue errors (with limit)
      console.error('Failed to report errors to remote endpoint:', error);
      
      // Re-queue up to half the batch size to prevent infinite growth
      const requeue = errorsToReport.slice(0, Math.floor(this.config.batchSize / 2));
      this.errorQueue.unshift(...requeue);
    }
  }

  private async sendToRemoteEndpoint(errors: ApplicationError[]): Promise<void> {
    if (!this.config.remoteEndpoint || !this.config.apiKey) {
      throw new Error('Remote endpoint or API key not configured');
    }

    const payload = {
      errors: errors.map(error => error.toJSON()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining errors
    if (this.errorQueue.length > 0) {
      await this.flushErrorQueue();
    }
  }

  // Get error queue size for monitoring
  getQueueSize(): number {
    return this.errorQueue.length;
  }

  // Clear error queue (for testing)
  clearQueue(): void {
    this.errorQueue = [];
  }
}

// Global error reporter instance
let globalErrorReporter: StandardErrorReporter | null = null;

export function getErrorReporter(): StandardErrorReporter {
  if (!globalErrorReporter) {
    globalErrorReporter = new StandardErrorReporter();
  }
  return globalErrorReporter;
}

export function configureErrorReporter(config: Partial<ErrorReportingConfig>): void {
  globalErrorReporter = new StandardErrorReporter(config);
}

// Convenience function for reporting errors
export async function reportError(error: ApplicationError): Promise<void> {
  const reporter = getErrorReporter();
  await reporter.report(error);
}