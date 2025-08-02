'use client';

import React from 'react';

export type ErrorType = 
  | 'not-found' 
  | 'configuration' 
  | 'content-error' 
  | 'permission' 
  | 'server-error'
  | 'network-error';

interface ErrorDisplayProps {
  type: ErrorType;
  title?: string;
  message?: string;
  details?: string;
  slug?: string;
  error?: Error;
  showTechnicalDetails?: boolean;
  actions?: {
    primary?: { label: string; action: () => void };
    secondary?: { label: string; action: () => void };
  };
}

const ERROR_CONFIGS = {
  'not-found': {
    icon: '📄',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/20',
    titleColor: 'text-accent',
    textColor: 'text-foreground',
    subTextColor: 'text-muted-foreground',
    defaultTitle: 'Page Not Found',
    defaultMessage: 'The requested page could not be found.',
    suggestions: [
      'The page may have been moved or deleted',
      'Check the URL for typos',
      'You may not have permission to view this page'
    ]
  },
  'configuration': {
    icon: '⚙️',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    titleColor: 'text-destructive',
    textColor: 'text-foreground',
    subTextColor: 'text-muted-foreground',
    defaultTitle: 'Configuration Error',
    defaultMessage: 'Unable to determine system configuration.',
    suggestions: [
      'Contact the administrator',
      'Check your tenant settings',
      'Verify your access permissions'
    ]
  },
  'content-error': {
    icon: '⚠️',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    titleColor: 'text-destructive',
    textColor: 'text-foreground',
    subTextColor: 'text-muted-foreground',
    defaultTitle: 'Content Loading Error',
    defaultMessage: 'There was an error loading the content.',
    suggestions: [
      'Content settings not configured',
      'Database connection issues',
      'Content corruption or missing data',
      'Insufficient permissions'
    ]
  },
  'permission': {
    icon: '🔒',
    bgColor: 'bg-secondary/10',
    borderColor: 'border-secondary/20',
    titleColor: 'text-secondary',
    textColor: 'text-foreground',
    subTextColor: 'text-muted-foreground',
    defaultTitle: 'Access Denied',
    defaultMessage: 'You do not have permission to access this content.',
    suggestions: [
      'Contact your administrator for access',
      'Check if you need to log in',
      'Verify your account permissions'
    ]
  },
  'server-error': {
    icon: '🔧',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    titleColor: 'text-destructive',
    textColor: 'text-foreground',
    subTextColor: 'text-muted-foreground',
    defaultTitle: 'Server Error',
    defaultMessage: 'The server encountered an error processing your request.',
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists'
    ]
  },
  'network-error': {
    icon: '📡',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    titleColor: 'text-primary',
    textColor: 'text-foreground',
    subTextColor: 'text-muted-foreground',
    defaultTitle: 'Network Error',
    defaultMessage: 'Unable to connect to the server.',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Contact your network administrator'
    ]
  }
};

export function ErrorDisplay({ 
  type, 
  title, 
  message, 
  details, 
  slug, 
  error,
  showTechnicalDetails = true,
  actions 
}: ErrorDisplayProps) {
  const config = ERROR_CONFIGS[type];
  
  const defaultActions = {
    primary: { 
      label: 'Retry', 
      action: () => window.location.reload() 
    },
    secondary: { 
      label: 'Return to Home', 
      action: () => window.location.href = '/' 
    }
  };

  const finalActions = actions || defaultActions;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className={`text-center p-8 ${config.bgColor} border ${config.borderColor} rounded-theme-card`}>
        <div className="text-6xl mb-4">{config.icon}</div>
        
        <h1 className={`text-3xl font-bold ${config.titleColor} mb-4`}>
          {title || config.defaultTitle}
        </h1>
        
        <p className={`${config.textColor} mb-2`}>
          {message || config.defaultMessage}
          {slug && ` "${slug}"`}
        </p>
        
        {details && (
          <p className={`${config.subTextColor} mb-4`}>{details}</p>
        )}
        
        {config.suggestions && (
          <>
            <p className={`${config.subTextColor} mb-2`}>This could be due to:</p>
            <ul className={`${config.subTextColor} text-left max-w-md mx-auto mb-6 space-y-1`}>
              {config.suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </>
        )}
        
        <div className="space-x-4">
          {finalActions.primary && (
            <button 
              onClick={finalActions.primary.action}
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-theme-button hover:bg-primary/80 transition-colors"
            >
              {finalActions.primary.label}
            </button>
          )}
          {finalActions.secondary && (
            <button 
              onClick={finalActions.secondary.action}
              className="inline-block px-6 py-2 bg-secondary text-secondary-foreground rounded-theme-button hover:bg-secondary/80 transition-colors"
            >
              {finalActions.secondary.label}
            </button>
          )}
        </div>
        
        {showTechnicalDetails && error instanceof Error && (
          <details className="mt-6 text-left max-w-2xl mx-auto">
            <summary className={`cursor-pointer ${config.textColor} font-medium`}>
              Technical Details
            </summary>
            <pre className={`mt-2 p-4 ${config.bgColor} rounded text-sm ${config.titleColor} overflow-auto border`}>
              {error.message}
              {error.stack && (
                <>
                  {'\n\nStack Trace:\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default ErrorDisplay;