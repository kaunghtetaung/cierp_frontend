import React from "react";

// This layout provides the consistent structure for all auth pages
// Each page will have its own content but share the same overall design system
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}