"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/styled-components/ui/Button";
import { HeroSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

/**
 * Hero Section Component
 * Large banner section with background image/video and call-to-action
 */
export function HeroSection({
  section,
  currentLanguage = "en",
}: SectionProps<HeroSectionData>) {
  const {
    layout = "centered",
    textAlign = "center",
    textAlignment,
    backgroundVideo,
    overlay,
  } = section;

  // Support both old and new schema formats
  const title = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : section.content?.title
    ? getLocalizedText(section.content.title, currentLanguage)
    : "Hero Title";

  const subtitle = section.subheadline
    ? getLocalizedText(section.subheadline, currentLanguage)
    : section.content?.subtitle
    ? getLocalizedText(section.content.subtitle, currentLanguage)
    : null;

  const description = section.content?.description
    ? getLocalizedText(section.content.description, currentLanguage)
    : null;

  // Use old schema textAlignment if available, otherwise use new textAlign
  const finalTextAlign = textAlignment || textAlign;

  // Layout styles
  const layoutStyles = {
    centered: "justify-center items-center text-center",
    left: "justify-center items-start text-left",
    right: "justify-center items-end text-right",
  };

  const textAlignStyles = {
    center: "text-center",
    left: "text-left",
    right: "text-right",
  };

  const buttonAlignStyles = {
    center: "justify-center",
    left: "justify-start",
    right: "justify-end",
  };

  return (
    <section
      className={`relative min-h-[600px] flex justify-center items-center border-b border-primary/20 overflow-hidden ${layoutStyles[layout]}`}
      data-section-id={section._id}
      data-section-type={section.type}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {backgroundVideo ? (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        ) : (
          //  : backgroundImage ? (
          //   <Image
          //     src={backgroundImage}
          //     alt=""
          //     className="w-full h-full object-cover"
          //     fill
          //     priority
          //     sizes="100vw"
          //   />
          // )
          <div className="w-full h-full bg-gradient-hero" />
        )}

        {/* Overlay */}
        {overlay?.enabled && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: overlay.color,
              opacity: overlay.opacity / 100,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-4 py-24">
          <div
            className={`max-w-4xl ${
              layout === "centered"
                ? "mx-auto"
                : layout === "right"
                ? "ml-auto"
                : ""
            } ${textAlignStyles[finalTextAlign]}`}
          >
            {subtitle && (
              <p className="text-lg md:text-xl text-primary font-semibold mb-4 bg-primary/10 px-4 py-2 rounded-full inline-block">
                {subtitle}
              </p>
            )}

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              {title}
            </h1>

            {description && (
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}

            {/* Action Buttons */}
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
                return (
                  <div
                    className={`flex flex-wrap gap-4 ${buttonAlignStyles[finalTextAlign]}`}
                  >
                    {oldButtons.map((button, index) => (
                      <Link
                        key={index}
                        href={button.url}
                        target={button.openInNewTab ? "_blank" : undefined}
                        rel={
                          button.openInNewTab
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        <Button
                          variant={
                            button.style === "primary" ? "primary" : "secondary"
                          }
                          size="lg"
                          className={
                            button.style === "primary"
                              ? "shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                              : "bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background backdrop-blur-sm"
                          }
                        >
                          {getLocalizedText(button.text, currentLanguage)}
                        </Button>
                      </Link>
                    ))}
                  </div>
                );
              } else if (newButtons) {
                return (
                  <div
                    className={`flex flex-wrap gap-4 ${buttonAlignStyles[finalTextAlign]}`}
                  >
                    {section.content?.primaryButton && (
                      <Link href={section.content.primaryButton.url}>
                        <Button
                          variant="primary"
                          size="lg"
                          className="shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                          variant="secondary"
                          size="lg"
                          className="bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background backdrop-blur-sm"
                        >
                          {getLocalizedText(
                            section.content.secondaryButton.text,
                            currentLanguage
                          )}
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              }

              return null;
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
