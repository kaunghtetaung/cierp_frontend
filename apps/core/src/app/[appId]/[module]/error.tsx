'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { Button } from '@repo/ui'
import { Alert, AlertDescription } from '@repo/ui'
import { RefreshCw, AlertTriangle, Clock, Wifi, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ModuleErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ModuleError({ error, reset }: ModuleErrorProps) {
  const router = useRouter()

  useEffect(() => {
    // Log error for debugging
    console.error('Module page error:', error)
  }, [error])

  // Check if this is a timeout error
  const isTimeoutError = error.message.includes('timeout') || 
                        error.message.includes('timed out') ||
                        error.message.includes('Request to microservice timed out')

  // Check if this is a network error
  const isNetworkError = error.message.includes('fetch') || 
                        error.message.includes('network') ||
                        error.message.includes('ECONNREFUSED')

  const getErrorIcon = () => {
    if (isTimeoutError) return <Clock className="h-6 w-6 text-warning" />
    if (isNetworkError) return <Wifi className="h-6 w-6 text-danger" />
    return <AlertTriangle className="h-6 w-6 text-danger" />
  }

  const getErrorTitle = () => {
    if (isTimeoutError) return 'Request Timed Out'
    if (isNetworkError) return 'Connection Error'
    return 'Module Load Error'
  }

  const getErrorDescription = () => {
    if (isTimeoutError) {
      return 'The microservice is taking longer than expected to respond. This usually happens during high load or when processing large datasets.'
    }
    if (isNetworkError) {
      return 'Unable to connect to the microservice. Please check your network connection and try again.'
    }
    return 'An unexpected error occurred while loading the module.'
  }

  const getSuggestions = () => {
    const common = ['Check your internet connection', 'Wait a moment and try again']
    
    if (isTimeoutError) {
      return [
        'The server might be processing a large request',
        'Try refreshing the page in a few seconds',
        'Consider using filters to reduce data load',
        ...common
      ]
    }
    
    if (isNetworkError) {
      return [
        'Check if the microservice is running',
        'Verify your network connection',
        ...common
      ]
    }
    
    return [
      'This might be a temporary issue',
      ...common
    ]
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <Card className={`w-full ${isTimeoutError ? 'border-warning' : 'border-danger'}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {getErrorIcon()}
            <div>
              <CardTitle className={isTimeoutError ? 'text-warning' : 'text-danger'}>
                {getErrorTitle()}
              </CardTitle>
              <CardDescription>
                {getErrorDescription()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details */}
          <Alert variant={isTimeoutError ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <details className="cursor-pointer">
                <summary className="font-medium mb-2">
                  {isTimeoutError ? 'Timeout Details' : 'Error Details'}
                </summary>
                <div className="space-y-2">
                  <code className="text-xs bg-background p-2 rounded block border">
                    {error.message}
                  </code>
                  {error.digest && (
                    <div className="text-xs text-muted-foreground">
                      Error ID: {error.digest}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Time: {new Date().toLocaleString()}
                  </div>
                </div>
              </details>
            </AlertDescription>
          </Alert>

          {/* Suggestions */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">What you can try:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default"
              onClick={reset}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.refresh()}
              className="flex-1 sm:flex-none"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1 sm:flex-none"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Additional info for timeout errors */}
          {isTimeoutError && (
            <div className="bg-info-light border border-info rounded-lg p-4">
              <h4 className="font-medium text-info text-sm mb-2">💡 Pro Tip</h4>
              <p className="text-sm text-info">
                If timeouts keep happening, try using table filters to reduce the amount of data being loaded, 
                or contact your system administrator if the issue persists.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}