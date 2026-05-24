import React from "react";
import { redirect } from "next/navigation";
import { getPageSections, getSectionsByLayout } from "@repo/page";
import { getContentSettings } from "@repo/content";
import { isKnownTheme } from "@repo/types";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getThemeTemplates, type ThemeName } from "@/themes";
import { resolvePageLayout } from "@/themes/default/lib/template-resolver";
import { getDepartmentBySlug, getDeptHomePage } from "./_lib/dept-fetch";
import { DeptComingSoon } from "./_components/DeptComingSoon";

/**
 * Department landing page.
 *
 * Flow:
 *   1. Resolve dept by URL slug.
 *   2. If dept exists AND has a published Post with
 *      `isHomePage = true`, render via the active theme's
 *      `HomePage` template (same chain `SafeHomePage` uses for the
 *      org home).
 *   3. Otherwise render the `DeptComingSoon` placeholder.
 *
 * The previous client-side debug page (tenant-info + request-info
 * cards) is gone. That UI was useful while wiring the multi-tenant
 * middleware but is inappropriate for public production traffic.
 *
 * Fetch failures of CRITICAL data (gateway down, content service
 * down) redirect to the friendly `/error/service-unavailable` page
 * — matches the org-level home behaviour from `SafeHomePage`.
 */

interface DeptPageProps {
  params: Promise<{ dept: string }>;
}

function redirectToServiceUnavailable(reason: string, message?: string): never {
  const params = new URLSearchParams();
  params.set("code", reason);
  if (message) params.set("message", message);
  redirect(`/error/service-unavailable?${params.toString()}`);
}

function pickMultiLang(
  raw: unknown,
  language: "en" | "mm",
): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw.trim() || null;
  if (typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const v =
      (typeof r[language] === "string" && (r[language] as string)) ||
      (typeof r.en === "string" && (r.en as string)) ||
      (typeof r.mm === "string" && (r.mm as string)) ||
      null;
    return v ? v.trim() || null : null;
  }
  return null;
}

/**
 * Pick the best human-readable label for a department by walking
 * a priority list of fields. The Department schema persists
 * `displayName` (multi-lang) + `fullName` (plain) + `shortName`
 * (plain); some legacy / external tenants may only set the plain
 * fields. The slug is the last-resort fallback so the page always
 * renders something instead of showing "undefined".
 */
function pickDeptLabel(
  dept: { displayName?: unknown; fullName?: unknown; name?: unknown } | null,
  language: "en" | "mm",
  fallbackSlug: string,
): string {
  if (!dept) return fallbackSlug;
  return (
    pickMultiLang(dept.displayName, language) ||
    pickMultiLang(dept.name, language) ||
    (typeof dept.fullName === "string" && dept.fullName.trim()
      ? dept.fullName.trim()
      : null) ||
    fallbackSlug
  );
}

export default async function DepartmentLandingPage({ params }: DeptPageProps) {
  const { dept: deptSlug } = await params;

  try {
    // ── 1. Resolve tenant / theme context ───────────────────────
    const middleware = await getMiddlewareDataFromHeaders();
    const tenantId: string | undefined = (middleware as any)?.tenantId;
    const currentLanguage = ((middleware as any)?.language ?? "en") as
      | "en"
      | "mm";

    let themeName: ThemeName = "default";
    if (tenantId) {
      try {
        const contentSettings = await getContentSettings(tenantId);
        const candidate = (contentSettings as any)?.themeName;
        if (candidate && isKnownTheme(candidate)) themeName = candidate;
      } catch (settingsError) {
        // Non-fatal — fall through with default theme.
        console.warn(
          "DepartmentLandingPage: theme resolve failed, using default",
          settingsError,
        );
      }
    }
    const { HomePage } = getThemeTemplates(themeName);

    // ── 2. Resolve the department ───────────────────────────────
    const dept = await getDepartmentBySlug(deptSlug);
    const deptLabel = pickDeptLabel(
      dept as any,
      currentLanguage,
      deptSlug,
    );

    // Department doesn't exist (or backend couldn't tell us) → show
    // the Coming Soon placeholder. Avoids a 404 page for slugs that
    // are valid but haven't been seeded yet, which is the most
    // common state during early rollout.
    if (!dept?._id) {
      return (
        <DeptComingSoon deptLabel={deptLabel} deptSlug={deptSlug} />
      );
    }

    // ── 3. Look up the dept's home page ─────────────────────────
    const homePage = await getDeptHomePage(dept._id);
    if (!homePage) {
      return (
        <DeptComingSoon deptLabel={deptLabel} deptSlug={deptSlug} />
      );
    }

    // ── 4. Render the dept home via the standard theme template ─
    // Same layout-resolution + section-fetch chain `SafeHomePage`
    // uses for the org home, so wrapper-mode pages (with a
    // `templateId` pointing at an authored Template) also work.
    const effectiveLayout = await resolvePageLayout(homePage as any);
    const sections = effectiveLayout
      ? await getSectionsByLayout(effectiveLayout).catch(() => [] as any[])
      : await getPageSections(homePage.slug as string).catch(
          () => [] as any[],
        );

    const homePageWithLayout = {
      ...homePage,
      layout: effectiveLayout ?? (homePage as any).layout,
    } as any;

    return (
      <HomePage
        tenantId={tenantId ?? ""}
        currentLanguage={currentLanguage}
        homePage={homePageWithLayout}
        sections={sections || []}
      />
    );
  } catch (error) {
    // Re-throw NEXT_REDIRECT so Next.js completes the redirect.
    if (
      error &&
      typeof error === "object" &&
      (error as any).digest?.startsWith?.("NEXT_REDIRECT")
    ) {
      throw error;
    }
    // Any other backend / network failure → friendly error page,
    // same UX as the org home's failure path.
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DepartmentLandingPage: render failed", error);
    redirectToServiceUnavailable("CONTENT_SERVICE_UNAVAILABLE", message);
  }
}
