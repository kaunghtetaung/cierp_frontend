import React from 'react';

interface GlobalErrorFallbackProps {
  title: string;
  message: string;
  reasons: string[];
  error: string;
}

export function GlobalErrorFallback({ title, message, reasons, error }: GlobalErrorFallbackProps) {
  return (
    <html lang="en">
      <head>
        <title>{title} - PublicWeb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 0,
        padding: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            color: 'white',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚨</div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{title}</h1>
          </div>
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: '#333', fontSize: '18px', marginBottom: '16px', lineHeight: '1.5' }}>
              {message}
            </p>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '24px',
              margin: '24px 0',
              textAlign: 'left'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#495057' }}>This could be due to:</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d' }}>
                {reasons.map((reason, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>{reason}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={typeof window !== 'undefined' ? window.location.href : '/'}
                style={{
                  padding: '14px 28px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  display: 'inline-block'
                }}
              >
                🔄 Retry Loading
              </a>
              <a 
                href="/"
                style={{
                  padding: '14px 28px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  fontSize: '16px',
                  background: '#6c757d',
                  color: 'white',
                  display: 'inline-block'
                }}
              >
                ← Return to Home
              </a>
            </div>
            
            <details style={{
              marginTop: '24px',
              borderTop: '1px solid #dee2e6',
              paddingTop: '24px'
            }}>
              <summary style={{
                cursor: 'pointer',
                color: '#6c757d',
                fontWeight: '600',
                padding: '8px 0'
              }}>
                🔧 Technical Details
              </summary>
              <pre style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                padding: '16px',
                borderRadius: '6px',
                fontSize: '12px',
                overflow: 'auto',
                marginTop: '12px',
                color: '#495057',
                whiteSpace: 'pre-wrap'
              }}>
                {error}
              </pre>
            </details>
          </div>
        </div>
      </body>
    </html>
  );
}
