"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/styled-components/ui/Button";
import { CallToActionSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

/**
 * Call to Action Section Component
 * Prominent section designed to encourage user action
 */
export function CallToActionSection({
  section,
  currentLanguage = "en",
}: SectionProps<CallToActionSectionData>) {
  const { background } = section;

  // Support both old and new schema formats
  const title = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : section.content?.title
    ? getLocalizedText(section.content.title, currentLanguage)
    : "Call to Action";

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : section.content?.description
    ? getLocalizedText(section.content.description, currentLanguage)
    : null;

  // Background styles
  const backgroundStyle: React.CSSProperties = {};
  let backgroundClasses = "bg-gradient-primary";

  if (background) {
    if (background.type === "color") {
      backgroundStyle.backgroundColor = background.value;
      backgroundClasses = "";
    } else if (background.type === "image") {
      backgroundStyle.backgroundImage = `url(${background.value})`;
      backgroundClasses = "bg-cover bg-center bg-no-repeat";
    }
  }

  return (
    <section
      className={`relative py-24 ${backgroundClasses} overflow-hidden`}
      data-section-id={section._id}
      data-section-type={section.type}
      style={backgroundStyle}
    >
      {/* Background overlay for image backgrounds */}
      {background?.type === "image" && (
        <div className="absolute inset-0 bg-background/50" />
      )}

      {/* Background pattern for default gradient */}
      {!background && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-primary" />
          <div className="absolute inset-0 bg-gradient-cool opacity-30" />
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* CTA Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            {title}
          </h2>

          {description && (
            <p className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>

        {/* CTA Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          {(() => {
            // Support both old buttons array and new primaryButton/secondaryButton
            const oldButtons = section.buttons;
            const newButtons =
              section.content?.primaryButton ||
              section.content?.secondaryButton;

            if (
              oldButtons &&
              Array.isArray(oldButtons) &&
              oldButtons.length > 0
            ) {
              return oldButtons.map((button, index) => (
                <Link
                  key={index}
                  href={button.url}
                  target={button.openInNewTab ? "_blank" : undefined}
                  rel={button.openInNewTab ? "noopener noreferrer" : undefined}
                >
                  <Button
                    variant={button.style === "primary" ? "primary" : "outline"}
                    size="lg"
                    className="bg-background text-primary hover:bg-muted shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {getLocalizedText(button.text, currentLanguage)}
                  </Button>
                </Link>
              ));
            } else if (newButtons) {
              return (
                <>
                  {section.content?.primaryButton && (
                    <Link href={section.content.primaryButton.url}>
                      <Button
                        variant="primary"
                        size="lg"
                        className="bg-background text-primary hover:bg-muted shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        {getLocalizedText(
                          section.content.primaryButton.text,
                          currentLanguage
                        )}
                      </Button>
                    </Link>
                  )}

                  {section.content?.secondaryButton && (
                    <Link href={section.content.secondaryButton.url}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary backdrop-blur-sm"
                      >
                        {getLocalizedText(
                          section.content.secondaryButton.text,
                          currentLanguage
                        )}
                      </Button>
                    </Link>
                  )}
                </>
              );
            }

            return null;
          })()}
        </div>
      </div>
    </section>
  );
}

export default CallToActionSection;
