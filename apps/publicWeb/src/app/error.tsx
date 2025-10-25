'use client';

import React from 'react';
import { reportError } from '@repo/utils/common/error-reporter';
import { ApplicationError } from '@repo/utils/common/error-types';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log the error to error reporting service
    const appError = new ApplicationError({
      type: 'UNKNOWN_ERROR',
      message: error.message,
      severity: 'high',
      category: 'application',
      operation: 'page-render',
      component: 'error-boundary',
      cause: error,
      metadata: {
        digest: error.digest,
        errorName: error.name
      }
    });

    reportError(appError).catch(err => {
      console.error('Failed to report error:', err);
    });

    // Fallback console logging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Something went wrong!
          </h2>
          <p className="text-muted-foreground mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <div className="space-y-4">
            <button
              onClick={reset}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-dark transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                {error.message}
                {error.stack && '\n\nStack:\n' + error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}