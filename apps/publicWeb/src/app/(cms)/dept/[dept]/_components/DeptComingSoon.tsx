import React from "react";

/**
 * Public placeholder rendered when a department has no home page
 * authored yet. Shown in place of the legacy "Tenant Information"
 * debug card so production visitors see a friendly message instead
 * of internal config.
 *
 * Once a content author creates a Post with
 *   { postTypeSlug: 'page', departmentId, isHomePage: true,
 *     status: 'Published' }
 * the dept route picks it up automatically via `getDeptHomePage`
 * and this fallback stops rendering for that dept.
 */

interface Props {
  /** Department display name (en/mm) when we managed to resolve the
   *  dept; falls back to the URL slug otherwise. */
  deptLabel: string;
  /** URL slug, included as a small monospace footer for context. */
  deptSlug: string;
  /** Tenant display name (e.g. "University of Medicine 1, Yangon")
   *  — anchors the page to the parent org. Optional. */
  tenantLabel?: string;
}

export function DeptComingSoon({ deptLabel, deptSlug, tenantLabel }: Props) {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* Brand mark — uses the same primary-blue accent the rest
            of the public site is themed around. Inline SVG so the
            page renders without any image dependency. */}
        <svg
          className="mx-auto mb-8 h-20 w-20 text-primary"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="14"
            y="14"
            width="68"
            height="68"
            rx="14"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="2"
          />
          <path
            d="M30 60V36l18 12 18-12v24"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Coming soon
        </p>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          {deptLabel}
        </h1>

        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          The page for this department is being prepared. Please check
          back shortly — content will appear here once it&rsquo;s
          published by an administrator.
        </p>

        {tenantLabel && (
          <p className="text-sm text-muted-foreground mt-8">
            <span className="opacity-70">Part of</span>{" "}
            <span className="font-medium text-foreground">{tenantLabel}</span>
          </p>
        )}

        <div className="mt-10 inline-flex items-center gap-3">
          <a
            href="/"
            className="inline-flex items-center px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Go to homepage
          </a>
          <span className="font-mono text-xs text-muted-foreground">
            /{deptSlug}
          </span>
        </div>
      </div>
    </main>
  );
}

export default DeptComingSoon;
