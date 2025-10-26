// LEGACY: Global unhandled error catching (browser-side only)
// NOTE: New error reporting uses ApplicationError → stdout → Loki (see @repo/utils/common)
// This legacy handler catches browser window errors and unhandled promise rejections

/**
 * Global error information interface
 */
interface GlobalErrorInfo {
  type: 'error' | 'unhandledrejection' | 'react' | 'api'
  message: string
  source?: string
  lineno?: number
  colno?: number
  error?: Error
  stack?: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string
  tenantId?: string
  appId?: string
}

/**
 * Error reporting configuration
 */
interface ErrorReportingConfig {
  enableConsoleLogging: boolean
  enableRemoteReporting: boolean
  maxErrorsPerSession: number
  ignoredErrors: string[]
  reportingEndpoint?: string
  apiKey?: string
}

/**
 * Global error handler class
 */
class GlobalErrorHandler {
  private config: ErrorReportingConfig
  private errorCount = 0
  private reportedErrors = new Set<string>()
  private initialized = false

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteReporting: false,
      maxErrorsPerSession: 50,
      ignoredErrors: [
        'ResizeObserver loop limit exceeded',
        'Script error.',
        'Non-Error promise rejection captured'
      ],
      ...config
    }
  }

  /**
   * Initialize global error handling
   */
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return
    }

    // Handle uncaught JavaScript errors
    window.addEventListener('error', this.handleError.bind(this))

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))

    // Handle React errors (if React DevTools is available)
    if (process.env.NODE_ENV === 'development') {
      this.setupReactErrorHandling()
    }

    this.initialized = true
    console.log('✅ Global error handler initialized')
  }

  /**
   * Cleanup event listeners
   */
  cleanup(): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return
    }

    window.removeEventListener('error', this.handleError.bind(this))
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))
    
    this.initialized = false
    console.log('🧹 Global error handler cleaned up')
  }

  /**
   * Handle uncaught JavaScript errors
   */
  private handleError = (event: ErrorEvent): void => {
    const errorInfo: GlobalErrorInfo = {
      type: 'error',
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...this.getContextInfo()
    }

    this.processError(errorInfo)
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    let message = 'Unhandled promise rejection'
    let error: Error | undefined
    let stack: string | undefined

    // Extract error information from the rejection
    if (event.reason) {
      if (event.reason instanceof Error) {
        error = event.reason
        message = event.reason.message
        stack = event.reason.stack
      } else if (typeof event.reason === 'string') {
        message = event.reason
      } else {
        message = JSON.stringify(event.reason)
      }
    }

    const errorInfo: GlobalErrorInfo = {
      type: 'unhandledrejection',
      message,
      error,
      stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...this.getContextInfo()
    }

    this.processError(errorInfo)
  }

  /**
   * Setup React error handling (development only)
   */
  private setupReactErrorHandling(): void {
    // React error tracking via console.error override
    const originalConsoleError = console.error
    
    console.error = (...args: any[]) => {
      // Check if this looks like a React error
      const message = args[0]
      if (typeof message === 'string' && 
          (message.includes('React') || 
           message.includes('component') || 
           message.includes('Warning:'))) {
        
        const errorInfo: GlobalErrorInfo = {
          type: 'react',
          message: args.join(' '),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          ...this.getContextInfo()
        }

        this.processError(errorInfo)
      }

      // Call original console.error
      originalConsoleError.apply(console, args)
    }
  }

  /**
   * Get additional context information
   */
  private getContextInfo(): Partial<GlobalErrorInfo> {
    const context: Partial<GlobalErrorInfo> = {}

    // Extract tenant ID from URL or cookie
    try {
      const hostname = window.location.hostname
      const subdomain = hostname.split('.')[0]
      if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
        context.appId = subdomain
      }

      // Try to get tenant ID from cookies
      const cookies = document.cookie.split(';')
      const tenantCookie = cookies.find(c => c.trim().startsWith('x-tenant-id='))
      if (tenantCookie) {
        context.tenantId = tenantCookie.split('=')[1]
      }

      // Try to get user ID from localStorage or session
      const userInfo = localStorage.getItem('user')
      if (userInfo) {
        const user = JSON.parse(userInfo)
        context.userId = user.id
      }
    } catch (error) {
      // Ignore context extraction errors
    }

    return context
  }

  /**
   * Process and report error
   */
  private processError(errorInfo: GlobalErrorInfo): void {
    // Check if we should ignore this error
    if (this.shouldIgnoreError(errorInfo)) {
      return
    }

    // Check error count limits
    if (this.errorCount >= this.config.maxErrorsPerSession) {
      return
    }

    // Check for duplicate errors
    const errorKey = this.getErrorKey(errorInfo)
    if (this.reportedErrors.has(errorKey)) {
      return
    }

    this.errorCount++
    this.reportedErrors.add(errorKey)

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorInfo)
    }

    // Report to monitoring service if enabled
    if (this.config.enableRemoteReporting) {
      this.reportToService(errorInfo)
    }
  }

  /**
   * Check if error should be ignored
   */
  private shouldIgnoreError(errorInfo: GlobalErrorInfo): boolean {
    return this.config.ignoredErrors.some(ignored => 
      errorInfo.message.includes(ignored)
    )
  }

  /**
   * Generate unique key for error deduplication
   */
  private getErrorKey(errorInfo: GlobalErrorInfo): string {
    return `${errorInfo.type}:${errorInfo.message}:${errorInfo.source}:${errorInfo.lineno}`
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(errorInfo: GlobalErrorInfo): void {
    // In production, output structured JSON to stdout for Loki
    if (process.env.NODE_ENV === 'production') {
      const structuredLog = {
        level: 'error',
        timestamp: errorInfo.timestamp,
        service: this.getServiceName(),
        type: errorInfo.type,
        message: errorInfo.message,
        url: errorInfo.url,
        source: errorInfo.source || null,
        lineno: errorInfo.lineno || null,
        colno: errorInfo.colno || null,
        userId: errorInfo.userId || null,
        tenantId: errorInfo.tenantId || null,
        appId: errorInfo.appId || null,
        userAgent: errorInfo.userAgent,
        stack: errorInfo.stack || null,
        errorName: errorInfo.error?.name || null
      };

      // Output single-line JSON for Promtail/Loki
      console.log(JSON.stringify(structuredLog));
    } else {
      // Keep formatted output for development
      const style = {
        error: 'color: #dc2626; font-weight: bold;',
        unhandledrejection: 'color: #ea580c; font-weight: bold;',
        react: 'color: #0891b2; font-weight: bold;',
        api: 'color: #7c3aed; font-weight: bold;'
      }

      console.group(`%c🚨 Global ${errorInfo.type.toUpperCase()} Error`, style[errorInfo.type])
      console.error('Message:', errorInfo.message)
      console.log('Timestamp:', errorInfo.timestamp)
      console.log('URL:', errorInfo.url)

      if (errorInfo.source) {
        console.log('Source:', `${errorInfo.source}:${errorInfo.lineno}:${errorInfo.colno}`)
      }

      if (errorInfo.tenantId) {
        console.log('Tenant ID:', errorInfo.tenantId)
      }

      if (errorInfo.appId) {
        console.log('App ID:', errorInfo.appId)
      }

      if (errorInfo.stack) {
        console.log('Stack:', errorInfo.stack)
      }

      if (errorInfo.error) {
        console.error('Error Object:', errorInfo.error)
      }

      console.groupEnd()
    }
  }

  /**
   * Get service name for logging
   */
  private getServiceName(): string {
    // Detect service name from URL or build-time environment variable
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
        return `frontend-${subdomain}`;
      }
    }
    return process.env.NEXT_PUBLIC_SERVICE_NAME || 'frontend-core';
  }

  /**
   * Report error to monitoring service
   */
  private async reportToService(errorInfo: GlobalErrorInfo): Promise<void> {
    if (!this.config.reportingEndpoint) {
      return
    }

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          ...errorInfo,
          sessionId: this.getSessionId(),
          buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION,
          environment: process.env.NODE_ENV
        })
      })
    } catch (reportingError) {
      console.warn('Failed to report error to monitoring service:', reportingError)
    }
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('error-session-id', sessionId)
    }
    return sessionId
  }

  /**
   * Manually report an error
   */
  reportError(error: Error, context?: Record<string, any>): void {
    const errorInfo: GlobalErrorInfo = {
      type: 'error',
      message: error.message,
      error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...this.getContextInfo(),
      ...context
    }

    this.processError(errorInfo)
  }

  /**
   * Get error statistics
   */
  getStats(): { errorCount: number; reportedErrors: number } {
    return {
      errorCount: this.errorCount,
      reportedErrors: this.reportedErrors.size
    }
  }
}

// Create global instance
// NOTE: Remote reporting disabled - using stdout → Loki instead
export const globalErrorHandler = new GlobalErrorHandler({
  enableConsoleLogging: true,
  enableRemoteReporting: false, // Disabled - using ApplicationError → stdout → Loki
  maxErrorsPerSession: 50,
  reportingEndpoint: undefined
})

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      globalErrorHandler.initialize()
    })
  } else {
    globalErrorHandler.initialize()
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    globalErrorHandler.cleanup()
  })
}

// Export types and utilities
export type { GlobalErrorInfo, ErrorReportingConfig }
export { GlobalErrorHandler }