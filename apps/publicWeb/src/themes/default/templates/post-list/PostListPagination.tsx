import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PostListPaginationProps {
  /** 1-indexed current page. */
  page: number;
  /** Total pages (Math.ceil(total / limit)). 0 hides the pager. */
  totalPages: number;
  /** Pathname for the page (e.g. `/post/announcements`). */
  pathname: string;
  /** Existing search params (carries `view`, `limit`, etc.). */
  searchParams: Record<string, string | string[] | undefined>;
  /** Optional max-buttons cap for the middle page links. Default 5. */
  windowSize?: number;
}

/**
 * Link-based pagination — works without JS. Builds an href that
 * preserves all current query params except `page` (which gets
 * replaced or removed for page 1). Renders a windowed range of
 * page numbers around the current page with ellipses for the gaps,
 * plus Prev/Next chevrons gated on availability.
 */
export function PostListPagination({
  page,
  totalPages,
  pathname,
  searchParams,
  windowSize = 5,
}: PostListPaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (target: number): string => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams || {})) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        for (const vv of v) if (vv !== undefined) sp.append(k, vv);
      } else {
        sp.set(k, v);
      }
    }
    if (target <= 1) sp.delete("page");
    else sp.set("page", String(target));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Window of pages around `page`. Always include first + last.
  const half = Math.floor(windowSize / 2);
  let start = Math.max(2, page - half);
  let end = Math.min(totalPages - 1, page + half);
  if (end - start + 1 < windowSize) {
    if (start === 2) end = Math.min(totalPages - 1, start + windowSize - 1);
    if (end === totalPages - 1)
      start = Math.max(2, end - windowSize + 1);
  }

  const nums: Array<number | "…"> = [1];
  if (start > 2) nums.push("…");
  for (let i = start; i <= end; i++) nums.push(i);
  if (end < totalPages - 1) nums.push("…");
  if (totalPages > 1) nums.push(totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-1"
    >
      <PagerLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        ariaLabel="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PagerLink>

      {nums.map((n, i) =>
        n === "…" ? (
          <span
            key={`gap-${i}`}
            className="inline-flex items-center justify-center min-w-8 h-8 px-2 text-xs"
            style={{ color: "var(--color-muted-foreground)" }}
            aria-hidden
          >
            …
          </span>
        ) : (
          <PagerLink
            key={n}
            href={buildHref(n)}
            active={n === page}
            ariaLabel={`Page ${n}`}
          >
            {n}
          </PagerLink>
        ),
      )}

      <PagerLink
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        ariaLabel="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PagerLink>
    </nav>
  );
}

function PagerLink({
  href,
  active,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        aria-label={ariaLabel}
        className="inline-flex items-center justify-center min-w-8 h-8 px-2 text-sm rounded-md border opacity-40 cursor-not-allowed"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-muted-foreground)",
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className="inline-flex items-center justify-center min-w-8 h-8 px-2 text-sm rounded-md border transition-colors hover:underline underline-offset-2"
      style={{
        borderColor: active
          ? "var(--color-primary)"
          : "var(--color-border)",
        backgroundColor: active
          ? "var(--color-primary)"
          : "transparent",
        color: active
          ? "var(--color-primary-foreground, #fff)"
          : "var(--color-foreground)",
      }}
    >
      {children}
    </Link>
  );
}

export default PostListPagination;
