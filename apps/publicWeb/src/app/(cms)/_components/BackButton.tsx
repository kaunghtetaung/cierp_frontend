"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

/**
 * Browser-back button isolated as a client island so the
 * surrounding page can stay a server component. Falls back to
 * navigating to `/` when there's no history (e.g. the user
 * landed directly on the 404 page).
 */
export function BackButton({ label }: { label: string }) {
  const handleClick = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

export default BackButton;
