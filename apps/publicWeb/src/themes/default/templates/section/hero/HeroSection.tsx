"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { S3Image } from "@/components/common/S3Image";
import { Button } from "@/styled-components/ui/Button";
import { HeroSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

/**
 * Hero Section Component
 * Supports both single slide and carousel mode
 */
export function HeroSection({
  section,
  currentLanguage = "en",
}: SectionProps<HeroSectionData>) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isCarousel = section.carouselMode && section.slides && section.slides.length > 1;
  const slides = section.slides || [];
  const autoplay = section.autoplay ?? true;
  const autoplaySpeed = section.autoplaySpeed || 10000;

  // Auto-advance slides
  useEffect(() => {
    if (!isCarousel || !autoplay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoplaySpeed);

    return () => clearInterval(interval);
  }, [isCarousel, autoplay, autoplaySpeed, slides.length]);

  // Render carousel mode
  if (isCarousel) {
    return (
      <section
        className="relative min-h-[480px] flex justify-center items-center border-b border-primary/20 overflow-hidden"
        data-section-id={section._id}
        data-section-type={section.type}
      >
        {/* Slides */}
        {slides.map((slide: any, index: number) => (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background */}
            <div className="absolute inset-0">
              {slide.backgroundImage && slide.backgroundImage.trim() !== '' ? (
                <div
                  className="w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${slide.backgroundImage})` }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-hero" />
              )}

              {/* Overlay */}
              {slide.overlay?.enabled && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: slide.overlay.color,
                    opacity: slide.overlay.opacity,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className="relative z-10 w-full h-full flex items-center">
              {slide.type === 'rector' ? (
                <RectorSlide slide={slide} currentLanguage={currentLanguage} />
              ) : slide.type === 'history' ? (
                <HistorySlide slide={slide} currentLanguage={currentLanguage} />
              ) : (
                <WelcomeSlide slide={slide} currentLanguage={currentLanguage} />
              )}
            </div>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 backdrop-blur-sm p-3 rounded-full transition-all"
          style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))' }}
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 backdrop-blur-sm p-3 rounded-full transition-all"
          style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))' }}
          aria-label="Next slide"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </section>
    );
  }

  // Legacy single slide mode (backward compatibility)
  return <LegacyHeroSection section={section} currentLanguage={currentLanguage} />;
}

/**
 * Welcome Slide Component
 */
function WelcomeSlide({ slide, currentLanguage }: { slide: any; currentLanguage: string }) {
  const title = getLocalizedText(slide.content?.title, currentLanguage);
  const subtitle = slide.content?.subtitle ? getLocalizedText(slide.content.subtitle, currentLanguage) : null;
  const description = slide.content?.description ? getLocalizedText(slide.content.description, currentLanguage) : null;
  const textAlign = slide.textAlignment || 'center';

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
    <div className="max-w-7xl mx-auto px-4 py-16 w-full">
      <div className={`max-w-4xl mx-auto ${textAlignStyles[textAlign as keyof typeof textAlignStyles]}`}>
        {subtitle && (
          <p
            className="text-base md:text-lg font-semibold mb-3 px-3 py-1.5 rounded-full inline-block"
            style={{
              color: '#F1D0AB',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))'
            }}
          >
            {subtitle}
          </p>
        )}

        <h1
          className={`font-bold text-white mb-4 leading-tight ${
            currentLanguage === 'mm'
              ? 'text-2xl md:text-3xl lg:text-4xl'
              : 'text-3xl md:text-5xl lg:text-6xl'
          }`}
          style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}
        >
          {title}
        </h1>

        {description && (
          <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed max-w-3xl mx-auto">
            {description}
          </p>
        )}

        {/* Buttons */}
        {slide.buttons && slide.buttons.length > 0 && (
          <div className={`flex flex-wrap gap-4 ${buttonAlignStyles[textAlign as keyof typeof buttonAlignStyles]}`}>
            {slide.buttons.map((button: any, index: number) => (
              <Link
                key={index}
                href={button.url}
                target={button.openInNewTab ? "_blank" : undefined}
                rel={button.openInNewTab ? "noopener noreferrer" : undefined}
              >
                <Button
                  variant={button.style === "primary" ? "primary" : "secondary"}
                  size="lg"
                  className={
                    button.style === "primary"
                      ? "shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      : "bg-white border-2 border-white text-gray-900 hover:bg-white/90 backdrop-blur-sm"
                  }
                  style={
                    button.style === "primary"
                      ? { backgroundColor: '#FF9B12', borderColor: '#FF9B12' }
                      : undefined
                  }
                >
                  {getLocalizedText(button.text, currentLanguage)}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Rector Slide Component
 * Layout: 33% left panel with rector info, 67% right shows background
 */
function RectorSlide({ slide, currentLanguage }: { slide: any; currentLanguage: string }) {
  const rectorName = getLocalizedText(slide.content?.rectorName, currentLanguage);
  const degrees = slide.content?.degrees;
  const rectorPhoto = slide.content?.rectorPhoto;

  return (
    <div className="w-full h-full">
      <div className="max-w-7xl mx-auto px-4 h-full flex flex-col md:flex-row items-center">
        {/* Left Panel: 33% - Rector Info */}
        <div
          className="w-full md:w-1/3 backdrop-blur-sm flex flex-col items-center justify-center py-8 px-5 my-6 md:my-8 rounded-lg"
          style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))' }}
        >
        {/* Rector Photo - Reduced size */}
        <div className="mb-4 shadow-2xl rounded-lg overflow-hidden">
          {rectorPhoto && (
            <div className="relative">
              <S3Image
                src={rectorPhoto}
                alt={rectorName}
                width={162}
                height={216}
                className="h-[216px] w-auto rounded-lg"
                priority
              />
            </div>
          )}
        </div>

        {/* Rector Name */}
        <h2
          className={`font-bold text-white mb-3 text-center leading-tight ${
            currentLanguage === 'mm'
              ? 'text-lg md:text-xl'
              : 'text-xl md:text-2xl'
          }`}
          style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}
        >
          {rectorName}
        </h2>

        {/* Degrees */}
        <p className="text-xs md:text-sm text-white mb-4 text-center leading-relaxed px-2" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>
          {degrees}
        </p>

        {/* Button */}
        {slide.buttons && slide.buttons.length > 0 && (
          <div className="w-full flex justify-center">
            {slide.buttons.map((button: any, index: number) => (
              <Link
                key={index}
                href={button.url}
                target={button.openInNewTab ? "_blank" : undefined}
                rel={button.openInNewTab ? "noopener noreferrer" : undefined}
                className="w-full max-w-xs"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  style={{ backgroundColor: '#FF9B12', borderColor: '#FF9B12' }}
                >
                  {getLocalizedText(button.text, currentLanguage)}
                </Button>
              </Link>
            ))}
          </div>
        )}
        </div>

        {/* Right Side: 67% - Background Image (visible through) */}
        <div className="hidden md:block md:w-2/3">
          {/* Background image is already set on parent, this just takes space */}
        </div>
      </div>
    </div>
  );
}

/**
 * History Slide Component
 * Layout: Background image with text panel overlay on left
 */
function HistorySlide({ slide, currentLanguage }: { slide: any; currentLanguage: string }) {
  const title = getLocalizedText(slide.content?.title, currentLanguage);
  const description = getLocalizedText(slide.content?.description, currentLanguage);

  return (
    <div className="w-full h-full">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-start">
        {/* History Text Panel on Left */}
        <div className="w-full md:w-1/3 bg-black/15 backdrop-blur-md py-8 px-6 my-6 md:my-8 rounded-lg shadow-2xl">
          <h2
            className={`font-bold text-white mb-4 leading-tight ${
              currentLanguage === 'mm'
                ? 'text-xl md:text-2xl'
                : 'text-2xl md:text-3xl'
            }`}
            style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}
          >
            {title}
          </h2>

          <p className="text-sm md:text-base text-white mb-6 leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>
            {description}
          </p>

          {/* Button */}
          {slide.buttons && slide.buttons.length > 0 && (
            <div className="flex">
              {slide.buttons.map((button: any, index: number) => (
                <Link
                  key={index}
                  href={button.url}
                  target={button.openInNewTab ? "_blank" : undefined}
                  rel={button.openInNewTab ? "noopener noreferrer" : undefined}
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    style={{ backgroundColor: '#FF9B12', borderColor: '#FF9B12' }}
                  >
                    {getLocalizedText(button.text, currentLanguage)}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Legacy Hero Section (backward compatibility for non-carousel mode)
 */
function LegacyHeroSection({
  section,
  currentLanguage,
}: SectionProps<HeroSectionData>) {
  const {
    layout = "centered",
    textAlign = "center",
    textAlignment,
    backgroundImage,
    backgroundVideo,
    overlay,
  } = section;

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

  const finalTextAlign = textAlignment || textAlign;

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
      className={`relative min-h-[480px] flex justify-center items-center border-b border-primary/20 overflow-hidden ${layoutStyles[layout]}`}
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
        ) : backgroundImage ? (
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-hero" />
        )}

        {/* Overlay */}
        {overlay?.enabled && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: overlay.color,
              opacity: overlay.opacity,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 py-16">
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
              <p
                className="text-base md:text-lg font-semibold mb-3 px-3 py-1.5 rounded-full inline-block"
                style={{
                  color: '#F1D0AB',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))'
                }}
              >
                {subtitle}
              </p>
            )}

            <h1
              className={`font-bold text-white mb-4 leading-tight ${
                currentLanguage === 'mm'
                  ? 'text-2xl md:text-3xl lg:text-4xl'
                  : 'text-3xl md:text-5xl lg:text-6xl'
              }`}
              style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}
            >
              {title}
            </h1>

            {description && (
              <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}

            {/* Action Buttons */}
            {(() => {
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
                              : "bg-white border-2 border-white text-gray-900 hover:bg-white/90 backdrop-blur-sm"
                          }
                          style={
                            button.style === "primary"
                              ? { backgroundColor: '#FF9B12', borderColor: '#FF9B12' }
                              : undefined
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
