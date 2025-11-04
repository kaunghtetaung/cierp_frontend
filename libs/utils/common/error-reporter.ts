// Error Reporter - Stdout logging for Promtail → Loki → Grafana
import type { ApplicationError, ErrorReporter } from './error-types';

export interface ErrorReportingConfig {
  readonly enableConsoleLogging: boolean;
  readonly logFormat: 'json' | 'pretty'; // 'json' for Loki/production, 'pretty' for development
}

const DEFAULT_CONFIG: ErrorReportingConfig = {
  enableConsoleLogging: true,
  logFormat: (process.env.LOG_FORMAT as 'json' | 'pretty') ||
             (process.env.NODE_ENV === 'production' ? 'json' : 'pretty')
};

export class StandardErrorReporter implements ErrorReporter {
  private config: ErrorReportingConfig;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async report(error: ApplicationError): Promise<void> {
    // Log to stdout for Promtail → Loki → Grafana
    if (this.config.enableConsoleLogging) {
      this.logToConsole(error);
    }
  }

  private logToConsole(error: ApplicationError): void {
    const logData = {
      level: this.getSeverityLevel(error.severity),
      timestamp: error.context?.timestamp?.toISOString() || new Date().toISOString(),
      service: error.context?.service,
      hostname: error.context?.hostname,
      appName: error.context?.appName,
      type: error.type,
      code: error.code,
      message: error.message,
      severity: error.severity,
      category: error.category,
      operation: error.context?.operation,
      component: error.context?.component,
      tenantId: error.context?.tenantId,
      userId: error.context?.userId,
      sessionId: error.context?.sessionId,
      requestId: error.context?.requestId,
      path: error.context?.path,
      method: error.context?.method,
      userAgent: error.context?.userAgent,
      retryable: error.retryable,
      cause: error.cause?.message,
      stack: error.cause?.stack,
      metadata: error.context?.metadata
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