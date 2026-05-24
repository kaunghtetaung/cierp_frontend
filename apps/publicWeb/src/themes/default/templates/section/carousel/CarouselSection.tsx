"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarouselSectionData, CarouselSlideData, SectionProps } from "../types";

const heightMap: Record<string, string> = {
  small: "min-h-[320px]",
  medium: "min-h-[480px]",
  large: "min-h-[600px]",
  fullscreen: "min-h-screen",
};

const transitionMap: Record<string, string> = {
  fade: "opacity",
  slide: "transform",
  zoom: "transform",
  none: "opacity",
};

/**
 * Carousel Section — multi-slide hero/banner where each slide can carry
 * any combination of background image/video, foreground image, title,
 * subtitle, description and buttons. Per-slide layout (`centered` /
 * `split-left` / `split-right` / `flat`) decides how those parts are
 * arranged. Empty fields are omitted, so the same slide template
 * doubles as a welcome banner, rector portrait, history block etc.
 *
 * `backgroundVideo` takes priority over `backgroundImage` when both
 * are set on the same slide.
 */
export function CarouselSection({
  section,
  currentLanguage = "en",
}: SectionProps<CarouselSectionData>) {
  const slides = section.slides || [];
  const [active, setActive] = useState(0);

  const autoplay = section.autoplay ?? true;
  const autoplaySpeed = section.autoplaySpeed ?? 8000;
  const transitionEffect = section.transitionEffect ?? "fade";
  const transitionDuration = section.transitionDuration ?? 600;

  // Auto-advance
  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    const interval = setInterval(
      () => setActive((p) => (p + 1) % slides.length),
      autoplaySpeed,
    );
    return () => clearInterval(interval);
  }, [autoplay, autoplaySpeed, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <section
      className={`relative w-full overflow-hidden ${heightMap[section.height || "large"]}`}
      data-section-id={section._id}
      data-section-type={section.type}
    >
      {slides.map((slide, idx) => (
        <div
          key={slide.id || idx}
          className={`absolute inset-0 transition-${transitionMap[transitionEffect]} ${
            idx === active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
          style={{ transitionDuration: `${transitionDuration}ms` }}
          aria-hidden={idx !== active}
        >
          <SlideRenderer slide={slide} language={currentLanguage} />
        </div>
      ))}

      {/* Arrows */}
      {(section.showArrows ?? true) && slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setActive((p) => (p - 1 + slides.length) % slides.length)
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/30 hover:bg-black/50 text-white p-3 transition backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setActive((p) => (p + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/30 hover:bg-black/50 text-white p-3 transition backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {(section.showDots ?? true) && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${
                i === active ? "bg-white w-8" : "bg-white/50 hover:bg-white/75 w-2"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface SlideRendererProps {
  slide: CarouselSlideData;
  language: "en" | "mm";
}

function SlideRenderer({ slide, language }: SlideRendererProps) {
  const title = slide.title?.[language] || slide.title?.en;
  const subtitle = slide.subtitle?.[language] || slide.subtitle?.en;
  const description =
    slide.description?.[language] || slide.description?.en;
  const buttons = slide.buttons || [];
  const layout = slide.layout || "centered";
  const contentStyle = slide.contentStyle || "flat";
  const textAlignment = slide.textAlignment || "center";

  const showForegroundImage = layout !== "flat" && !!slide.image;
  const isSplit = layout === "split-left" || layout === "split-right";

  const buttonClass = (style: "primary" | "secondary" | "outline") => {
    if (style === "secondary") {
      return "bg-white/90 text-foreground hover:bg-white";
    }
    if (style === "outline") {
      return "border border-white text-white hover:bg-white hover:text-foreground";
    }
    return "bg-primary text-primary-foreground hover:bg-primary/90";
  };

  const textAlignClass =
    textAlignment === "left"
      ? "text-left items-start"
      : textAlignment === "right"
      ? "text-right items-end"
      : "text-center items-center";

  const contentBoxClass =
    contentStyle === "boxed"
      ? "bg-black/40 backdrop-blur-sm rounded-lg p-6 md:p-8"
      : "";

  const justifyClass =
    textAlignment === "left"
      ? "justify-start"
      : textAlignment === "right"
      ? "justify-end"
      : "justify-center";

  const renderTextContent = () => (
    <div
      className={`relative z-10 flex flex-col gap-4 max-w-3xl ${textAlignClass} ${contentBoxClass}`}
    >
      {showForegroundImage && layout === "centered" && slide.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image}
          alt=""
          className="h-24 md:h-28 w-auto object-contain"
        />
      )}
      {subtitle && (
        <p className="text-sm md:text-base uppercase tracking-widest text-white/90">
          {subtitle}
        </p>
      )}
      {title && (
        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-base md:text-lg text-white/90 leading-relaxed">
          {description}
        </p>
      )}
      {buttons.length > 0 && (
        <div className={`flex flex-wrap gap-3 pt-3 ${justifyClass}`}>
          {buttons.map((b, i) => {
            const buttonText =
              b.text?.[language] || b.text?.en || "Button";
            return (
              <Link
                key={i}
                href={b.url || "#"}
                target={b.openInNewTab ? "_blank" : undefined}
                rel={b.openInNewTab ? "noopener noreferrer" : undefined}
                className={`px-5 py-2.5 rounded text-sm md:text-base font-medium transition-colors ${buttonClass(b.style)}`}
              >
                {buttonText}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0">
      {/* Background — video wins over image when both set */}
      {slide.backgroundVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={slide.backgroundVideo} />
        </video>
      ) : slide.backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
      )}

      {/* Overlay */}
      {slide.overlay?.enabled && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: slide.overlay.color || "#000000",
            opacity: slide.overlay.opacity ?? 0.4,
          }}
        />
      )}

      {/* Foreground content */}
      <div className="relative z-10 h-full px-6 md:px-12 lg:px-20 py-12 md:py-20 flex items-center">
        {isSplit ? (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-center w-full max-w-7xl mx-auto ${
              layout === "split-right" ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="flex justify-center md:justify-start">
              {showForegroundImage && slide.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.image}
                  alt=""
                  className="max-h-96 w-auto object-contain rounded shadow-2xl"
                />
              )}
            </div>
            <div>{renderTextContent()}</div>
          </div>
        ) : (
          <div
            className={`w-full max-w-7xl mx-auto flex ${justifyClass}`}
          >
            {renderTextContent()}
          </div>
        )}
      </div>
    </div>
  );
}

export default CarouselSection;
