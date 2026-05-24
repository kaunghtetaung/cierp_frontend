import React from "react";
import { SectionRenderer } from "../section";
import type { SectionData } from "../section/types";

/**
 * Layout tree shape — kept loose / `any`-leaning here so the
 * publicWeb side doesn't need to import admin types. The admin
 * editor (`PageLayoutBuilder`) is the source of truth; this renderer
 * just walks whatever shape lands in `homePage.layout`.
 *
 * A column is *either* a leaf carrying `sectionRefs` *or* a branch
 * carrying nested `rows` (sub-rows for further subdivision). When
 * both are present the renderer prefers `rows` (treats it as a
 * branch) — the admin builder enforces mutual exclusivity but the
 * renderer is defensive for legacy data.
 */
interface PageLayoutColumnRef {
  sectionId?: string | null;
  sectionData?: Record<string, unknown> | null;
  order: number;
  isVisible?: boolean;
}
interface PageLayoutColumn {
  id: string;
  width: number; // 1-12
  sectionRefs?: PageLayoutColumnRef[];
  rows?: PageLayoutRow[];
}
interface PageLayoutRow {
  id: string;
  settings?: {
    mobileStack?: boolean;
    gap?: string;
  };
  columns: PageLayoutColumn[];
}
interface PageLayoutContainer {
  id: string;
  settings?: {
    maxWidth?: "screen-sm" | "screen-md" | "screen-lg" | "screen-xl" | "full";
    padding?: string;
    background?: string;
  };
  rows: PageLayoutRow[];
}
interface PageLayout {
  containers: PageLayoutContainer[];
}

interface PageLayoutRendererProps {
  /** Page-builder tree from `Post.layout`. */
  layout?: PageLayout;
  /** All section docs the page references (resolved by the route). */
  allSections: SectionData[];
  /** Legacy flat list — used as fallback when `layout` is empty. */
  fallbackSections?: SectionData[];
  currentLanguage?: "en" | "mm";
  /**
   * Theme-supplied section renderer. Lets per-tenant themes (e.g.
   * `um1sf`) inject their own dispatcher so per-type overrides
   * (Stats, FeatureList, …) can render in the page-builder tree.
   * Defaults to the default-theme `SectionRenderer` import.
   */
  RendererComponent?: React.ComponentType<{
    sections: SectionData[];
    currentLanguage?: "en" | "mm";
  }>;
  /**
   * When `true`, alternates each top-level row's background between
   * the page base and a subtle muted tint (zebra stripe). Useful on
   * the home page where adjacent marketing sections (Stats, Recent
   * News, etc.) benefit from a visual divider band.
   *
   * Default `false` — content pages (about, faculty, post layout
   * fallbacks) render with a flat background so the editorial
   * rhythm comes from the content alone. The `HomePage` template
   * opts in explicitly.
   */
  striped?: boolean;
}

const COL_SPAN_CLASS: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};

const MAX_WIDTH_CLASS: Record<string, string> = {
  "screen-sm": "max-w-screen-sm",
  "screen-md": "max-w-screen-md",
  "screen-lg": "max-w-screen-lg",
  "screen-xl": "max-w-screen-xl",
  full: "max-w-full",
};

/**
 * Renders the page-builder tree (`containers > rows > columns >
 * (sectionRefs | rows)`). Falls through to a single-column render of
 * `fallbackSections` when the page hasn't been authored with the
 * builder yet — keeps existing flat-`sectionRefs[]` pages rendering.
 *
 * Per-column section references are resolved against `allSections`
 * (the route fetches them server-side and passes the full set in).
 * Inline `sectionData` overrides the resolved doc, matching the
 * existing flat-mode behaviour. Columns may also nest sub-rows; the
 * renderer recurses through them and reuses the same row/column
 * grid logic at every depth.
 */
export function PageLayoutRenderer({
  layout,
  allSections,
  fallbackSections,
  currentLanguage = "en",
  RendererComponent = SectionRenderer,
  striped = false,
}: PageLayoutRendererProps) {
  const hasTree =
    !!layout?.containers?.length &&
    layout.containers.some((c) => c.rows.length > 0);

  if (!hasTree) {
    // Fallback — flat sectionRefs[] pages render as before.
    if (!fallbackSections || fallbackSections.length === 0) return null;
    return (
      <RendererComponent
        sections={fallbackSections}
        currentLanguage={currentLanguage}
      />
    );
  }

  const sectionsById = new Map(allSections.map((s) => [s._id, s]));

  // Section types that paint their own full-bleed chrome and don't
  // want the band wrapper's padding/zebra around them — wrapping them
  // pushes the hero down with awkward whitespace and lets the alt-bg
  // peek through their edges. Rows whose ONLY sections are full-bleed
  // types skip the row band entirely.
  const FULL_BLEED_TYPES = new Set([
    "hero",
    "carousel",
    "callToAction",
    "cta",
  ]);
  const isFullBleedRow = (row: PageLayoutRow): boolean => {
    const types: string[] = [];
    for (const col of row.columns ?? []) {
      // Sub-rows make this a branch — never full-bleed
      if (col.rows && col.rows.length > 0) return false;
      for (const ref of col.sectionRefs ?? []) {
        const inlineType = (ref as any)?.sectionData?.type as
          | string
          | undefined;
        if (inlineType) {
          types.push(inlineType);
          continue;
        }
        const resolved = ref.sectionId
          ? sectionsById.get(String(ref.sectionId))
          : null;
        if (resolved) types.push((resolved as any).type as string);
      }
    }
    return types.length > 0 && types.every((t) => FULL_BLEED_TYPES.has(t));
  };

  return (
    <>
      {layout!.containers.map((container) => {
        // Only apply horizontal padding + max-width when the container
        // is explicitly constrained. Default ("full") leaves each
        // section to manage its own width — Hero / Carousel can go
        // edge-to-edge while FeatureList / Stats still center within
        // their own internal `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
        const maxWidth = container.settings?.maxWidth ?? "full";
        const isConstrained = maxWidth !== "full";
        const containerClass = isConstrained
          ? `mx-auto px-4 sm:px-6 lg:px-8 ${
              MAX_WIDTH_CLASS[maxWidth] ?? ""
            }`
          : "w-full";

        // An explicit `container.settings.background` wraps the
        // whole container in that colour and disables row-level
        // zebra (author chose a deliberate band, don't fight it).
        const explicitBg = (container.settings as any)?.background as
          | string
          | undefined;
        const containerStyle: React.CSSProperties = explicitBg
          ? { backgroundColor: explicitBg }
          : {};

        return (
          <div key={container.id} className="w-full" style={containerStyle}>
            {/* Each row becomes its own full-bleed band, alternating
                 white / muted-tint by row index. Bands are flush
                 (no gap between them) so the alternating colours
                 themselves carry the visual separation between
                 sections. Inner vertical padding gives each section
                 breathing room within its band. */}
            {container.rows.map((row, rowIdx) => {
              const fullBleed = isFullBleedRow(row);
              // Zebra parity: even rows (0, 2, 4 …) get the alt
              // (gray) band, odd rows stay on the page base (white).
              // Starts gray so the first row — typically a hero —
              // reads as a deliberate band rather than blending into
              // the page background.
              //
              // Only activates when `striped` is set by the caller
              // (home page opts in). Content pages (about, faculty,
              // post layouts) render with a flat background.
              // Explicit container backgrounds also disable zebra.
              const isAltBand =
                striped && !explicitBg && rowIdx % 2 === 0;
              const bandStyle: React.CSSProperties = isAltBand
                ? {
                    backgroundColor:
                      "var(--color-section-alt-bg, rgba(0,0,0,0.04))",
                  }
                : {};

              // Full-bleed rows (hero/carousel/cta) keep the band
              // colour underneath but skip the inner max-width
              // container + padding — they paint their own chrome
              // edge-to-edge on top of the band.
              if (fullBleed) {
                return (
                  <div
                    key={row.id}
                    className="w-full"
                    style={bandStyle}
                    data-section-band={isAltBand ? "alt" : "base"}
                    data-section-bleed="full"
                  >
                    <RowRenderer
                      row={row}
                      sectionsById={sectionsById}
                      currentLanguage={currentLanguage}
                      RendererComponent={RendererComponent}
                    />
                  </div>
                );
              }
              return (
                <div
                  key={row.id}
                  className="w-full"
                  style={bandStyle}
                  data-section-band={isAltBand ? "alt" : "base"}
                >
                  <div className={containerClass}>
                    {/* Vertical padding lives inside each section
                         component (Stats, FeatureList, CategoryList,
                         etc. all manage their own `py-*`), so the
                         band wrapper here only carries the
                         max-width / horizontal padding. Doubling the
                         padding produced ~64px of dead space at the
                         top/bottom of every section. */}
                    <RowRenderer
                      row={row}
                      sectionsById={sectionsById}
                      currentLanguage={currentLanguage}
                      RendererComponent={RendererComponent}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

interface RowRendererProps {
  row: PageLayoutRow;
  sectionsById: Map<string, SectionData>;
  currentLanguage: "en" | "mm";
  RendererComponent: React.ComponentType<{
    sections: SectionData[];
    currentLanguage?: "en" | "mm";
  }>;
}

function RowRenderer({
  row,
  sectionsById,
  currentLanguage,
  RendererComponent,
}: RowRendererProps) {
  const stack = row.settings?.mobileStack !== false;
  const gap = row.settings?.gap ?? "gap-6";
  return (
    <div
      className={`grid ${
        stack ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-12"
      } ${gap}`}
    >
      {row.columns.map((col) => (
        <ColumnRenderer
          key={col.id}
          col={col}
          sectionsById={sectionsById}
          currentLanguage={currentLanguage}
          RendererComponent={RendererComponent}
        />
      ))}
    </div>
  );
}

interface ColumnRendererProps {
  col: PageLayoutColumn;
  sectionsById: Map<string, SectionData>;
  currentLanguage: "en" | "mm";
  RendererComponent: React.ComponentType<{
    sections: SectionData[];
    currentLanguage?: "en" | "mm";
  }>;
}

function ColumnRenderer({
  col,
  sectionsById,
  currentLanguage,
  RendererComponent,
}: ColumnRendererProps) {
  const span = COL_SPAN_CLASS[col.width] ?? "lg:col-span-12";

  // Branch — recurse into sub-rows. Prefer `rows` over `sectionRefs`
  // when both are populated (defensive — admin enforces mutual
  // exclusivity but legacy data may carry both).
  if (col.rows && col.rows.length > 0) {
    return (
      <div className={span}>
        {/* Sub-rows in the same column (e.g. sidebar widgets stacked
             vertically) need spacing so widgets don't run into each
             other. Tighter than top-level row spacing because
             stacked widgets read better with closer rhythm. */}
        <div className="space-y-6 md:space-y-8">
          {col.rows.map((subRow) => (
            <RowRenderer
              key={subRow.id}
              row={subRow}
              sectionsById={sectionsById}
              currentLanguage={currentLanguage}
              RendererComponent={RendererComponent}
            />
          ))}
        </div>
      </div>
    );
  }

  // Leaf — resolve sections.
  const refs = (col.sectionRefs ?? [])
    .filter((r) => r.isVisible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const colSections: SectionData[] = refs
    .map((r) => {
      if (r.sectionId) {
        const resolved = sectionsById.get(String(r.sectionId));
        if (!resolved) return null;
        return r.sectionData
          ? ({ ...resolved, ...r.sectionData } as SectionData)
          : resolved;
      }
      if (r.sectionData) {
        return r.sectionData as unknown as SectionData;
      }
      return null;
    })
    .filter((s): s is SectionData => s !== null);

  return (
    <div className={span}>
      {colSections.length > 0 ? (
        <RendererComponent
          sections={colSections}
          currentLanguage={currentLanguage}
        />
      ) : null}
    </div>
  );
}

export default PageLayoutRenderer;
