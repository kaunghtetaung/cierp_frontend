import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
  /** Defaults to a transparent background; pass `dark` for hero overlays. */
  variant?: "default" | "onDark";
  /** Extra classes for the outer nav element. */
  className?: string;
}

/**
 * Shared breadcrumb trail. Same markup the PostHero renders inline,
 * extracted so ContentPage (and any other template surface) can render
 * a consistent crumb chain without copying the rendering logic.
 *
 * Hides the first crumb's leading Home icon when there are zero crumbs,
 * and marks the last crumb with `aria-current="page"`.
 */
export function Breadcrumbs({
  crumbs,
  variant = "default",
  className = "",
}: BreadcrumbsProps) {
  if (!crumbs || crumbs.length === 0) return null;

  const colorClass =
    variant === "onDark"
      ? "text-white/90"
      : "text-muted-foreground";

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs md:text-sm ${colorClass}`}
      >
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li
              key={`${i}-${c.label}`}
              className="flex items-center gap-1.5"
            >
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
              )}
              {isLast || !c.href ? (
                <span
                  className="font-medium inline-flex items-center gap-1"
                  aria-current={isLast ? "page" : undefined}
                >
                  {i === 0 && (
                    <Home className="h-3.5 w-3.5 opacity-90" aria-hidden="true" />
                  )}
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="inline-flex items-center gap-1 hover:underline underline-offset-4 decoration-1"
                >
                  {i === 0 && (
                    <Home className="h-3.5 w-3.5 opacity-90" aria-hidden="true" />
                  )}
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
