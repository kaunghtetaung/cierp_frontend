import React from "react";
import { LoadingSpinner } from "../../base-components/ui/LoadingSpinner";

/**
 * Styled loading components using standard Tailwind patterns
 */

export function StandardLoadingSpinner() {
  return (
    <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin">
      <LoadingSpinner />
    </div>
  );
}

export function LargeLoadingSpinner() {
  return (
    <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin">
      <LoadingSpinner />
    </div>
  );
}

export function CenteredLoadingDisplay({
  text = "Loading...",
}: {
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <LargeLoadingSpinner />
      <p className="mt-4 text-muted-foreground text-center">{text}</p>
    </div>
  );
}

export function FullPageLoadingDisplay({
  text = "Loading...",
}: {
  text?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <CenteredLoadingDisplay text={text} />
    </div>
  );
}
