import React from "react";
import * as LucideIcons from "lucide-react";
import { StudentEnrollmentSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";
import { getMessages } from "../../../lib/messages";

/**
 * Enrollment counter cards — mirrors the backend `studentEnrollment`
 * section. Renders a grid (or row) of cards, each with an icon, a
 * large count, and a localized title/subtitle. Icon is resolved by
 * name from lucide-react (the rest of the theme already uses lucide
 * for icons); unknown names fall through to a neutral Users icon so
 * a typo in the admin doesn't blank the card.
 *
 * Colors come from the doc (`bgColor`, `textColor`) so per-card
 * branding stays in the author's hands — we don't override.
 */
export function StudentEnrollmentSection({
  section,
  currentLanguage = "en",
}: SectionProps<StudentEnrollmentSectionData>) {
  const {
    enrollmentCards = [],
    layout = "grid",
    columns = 4,
  } = section;

  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : null;
  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : null;

  if (enrollmentCards.length === 0) {
    const t = getMessages(currentLanguage);
    return (
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t.section.noEnrollmentTitle}
            </h3>
            <p className="text-muted-foreground">
              {t.section.noEnrollmentMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Grid column map — Tailwind needs literal class names to JIT, so a
  // lookup keeps the bundle correct (template-string `grid-cols-${n}`
  // wouldn't survive purge).
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  const containerClass =
    layout === "row"
      ? "flex flex-wrap gap-6 justify-center"
      : `grid ${gridColsClass} gap-6`;

  return (
    <section className="py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        {(headline || description) && (
          <div className="text-center mb-12">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {headline}
              </h2>
            )}
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}

        <div className={containerClass}>
          {enrollmentCards.map((card, idx) => {
            const IconComponent =
              ((LucideIcons as any)[card.icon] as React.ElementType) ||
              LucideIcons.Users;
            const title = getLocalizedText(card.title, currentLanguage);
            const subTitle = getLocalizedText(card.subTitle, currentLanguage);
            return (
              <div
                key={idx}
                className="rounded-xl shadow-md p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: card.bgColor,
                  color: card.textColor,
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${card.textColor}1a` }}
                  aria-hidden="true"
                >
                  <IconComponent
                    className="w-7 h-7"
                    style={{ color: card.textColor }}
                  />
                </div>
                <div className="text-4xl font-bold tracking-tight mb-2">
                  {card.count}
                </div>
                <div className="text-base font-semibold">{title}</div>
                {subTitle && (
                  <div className="text-sm opacity-80 mt-1">{subTitle}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StudentEnrollmentSection;
