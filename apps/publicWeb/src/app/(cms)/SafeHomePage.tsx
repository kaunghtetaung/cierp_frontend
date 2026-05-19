import React, { cache } from "react";
import { redirect } from "next/navigation";
import { getPageBySlug, getPageSections, getSectionsByLayout } from "@repo/page";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { resolvePageLayout } from "@/themes/default/lib/template-resolver";
import { ErrorPage } from "../../feature-components/error";

// Per-request dedup only. Avoid Next's `unstable_cache` here: the underlying
// data services (getPageBySlug, getContentSettings, ...) read request
// headers (tenantId, auth) via `headers()`, which throws inside an
// `unstable_cache` callback. Cross-request caching is handled by the
// backend Redis layer instead (see content service repositories).
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

    // Resolve the active theme so home content uses the right templates.
    // Settings.themeName is the source of truth; any unregistered value
    // falls back to 'default'.
    let themeName: ThemeName = "default";
    try {
      const contentSettings = await getContentSettings(tenantId);
      const candidate = (contentSettings as any)?.themeName;
      if (candidate && isKnownTheme(candidate)) {
        themeName = candidate as ThemeName;
      }
    } catch {
      // Theme resolution failure is non-fatal — render with default.
    }

    const { HomePage } = getThemeTemplates(themeName);

    // Fetch the home page. Network errors propagate to the outer catch
    // so they redirect to /error/service-unavailable; the null path
    // (legitimate "no home configured") falls through to the HomePage
    // template's empty state.
    const homePage = await getPageBySlug("home");

    // Resolve effective layout — prefers `homePage.layout`, falls back to
    // the assigned authored Template (`homePage.templateId`) when the
    // page itself doesn't carry a layout. Returns `null` for pages with
    // neither, so the renderer falls through to flat sectionRefs.
    const effectiveLayout = await resolvePageLayout(homePage as any);

    // Fetch sections from the *effective* layout so wrapper-mode pages
    // (page.layout empty, layout lives on the template) don't end up
    // with an empty sections list.
    const sections = effectiveLayout
      ? await getSectionsByLayout(effectiveLayout).catch(() => [] as any[])
      : await getPageSections("home").catch(() => [] as any[]);

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
    // `redirect()` throws a NEXT_REDIRECT signal — DO NOT swallow it.
    // Re-throw so Next can complete the redirect; otherwise it falls
    // through and we'd render an inline ErrorPage instead.
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

    // Any backend fetch failure funnels to the same friendly page.
    redirectToServiceUnavailable("CONTENT_SERVICE_UNAVAILABLE", errorMessage);
  }
}
