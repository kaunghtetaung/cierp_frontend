// um1sf section dispatcher.
//
// Overrides 4 section types with um1sf-themed implementations:
//   hero, featureList, testimonials, cta
//
// Everything else (gallery, faq, pricing, dataTable, contentWith
// Image, organizationStructure, appList, showcase) falls through
// to the default theme's renderer — same behaviour, no fork.

import React from "react";
import {
  isHeroSection,
  isFeatureListSection,
  isCallToActionSection,
  isTestimonialsSection,
  isStatsSection,
  isCarouselSection,
  isRecentPostsSection,
  isCategoryListSection,
  isTagListSection,
  isPostBodySection,
} from "@/themes/default/templates/section/utils";
import type {
  SectionData,
  SectionRendererProps,
} from "@/themes/default/templates/section/types";

import { HeroSection } from "./hero/HeroSection";
import { FeatureListSection } from "./featureList/FeatureListSection";
import { TestimonialsSection } from "./testimonials/TestimonialsSection";
import { CallToActionSection } from "./cta/CallToActionSection";
import { StatsSection } from "./stats/StatsSection";
import { CarouselSection } from "./carousel/CarouselSection";

// Default theme components for everything else.
import {
  ContentWithImageSection,
  GallerySection,
  StatusColorsShowcase,
} from "@/themes/default/templates/section";
import RecentPostsSection from "@/themes/default/templates/section/recent-posts/RecentPostsSection";
import CategoryListSection from "@/themes/default/templates/section/category-list/CategoryListSection";
import TagListSection from "@/themes/default/templates/section/tag-list/TagListSection";
import PostBodySection from "@/themes/default/templates/section/post-body/PostBodySection";
import FaqSection from "@/themes/default/templates/section/faq/FaqSection";
import NavigationMenuSection from "@/themes/default/templates/section/navigation-menu/NavigationMenuSection";
import TabsSectionComp from "@/themes/default/templates/section/tabs/TabsSection";

// Re-export the type guards + util helpers so HomePage can keep
// using them without importing from the default theme directly.
export {
  getLocalizedText,
  getSectionClasses,
  getProcessedSections,
} from "@/themes/default/templates/section/utils";
export type { SectionData, SectionRendererProps };

/**
 * um1sf SectionRenderer.
 *
 * Walks the sections list, dispatches each to its um1sf override
 * (when one exists) or to the default-theme component. Sections
 * are pre-sorted + filtered by `getProcessedSections` upstream.
 */
export function SectionRenderer({
  sections,
  currentLanguage = "en",
  className = "",
}: SectionRendererProps) {
  if (!sections || sections.length === 0) return null;

  const renderOne = (section: SectionData) => {
    if (isHeroSection(section)) {
      return (
        <HeroSection section={section} currentLanguage={currentLanguage} />
      );
    }
    if (isFeatureListSection(section)) {
      return (
        <FeatureListSection
          section={section}
          currentLanguage={currentLanguage}
        />
      );
    }
    if (isTestimonialsSection(section)) {
      return (
        <TestimonialsSection
          section={section}
          currentLanguage={currentLanguage}
        />
      );
    }
    if (isCallToActionSection(section)) {
      return (
        <CallToActionSection
          section={section}
          currentLanguage={currentLanguage}
        />
      );
    }
    if (isStatsSection(section)) {
      return (
        <StatsSection section={section} currentLanguage={currentLanguage} />
      );
    }
    // Carousel + RecentPosts have no um1sf-specific override yet —
    // dispatch to the default theme's component so they at least
    // render. Without this branch the dispatcher returns null and
    // the slot stays blank (the home page's first row was hitting
    // exactly this case for the `home_carousel` section).
    if (isCarouselSection(section)) {
      return (
        <CarouselSection
          section={section}
          currentLanguage={currentLanguage}
        />
      );
    }
    if (isRecentPostsSection(section)) {
      return (
        <RecentPostsSection
          section={section}
          currentLanguage={currentLanguage}
        />
      );
    }
    if (isCategoryListSection(section)) {
      return (
        <CategoryListSection
          section={section}
          currentLanguage={currentLanguage}
        />
      );
    }
    if (isTagListSection(section)) {
      return (
        <TagListSection
          section={section}
          currentLanguage={currentLanguage}
        />
      );
    }
    if (isPostBodySection(section)) {
      return (
        <PostBodySection
          section={section}
          currentLanguage={currentLanguage}
        />
      );
    }
    // Pass-through to default theme components for unforked types.
    if ((section as any).type === "contentWithImage") {
      return (
        <ContentWithImageSection
          section={section as any}
          currentLanguage={currentLanguage}
        />
      );
    }
    if ((section as any).type === "gallery") {
      return (
        <GallerySection
          section={section as any}
          currentLanguage={currentLanguage}
        />
      );
    }
    if ((section as any).type === "statusColorsShowcase") {
      return <StatusColorsShowcase />;
    }
    // FAQ — accordion of collapsible items with optional rich-HTML
    // bodies (lists, tables, images). No um1sf-specific styling yet,
    // so dispatch to the default-theme renderer. Without this case
    // the course page's `mbbs-course-accordion` section silently
    // returned null and the column rendered blank.
    if ((section as any).type === "faq") {
      return (
        <FaqSection
          section={section as any}
          currentLanguage={currentLanguage}
        />
      );
    }
    // Sidebar nav menu — fetches the Navigation tree by `menuType`
    // and renders nested links. Same Navigation collection the
    // header uses; pick which tree via the section's `menuType`
    // field. Server-fetched so the markup is fully SSR.
    if ((section as any).type === "navigationMenu") {
      return (
        <NavigationMenuSection
          section={section as any}
          currentLanguage={currentLanguage}
        />
      );
    }
    if ((section as any).type === "tabs") {
      return (
        <TabsSectionComp
          section={section as any}
          currentLanguage={currentLanguage}
        />
      );
    }
    // Unknown / unsupported type: render nothing rather than breaking
    // the whole page. Add an override here if the type appears often.
    return null;
  };

  // Section types that paint their own full-bleed background and
  // therefore opt OUT of the zebra-band wrapper — adding a tint
  // beneath them either fights with their colour or leaves a strip
  // visible at the edges of their inner content.
  const FULL_BLEED_TYPES = new Set([
    "hero",
    "carousel",
    "callToAction",
    "cta",
  ]);

  return (
    <div className={className}>
      {sections.map((section, idx) => {
        const isFullBleed = FULL_BLEED_TYPES.has(
          (section as any).type as string,
        );
        // Zebra-stripe adjacent sections so consecutive bands of
        // similar tone (e.g. Stats + Recent News, both white) read
        // as separate. Even index = page bg (no override); odd index
        // = subtle muted tint via the theme variable.
        const bandStyle: React.CSSProperties =
          !isFullBleed && idx % 2 === 1
            ? {
                backgroundColor:
                  "var(--color-section-alt-bg, rgba(0,0,0,0.04))",
              }
            : {};
        return (
          <div
            key={section._id}
            data-section-id={section._id}
            data-section-band={idx % 2 === 1 ? "alt" : "base"}
            style={bandStyle}
          >
            {renderOne(section)}
          </div>
        );
      })}
    </div>
  );
}

export default SectionRenderer;
