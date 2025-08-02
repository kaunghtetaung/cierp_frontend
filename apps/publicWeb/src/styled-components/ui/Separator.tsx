"use client";

// Styled Separator Component - Complete UI implementation
import React from "react";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/**
 * Styled Separator Component - WITH STYLING
 */
export function Separator({
  orientation = "horizontal",
  className = "",
}: SeparatorProps) {
  const baseClasses =
    orientation === "horizontal"
      ? "h-px w-full bg-border"
      : "h-full w-px bg-border";

  return <div className={`${baseClasses} ${className}`} />;
}
