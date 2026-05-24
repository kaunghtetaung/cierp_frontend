import React from "react";
import { IconComponent } from "@repo/ui/components/icons/IconComponent";
import type { SectionProps, StatsSectionData } from "../types";
import { getLocalizedText } from "../utils";

/**
 * Stats Section — array of big-number counter cards.
 *
 * Mirrors the admin `StatsSectionFormData`: each counter renders an
 * icon + count + title + optional description, with per-card
 * background / text / icon colour overrides. Layout switches between
 * grid (responsive grid of N columns) and row (single horizontal
 * strip). Section-level `headline` and `description` render above the
 * counter row.
 *
 * Falls back to neutral defaults when colour fields are missing so
 * data authored before the colour overrides existed still renders.
 */
export function StatsSection({
  section,
  currentLanguage = "en",
}: SectionProps<StatsSectionData>) {
  const counters = section.counters ?? [];
  const layout = section.layout ?? "grid";
  const columns = section.columns ?? 4;
  const headline = getLocalizedText(section.headline, currentLanguage);
  const description = getLocalizedText(section.description, currentLanguage);

  if (counters.length === 0) return null;

  const gridColsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  const containerClass =
    layout === "row"
      ? "flex flex-wrap justify-center gap-6"
      : `grid gap-6 ${gridColsClass[columns] ?? gridColsClass[4]}`;

  return (
    <section
      className="py-12 md:py-16"
      data-section-id={section._id}
      data-section-type="stats"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {(headline || description) && (
          <header className="text-center mb-10 md:mb-12">
            {headline && (
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                {headline}
              </h2>
            )}
            {description && (
              <p className="mt-3 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground">
                {description}
              </p>
            )}
          </header>
        )}

        <div className={containerClass}>
          {counters.map((c, idx) => {
            const title = getLocalizedText(c.title, currentLanguage);
            const desc = getLocalizedText(c.description, currentLanguage);
            const bg = c.bgColor || "#1e3a8a";
            const text = c.textColor || "#ffffff";
            const iconColor = c.iconColor || c.textColor || "#ffffff";
            return (
              <div
                key={idx}
                className="rounded-xl shadow-md p-6 md:p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: bg, color: text }}
              >
                {c.icon && (
                  <div className="mb-4 inline-flex items-center justify-center h-14 w-14 rounded-full bg-white/10">
                    <IconComponent
                      name={c.icon}
                      size={32}
                      color={iconColor}
                    />
                  </div>
                )}
                <div
                  className="text-3xl md:text-4xl font-extrabold tabular-nums leading-none"
                  style={{ color: text }}
                >
                  {c.count}
                </div>
                {title && (
                  <div
                    className="mt-2 text-sm md:text-base font-semibold"
                    style={{ color: text }}
                  >
                    {title}
                  </div>
                )}
                {desc && (
                  <div
                    className="mt-1 text-xs md:text-sm opacity-80"
                    style={{ color: text }}
                  >
                    {desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
