'use client';

import React from 'react';

interface TenantNotFoundPageProps {
  searchParams: Promise<{
    hostname?: string;
    requestId?: string;
    app?: string;
  }>;
}

export default function TenantNotFoundPage({ searchParams }: TenantNotFoundPageProps) {
  const { hostname, requestId, app } = React.use(searchParams);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Service Unavailable - ${hostname || 'Unknown Domain'}`}</title>
        <meta name="description" content="The service for this domain is currently unavailable. Please try again later." />
        <meta name="robots" content="noindex, nofollow" />
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #f9fafb;
              color: #111827;
              line-height: 1.6;
            }

            .container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }

            .error-card {
              max-width: 500px;
              width: 100%;
              background-color: #ffffff;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              border-radius: 12px;
              padding: 40px;
              text-align: center;
            }

            .icon {
              font-size: 64px;
              margin-bottom: 24px;
              line-height: 1;
            }

            .title {
              font-size: 28px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 16px;
            }

            .description {
              font-size: 18px;
              color: #6b7280;
              margin-bottom: 24px;
            }

            .info-box {
              background-color: #f3f4f6;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 24px;
              text-align: left;
            }

            .info-item {
              font-size: 14px;
              color: #374151;
              margin-bottom: 8px;
            }

            .info-item:last-child {
              margin-bottom: 0;
            }

            .info-label {
              font-weight: 600;
            }

            .reasons {
              color: #6b7280;
              margin-bottom: 16px;
            }

            .reasons-list {
              text-align: left;
              color: #6b7280;
              padding-left: 20px;
              margin-bottom: 24px;
            }

            .reasons-list li {
              margin-bottom: 4px;
            }

            .button {
              width: 100%;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
              margin-bottom: 12px;
              transition: background-color 0.2s;
            }

            .button-primary {
              background-color: #2563eb;
              color: #ffffff;
            }

            .button-primary:hover {
              background-color: #1d4ed8;
            }

            .button-secondary {
              background-color: #6b7280;
              color: #ffffff;
            }

            .button-secondary:hover {
              background-color: #4b5563;
            }

            .debug-info {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #9ca3af;
            }

            @media (max-width: 640px) {
              .error-card {
                padding: 24px;
              }
              
              .title {
                font-size: 24px;
              }
              
              .description {
                font-size: 16px;
              }
            }
          `
        }} />
      </head>
      <body>
        <div className="container">
          <div className="error-card">
            <div className="icon">🌐</div>
            
            <h1 className="title">Service Unavailable</h1>
            
            <p className="description">
              We're sorry, but the service for this domain is currently unavailable.
            </p>
            
            {hostname && (
              <div className="info-box">
                <div className="info-item">
                  <span className="info-label">Domain:</span> {hostname}
                </div>
                {app && (
                  <div className="info-item">
                    <span className="info-label">Service:</span> {app}
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="reasons">This could be due to:</p>
              <ul className="reasons-list">
                <li>Temporary maintenance</li>
                <li>Configuration updates</li>
                <li>Network connectivity issues</li>
              </ul>
              
              <button
                className="button button-primary"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
              >
                Try Again
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.history.back();
                  }
                }}
              >
                Go Back
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && requestId && (
              <div className="debug-info">
                Request ID: {requestId}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}