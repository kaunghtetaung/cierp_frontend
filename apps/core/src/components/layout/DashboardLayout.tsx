"use client";

import React from "react";
import { cn } from "@repo/ui";

interface DashboardLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

/**
 * Dashboard-01 style layout wrapper component
 * Provides the grid-based responsive layout following shadcn dashboard-01 patterns
 */
export function DashboardLayout({ 
  children, 
  header,
  sidebar,
  className 
}: DashboardLayoutProps) {
  return (
    <div className={cn(
      "flex h-screen overflow-hidden bg-background",
      className
    )}>
      {/* Sidebar area */}
      {sidebar && (
        <div className="flex-shrink-0">
          {sidebar}
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {header && (
          <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {header}
          </div>
        )}
        
        {/* Content area with dashboard-01 styling */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex flex-col space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Dashboard content wrapper for consistent spacing and layout
 */
export function DashboardContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6 lg:gap-8",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Dashboard section for organizing content blocks
 */
export function DashboardSection({ 
  children, 
  title,
  description,
  className 
}: { 
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default DashboardLayout;