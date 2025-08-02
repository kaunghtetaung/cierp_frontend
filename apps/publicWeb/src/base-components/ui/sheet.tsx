// Basic Sheet Component
// Simple replacement for missing UI library
"use client";

import React, { createContext, useContext, useState } from "react";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({
  open: controlledOpen,
  onOpenChange,
  children,
}: SheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <SheetContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function SheetTrigger({ children, asChild }: SheetTriggerProps) {
  const context = useContext(SheetContext);

  if (!context) {
    throw new Error("SheetTrigger must be used within a Sheet");
  }

  const handleClick = () => {
    context.onOpenChange(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any);
  }

  return <button onClick={handleClick}>{children}</button>;
}

export interface SheetContentProps {
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

export function SheetContent({
  children,
  side = "right",
  className = "",
}: SheetContentProps) {
  const context = useContext(SheetContext);

  if (!context) {
    throw new Error("SheetContent must be used within a Sheet");
  }

  if (!context.open) {
    return null;
  }

  const sideClasses = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => context.onOpenChange(false)}
      />

      {/* Sheet content */}
      <div
        className={`fixed z-50 bg-background border shadow-lg ${sideClasses[side]} ${className}`}
        style={{
          width: side === "left" || side === "right" ? "320px" : undefined,
          height: side === "top" || side === "bottom" ? "50%" : undefined,
        }}
      >
        {children}
      </div>
    </>
  );
}

export interface SheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SheetHeader({ children, className = "" }: SheetHeaderProps) {
  return <div className={`p-6 pb-4 border-b ${className}`}>{children}</div>;
}

export interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SheetTitle({ children, className = "" }: SheetTitleProps) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}
