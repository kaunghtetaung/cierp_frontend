'use client'

import React from 'react'

interface WizardErrorBoundaryProps {
  children: React.ReactNode
}

interface WizardErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class WizardErrorBoundary extends React.Component<WizardErrorBoundaryProps, WizardErrorBoundaryState> {
  constructor(props: WizardErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): WizardErrorBoundaryState {
    console.error('🚨 WizardErrorBoundary caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 WizardErrorBoundary error details:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-4xl mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="font-medium">React Error in Wizard Form</span>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {this.state.error?.message}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}