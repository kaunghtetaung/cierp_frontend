"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  PageErrorDisplay,
  ServiceErrorDisplay,
  CriticalErrorDisplay,
} from "../../styled-components/error/ErrorDisplays";
import {
  PrimaryNavigationLink,
  DangerRetryButton,
  WarningRetryButton,
} from "../../styled-components/controls/StyledControls";

export interface ErrorPageProps {
  type: "page" | "service" | "critical";
  title: string;
  message: string;
  showRetry?: boolean;
  showHome?: boolean;
  debugInfo?: string;
}

/**
 * Feature component that combines error display with navigation logic
 */
export function ErrorPage({
  type,
  title,
  message,
  showRetry = true,
  showHome = true,
  debugInfo,
}: ErrorPageProps) {
  const router = useRouter();

  const handleRetry = () => {
    router.refresh();
  };

  const actions = (
    <div className="space-y-3">
      {showRetry && (
        <div>
          {type === "critical" ? (
            <DangerRetryButton onRetry={handleRetry}>Retry</DangerRetryButton>
          ) : type === "service" ? (
            <WarningRetryButton onRetry={handleRetry}>Retry</WarningRetryButton>
          ) : (
            <DangerRetryButton onRetry={handleRetry}>Retry</DangerRetryButton>
          )}
        </div>
      )}

      {showHome && (
        <div>
          <PrimaryNavigationLink href="/">Return to Home</PrimaryNavigationLink>
        </div>
      )}

      {debugInfo && process.env.NODE_ENV === "development" && (
        <div className="mt-6 p-4 bg-gray-100 rounded text-left">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Debug Information
          </h3>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  );

  switch (type) {
    case "critical":
      return (
        <CriticalErrorDisplay title={title} message={message}>
          {actions}
        </CriticalErrorDisplay>
      );
    case "service":
      return (
        <ServiceErrorDisplay title={title} message={message}>
          {actions}
        </ServiceErrorDisplay>
      );
    case "page":
    default:
      return (
        <PageErrorDisplay title={title} message={message}>
          {actions}
        </PageErrorDisplay>
      );
  }
}
