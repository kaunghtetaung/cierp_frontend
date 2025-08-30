'use client'

import { useEffect } from 'react'
import { globalErrorHandler } from '@/lib/error-handler'

/**
 * Error provider component to initialize global error handling
 * This should be placed near the root of your application
 */
export function ErrorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize global error handler
    globalErrorHandler.initialize()

    // Cleanup on unmount
    return () => {
      globalErrorHandler.cleanup()
    }
  }, [])

  return <>{children}</>
}

export default ErrorProvider