"use client";

import React from "react";
import { FeatureListSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";
import { IconComponent } from "@repo/ui";

/**
 * Feature List Section Component
 * Grid or list layout of features with icons, titles, and descriptions
 */
export function FeatureListSection({
  section,
  currentLanguage = "en",
}: SectionProps<FeatureListSectionData>) {
  const { layout = "grid", columns = 3 } = section;

  // Support both old and new schema formats
  const title = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : section.content?.title
    ? getLocalizedText(section.content.title, currentLanguage)
    : "Features";

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : section.content?.description
    ? getLocalizedText(section.content.description, currentLanguage)
    : null;

  // Get responsive grid classes based on columns
  const getGridClasses = () => {
    if (layout !== "grid") return "space-y-6";

    switch (columns) {
      case 1:
        return "grid grid-cols-1 gap-8";
      case 2:
        return "grid grid-cols-1 md:grid-cols-2 gap-8";
      case 3:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";
      case 4:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";
    }
  };

  return (
    <section
      className="py-16 px-4 bg-gradient-secondary"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 relative">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 relative">
            <span className="absolute -top-4 -left-4 w-8 h-8 bg-accent/20 rounded-full blur-sm"></span>
            {title}
          </h2>

          {description && (
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Features Grid/List */}
        <div className={getGridClasses()}>
          {/* Support both old and new schema for features */}
          {(() => {
            const features = section.features || section.content?.features;
            return features && Array.isArray(features) ? (
              features.map((feature, index) => {
                const featureTitle = feature?.title
                  ? getLocalizedText(feature.title, currentLanguage)
                  : "Feature";
                const featureDescription = feature?.description
                  ? getLocalizedText(feature.description, currentLanguage)
                  : "";

                // Cycle through different color combinations for variety
                const iconColors = [
                  "from-primary to-primary/80",
                  "from-accent to-accent/80",
                  "from-secondary to-secondary/80",
                ];
                const iconColor = iconColors[index % iconColors.length];

                return (
                  <div
                    key={feature?.id || `feature-${Math.random()}`}
                    className="group bg-gradient-to-br from-card to-card/50 rounded-lg p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-border hover:border-primary/30 transform hover:-translate-y-2 hover:bg-gradient-to-br hover:from-card hover:to-accent/10"
                  >
                    {/* Feature Icon */}
                    {feature?.icon && (
                      <div className="mb-6">
                        <div
                          className={`w-16 h-16 bg-gradient-to-br ${iconColor} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          {/* Check if it's an icon name (letters only) or emoji/symbol */}
                          {/^[a-zA-Z]+$/.test(feature.icon) ? (
                            <IconComponent
                              name={feature.icon}
                              size={32}
                              className="text-primary-foreground"
                            />
                          ) : (
                            <span
                              className="text-2xl text-primary-foreground"
                              aria-hidden="true"
                            >
                              {feature.icon}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Feature Content */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                        {featureTitle}
                      </h3>

                      <p className="text-muted-foreground leading-relaxed">
                        {featureDescription}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-lg">No features available</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}

export default FeatureListSection;
