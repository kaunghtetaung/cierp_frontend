'use client';

import React from 'react';
import { reportError, ApplicationError } from '@repo/utils/common';
import { getClientRequestContext } from '@repo/utils/client/error-context';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Extract request context from browser
    const requestContext = getClientRequestContext();

    // Report critical error with full context
    const appError = new ApplicationError({
      type: 'UNKNOWN_ERROR',
      message: error.message,
      severity: 'critical',
      category: 'application',
      operation: 'app-initialization',
      component: 'global-error-boundary',
      cause: error,
      // Include request context
      hostname: requestContext.hostname,
      appName: requestContext.appName,
      service: requestContext.service,
      tenantId: requestContext.tenantId,
      userId: requestContext.userId,
      path: requestContext.path,
      userAgent: requestContext.userAgent,
      metadata: {
        digest: error.digest,
        errorName: error.name,
        timestamp: new Date().toISOString()
      }
    });

    reportError(appError).catch(err => {
      console.error('Failed to report critical error:', err);
    });

    // Fallback console logging
    console.error('Global Error (Critical):', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 13.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Critical System Error
              </h1>

              <p className="text-gray-600 mb-8 leading-relaxed">
                A critical error has occurred that prevented the application
                from loading properly. Please reload the page or contact
                technical support.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                  <h3 className="font-semibold text-sm mb-2">Error Details:</h3>
                  <p className="text-xs text-gray-600 font-mono break-words">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-gray-500 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-500">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  🔄 Try Again
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  🏠 Reload Application
                </button>

                <button
                  onClick={() => (window.location.href = '/support')}
                  className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  🆘 Contact Support
                </button>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  If this problem persists, please contact technical support
                  with the error ID above.
                  <br />
                  Time: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
