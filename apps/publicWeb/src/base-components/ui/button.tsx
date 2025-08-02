"use client";

// Base Button Component - Pure functionality only
import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: string; // For styled components to use
  size?: string; // For styled components to use
}

/**
 * Base Button Component - NO STYLING
 * Pure functional button with accessibility and event handling
 * Styling should be applied by wrapper components
 */
export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}

export default Button;
