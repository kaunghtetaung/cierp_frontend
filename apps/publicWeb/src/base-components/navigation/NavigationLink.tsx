import React from "react";
import Link from "next/link";

export interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Base navigation link component without styling
 * Used as foundation for styled navigation links
 */
export function NavigationLink({ href, children }: NavigationLinkProps) {
  return <Link href={href}>{children}</Link>;
}
