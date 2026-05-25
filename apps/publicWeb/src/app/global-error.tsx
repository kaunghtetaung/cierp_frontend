'use client';

import React from 'react';
import { reportError } from '@repo/utils/common';
import { getClientRequestContext } from '@repo/utils/client/error-context';

// Prevent static generation for global error boundary
export const dynamic = 'force-dynamic';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Best-effort telemetry — must not throw, the global error
    // boundary is the LAST surface before a blank screen.
    try {
      const requestContext = getClientRequestContext();
      (reportError as any)(error, {
        ...requestContext,
        severity: 'critical',
        component: 'global-error-boundary',
      })?.catch?.((err: unknown) =>
        console.error('Failed to report critical error:', err),
      );
    } catch (reportErr) {
      console.error('Global Error (Critical):', error, reportErr);
    }
  }, [error]);

  // Global error renders OUTSIDE the root layout when the layout
  // itself fails — so we ship our own <html><body> and inline CSS.
  // No theme tokens, no design-system imports — has to render even
  // when the whole app pipeline is broken. Kept visually aligned
  // with the route-level error.tsx (red accent, big icon, dual
  // action buttons) but standalone.
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #fff5f5 0%, #ffffff 50%, #fef2f2 100%)',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          color: '#111827',
          padding: '3rem 1rem',
        }}
      >
        <div style={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              margin: '0 auto 1.5rem',
              width: 96,
              height: 96,
              borderRadius: '9999px',
              background: 'rgba(220, 38, 38, 0.10)',
              boxShadow: 'inset 0 0 0 1px rgba(220, 38, 38, 0.20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>

          <p
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              fontWeight: 600,
              color: '#dc2626',
              margin: '0 0 0.5rem',
            }}
          >
            CRITICAL ERROR
          </p>

          <h1
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 1rem',
            }}
          >
            Something went seriously wrong
          </h1>

          <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
            A critical error prevented the application from loading.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
            Try reloading the page. If the problem persists, contact technical support.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                width: '100%',
                maxWidth: 280,
                height: 44,
                borderRadius: 8,
                border: 'none',
                background: '#dc2626',
                color: '#fff',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              style={{
                width: '100%',
                maxWidth: 280,
                height: 44,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#111827',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Reload application
            </button>
          </div>

          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              Error ID:{' '}
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                {error.digest}
              </span>
            </p>
          )}

          {isDev && (
            <details
              style={{
                marginTop: '2rem',
                textAlign: 'left',
                maxWidth: 560,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                }}
              >
                Error details (development)
              </summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: 6,
                  fontSize: '0.6875rem',
                  lineHeight: 1.5,
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 240,
                  overflow: 'auto',
                }}
              >
                {error.message}
                {error.stack && `\n\nStack:\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}
