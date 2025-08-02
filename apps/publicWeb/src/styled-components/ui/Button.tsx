"use client";

// Styled Button Component - Complete UI implementation
import React from "react";
import {
  Button as BaseButton,
  ButtonProps as BaseButtonProps,
} from "@/base-components/ui/button";

export interface ButtonProps extends BaseButtonProps {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "destructive"
    | "success"
    | "warning"
    | "info"
    | "accent"
    | "ghost"
    | "outline";
  size?: "sm" | "md" | "lg";
}

/**
 * Styled Button Component - WITH STYLING
 * Wraps base button with complete theme styling
 */
export function Button({
  variant = "default",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md transform hover:-translate-y-0.5";

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    success: "bg-success text-success-foreground hover:bg-success/90",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    info: "bg-info text-info-foreground hover:bg-info/90",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90",
    ghost:
      "hover:bg-accent hover:text-accent-foreground shadow-none hover:shadow-none transform-none hover:transform-none",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  const sizeClasses = {
    sm: "h-9 rounded-md px-2 py-2 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 rounded-md px-8",
  };

  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return <BaseButton className={finalClassName} {...props} />;
}
