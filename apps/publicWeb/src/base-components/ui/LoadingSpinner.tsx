import React from "react";

/**
 * Base loading spinner component without styling
 */
export function LoadingSpinner() {
  return (
    <div role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
}
