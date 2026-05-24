import React from "react";
import Link from "next/link";
import type {
  HeroSectionData,
  SectionProps,
} from "@/themes/default/templates/section/types";
import { getLocalizedText } from "@/themes/default/templates/section/utils";

/**
 * um1sf Hero — Stanford-inspired editorial.
 *
 * When `backgroundImage` is set, the hero paints a full-bleed photo
 * with a configurable dark overlay for legibility (text turns white).
 * When unset, falls back to a clean white canvas with dark serif
 * headline + grey supporting paragraph (text-only mode).
 */
export function HeroSection({
  section,
  currentLanguage = "en",
}: SectionProps<HeroSectionData>) {
  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : section.content?.title
      ? getLocalizedText(section.content.title, currentLanguage)
      : "";
  const subhead = section.subheadline
    ? getLocalizedText(section.subheadline, currentLanguage)
    : section.content?.description
      ? getLocalizedText(section.content.description, currentLanguage)
      : "";

  const primaryButton = section.buttons?.[0] ?? section.content?.primaryButton;

  const hasImage = !!section.backgroundImage;
  const overlay = section.overlay;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={
        hasImage
          ? {
              backgroundImage: `url(${section.backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: "60vh",
            }
          : { backgroundColor: "var(--color-background)" }
      }
      data-section-id={section._id}
      data-section-type={section.type}
    >
      {/* Dark overlay when an image is present — improves legibility
          of the white text and adds Stanford-y restraint. */}
      {hasImage && overlay?.enabled !== false && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: overlay?.color ?? "#000000",
            opacity: overlay?.opacity ?? 0.5,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${
          hasImage ? "py-28 md:py-36" : "py-20 md:py-28"
        } text-center`}
      >
        {headline && (
          <h1
            className="um1sf-hero-headline text-3xl md:text-5xl lg:text-6xl"
            style={{
              color: hasImage ? "#FFFFFF" : "var(--color-foreground)",
            }}
          >
            {headline}
          </h1>
        )}
        {subhead && (
          <p
            className="mt-6 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{
              color: hasImage
                ? "rgba(255,255,255,0.92)"
                : "var(--color-muted-foreground)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {subhead}
          </p>
        )}
        {primaryButton && (
          <div className="mt-8">
            <Link
              href={primaryButton.url}
              className="inline-flex items-center gap-1 text-sm font-medium border-b-2 border-current pb-0.5 hover:opacity-70 transition-opacity"
              style={{
                color: hasImage ? "#FFFFFF" : "var(--color-primary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {getLocalizedText(primaryButton.text, currentLanguage)}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default HeroSection;
