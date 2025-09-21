"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ModuleLoading() {
  const [dots, setDots] = useState("");
  const [showContent, setShowContent] = useState(false);

  // Animate dots for loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Show skeleton after a short delay to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    // Initial state - minimal loading to prevent flash
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">Loading{dots}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden animate-in fade-in-50 duration-500">
      <div className="w-full space-y-4 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
            <div className="space-y-2">
              <div className="h-6 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded-md w-48"></div>
              <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 animate-pulse rounded-md w-64"></div>
            </div>
          </div>
          <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded-md w-24"></div>
        </div>

        {/* Toolbar Skeleton */}
        <div className="flex justify-between items-center py-2">
          <div className="flex gap-2">
            <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded-md w-64"></div>
            <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded-md w-20"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded-md w-24"></div>
            <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded-md w-24"></div>
            <div className="h-9 bg-gradient-to-r from-primary/20 to-primary/10 animate-pulse rounded-md w-28"></div>
          </div>
        </div>

        {/* Table Skeleton with better styling */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Table header */}
          <div className="border-b bg-muted/30 px-6 py-3">
            <div className="flex gap-4">
              <div className="h-4 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded w-8"></div>
              <div className="h-4 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded flex-1 max-w-[180px]"></div>
              <div className="h-4 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded flex-1 max-w-[150px]"></div>
              <div className="h-4 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded flex-1 max-w-[200px]"></div>
              <div className="h-4 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded w-24"></div>
              <div className="h-4 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded w-20"></div>
            </div>
          </div>

          {/* Table rows with staggered animation */}
          <div className="divide-y divide-border/50">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="px-6 py-4 hover:bg-muted/5 transition-colors"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              >
                <div className="flex gap-4 items-center">
                  <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-8"></div>
                  <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded flex-1 max-w-[180px]"></div>
                  <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded flex-1 max-w-[150px]"></div>
                  <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded flex-1 max-w-[200px]"></div>
                  <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 rounded w-24"></div>
                  <div className="flex gap-1">
                    <div className="h-7 w-7 bg-gradient-to-r from-muted/60 to-muted/30 rounded"></div>
                    <div className="h-7 w-7 bg-gradient-to-r from-muted/60 to-muted/30 rounded"></div>
                    <div className="h-7 w-7 bg-gradient-to-r from-muted/60 to-muted/30 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gradient-to-r from-muted/60 to-muted/30 animate-pulse rounded w-48"></div>
          <div className="flex gap-1">
            <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded w-9"></div>
            <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded w-9"></div>
            <div className="h-9 bg-gradient-to-r from-primary/20 to-primary/10 animate-pulse rounded w-9"></div>
            <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded w-9"></div>
            <div className="h-9 bg-gradient-to-r from-muted to-muted/50 animate-pulse rounded w-9"></div>
          </div>
        </div>
      </div>

      {/* Subtle loading indicator at bottom */}
      <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-lg border p-3 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary/60" />
        <span className="text-sm text-muted-foreground">
          Loading module{dots}
        </span>
      </div>
    </div>
  );
}
