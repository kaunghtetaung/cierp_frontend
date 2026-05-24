'use client';

import React from 'react';

/**
 * Generic service-unavailable page rendered when the tenant
 * middleware can't resolve / reach the backend (gateway down,
 * tenant lookup network error, unhandled middleware exception).
 *
 * Self-contained styling so the page renders correctly even when
 * the rest of the app's CSS pipeline isn't available — same
 * approach as the sibling `tenant-not-found` page.
 *
 * The redirect happens from `libs/tenant/middleware/response.ts`
 * for ANY middleware error other than `TENANT_NOT_FOUND` (which
 * has its own dedicated page).
 */

interface ServiceUnavailablePageProps {
  searchParams: Promise<{
    hostname?: string;
    requestId?: string;
    app?: string;
    code?: string;
    message?: string;
  }>;
}

export default function ServiceUnavailablePage({
  searchParams,
}: ServiceUnavailablePageProps) {
  const { hostname, requestId, app, code, message } = React.use(searchParams);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>503 — Service Temporarily Unavailable</title>
        <meta
          name="description"
          content="The service is temporarily unavailable. Please try again shortly."
        />
        <meta name="robots" content="noindex, nofollow" />
        <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      </head>
      <body>
        <main className="page">
          <div className="content">
            {/* Animated SVG glyph. Inline so it renders even when
                the rest of the CSS/JS pipeline is unreachable. */}
            <svg
              className="glyph"
              viewBox="0 0 96 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeOpacity="0.15"
                strokeWidth="2"
              />
              <circle
                className="glyph-arc"
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M48 28v24"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="48" cy="64" r="2.5" fill="currentColor" />
            </svg>

            <div className="status-row">
              <span className="status-code">503</span>
              <span className="status-divider" aria-hidden="true">·</span>
              <span className="status-label">Service Temporarily Unavailable</span>
            </div>

            <h1 className="headline">
              We can&rsquo;t reach the service right now.
            </h1>

            <p className="lede">
              A backend service is restarting or briefly unreachable.
              This usually clears up on its own in a moment — please
              try again.
            </p>

            <div className="actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.reload();
                }}
              >
                <span>Try again</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 22v-6h6" />
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 2v6h-6" />
                </svg>
              </button>
              <a className="btn btn-ghost" href="/">
                Go to homepage
              </a>
            </div>

            {(hostname || app) && (
              <div className="context">
                {hostname && (
                  <span className="context-pill">
                    <span className="context-label">domain</span>
                    {hostname}
                  </span>
                )}
                {app && (
                  <span className="context-pill">
                    <span className="context-label">app</span>
                    {app}
                  </span>
                )}
              </div>
            )}

            {process.env.NODE_ENV === 'development' &&
              (code || requestId || message) && (
                <details className="debug">
                  <summary>Diagnostic info (dev only)</summary>
                  <dl>
                    {code && (
                      <>
                        <dt>Code</dt>
                        <dd>{code}</dd>
                      </>
                    )}
                    {message && (
                      <>
                        <dt>Message</dt>
                        <dd>{message}</dd>
                      </>
                    )}
                    {requestId && (
                      <>
                        <dt>Request</dt>
                        <dd>
                          <code>{requestId}</code>
                        </dd>
                      </>
                    )}
                  </dl>
                </details>
              )}
          </div>
        </main>
      </body>
    </html>
  );
}

// Inline CSS — single-stylesheet so the page can render with the
// global stylesheet pipeline unavailable. Colour palette is aligned
// with the publicWeb theme (`--color-primary: #1D7BDB`).
const PAGE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    background:
      radial-gradient(1200px 600px at 50% -10%, rgba(29,123,219,0.10), transparent 60%),
      radial-gradient(900px 500px at 80% 110%, rgba(29,123,219,0.06), transparent 60%),
      #fafafa;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }
  .content {
    width: 100%;
    max-width: 560px;
    text-align: center;
  }
  .glyph {
    width: 84px;
    height: 84px;
    color: #1d7bdb;
    margin: 0 auto 28px;
    display: block;
  }
  .glyph-arc {
    stroke-dasharray: 70 200;
    transform-origin: 48px 48px;
    animation: spin 1.4s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .status-row {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 20px;
  }
  .status-code {
    background: #1d7bdb;
    color: #fff;
    padding: 4px 10px;
    border-radius: 999px;
    letter-spacing: 0.05em;
    font-size: 12px;
  }
  .status-divider { color: #cbd5e1; }
  .headline {
    font-size: clamp(24px, 4vw, 34px);
    font-weight: 700;
    line-height: 1.2;
    color: #0f172a;
    margin-bottom: 14px;
    letter-spacing: -0.01em;
  }
  .lede {
    font-size: 16px;
    line-height: 1.65;
    color: #475569;
    margin: 0 auto 32px;
    max-width: 440px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    margin-bottom: 36px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: background-color 0.15s ease, color 0.15s ease,
      box-shadow 0.15s ease, transform 0.05s ease;
    border: 1px solid transparent;
  }
  .btn-primary {
    background: #1d7bdb;
    color: #fff;
    box-shadow: 0 1px 0 rgba(15,23,42,0.04),
                0 8px 20px -8px rgba(29,123,219,0.45);
  }
  .btn-primary:hover { background: #1769bd; }
  .btn-primary:active { transform: translateY(1px); }
  .btn-ghost {
    background: transparent;
    color: #1d7bdb;
    border-color: rgba(29,123,219,0.25);
  }
  .btn-ghost:hover {
    background: rgba(29,123,219,0.06);
    border-color: rgba(29,123,219,0.45);
  }
  .context {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 4px;
  }
  .context-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #475569;
    background: rgba(15,23,42,0.04);
    padding: 6px 12px;
    border-radius: 999px;
  }
  .context-label {
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 10px;
    font-weight: 600;
  }
  .debug {
    margin-top: 36px;
    text-align: left;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 13px;
    color: #334155;
  }
  .debug summary {
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    user-select: none;
  }
  .debug dl {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 6px 16px;
    margin-top: 12px;
  }
  .debug dt {
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 11px;
  }
  .debug dd {
    color: #1e293b;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      monospace;
    font-size: 12px;
  }
  @media (max-width: 480px) {
    .page { padding: 32px 18px; }
    .glyph { width: 72px; height: 72px; margin-bottom: 22px; }
    .lede { font-size: 15px; }
    .btn { padding: 10px 18px; font-size: 14px; }
  }
`;
