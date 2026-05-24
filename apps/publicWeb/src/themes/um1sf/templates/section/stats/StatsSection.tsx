import React from "react";
import type {
  SectionProps,
  StatsSectionData,
} from "@/themes/default/templates/section/types";
import { getLocalizedText } from "@/themes/default/templates/section/utils";

/**
 * um1sf Stats — editorial-style counter section.
 *
 * Mirrors the original `um1sf-stats` featureList layout from the demo
 * data (`home_backup.ts`):
 *   - Section header: eyebrow + serif headline + sans description,
 *     left-aligned in a `max-w-3xl` block.
 *   - Container: `max-w-7xl` with the standard horizontal padding and
 *     `py-16 md:py-20` vertical rhythm.
 *   - Counter cards: `border-t-4` cardinal-red top accent, big serif
 *     numerals (3rem→6rem), small uppercase sans label.
 *
 * The per-counter colour overrides on the new `stats` schema
 * (bgColor / textColor / iconColor) are intentionally ignored here —
 * the editorial design owns the colour palette via theme tokens, and
 * letting authors paint individual cards would break the visual
 * rhythm the demo established.
 */
export function StatsSection({
  section,
  currentLanguage = "en",
}: SectionProps<StatsSectionData>) {
  const headline = getLocalizedText(section.headline, currentLanguage);
  const description = getLocalizedText(section.description, currentLanguage);
  const counters = section.counters ?? [];
  // Coerce to number — admin forms persist `columns` as a string enum
  // for FeatureList; Stats currently stores numbers but treat both
  // shapes defensively so a future schema change doesn't break this
  // grid silently (cf. campus-section "3 col rendered as 4" bug).
  const colsRaw = section.columns ?? 3;
  const cols = Number(colsRaw) || 3;

  if (counters.length === 0) return null;

  // Match the demo's responsive grid breakpoints.
  const gridCols =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-1 md:grid-cols-2"
        : cols === 3
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          : "grid-cols-2 md:grid-cols-4";

  return (
    <section
      // No `bg-background` — the parent SectionRenderer wraps each
      // section in a zebra-band wrapper and a solid bg here would
      // cover that band. Inherit the wrapper bg instead.
      className="w-full"
      data-section-id={section._id}
      data-section-type="stats"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        {(headline || description) && (
          <div className="mb-10 md:mb-14 max-w-3xl">
            <div className="um1sf-section-eyebrow mb-3">
              {currentLanguage === "mm" ? "ကဏ္ဍ" : "Section"}
            </div>
            {headline && (
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {headline}
              </h2>
            )}
            {description && (
              <p
                className="mt-3 text-base md:text-lg"
                style={{
                  color: "var(--color-muted-foreground)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        <div className={`grid ${gridCols} gap-8 md:gap-12`}>
          {counters.map((c, idx) => (
            <div
              key={idx}
              className="border-t-4 pt-4"
              style={{ borderTopColor: "var(--color-primary)" }}
            >
              <div
                className="um1sf-stat-number text-4xl md:text-5xl lg:text-6xl"
                style={{ color: "var(--color-foreground)" }}
              >
                {c.count}
              </div>
              <div
                className="mt-2 text-sm uppercase tracking-wider"
                style={{
                  color: "var(--color-muted-foreground)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {getLocalizedText(c.title, currentLanguage)}
              </div>
              {c.description && (
                <div
                  className="mt-1 text-xs"
                  style={{
                    color: "var(--color-muted-foreground)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {getLocalizedText(c.description, currentLanguage)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
