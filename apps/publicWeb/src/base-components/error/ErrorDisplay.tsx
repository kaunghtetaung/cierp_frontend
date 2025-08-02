import React from "react";

export interface ErrorDisplayProps {
  title: string;
  message: string;
  children?: React.ReactNode;
}

/**
 * Base error display component with minimal styling
 * Used as foundation for styled error components
 */
export function ErrorDisplay({ title, message, children }: ErrorDisplayProps) {
  return (
    <div role="alert" aria-live="polite">
      <h1>{title}</h1>
      <p>{message}</p>
      {children}
    </div>
  );
}
