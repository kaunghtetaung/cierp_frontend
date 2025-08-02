import React from "react";
import { ErrorDisplayProps } from "../../base-components/error/ErrorDisplay";

/**
 * Styled error display components using Tailwind CSS
 */

export function CriticalErrorDisplay({
  title,
  message,
  children,
}: ErrorDisplayProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-destructive/10">
      <div className="max-w-md mx-auto p-6">
        <div className="bg-card border border-destructive/20 rounded-lg p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-destructive mb-2">{title}</h1>
            <p className="text-destructive-foreground mb-6">{message}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageErrorDisplay({
  title,
  message,
  children,
}: ErrorDisplayProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
        <div className="mx-auto w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-destructive mb-4">{title}</h1>
        <p className="text-destructive-foreground mb-6">{message}</p>
        {children}
      </div>
    </div>
  );
}

export function ServiceErrorDisplay({
  title,
  message,
  children,
}: ErrorDisplayProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warning/10">
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-card border border-warning/20 rounded-lg p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 4h.01M5 12a7 7 0 1114 0 7 7 0 01-14 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-warning mb-2">
              {title}
            </h1>
            <p className="text-warning-foreground mb-6">{message}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
