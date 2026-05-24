import React from "react";
import { PageLayoutRenderer } from "@/themes/default/templates/page/PageLayoutRenderer";
import { SectionRenderer, getProcessedSections } from "../section";

interface HomePageProps {
  tenantId?: string;
  currentLanguage?: "en" | "mm";
  homePage?: any;
  sections?: any[];
}

/**
 * um1sf Home Page — rendered from real DB content.
 *
 * Two paths:
 *   1. **Layout-tree page** (`homePage.layout` carries containers).
 *      Renders via `PageLayoutRenderer`, which walks the
 *      builder tree and hands each section to um1sf's
 *      `SectionRenderer`.
 *   2. **Legacy flat sections** (`sections` prop populated). Sorted
 *      and filtered by `getProcessedSections`, then handed to the
 *      same `SectionRenderer`.
 *
 * The previous placeholder fallback (`UM1_HOME_DUMMY`) lives in
 * `data/home_backup.ts` for reference but is no longer wired in.
 */
export async function HomePage({
  currentLanguage = "en",
  homePage,
  sections,
}: HomePageProps) {
  const hasLayoutTree =
    !!homePage?.layout?.containers?.length &&
    homePage.layout.containers.some(
      (c: any) => Array.isArray(c?.rows) && c.rows.length > 0,
    );

  // Layout-tree path. PageLayoutRenderer accepts the resolved
  // `allSections` list and dispatches each `sectionRef.sectionId`
  // through um1sf's overridden SectionRenderer (because we render
  // its <SectionRenderer> as the default for unknown shapes — the
  // default `PageLayoutRenderer` already imports SectionRenderer
  // from "../section", which under um1sf resolves to the um1sf
  // dispatcher because of how the theme entry is wired).
  if (hasLayoutTree) {
    return (
      <div className="w-full">
        <PageLayoutRenderer
          layout={homePage.layout}
          allSections={(sections ?? []) as any[]}
          fallbackSections={(sections ?? []) as any[]}
          currentLanguage={currentLanguage}
          // Hand the um1sf-themed dispatcher down — without this,
          // PageLayoutRenderer would fall back to the default theme's
          // SectionRenderer, which doesn't carry um1sf's per-type
          // overrides (Stats editorial style, FeatureList variants, etc.).
          RendererComponent={SectionRenderer}
          // Zebra-band only on the home page — content pages stay flat.
          striped
        />
      </div>
    );
  }

  // Legacy flat-sections path.
  const list = Array.isArray(sections) ? sections : [];
  if (list.length === 0) {
    return (
      <div className="w-full">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-semibold mb-2">No content yet</h1>
          <p className="text-muted-foreground">
            The home page hasn't been authored. Add sections in the admin to
            see them here.
          </p>
        </div>
      </div>
    );
  }

  const processed = getProcessedSections(list);
  return (
    <div className="w-full">
      <SectionRenderer sections={processed} currentLanguage={currentLanguage} />
    </div>
  );
}

export default HomePage;
