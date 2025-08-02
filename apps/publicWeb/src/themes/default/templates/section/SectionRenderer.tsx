import React from "react";
import { SectionRendererProps, SectionData } from "./types";
import {
  getSectionClasses,
  getLocalizedText,
  getProcessedSections,
  isHeroSection,
  isContentWithImageSection,
  isFeatureListSection,
  isCallToActionSection,
  isGallerySection,
  isTestimonialsSection,
  isFaqSection,
  isPricingSection,
  isDataTableSection,
  isOrganizationStructureSection,
  isStatusColorsShowcase,
} from "./utils";

// Section components
import HeroSection from "./hero/HeroSection";
import ContentWithImageSection from "./content/ContentWithImageSection";
import FeatureListSection from "./feature/FeatureListSection";
import CallToActionSection from "./cta/CallToActionSection";
import GallerySection from "./gallery/GallerySection";
import TestimonialsSection from "./testimonials/TestimonialsSection";
import FaqSection from "./faq/FaqSection";
import PricingSection from "./pricing/PricingSection";
import DataTableSection from "./datatable/DataTableSection";
import OrganizationStructureSection from "./organization/OrganizationStructureSection";
import StatusColorsShowcase from "./showcase/StatusColorsShowcase";

/**
 * Section Renderer Component
 * Dynamically renders different section types based on data
 */
export function SectionRenderer({
  sections,
  currentLanguage = "en",
  className = "",
}: SectionRendererProps) {
  // Process sections (filter enabled and sort by order)
  const processedSections = getProcessedSections(sections);

  if (processedSections.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-64 ${className}`}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground">
            <p>No sections to display</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render individual section component
   */
  const renderSection = (section: SectionData) => {
    try {
      // Section title (if exists and different from content title)
      // const sectionTitle = getLocalizedText(section.title, currentLanguage);

      // Render specific section type
      let sectionComponent: React.ReactNode = null;

      if (isHeroSection(section)) {
        sectionComponent = (
          <HeroSection section={section} currentLanguage={currentLanguage} />
        );
      } else if (isContentWithImageSection(section)) {
        sectionComponent = (
          <ContentWithImageSection
            section={section}
            currentLanguage={currentLanguage}
          />
        );
      } else if (isFeatureListSection(section)) {
        sectionComponent = (
          <FeatureListSection
            section={section}
            currentLanguage={currentLanguage}
          />
        );
      } else if (isCallToActionSection(section)) {
        sectionComponent = (
          <CallToActionSection
            section={section}
            currentLanguage={currentLanguage}
          />
        );
      } else if (isGallerySection(section)) {
        sectionComponent = (
          <GallerySection section={section} currentLanguage={currentLanguage} />
        );
      } else if (isTestimonialsSection(section)) {
        sectionComponent = (
          <TestimonialsSection
            section={section}
            currentLanguage={currentLanguage}
          />
        );
      } else if (isFaqSection(section)) {
        sectionComponent = (
          <FaqSection section={section} currentLanguage={currentLanguage} />
        );
      } else if (isPricingSection(section)) {
        sectionComponent = (
          <PricingSection section={section} currentLanguage={currentLanguage} />
        );
      } else if (isDataTableSection(section)) {
        sectionComponent = (
          <DataTableSection
            section={section}
            currentLanguage={currentLanguage}
          />
        );
      } else if (isOrganizationStructureSection(section)) {
        sectionComponent = (
          <OrganizationStructureSection
            section={section}
            currentLanguage={currentLanguage}
          />
        );
      } else if (isStatusColorsShowcase(section)) {
        sectionComponent = <StatusColorsShowcase />;
      } else {
        // Unknown section type fallback
        sectionComponent = <UnknownSectionFallback section={section} />;
      }

      return (
        <div
          key={section._id}
          className={getSectionClasses(section)}
          data-section-id={section._id}
          data-section-type={section.type}
        >
          {/* Optional section title (separate from content title)
          {sectionTitle && (
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <h2 className="text-3xl font-bold text-center text-foreground">
                {sectionTitle}
              </h2>
            </div>
          )} */}

          {/* Section content */}
          <div className="w-full">{sectionComponent}</div>
        </div>
      );
    } catch (error) {
      console.error(`Error rendering section ${section._id}:`, error);
      return (
        <SectionErrorFallback
          key={section._id}
          section={section}
          error={error as Error}
        />
      );
    }
  };

  return (
    <div className={`space-y-16 ${className}`}>
      {processedSections.map(renderSection)}
    </div>
  );
}

/**
 * Fallback component for unknown section types
 */
function UnknownSectionFallback({ section }: { section: SectionData }) {
  return (
    <section className={`py-16 bg-muted/50`}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <h3 className={`text-xl font-semibold text-foreground`}>
            Unknown Section Type
          </h3>
          <p className="text-muted-foreground">
            Section type &quot;{section.type}&quot; does not have a renderer
            component.
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Section ID: {section._id}</p>
            <p>Section Name: {section.name}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Fallback component for section rendering errors
 */
function SectionErrorFallback({
  section,
  error,
}: {
  section: SectionData;
  error: Error;
}) {
  return (
    <section className={`py-16 bg-destructive/10`}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <h3 className={`text-xl font-semibold text-destructive`}>
            Section Rendering Error
          </h3>
          <p className="text-muted-foreground">
            Failed to render section &quot;{section.type}&quot;
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Section ID: {section._id}</p>
            <p>Error: {error.message}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SectionRenderer;
