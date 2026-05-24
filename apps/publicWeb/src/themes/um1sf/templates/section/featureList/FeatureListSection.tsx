import React from "react";
import Link from "next/link";
import { IconComponent } from "@repo/ui/components/icons";
import type {
  FeatureListSectionData,
  SectionProps,
} from "@/themes/default/templates/section/types";
import { getLocalizedText } from "@/themes/default/templates/section/utils";

/**
 * um1sf FeatureList — handles three modes from a single component:
 *
 *   - "stats" — when `customClasses` includes `'um1sf-stats'`,
 *     renders big-number tiles (serif numerals, sans labels).
 *   - "with-images" — image card grid (used by news + campus life).
 *   - "no-images" — column-style text cards with chevron link
 *     (used by Academics tier list).
 *
 * Mode is inferred so the same backend data shape covers all three.
 */
export function FeatureListSection({
  section,
  currentLanguage = "en",
}: SectionProps<FeatureListSectionData>) {
  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : section.content?.title
      ? getLocalizedText(section.content.title, currentLanguage)
      : "";
  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : section.content?.description
      ? getLocalizedText(section.content.description, currentLanguage)
      : "";
  const features = section.features ?? section.content?.features ?? [];

  // Admin form persists `columns` as the STRING enum '1'..'4' (zod
  // `z.enum(['1','2','3','4'])`); legacy data may store numbers. Coerce
  // to a number once so the strict-equality branches below work for both.
  const colsRaw = section.columns ?? 3;
  const cols = Number(colsRaw) || 3;
  const gridCols =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-1 md:grid-cols-2"
        : cols === 3
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          : "grid-cols-2 md:grid-cols-4";

  const isStatsMode = section.customClasses?.includes("um1sf-stats") ?? false;
  const showImages = section.showImages !== false && !isStatsMode;
  const hasAnyImage = features.some((f: any) => f.image);
  // Icons are an additive enhancement — show them whenever the admin
  // didn't explicitly disable them and at least one item has an icon.
  // Falls back to image when both are present (image wins visually).
  const showIcons = section.showIcons !== false && !isStatsMode;
  const hasAnyIcon = features.some((f: any) => f.icon);

  // Section-wide content alignment — applies to every per-feature
  // card (icon / title / description / button / image-card content)
  // and acts as the DEFAULT for the section header. Default 'left'
  // when the editor hasn't picked one.
  //
  // Per-feature `titleAlign` / `descriptionAlign` / `iconAlign` still
  // override on a single card. The header has its own dedicated
  // `headlineAlign` override so an author can (for example) center
  // the headline while keeping all feature cards left-aligned.
  const contentAlign: "left" | "center" | "right" =
    (section as any).contentAlign === "center" ||
    (section as any).contentAlign === "right"
      ? (section as any).contentAlign
      : "left";
  const headlineAlign: "left" | "center" | "right" =
    (section as any).headlineAlign === "center" ||
    (section as any).headlineAlign === "right" ||
    (section as any).headlineAlign === "left"
      ? (section as any).headlineAlign
      : contentAlign;
  const headerAlignClass =
    headlineAlign === "center"
      ? "mx-auto text-center"
      : headlineAlign === "right"
        ? "ml-auto text-right"
        : "text-left";
  const headlineIcon = (section as any).headlineIcon as string | undefined;
  const headlineIconSize =
    Number((section as any).headlineIconSize) || 32;
  const headlineIconColor =
    (section as any).headlineIconColor || "var(--color-primary)";

  return (
    <section
      // Transparent — see StatsSection note. Wrapping
      // SectionRenderer drives the zebra band bg.
      className="w-full"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        {(headline || description) && (
          <div className={`mb-10 md:mb-14 max-w-3xl ${headerAlignClass}`}>
            <div className="um1sf-section-eyebrow mb-3">
              {currentLanguage === "mm" ? "ကဏ္ဍ" : "Section"}
            </div>
            {headlineIcon && (
              <div
                className={`mb-3 inline-flex ${
                  headlineAlign === "center"
                    ? "justify-center w-full"
                    : headlineAlign === "right"
                      ? "justify-end w-full"
                      : ""
                }`}
                aria-hidden="true"
              >
                <IconComponent
                  name={headlineIcon}
                  size={headlineIconSize}
                  color={headlineIconColor as unknown as string}
                />
              </div>
            )}
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

        {isStatsMode ? (
          // ── Stats mode: big-number tiles ─────────────────────────
          <div className={`grid ${gridCols} gap-8 md:gap-12`}>
            {features.map((f: any, idx: number) => (
              <div
                key={f.id ?? idx}
                className="border-t-4 pt-4"
                style={{ borderTopColor: "var(--color-primary)" }}
              >
                <div
                  className="um1sf-stat-number text-4xl md:text-5xl lg:text-6xl"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {getLocalizedText(f.title, currentLanguage)}
                </div>
                <div
                  className="mt-2 text-sm uppercase tracking-wider"
                  style={{
                    color: "var(--color-muted-foreground)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {getLocalizedText(f.description, currentLanguage)}
                </div>
              </div>
            ))}
          </div>
        ) : showImages && hasAnyImage ? (
          // ── Image card grid (news, campus life) ──────────────────
          <div className={`grid ${gridCols} gap-6 md:gap-8`}>
            {features.map((f: any, idx: number) => {
              // Same fallback chain as the column-text branch — per
              // feature → section-wide `contentAlign`.
              const fTitleAlign: "left" | "center" | "right" =
                f.titleAlign === "center" ||
                f.titleAlign === "right" ||
                f.titleAlign === "left"
                  ? f.titleAlign
                  : contentAlign;
              const fDescAlign: "left" | "center" | "right" =
                f.descriptionAlign === "center" ||
                f.descriptionAlign === "right" ||
                f.descriptionAlign === "left"
                  ? f.descriptionAlign
                  : contentAlign;
              const fTitleClass =
                fTitleAlign === "center"
                  ? "text-center"
                  : fTitleAlign === "right"
                    ? "text-right"
                    : "text-left";
              const fDescClass =
                fDescAlign === "center"
                  ? "text-center"
                  : fDescAlign === "right"
                    ? "text-right"
                    : "text-left";
              const linkJustify =
                fTitleAlign === "center"
                  ? "justify-center w-full"
                  : fTitleAlign === "right"
                    ? "justify-end w-full"
                    : "";
              return (
                <article
                  key={f.id ?? idx}
                  className="group flex flex-col gap-3"
                >
                  {f.image ? (
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={f.image}
                        alt={getLocalizedText(f.title, currentLanguage)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  ) : showIcons && f.icon ? (
                    // Icon fallback when this item has no image — keeps
                    // a consistent tile silhouette across mixed rows.
                    <div
                      className="aspect-[4/3] w-full flex items-center justify-center bg-muted/40 border border-border"
                      aria-hidden="true"
                    >
                      <IconComponent
                        name={f.icon}
                        size={56}
                        className="opacity-90"
                        color={"var(--color-primary)" as unknown as string}
                      />
                    </div>
                  ) : null}
                  <h3
                    className={`text-lg font-semibold leading-snug ${fTitleClass}`}
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {f.link ? (
                      <Link
                        href={f.link.url}
                        className="hover:text-primary transition-colors"
                      >
                        {getLocalizedText(f.title, currentLanguage)}
                      </Link>
                    ) : (
                      getLocalizedText(f.title, currentLanguage)
                    )}
                  </h3>
                  {f.description && (
                    <p
                      className={`text-sm leading-relaxed ${fDescClass}`}
                      style={{
                        color: "var(--color-muted-foreground)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {getLocalizedText(f.description, currentLanguage)}
                    </p>
                  )}
                  {f.link && (
                    <Link
                      href={f.link.url}
                      className={`text-xs font-medium uppercase tracking-wider mt-1 inline-flex items-center gap-1 ${linkJustify}`}
                      style={{
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {getLocalizedText(f.link.text, currentLanguage)}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          // ── Column text mode (academic tiers, programs) ─────────
          <div
            className={`grid ${gridCols} gap-8 md:gap-10 ${
              hasAnyIcon && showIcons ? "" : "border-t pt-8"
            }`}
            style={{ borderColor: "var(--color-border)" }}
          >
            {features.map((f: any, idx: number) => {
              // Each per-feature align falls back to the section-wide
              // `contentAlign` when the editor didn't override it.
              const titleAlign: "left" | "center" | "right" =
                f.titleAlign === "center" ||
                f.titleAlign === "right" ||
                f.titleAlign === "left"
                  ? f.titleAlign
                  : contentAlign;
              const descAlign: "left" | "center" | "right" =
                f.descriptionAlign === "center" ||
                f.descriptionAlign === "right" ||
                f.descriptionAlign === "left"
                  ? f.descriptionAlign
                  : contentAlign;
              const titleAlignClass =
                titleAlign === "center"
                  ? "text-center"
                  : titleAlign === "right"
                    ? "text-right"
                    : "text-left";
              const descAlignClass =
                descAlign === "center"
                  ? "text-center"
                  : descAlign === "right"
                    ? "text-right"
                    : "text-left";
              // Icon alignment falls back to the per-feature title align,
              // which itself falls back to the section's `contentAlign`.
              const iconAlign: "left" | "center" | "right" =
                f.iconAlign === "center" ||
                f.iconAlign === "right" ||
                f.iconAlign === "left"
                  ? f.iconAlign
                  : titleAlign;
              const iconWrapAlignClass =
                iconAlign === "center"
                  ? "mx-auto"
                  : iconAlign === "right"
                    ? "ml-auto"
                    : "";
              const cardBg =
                f.background?.type === "solid" && f.background?.solid
                  ? f.background.solid
                  : undefined;
              const cardTextColor = f.textColor || undefined;
              return (
                <div
                  key={f.id ?? idx}
                  className={cardBg ? "rounded-md p-5" : ""}
                  style={{
                    ...(cardBg ? { backgroundColor: cardBg } : {}),
                    ...(cardTextColor ? { color: cardTextColor } : {}),
                  }}
                >
                  {showIcons && f.icon && (
                    <div
                      className={`mb-4 inline-flex items-center justify-center rounded-md ${iconWrapAlignClass}`}
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                        color: f.iconColor || "var(--color-primary)",
                        display:
                          iconWrapAlignClass === "mx-auto"
                            ? "flex"
                            : undefined,
                        width: `${(Number(f.iconSize) || 28) + 20}px`,
                        height: `${(Number(f.iconSize) || 28) + 20}px`,
                      }}
                      aria-hidden="true"
                    >
                      <IconComponent
                        name={f.icon}
                        size={Number(f.iconSize) || 28}
                        color={f.iconColor as unknown as string | undefined}
                      />
                    </div>
                  )}
                  <h3
                    className={`text-xl md:text-2xl font-semibold leading-snug ${titleAlignClass}`}
                    style={{
                      fontFamily: "var(--font-serif)",
                      ...(f.titleSize
                        ? { fontSize: `${Number(f.titleSize)}px` }
                        : {}),
                    }}
                  >
                    {f.link ? (
                      <Link
                        href={f.link.url}
                        className="hover:text-primary transition-colors"
                      >
                        {getLocalizedText(f.title, currentLanguage)}
                      </Link>
                    ) : (
                      getLocalizedText(f.title, currentLanguage)
                    )}
                  </h3>
                  {f.description && (
                    <p
                      className={`mt-3 text-base leading-relaxed ${descAlignClass}`}
                      style={{
                        color: cardTextColor || "var(--color-muted-foreground)",
                        fontFamily: "var(--font-sans)",
                        ...(f.descriptionSize
                          ? { fontSize: `${Number(f.descriptionSize)}px` }
                          : {}),
                      }}
                    >
                      {getLocalizedText(f.description, currentLanguage)}
                    </p>
                  )}
                  {f.link && (
                    <Link
                      href={f.link.url}
                      className={`mt-3 text-xs font-medium uppercase tracking-wider inline-flex items-center gap-1 ${
                        titleAlign === "center"
                          ? "justify-center w-full"
                          : titleAlign === "right"
                            ? "justify-end w-full"
                            : ""
                      }`}
                      style={{
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {getLocalizedText(f.link.text, currentLanguage)}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeatureListSection;
