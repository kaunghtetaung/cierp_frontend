/**
 * Console Wrapper for Production JSON Logging
 *
 * Intercepts console.log, console.info, console.warn, console.error, console.debug
 * and formats them as JSON when LOG_FORMAT=json for Loki compatibility.
 *
 * This wrapper ensures ALL console output respects the LOG_FORMAT environment variable,
 * even for direct console.log() calls throughout the codebase.
 *
 * Usage: Import this file early in your application initialization
 * (e.g., in next.config.js instrumentation or top of layout.tsx)
 */

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface StructuredLog {
  level: string;
  timestamp: string;
  message: string;
  args?: any[];
  service?: string;
  metadata?: Record<string, any>;
}

class ConsoleWrapper {
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  private logFormat: 'json' | 'pretty';
  private isProduction: boolean;
  private serviceName: string;
  private initialized = false;

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    // Determine log format
    this.logFormat = (process.env.LOG_FORMAT as 'json' | 'pretty') ||
                     (process.env.NODE_ENV === 'production' ? 'json' : 'pretty');

    this.isProduction = process.env.NODE_ENV === 'production';
    this.serviceName = process.env.SERVICE_NAME || 'frontend';
  }

  /**
   * Initialize console wrapper - replaces console methods
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Only wrap in production or when LOG_FORMAT=json
    if (this.logFormat === 'json') {
      console.log = this.wrapConsoleMethod('log', 'info');
      console.info = this.wrapConsoleMethod('info', 'info');
      console.warn = this.wrapConsoleMethod('warn', 'warn');
      console.error = this.wrapConsoleMethod('error', 'error');
      console.debug = this.wrapConsoleMethod('debug', 'debug');

      this.initialized = true;

      // Use original console to announce initialization
      this.originalConsole.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: 'Console wrapper initialized',
        service: this.serviceName,
        metadata: {
          logFormat: this.logFormat,
          nodeEnv: process.env.NODE_ENV
        }
      }));
    }
  }

  /**
   * Restore original console methods
   */
  restore(): void {
    if (!this.initialized) {
      return;
    }

    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.initialized = false;
  }

  /**
   * Wrap a console method to output JSON format
   */
  private wrapConsoleMethod(method: ConsoleMethod, level: string) {
    return (...args: any[]) => {
      try {
        // Check if first argument is already a stringified structured log
        if (args.length > 0 && typeof args[0] === 'string') {
          const firstArg = args[0].trim();
          if (firstArg.startsWith('{') && firstArg.endsWith('}')) {
            try {
              const parsed = JSON.parse(firstArg);
              // If it's already a structured log with our format, pass through
              if (parsed.level && parsed.timestamp && parsed.message && parsed.service) {
                this.originalConsole.log(firstArg);
                return;
              }
            } catch {
              // Not valid JSON, continue with normal processing
            }
          }
        }

        const structuredLog = this.formatAsStructuredLog(level, args);

        // Output as single-line JSON
        this.originalConsole.log(JSON.stringify(structuredLog));
      } catch (error) {
        // Fallback to original console if JSON serialization fails
        this.originalConsole[method]('[CONSOLE_WRAPPER_ERROR]', ...args);
      }
    };
  }

  /**
   * Format console arguments as structured log
   */
  private formatAsStructuredLog(level: string, args: any[]): StructuredLog {
    const timestamp = new Date().toISOString();

    // Extract message from first argument
    let message = '';
    let additionalArgs: any[] = [];
    let metadata: Record<string, any> = {};

    if (args.length > 0) {
      const firstArg = args[0];

      // If first arg is a string, use it as message
      if (typeof firstArg === 'string') {
        message = firstArg;
        additionalArgs = args.slice(1);
      }
      // If first arg is Error, extract message and stack
      else if (firstArg instanceof Error) {
        message = firstArg.message;
        metadata.errorName = firstArg.name;
        metadata.stack = firstArg.stack;
        additionalArgs = args.slice(1);
      }
      // Otherwise, stringify the first arg
      else {
        try {
          message = JSON.stringify(firstArg);
          additionalArgs = args.slice(1);
        } catch {
          message = String(firstArg);
          additionalArgs = args.slice(1);
        }
      }
    }

    // Process additional arguments
    if (additionalArgs.length > 0) {
      // If there's only one additional arg and it's an object, merge it into metadata
      if (additionalArgs.length === 1 &&
          typeof additionalArgs[0] === 'object' &&
          additionalArgs[0] !== null &&
          !Array.isArray(additionalArgs[0])) {
        metadata = { ...metadata, ...this.sanitizeObject(additionalArgs[0]) };
      } else {
        // Otherwise, include all additional args
        metadata.args = additionalArgs.map(arg => this.sanitizeValue(arg));
      }
    }

    const structuredLog: StructuredLog = {
      level,
      timestamp,
      message,
      service: this.serviceName
    };

    // Only include metadata if it has content
    if (Object.keys(metadata).length > 0) {
      structuredLog.metadata = metadata;
    }

    return structuredLog;
  }

  /**
   * Sanitize a value for JSON serialization
   */
  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }

    if (typeof value === 'function') {
      return '[Function]';
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (typeof value === 'object') {
      return this.sanitizeObject(value);
    }

    return value;
  }

  /**
   * Sanitize an object for JSON serialization
   */
  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeValue(item));
    }

    const sanitized: Record<string, any> = {};

    try {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = this.sanitizeValue(obj[key]);
        }
      }
    } catch (error) {
      return '[Object - Serialization Error]';
    }

    return sanitized;
  }

  /**
   * Get original console methods (for internal use)
   */
  getOriginal() {
    return this.originalConsole;
  }
}

// Create singleton instance
const consoleWrapper = new ConsoleWrapper();

// Auto-initialize if LOG_FORMAT=json
if (process.env.LOG_FORMAT === 'json' ||
    (process.env.NODE_ENV === 'production' && !process.env.LOG_FORMAT)) {
  consoleWrapper.initialize();
}

// Export for manual control if needed
export { consoleWrapper, ConsoleWrapper };
export default consoleWrapper;
