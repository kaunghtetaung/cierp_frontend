import React from "react";

interface ProfileSetupLayoutProps {
  children: React.ReactNode;
}

/**
 * Pass-through. Chrome (logo, tenant name, lang switcher, footer)
 * is provided by the outer `(register)/layout.tsx` → AuthShell.
 *
 * Earlier this file duplicated the same chrome inside
 * `ProfileSetupLayoutClient`; we collapsed the duplicate so all auth
 * screens share a single header surface.
 */
export default function ProfileSetupLayout({
  children,
}: ProfileSetupLayoutProps) {
  return <>{children}</>;
}
