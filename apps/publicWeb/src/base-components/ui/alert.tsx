"use client";

import * as React from "react";

type AlertVariant = "default" | "destructive" | "success" | "warning" | "info";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const alertVariants: Record<AlertVariant, string> = {
  default: "bg-gray-50 text-gray-900 border-gray-200",
  destructive: "bg-red-50 text-red-900 border-red-200 [&>svg]:text-red-600",
  success: "bg-green-50 text-green-900 border-green-200 [&>svg]:text-green-600",
  warning: "bg-yellow-50 text-yellow-900 border-yellow-200 [&>svg]:text-yellow-600", 
  info: "bg-blue-50 text-blue-900 border-blue-200 [&>svg]:text-blue-600",
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = "", variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border px-4 py-3 text-sm flex items-start gap-3 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4 [&>svg~*]:pl-7 ${alertVariants[variant]} ${className}`}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, AlertTitleProps>(
  ({ className = "", ...props }, ref) => (
    <h5
      ref={ref}
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`text-sm opacity-90 ${className}`}
      {...props}
    />
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
export type { AlertProps, AlertTitleProps, AlertDescriptionProps, AlertVariant };