import React from "react";
import Link from "next/link";
import type {
  CallToActionSectionData,
  SectionProps,
} from "@/themes/default/templates/section/types";
import { getLocalizedText } from "@/themes/default/templates/section/utils";

/**
 * um1sf Call to Action — full-width cardinal band. White text on
 * primary background, a primary white outline button + optional
 * secondary text-link. Sits at the foot of the home page as the
 * admission band.
 */
export function CallToActionSection({
  section,
  currentLanguage = "en",
}: SectionProps<CallToActionSectionData>) {
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
  const buttons = section.buttons ?? [];
  if (!headline && !description && buttons.length === 0) return null;

  return (
    <section
      className="w-full"
      style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
      }}
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        {headline && (
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {headline}
          </h2>
        )}
        {description && (
          <p
            className="mt-4 max-w-2xl mx-auto text-base md:text-lg opacity-90"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {description}
          </p>
        )}
        {buttons.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {buttons.map((b, idx) => {
              const isPrimary = b.style !== "outline" && idx === 0;
              return (
                <Link
                  key={idx}
                  href={b.url}
                  target={b.openInNewTab ? "_blank" : undefined}
                  rel={b.openInNewTab ? "noopener noreferrer" : undefined}
                  className={
                    isPrimary
                      ? "inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold tracking-wide bg-white text-primary hover:bg-white/90 transition-colors"
                      : "inline-flex items-center gap-1 text-sm font-medium border-b border-current pb-0.5 hover:opacity-80 transition-opacity"
                  }
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: isPrimary
                      ? "var(--color-primary)"
                      : "var(--color-primary-foreground)",
                  }}
                >
                  {getLocalizedText(b.text, currentLanguage)}
                  {!isPrimary && <span aria-hidden="true">→</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default CallToActionSection;
