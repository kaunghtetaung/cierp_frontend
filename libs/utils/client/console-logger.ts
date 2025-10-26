/**
 * Client-Side Console Logger - Captures browser console logs and sends to server
 *
 * This utility intercepts console.log/warn/error/info calls in the browser
 * and sends them to a server endpoint for Loki ingestion.
 *
 * Usage:
 * ```typescript
 * import { initializeConsoleLogger } from '@repo/utils/client/console-logger';
 *
 * // In your app initialization (e.g., _app.tsx or layout.tsx)
 * initializeConsoleLogger({
 *   endpoint: '/api/logs',
 *   batchSize: 10,
 *   batchInterval: 5000,
 *   includeMetadata: true
 * });
 * ```
 */

export interface ConsoleLogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  timestamp: string;
  message: string;
  args?: any[];
  metadata?: {
    url: string;
    userAgent: string;
    tenantId?: string;
    userId?: string;
    sessionId?: string;
  };
}

export interface ConsoleLoggerConfig {
  endpoint: string;                    // Server endpoint to send logs to
  batchSize?: number;                  // Number of logs to batch before sending (default: 10)
  batchInterval?: number;              // Max time (ms) to wait before sending batch (default: 5000)
  includeMetadata?: boolean;           // Include browser metadata (default: true)
  enableInDevelopment?: boolean;       // Enable in development mode (default: false)
  maxBatchSize?: number;               // Maximum batch size to prevent memory issues (default: 100)
  onError?: (error: Error) => void;    // Callback for send errors
}

class ConsoleLogger {
  private config: Required<ConsoleLoggerConfig>;
  private logQueue: ConsoleLogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // Store original console methods
  private originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  constructor(config: ConsoleLoggerConfig) {
    this.config = {
      batchSize: 10,
      batchInterval: 5000,
      includeMetadata: true,
      enableInDevelopment: false,
      maxBatchSize: 100,
      onError: (error) => this.originalConsole.error('Console logger error:', error),
      ...config
    };
  }

  /**
   * Initialize console interception
   */
  initialize(): void {
    // Skip if already initialized
    if (this.isInitialized) {
      return;
    }

    // Skip in server-side rendering
    if (typeof window === 'undefined') {
      return;
    }

    // Skip in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !this.config.enableInDevelopment) {
      return;
    }

    // Override console methods
    console.log = this.createInterceptor('log');
    console.info = this.createInterceptor('info');
    console.warn = this.createInterceptor('warn');
    console.error = this.createInterceptor('error');
    console.debug = this.createInterceptor('debug');

    // Flush logs before page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush logs when page becomes hidden (mobile/tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });

    this.isInitialized = true;
    this.originalConsole.log('✅ Console logger initialized');
  }

  /**
   * Create an interceptor for a console method
   */
  private createInterceptor(level: ConsoleLogEntry['level']) {
    return (...args: any[]) => {
      // Call original console method first
      this.originalConsole[level].apply(console, args);

      // Queue the log for sending to server
      this.queueLog(level, args);
    };
  }

  /**
   * Queue a log entry
   */
  private queueLog(level: ConsoleLogEntry['level'], args: any[]): void {
    // Serialize arguments
    const message = args
      .map(arg => {
        if (typeof arg === 'string') {
          return arg;
        }
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');

    const entry: ConsoleLogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message: this.truncateMessage(message),
      args: this.config.includeMetadata ? this.serializeArgs(args) : undefined,
      metadata: this.config.includeMetadata ? this.getMetadata() : undefined
    };

    this.logQueue.push(entry);

    // Prevent memory issues
    if (this.logQueue.length > this.config.maxBatchSize) {
      this.logQueue = this.logQueue.slice(-this.config.maxBatchSize);
    }

    // Send batch if size threshold reached
    if (this.logQueue.length >= this.config.batchSize) {
      this.flush();
    } else {
      // Schedule batch send
      this.scheduleBatchSend();
    }
  }

  /**
   * Truncate message to prevent huge payloads
   */
  private truncateMessage(message: string, maxLength = 1000): string {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + '... (truncated)';
  }

  /**
   * Serialize arguments safely
   */
  private serializeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (arg === null || arg === undefined) {
        return arg;
      }
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      }
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack
        };
      }
      try {
        // Try to serialize as JSON, but truncate large objects
        const str = JSON.stringify(arg);
        if (str.length > 500) {
          return '[Large Object]';
        }
        return JSON.parse(str); // Parse to ensure it's serializable
      } catch {
        return String(arg);
      }
    });
  }

  /**
   * Get browser metadata
   */
  private getMetadata(): ConsoleLogEntry['metadata'] {
    const metadata: ConsoleLogEntry['metadata'] = {
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Try to get tenant ID from cookie
    try {
      const cookies = document.cookie.split(';');
      const tenantCookie = cookies.find(c => c.trim().startsWith('x-tenant-id='));
      if (tenantCookie) {
        metadata.tenantId = tenantCookie.split('=')[1];
      }
    } catch {
      // Ignore cookie extraction errors
    }

    // Try to get session ID from sessionStorage
    try {
      const sessionId = sessionStorage.getItem('sessionId');
      if (sessionId) {
        metadata.sessionId = sessionId;
      }
    } catch {
      // Ignore storage errors
    }

    return metadata;
  }

  /**
   * Schedule a batch send
   */
  private scheduleBatchSend(): void {
    if (this.batchTimer) {
      return; // Timer already scheduled
    }

    this.batchTimer = setTimeout(() => {
      this.flush();
    }, this.config.batchInterval);
  }

  /**
   * Flush all queued logs to server
   */
  async flush(): Promise<void> {
    // Clear scheduled timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Nothing to send
    if (this.logQueue.length === 0) {
      return;
    }

    // Take current queue and clear it
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      // Send logs to server using sendBeacon (reliable even during page unload)
      if (navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ logs: logsToSend })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(this.config.endpoint, blob);
      } else {
        // Fallback to fetch for older browsers
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ logs: logsToSend }),
          keepalive: true // Keep connection alive during page unload
        });
      }
    } catch (error) {
      this.config.onError(error as Error);

      // Re-queue logs if send failed (but don't exceed max size)
      this.logQueue = [...logsToSend, ...this.logQueue].slice(0, this.config.maxBatchSize);
    }
  }

  /**
   * Restore original console methods
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.flush();
    this.isInitialized = false;
    this.originalConsole.log('🧹 Console logger destroyed');
  }
}

// Singleton instance
let consoleLogger: ConsoleLogger | null = null;

/**
 * Initialize console logger (call once in app initialization)
 */
export function initializeConsoleLogger(config: ConsoleLoggerConfig): void {
  if (consoleLogger) {
    console.warn('Console logger already initialized');
    return;
  }

  consoleLogger = new ConsoleLogger(config);
  consoleLogger.initialize();
}

/**
 * Manually flush logs (useful before navigation)
 */
export async function flushConsoleLogs(): Promise<void> {
  if (consoleLogger) {
    await consoleLogger.flush();
  }
}

/**
 * Destroy console logger
 */
export function destroyConsoleLogger(): void {
  if (consoleLogger) {
    consoleLogger.destroy();
    consoleLogger = null;
  }
}
