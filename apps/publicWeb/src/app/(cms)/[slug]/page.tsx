import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getPageBySlug, getPageSections, getSectionsByLayout } from "@repo/page";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { resolvePageLayout } from "@/themes/default/lib/template-resolver";
import { buildContentMetadata } from "@/themes/default/lib/seo-metadata";
import { ErrorPage } from "../../../feature-components/error";

// Force this page to be dynamic since it accesses runtime headers
export const dynamic = "force-dynamic";

interface SlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Per-route SEO metadata for content pages. Falls back to the page's
 * own title/excerpt when the author hasn't filled the meta fields.
 * Empty/failed fetch leaves the parent layout's metadata in place.
 */
export async function generateMetadata({
  params,
}: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const language = (middleware?.language as "en" | "mm") || "en";
  const page = await getPageBySlug(slug).catch(() => null);
  return buildContentMetadata(page as any, {
    language,
    fallbackTitle: slug,
    ogType: "website",
  });
}

/**
 * Dynamic content-page route.
 *
 * Mirrors `SafeHomePage` for non-home pages: resolves the active
 * theme from settings, fetches page + sections + effective layout
 * upstream, then dispatches to the active theme's `ContentPage`.
 * Both default and um1sf ContentPage components share the same
 * `{ page, sections, currentLanguage }` prop shape.
 */
export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;

  try {
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;
    const currentLanguage = middlewareData.language as "en" | "mm";

    if (!tenantId) {
      return (
        <ErrorPage
          type="critical"
          title="Configuration Error"
          message="Unable to determine tenant configuration. Please check your setup."
          showRetry={false}
        />
      );
    }

    // Resolve the active theme — Settings.themeName is the source of
    // truth; unregistered values fall back to 'default'.
    let themeName: ThemeName = "default";
    try {
      const contentSettings = await getContentSettings(tenantId);
      const candidate = (contentSettings as any)?.themeName;
      if (candidate && isKnownTheme(candidate)) {
        themeName = candidate as ThemeName;
      }
    } catch (settingsError) {
      console.warn(
        "SlugPage: failed to resolve theme from settings, using default",
        settingsError,
      );
    }
    const { ContentPage } = getThemeTemplates(themeName);

    // Fetch the page first so we know what layout shape to walk.
    const page = await getPageBySlug(slug).catch(() => null);

    // Slug doesn't resolve to a real page → 404. Without this the
    // catch-all renders an empty ContentPage instead of the
    // framework's not-found.tsx, masking broken/typo links.
    if (!page) {
      notFound();
    }

    // Resolve effective layout: prefer page.layout, fall back to
    // template.layout (wrapper-mode pages have an empty layout and
    // a templateId pointing at the wrapping template).
    const effectiveLayout = await resolvePageLayout(page as any);

    // Fetch sections from the *effective* layout. If the page is
    // wrapper-mode (page.layout empty), `getPageSections(slug)`
    // would walk only the page's empty layout and miss the
    // template's section refs — so when an effective layout exists,
    // walk that instead. Falls back to the slug-based fetcher for
    // legacy flat-sections pages with no layout tree at all.
    const sections = effectiveLayout
      ? await getSectionsByLayout(effectiveLayout).catch(() => [] as any[])
      : await getPageSections(slug).catch(() => [] as any[]);

    // Merge effective layout back onto the page so ContentPage
    // doesn't need a second resolution pass.
    const pageWithLayout = page
      ? ({
          ...page,
          layout: effectiveLayout ?? (page as any).layout,
        } as any)
      : null;

    // Build a `Home → <Page title>` crumb chain. Pages-as-posts that
    // sit under a parent could grow a longer chain in the future by
    // walking `parentId`; for now we keep it two-deep which matches
    // what publicWeb has historically shown.
    const titleLabel =
      pageWithLayout?.title?.[currentLanguage] ||
      pageWithLayout?.title?.en ||
      slug;
    const crumbs = [
      { label: currentLanguage === "mm" ? "ပင်မ" : "Home", href: "/" },
      { label: titleLabel },
    ];

    return (
      <ContentPage
        slug={slug}
        tenantId={tenantId}
        currentLanguage={currentLanguage}
        page={pageWithLayout}
        sections={sections || []}
        crumbs={crumbs}
      />
    );
  } catch (error: any) {
    // Re-throw special Next.js navigation errors (notFound, redirect)
    // so the framework can render not-found.tsx or handle the redirect.
    // Without this, the catch swallows `notFound()`'s internal throw
    // and renders our generic ErrorPage with the framework code in
    // debugInfo. Next.js 15+ uses `NEXT_HTTP_ERROR_FALLBACK;<status>`
    // as the digest; older versions used `NEXT_NOT_FOUND`. Cover both.
    const digest = typeof error?.digest === "string" ? error.digest : "";
    const message = typeof error?.message === "string" ? error.message : "";
    if (
      digest.startsWith("NEXT_NOT_FOUND") ||
      digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") ||
      digest.startsWith("NEXT_REDIRECT") ||
      message.startsWith("NEXT_HTTP_ERROR_FALLBACK") ||
      message === "NEXT_NOT_FOUND"
    ) {
      throw error;
    }
    console.error("Error in SlugPage:", error);

    return (
      <ErrorPage
        type="page"
        title="Error Loading Page"
        message={`There was an error loading the page "${slug}". Please try refreshing the page or contact support if the problem persists.`}
        debugInfo={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
