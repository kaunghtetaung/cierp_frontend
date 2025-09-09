'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@repo/ui'
import { IconComponent } from '@repo/ui'
import { getLocalizedErrorMessage, getLocalizedRecoveryActions } from '@repo/api/messages'

interface MultilingualErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

interface MultilingualErrorBoundaryProps {
  children: ReactNode
  language: 'en' | 'mm'
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void, language: 'en' | 'mm') => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean
  errorContext?: string // Context for specific error types (e.g., 'form', 'data', 'component')
}

/**
 * Multilingual React Error Boundary with integrated error message support
 * Automatically displays errors in the user's preferred language
 */
export class MultilingualErrorBoundary extends Component<MultilingualErrorBoundaryProps, MultilingualErrorBoundaryState> {
  private retryTimeoutId: number | null = null

  constructor(props: MultilingualErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<MultilingualErrorBoundaryState> {
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
    console.error('MultilingualErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
      language: this.props.language,
      context: this.props.errorContext
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // TODO: Report to error monitoring service with language context
    // this.reportError(error, errorInfo)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId)
    }
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

  private getErrorMessageKey(): string {
    const { errorContext } = this.props
    const { error } = this.state

    // Determine appropriate error message based on context and error type
    if (errorContext === 'form') {
      return 'FORM_SUBMISSION_FAILED'
    }
    
    if (errorContext === 'data') {
      return 'DATA_LOAD_FAILED'
    }
    
    if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
      return 'COMPONENT_LOAD_FAILED'
    }
    
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      return 'NETWORK_CONNECTION_FAILED'
    }
    
    return 'UNEXPECTED_ERROR'
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { language } = this.props
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error, 
          this.state.errorInfo!, 
          this.retry,
          language
        )
      }

      // Get localized error messages
      const errorMessageKey = this.getErrorMessageKey()
      const errorMessage = getLocalizedErrorMessage(errorMessageKey, language)
      const recoveryActions = getLocalizedRecoveryActions(errorMessageKey, language)

      // Default multilingual fallback UI
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
              {language === 'mm' ? 'ကွန်ပိုနင့် အမှားအယွင်း' : 'Component Error'}
            </h3>

            {/* Error Description */}
            <p className="text-sm text-muted-foreground mb-4">
              {errorMessage}
            </p>

            {/* Recovery Actions */}
            {recoveryActions.length > 0 && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg text-left">
                <h4 className="font-semibold text-xs mb-2">
                  {language === 'mm' ? 'ဖြေရှင်းနည်းများ:' : 'What you can do:'}
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {recoveryActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <IconComponent name="ArrowRight" className="w-3 h-3 mt-0.5 text-muted-foreground/60" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-muted rounded-lg text-left">
                <h4 className="font-semibold text-xs mb-1">
                  {language === 'mm' ? 'အမှားအယွင်း အသေးစိတ်:' : 'Error Details:'}
                </h4>
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
                {language === 'mm' ? 'ထပ်မံကြိုးစားပါ' : 'Try Again'}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                size="sm" 
                className="w-full"
              >
                <IconComponent name="RefreshCw" className="w-4 h-4 mr-2" />
                {language === 'mm' ? 'စာမျက်နှာကို ပြန်လည်ရှင်းသန့်စေပါ' : 'Reload Page'}
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
 * Higher-order component to wrap components with multilingual error boundary
 */
export function withMultilingualErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<MultilingualErrorBoundaryProps, 'children' | 'language'>
) {
  const WrappedComponent = React.forwardRef<any, P & { language?: 'en' | 'mm' }>((props, ref) => {
    const { language = 'en', ...componentProps } = props
    
    return (
      <MultilingualErrorBoundary language={language} {...errorBoundaryProps}>
        <Component {...(componentProps as P)} ref={ref} />
      </MultilingualErrorBoundary>
    )
  })

  WrappedComponent.displayName = `withMultilingualErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default MultilingualErrorBoundary