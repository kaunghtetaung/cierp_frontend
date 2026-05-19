import React, { cache } from "react";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { getPageBySlug, getPageSections, getSectionsByLayout } from "@repo/page";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { resolvePageLayout } from "@/themes/default/lib/template-resolver";
import { ErrorPage } from "../../feature-components/error";

// Cache window for the home page's per-tenant data fetches. Pure ISR on the
// route itself doesn't work because SafeHomePage reads headers() to resolve
// the tenant, which forces dynamic rendering. Instead we cache the data
// fetches themselves keyed by tenantId+language so cross-request hits skip
// the 4 backend round trips. Backend Redis cache sits behind this for an
// additional layer.
const HOMEPAGE_CACHE_REVALIDATE_SEC = 600; // 10 minutes

// Per-tenant cached fetch for the home page payload. Returns the same shape
// the inline implementation used. Network errors propagate to the caller.
const getHomePageData = (tenantId: string, language: string) =>
  unstable_cache(
    async () => {
      const homePage = await getPageBySlug("home");
      const effectiveLayout = await resolvePageLayout(homePage as any);
      const sections = effectiveLayout
        ? await getSectionsByLayout(effectiveLayout).catch(() => [] as any[])
        : await getPageSections("home").catch(() => [] as any[]);
      return { homePage, effectiveLayout, sections };
    },
    [`safe-home-page`, tenantId, language],
    {
      revalidate: HOMEPAGE_CACHE_REVALIDATE_SEC,
      tags: [`home:${tenantId}`, `page:${tenantId}`],
    },
  )();

// Resolve the active theme name. Cached per tenant — settings rarely change.
const getThemeNameCached = (tenantId: string) =>
  unstable_cache(
    async (): Promise<ThemeName> => {
      try {
        const contentSettings = await getContentSettings(tenantId);
        const candidate = (contentSettings as any)?.themeName;
        if (candidate && isKnownTheme(candidate)) {
          return candidate as ThemeName;
        }
      } catch {
        // fall through to default
      }
      return "default";
    },
    [`safe-home-theme`, tenantId],
    {
      revalidate: HOMEPAGE_CACHE_REVALIDATE_SEC,
      tags: [`settings:${tenantId}`],
    },
  )();

// Per-request dedup for the middleware-headers lookup. If two RSC children
// also call this within the same request, React's cache() coalesces.
const getRequestMiddlewareData = cache(() => getMiddlewareDataFromHeaders());

/**
 * Redirect helper — sends the user to the friendly
 * service-unavailable page with diagnostic context in the query
 * string. `redirect()` throws a Next.js `NEXT_REDIRECT` error that
 * the framework catches at the route boundary; the caller never
 * returns from this call.
 */
function redirectToServiceUnavailable(
  reason: string,
  message?: string,
): never {
  const params = new URLSearchParams();
  params.set("code", reason);
  if (message) params.set("message", message);
  redirect(`/error/service-unavailable?${params.toString()}`);
}

/**
 * Safe page wrapper that handles service errors gracefully
 */
export default async function SafeHomePage() {
  try {
    const middlewareData = await getRequestMiddlewareData();
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

    // Resolve theme + home-page data in parallel; both are tenant-cached so
    // a warm cache returns in microseconds.
    const [themeName, homePageData] = await Promise.all([
      getThemeNameCached(tenantId),
      getHomePageData(tenantId, currentLanguage),
    ]);

    const { HomePage } = getThemeTemplates(themeName);
    const { homePage, effectiveLayout, sections } = homePageData;

    const homePageWithLayout = homePage
      ? ({ ...homePage, layout: effectiveLayout ?? (homePage as any).layout } as any)
      : homePage;

    return (
      <HomePage
        tenantId={tenantId}
        currentLanguage={currentLanguage}
        homePage={homePageWithLayout}
        sections={sections || []}
      />
    );
  } catch (error) {
    // `redirect()` throws a NEXT_REDIRECT signal — DO NOT swallow
    // it. Re-throw so Next can complete the redirect; otherwise it
    // falls through and we'd render an inline ErrorPage instead.
    if (
      error &&
      typeof error === "object" &&
      (error as any).digest?.startsWith?.("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("SafeHomePage: Service error detected:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Any backend fetch failure (gateway up, content service down,
    // gateway down, timeout, 5xx) all funnel to the same friendly
    // page. Previously a "gateway" string-match branch and a
    // generic ErrorPage rendered inline fragments — the user saw
    // a broken header + "Page Load Error" card instead of a clean
    // error UI. Single redirect target gives consistent UX with
    // the middleware-level errors.
    redirectToServiceUnavailable("CONTENT_SERVICE_UNAVAILABLE", errorMessage);
  }
}
