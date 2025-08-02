"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ContentWithImageSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

/**
 * Content with Image Section Component
 * Text content paired with an image, side by side layout
 */
export function ContentWithImageSection({
  section,
  currentLanguage = "en",
}: SectionProps<ContentWithImageSectionData>) {
  const { content, layout = "imageLeft" } = section;

  const description = content?.description
    ? getLocalizedText(content.description, currentLanguage)
    : "";
  const imageAlt = content?.image?.alt
    ? getLocalizedText(content.image.alt, currentLanguage)
    : "Image";

  const isImageLeft = layout === "imageLeft";

  return (
    <section
      className="py-16 px-4 bg-gradient-to-br from-background/50 to-background"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
            isImageLeft
              ? "lg:grid-cols-[1fr_1fr]"
              : "lg:grid-cols-[1fr_1fr] lg:[&>*:nth-child(1)]:order-2"
          }`}
        >
          {/* Image */}
          {content?.image?.url && (
            <div className={`${!isImageLeft ? "lg:order-2" : ""}`}>
              <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-background p-2 transform hover:scale-105 transition-transform duration-300">
                <Image
                  src={content.image.url}
                  alt={imageAlt}
                  className="w-full h-auto object-cover rounded-xl"
                  width={600}
                  height={400}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`space-y-6 ${!isImageLeft ? "lg:order-1" : ""}`}>
            <div className="space-y-4">
              {/* <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                {title}
              </h2> */}

              <div className="space-y-4">
                {description.split("\n").map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-lg text-muted-foreground leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {content?.button && (
                <div className="pt-4">
                  <Link
                    href={content.button.url}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-md shadow-lg hover:from-primary/90 hover:to-primary/70 transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-primary/30 focus:outline-none"
                  >
                    {getLocalizedText(content.button.text, currentLanguage)}
                    <svg
                      className="ml-2 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentWithImageSection;
