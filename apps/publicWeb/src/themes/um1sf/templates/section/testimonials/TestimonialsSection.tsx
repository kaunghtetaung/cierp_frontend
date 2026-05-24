import React from "react";
import type {
  TestimonialsSectionData,
  SectionProps,
} from "@/themes/default/templates/section/types";
import { getLocalizedText } from "@/themes/default/templates/section/utils";

/**
 * um1sf Testimonials — single-quote pull-quote layout (Stanford
 * faculty / student profile pattern). Uses serif italic for the
 * quote and small-caps attribution beneath. Multi-quote layouts
 * (`grid`, `carousel`) fall back to the same single-card style
 * stacked vertically.
 */
export function TestimonialsSection({
  section,
  currentLanguage = "en",
}: SectionProps<TestimonialsSectionData>) {
  const items = section.testimonials ?? [];
  if (items.length === 0) return null;

  return (
    <section
      className="w-full"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-12">
        {items.map((t, idx) => (
          <figure key={idx} className="text-center">
            <blockquote
              className="um1sf-pull-quote text-2xl md:text-3xl lg:text-[2.25rem] leading-[1.35] max-w-3xl mx-auto"
              style={{ color: "var(--color-foreground)" }}
            >
              "{getLocalizedText(t.quote, currentLanguage)}"
            </blockquote>
            <figcaption className="mt-6 flex flex-col items-center gap-1">
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {getLocalizedText(t.author.name, currentLanguage)}
              </span>
              {t.author.title && (
                <span
                  className="text-xs"
                  style={{
                    color: "var(--color-muted-foreground)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {getLocalizedText(t.author.title, currentLanguage)}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default TestimonialsSection;
