/**
 * Structured Logging Utility for Loki Compatibility
 *
 * Provides consistent logging format that works with both:
 * - Development (pretty console output with emojis)
 * - Production (JSON format for Loki/Grafana ingestion)
 *
 * Usage:
 * ```typescript
 * import { logger } from '@repo/utils/common/logger';
 *
 * logger.info('User logged in', { userId: '123', tenantId: 'abc' });
 * logger.warn('Token expiring soon', { expiresIn: 300 });
 * logger.error('Authentication failed', { error: err.message });
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'json' | 'pretty';

export interface LogContext {
  // Identity
  tenantId?: string;
  userId?: string;
  sessionId?: string;

  // Request context
  requestId?: string;
  hostname?: string;
  path?: string;
  method?: string;

  // Application context
  service?: string;
  component?: string;
  operation?: string;

  // Additional metadata
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: LogContext;
}

class Logger {
  private format: LogFormat;
  private minLevel: LogLevel = 'debug';

  constructor() {
    this.format = (process.env.LOG_FORMAT as LogFormat) ||
                  (process.env.NODE_ENV === 'production' ? 'json' : 'pretty');
  }

  /**
   * Set minimum log level (logs below this level will be suppressed)
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    if (this.format === 'json') {
      // JSON format for Loki (single-line, structured)
      console.log(JSON.stringify(entry));
    } else {
      // Pretty format for development (human-readable with emojis)
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      }[entry.level];

      const timestamp = new Date(entry.timestamp).toLocaleTimeString();

      if (entry.context && Object.keys(entry.context).length > 0) {
        console.log(`${emoji} [${timestamp}] ${entry.message}`, entry.context);
      } else {
        console.log(`${emoji} [${timestamp}] ${entry.message}`);
      }
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext) {
    this.formatLog({
      level: 'debug',
      timestamp: new Date().toISOString(),
      message,
      context
    });
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext) {
    this.formatLog({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      context
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext) {
    this.formatLog({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      context
    });
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext) {
    this.formatLog({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      context
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing/customization
export { Logger };
