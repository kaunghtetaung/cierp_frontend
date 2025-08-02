'use client';

import React from 'react';

interface InteractiveButtonsProps {
  slug?: string;
  type: 'not-found' | 'error';
  error?: Error;
}

export function InteractiveButtons({ slug, type, error }: InteractiveButtonsProps) {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (type === 'not-found') {
    return (
      <div className="space-x-4">
        <button 
          onClick={handleGoHome}
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-theme-button hover:bg-primary/80 transition-colors"
        >
          Return to Home
        </button>
        <button 
          onClick={handleGoBack}
          className="inline-block px-6 py-2 bg-secondary text-secondary-foreground rounded-theme-button hover:bg-secondary/80 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-x-4">
        <button 
          onClick={handleRetry}
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-theme-button hover:bg-primary/80 transition-colors"
        >
          Retry
        </button>
        <button 
          onClick={handleGoHome}
          className="inline-block px-6 py-2 bg-secondary text-secondary-foreground rounded-theme-button hover:bg-secondary/80 transition-colors"
        >
          Return to Home
        </button>
      </div>
      
      {error && (
        <details className="mt-6 text-left max-w-2xl mx-auto">
          <summary className="cursor-pointer text-destructive font-medium">
            Technical Details
          </summary>
          <pre className="mt-2 p-4 bg-destructive/10 rounded-theme-base text-sm text-destructive overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
}