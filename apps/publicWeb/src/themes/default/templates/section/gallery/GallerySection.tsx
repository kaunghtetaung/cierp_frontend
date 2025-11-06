"use client";

import React from "react";
import { S3Image } from "@/components/common/S3Image";
import { GallerySectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

/**
 * Gallery Section Component
 * Display images in grid, masonry, or carousel layout
 */
export function GallerySection({
  section,
  currentLanguage = "en",
}: SectionProps<GallerySectionData>) {
  const { layout = "grid", columns = 3 } = section;

  // Support both old and new schema formats
  const title = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : section.content?.title
    ? getLocalizedText(section.content.title, currentLanguage)
    : "Gallery";

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : section.content?.description
    ? getLocalizedText(section.content.description, currentLanguage)
    : null;

  // Get responsive grid classes based on columns and layout
  const getGalleryClasses = () => {
    if (layout === "masonry") {
      return "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6";
    }

    if (layout === "carousel") {
      return "flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory";
    }

    // Default grid layout
    switch (columns) {
      case 2:
        return "grid grid-cols-1 md:grid-cols-2 gap-6";
      case 3:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      case 4:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    }
  };

  return (
    <section
      className="py-16 px-4 bg-gradient-to-br from-background via-muted/50 to-primary/10"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-7xl mx-auto">
        {/* Gallery Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 relative">
            <span className="absolute -top-4 -left-4 w-10 h-10 bg-secondary/20 rounded-full blur-sm"></span>
            {title}
          </h2>

          {description && (
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Gallery Content */}
        <div className={getGalleryClasses()}>
          {(() => {
            // Support both old and new schema for images
            const images = section.images || section.content?.images;
            return images && Array.isArray(images) ? (
              images.map((image) => {
                const imageAlt = image?.alt
                  ? getLocalizedText(image.alt, currentLanguage)
                  : "Gallery image";
                const imageCaption = image?.caption
                  ? getLocalizedText(image.caption, currentLanguage)
                  : null;

                return (
                  <div
                    key={image?.id || `image-${Math.random()}`}
                    className={`group ${
                      layout === "carousel"
                        ? "flex-none w-80 snap-center"
                        : "break-inside-avoid"
                    }`}
                  >
                    {image?.url && (
                      <div className="relative overflow-hidden rounded-lg bg-card shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-border hover:border-primary">
                        <div className="relative overflow-hidden">
                          <S3Image
                            src={image.url}
                            alt={imageAlt}
                            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                            width={400}
                            height={300}
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />

                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          {/* Zoom icon overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-primary/80 backdrop-blur-sm rounded-full p-3 border border-primary-foreground/20">
                              <svg
                                className="w-6 h-6 text-primary-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {imageCaption && (
                          <div className="p-4 bg-gradient-to-r from-card to-primary/5">
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {imageCaption}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-muted to-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Images Available
                  </h3>
                  <p className="text-muted-foreground">
                    This gallery is currently empty
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}

export default GallerySection;
