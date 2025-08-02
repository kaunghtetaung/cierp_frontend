"use client";

import React from "react";
import {
  RetryButton,
  RetryButtonProps,
} from "../../base-components/controls/RetryButton";
import {
  NavigationLink,
  NavigationLinkProps,
} from "../../base-components/navigation/NavigationLink";

/**
 * Styled control components using Tailwind CSS
 */

export function PrimaryRetryButton({
  onRetry,
  children,
  disabled = false,
}: RetryButtonProps) {
  return (
    <RetryButton onRetry={onRetry} disabled={disabled}>
      <span
        className={`inline-block px-4 py-2 rounded transition-colors ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {children}
      </span>
    </RetryButton>
  );
}

export function SecondaryRetryButton({
  onRetry,
  children,
  disabled = false,
}: RetryButtonProps) {
  return (
    <RetryButton onRetry={onRetry} disabled={disabled}>
      <span
        className={`inline-block px-4 py-2 border rounded transition-colors ${
          disabled
            ? "border-muted text-muted-foreground cursor-not-allowed"
            : "border-border text-foreground hover:bg-muted"
        }`}
      >
        {children}
      </span>
    </RetryButton>
  );
}

export function DangerRetryButton({
  onRetry,
  children,
  disabled = false,
}: RetryButtonProps) {
  return (
    <RetryButton onRetry={onRetry} disabled={disabled}>
      <span
        className={`inline-block px-4 py-2 rounded transition-colors ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
        }`}
      >
        {children}
      </span>
    </RetryButton>
  );
}

export function WarningRetryButton({
  onRetry,
  children,
  disabled = false,
}: RetryButtonProps) {
  return (
    <RetryButton onRetry={onRetry} disabled={disabled}>
      <span
        className={`inline-block px-4 py-2 rounded transition-colors ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-warning text-warning-foreground hover:bg-warning/90"
        }`}
      >
        {children}
      </span>
    </RetryButton>
  );
}

export function PrimaryNavigationLink({ href, children }: NavigationLinkProps) {
  return (
    <NavigationLink href={href}>
      <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
        {children}
      </span>
    </NavigationLink>
  );
}

export function SecondaryNavigationLink({
  href,
  children,
}: NavigationLinkProps) {
  return (
    <NavigationLink href={href}>
      <span className="inline-block px-4 py-2 border border-border text-foreground rounded hover:bg-muted transition-colors">
        {children}
      </span>
    </NavigationLink>
  );
}
