"use client";

import React from "react";
import { Star } from "lucide-react";
import { TestimonialsSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

/**
 * Testimonials Section Component
 * Displays customer testimonials with ratings and author information
 */
export function TestimonialsSection({
  section,
  currentLanguage = "en",
}: SectionProps<TestimonialsSectionData>) {
  const {
    layout = "grid",
    showRatings = true,
    showAvatars = true,
    testimonials = [],
  } = section;

  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : null;

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : null;

  if (!testimonials || testimonials.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-surface via-primary/5 to-surface">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-background border border-border rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Testimonials Available
            </h3>
            <p className="text-muted-foreground">
              Testimonials will be displayed here when available.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-primary text-primary" : "text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const layoutClasses = {
    grid:
      testimonials.length === 1
        ? "grid grid-cols-1 max-w-2xl mx-auto"
        : testimonials.length === 2
        ? "grid grid-cols-1 md:grid-cols-2 gap-8"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
    carousel: "flex gap-8 overflow-x-auto pb-4 snap-x snap-mandatory",
    single: "max-w-4xl mx-auto",
  };

  return (
    <section
      className="py-16 bg-gradient-to-b from-background via-primary/5 to-background"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        {(headline || description) && (
          <div className="text-center mb-12">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 relative">
                <span className="absolute -top-3 -left-3 w-8 h-8 bg-primary/20 rounded-full blur-sm"></span>
                {headline}
              </h2>
            )}
            {description && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Testimonials */}
        <div className={layoutClasses[layout]}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`
                bg-background border border-border rounded-lg p-6 shadow-lg hover:shadow-2xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1
                ${layout === "carousel" ? "flex-shrink-0 w-80 snap-start" : ""}
                ${layout === "single" ? "text-center" : ""}
              `}
            >
              {/* Quote */}
              <blockquote className="text-foreground mb-4 leading-relaxed italic">
                <span className="text-primary text-5xl leading-none font-serif">
                  &quot;
                </span>
                {getLocalizedText(testimonial.quote, currentLanguage)}
                <span className="text-primary text-5xl leading-none font-serif">
                  &quot;
                </span>
              </blockquote>

              {/* Rating */}
              {showRatings && testimonial.rating && (
                <div
                  className={`mb-4 ${
                    layout === "single" ? "justify-center" : ""
                  } flex`}
                >
                  {renderStars(testimonial.rating)}
                </div>
              )}

              {/* Author */}
              <div
                className={`flex items-center gap-4 ${
                  layout === "single" ? "justify-center" : ""
                }`}
              >
                {showAvatars && testimonial.author.avatar && (
                  <img
                    src={testimonial.author.avatar}
                    alt={getLocalizedText(
                      testimonial.author.name,
                      currentLanguage
                    )}
                    className="w-12 h-12 rounded-full object-cover border-2 border-accent/40 shadow-md"
                  />
                )}
                <div className={layout === "single" ? "text-center" : ""}>
                  <div className="font-semibold text-foreground">
                    {getLocalizedText(testimonial.author.name, currentLanguage)}
                  </div>
                  {testimonial.author.title && (
                    <div className="text-sm text-primary font-medium">
                      {getLocalizedText(
                        testimonial.author.title,
                        currentLanguage
                      )}
                      {testimonial.author.company && (
                        <span className="text-muted-foreground">
                          {" "}
                          at{" "}
                          {getLocalizedText(
                            testimonial.author.company,
                            currentLanguage
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel indicators for mobile */}
        {layout === "carousel" && testimonials.length > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-primary/40" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TestimonialsSection;
