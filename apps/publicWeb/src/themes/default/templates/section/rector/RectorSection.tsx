import React from "react";
import { Mail } from "lucide-react";
import { RectorSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";
import { S3Image } from "@/components/common/S3Image";
import { getMessages } from "../../../lib/messages";

/**
 * Single-person leadership profile — mirrors the backend `rector`
 * section. Three layouts (left/right/center) drive the photo's
 * position relative to the bio. Photo size + shape come from the
 * doc; defaults are medium / circle to match the most common
 * leadership-card style.
 *
 * `S3Image` is used (not raw <img>) so tenant-specific storage
 * domains route through the right CDN — same pattern as the rest
 * of the default theme's image-bearing sections.
 */
export function RectorSection({
  section,
  currentLanguage = "en",
}: SectionProps<RectorSectionData>) {
  const {
    person,
    layout = "left",
    showEmail = true,
    showDegrees = true,
    imageSize = "medium",
    imageShape = "circle",
  } = section;

  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : null;
  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : null;

  if (!person) {
    const t = getMessages(currentLanguage);
    return (
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t.section.noProfileTitle}
            </h3>
            <p className="text-muted-foreground">
              {t.section.noProfileMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const name = getLocalizedText(person.name, currentLanguage);
  const degrees = getLocalizedText(person.degrees, currentLanguage);
  const contentText = getLocalizedText(person.contentText, currentLanguage);
  const readMoreText = person.readMoreLink
    ? getLocalizedText(person.readMoreLink.text, currentLanguage)
    : null;

  const imgSizeClass = {
    small: "w-32 h-32",
    medium: "w-48 h-48",
    large: "w-64 h-64",
  }[imageSize];

  const imgShapeClass = {
    circle: "rounded-full",
    square: "rounded-none",
    rounded: "rounded-2xl",
  }[imageShape];

  // Pixel dim for next/image — pulled from imageSize so we don't
  // pay for an LCP-blocking raw <img>.
  const imgPixelDim = { small: 128, medium: 192, large: 256 }[imageSize];

  // layout → flex direction. `center` stacks photo on top of bio.
  const flexClass = {
    left: "md:flex-row",
    right: "md:flex-row-reverse",
    center: "md:flex-col md:items-center",
  }[layout];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        {(headline || description) && (
          <div className="text-center mb-10">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
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

        <article
          className={`flex flex-col gap-8 items-center ${flexClass} bg-card border border-border rounded-2xl p-8 shadow-sm`}
        >
          <div className="flex-shrink-0">
            <S3Image
              src={person.photo}
              alt={name}
              width={imgPixelDim}
              height={imgPixelDim}
              className={`object-cover ${imgSizeClass} ${imgShapeClass}`}
            />
          </div>

          <div
            className={`flex-1 ${layout === "center" ? "text-center" : "text-left"}`}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              {name}
            </h3>
            {showDegrees && degrees && (
              <p className="text-sm text-muted-foreground italic mb-4">
                {degrees}
              </p>
            )}

            {contentText && (
              <div className="prose prose-sm md:prose-base max-w-none text-foreground mb-4">
                <p className="whitespace-pre-line">{contentText}</p>
              </div>
            )}

            <div
              className={`flex flex-wrap gap-3 items-center ${layout === "center" ? "justify-center" : ""}`}
            >
              {showEmail && person.email && (
                <a
                  href={`mailto:${person.email}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>{person.email}</span>
                </a>
              )}
              {person.readMoreLink && readMoreText && (
                <a
                  href={person.readMoreLink.url}
                  target={person.readMoreLink.openInNewTab ? "_blank" : undefined}
                  rel={
                    person.readMoreLink.openInNewTab
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {readMoreText}
                </a>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default RectorSection;
