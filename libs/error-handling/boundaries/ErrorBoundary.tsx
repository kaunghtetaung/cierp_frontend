'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { IconComponent } from '@repo/ui/components/icons'
import { getLocalizedErrorMessage } from '@repo/api/messages'
import { useLanguage } from '@repo/language'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void, language?: 'en' | 'mm') => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean // Whether to isolate this boundary from parent boundaries
  language?: 'en' | 'mm' // Language for error messages
}

/**
 * React Error Boundary for catching and handling component errors
 * Provides fallback UI and error reporting capabilities
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorId: this.state.errorId
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // TODO: Report to error monitoring service
    // this.reportError(error, errorInfo)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId)
    }
  }

  // TODO: Implement error reporting
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Report to Sentry, LogRocket, or other monitoring service
    // Example:
    // Sentry.captureException(error, {
    //   tags: {
    //     component: 'ErrorBoundary',
    //     errorId: this.state.errorId
    //   },
    //   extra: {
    //     errorInfo,
    //     componentStack: errorInfo.componentStack
    //   }
    // })
  }

  private retry = () => {
    // Clear error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private retryWithDelay = (delay: number = 1000) => {
    this.retryTimeoutId = window.setTimeout(() => {
      this.retry()
    }, delay)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error, 
          this.state.errorInfo!, 
          this.retry,
          this.props.language
        )
      }

      // Default fallback UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <IconComponent 
                name="AlertTriangle" 
                className="w-6 h-6 text-destructive"
              />
            </div>

            {/* Error Title */}
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {this.props.language === 'mm' ? 'ကွန်ပိုနန့် အမှားအယွင်း' : 'Component Error'}
            </h3>

            {/* Error Description */}
            <p className="text-sm text-muted-foreground mb-6">
              {getLocalizedErrorMessage('COMPONENT_LOAD_FAILED', this.props.language || 'en')}
            </p>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-muted rounded-lg text-left">
                <h4 className="font-semibold text-xs mb-1">Error Details:</h4>
                <p className="text-xs text-muted-foreground font-mono break-words">
                  {this.state.error.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {this.state.errorId}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Component Stack
                    </summary>
                    <pre className="mt-1 text-xs text-muted-foreground overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={this.retry} 
                size="sm" 
                className="w-full"
              >
                <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
                {this.props.language === 'mm' ? 'ထပ်မံကြိုးစားပါ' : 'Try Again'}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                size="sm" 
                className="w-full"
              >
                <IconComponent name="RefreshCw" className="w-4 h-4 mr-2" />
                {this.props.language === 'mm' ? 'စာမျက်နှာကို ပြန်ရှင်းသန့်စေပါ' : 'Reload Page'}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  // Throw error to be caught by Error Boundary
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ))

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Specialized error boundaries for different use cases
 */

// Error boundary for async operations
export function AsyncErrorBoundary({ children, onError }: { 
  children: ReactNode
  onError?: (error: Error) => void 
}) {
  const { currentLanguage } = useLanguage()
  
  return (
    <ErrorBoundary
      language={currentLanguage as 'en' | 'mm'}
      onError={onError}
      fallback={(error, errorInfo, retry, language) => (
        <div className="p-4 text-center">
          <IconComponent name="Loader" className="w-6 h-6 mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground mb-3">
            {getLocalizedErrorMessage('DATA_LOAD_FAILED', language || 'en')}
          </p>
          <Button onClick={retry} size="sm" variant="outline">
            {language === 'mm' ? 'ထပ်မံကြိုးစားပါ' : 'Retry'}
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// Error boundary for form components
export function FormErrorBoundary({ children }: { children: ReactNode }) {
  const { currentLanguage } = useLanguage()
  
  return (
    <ErrorBoundary
      language={currentLanguage as 'en' | 'mm'}
      fallback={(error, errorInfo, retry, language) => (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent name="AlertCircle" className="w-5 h-5 text-destructive" />
            <h4 className="font-semibold text-destructive">
              {language === 'mm' ? 'ဖောင်း အမှားအယွင်း' : 'Form Error'}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {getLocalizedErrorMessage('FORM_SUBMISSION_FAILED', language || 'en')}
          </p>
          <Button onClick={retry} size="sm" variant="outline">
            {language === 'mm' ? 'ဖောင်းကို ပြန်ရှင်းလင်းမည်' : 'Reset Form'}
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary