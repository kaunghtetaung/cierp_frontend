import React from "react";

export interface RetryButtonProps {
  onRetry: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * Base retry button component without styling
 * Used as foundation for styled retry buttons
 */
export function RetryButton({
  onRetry,
  children,
  disabled = false,
}: RetryButtonProps) {
  return (
    <button onClick={onRetry} disabled={disabled} type="button">
      {children}
    </button>
  );
}
