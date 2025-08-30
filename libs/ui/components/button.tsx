"use client";

// Base Button Component - Pure functionality only
import React from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: string; // For styled components to use
  size?: string; // For styled components to use
  asChild?: boolean; // For Radix UI Slot compatibility
}

/**
 * Base Button Component - NO STYLING
 * Pure functional button with accessibility and event handling
 * Styling should be applied by wrapper components
 */
export function Button({ children, className = "", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  
  return (
    <Comp className={className} {...props}>
      {children}
    </Comp>
  );
}

export default Button;