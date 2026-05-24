"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  CarouselSectionData,
  CarouselSlideData,
  SectionProps,
} from "@/themes/default/templates/section/types";
import { getLocalizedText } from "@/themes/default/templates/section/utils";

const heightMap: Record<string, string> = {
  small: "min-h-[360px]",
  medium: "min-h-[520px]",
  large: "min-h-[640px] md:min-h-[680px]",
  fullscreen: "min-h-screen",
};

/**
 * um1sf Carousel — full-bleed editorial slides used as the home-page
 * banner. Mirrors the Stanford-leaning visual rhythm of the rest of
 * the theme: large serif title, subtitle wrapped in a translucent
 * dark backdrop chip for legibility over photos, a thin red rule
 * under the title, and theme-coloured dots.
 *
 * Subtitle is the field the editorial designs put in front of the
 * cover photo (degrees, taglines), so it MUST stay readable on any
 * image. We wrap the subtitle text in an inline chip with
 * `bg-black/80` (the 0.8-opacity backdrop the user asked for) and a
 * subtle backdrop blur — a `<span>` chip rather than a full-width
 * bar so left / center / right alignment still works naturally.
 */
export function CarouselSection({
  section,
  currentLanguage = "en",
}: SectionProps<CarouselSectionData>) {
  const slides = section.slides ?? [];
  const [active, setActive] = useState(0);

  const autoplay = section.autoplay ?? true;
  const autoplaySpeed = section.autoplaySpeed ?? 8000;
  const transitionDuration = section.transitionDuration ?? 600;
  const showDots = section.showDots ?? true;
  const showArrows = section.showArrows ?? true;
  const heightClass = heightMap[section.height ?? "large"];

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    const t = setInterval(
      () => setActive((p) => (p + 1) % slides.length),
      autoplaySpeed,
    );
    return () => clearInterval(t);
  }, [autoplay, autoplaySpeed, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className={`group relative w-full overflow-hidden ${heightClass}`}
      data-section-id={section._id}
      data-section-type="carousel"
    >
      {/* Slow Ken-Burns-style zoom on the active slide adds cinematic
          movement without distracting from the content. Defined via
          inline <style> so we don't need to wire a Tailwind keyframe. */}
      <style>{`
        @keyframes um1sfSlowZoom {
          0%   { transform: scale(1);    }
          100% { transform: scale(1.08); }
        }
        .um1sf-carousel-active-bg {
          animation: um1sfSlowZoom ${Math.max(autoplaySpeed * 1.2, 9000)}ms ease-out forwards;
        }
      `}</style>

      {slides.map((slide, idx) => (
        <div
          key={slide.id || idx}
          className={`absolute inset-0 transition-opacity ${
            idx === active
              ? "opacity-100 z-10"
              : "opacity-0 z-0 pointer-events-none"
          }`}
          style={{ transitionDuration: `${transitionDuration}ms` }}
          aria-hidden={idx !== active}
        >
          <Slide
            slide={slide}
            language={currentLanguage}
            isActive={idx === active}
          />
        </div>
      ))}

      {/* Top + bottom edge vignettes — subtle, always on, give the
          slides a more cinematic frame. */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-20 pointer-events-none" />

      {showArrows && slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setActive((p) => (p - 1 + slides.length) % slides.length)
            }
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/10 hover:bg-white/25 text-white p-3 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md ring-1 ring-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setActive((p) => (p + 1) % slides.length)}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/10 hover:bg-white/25 text-white p-3 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md ring-1 ring-white/20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? "h-1.5 w-10"
                  : "h-1.5 w-1.5 bg-white/45 hover:bg-white/80"
              }`}
              style={
                i === active
                  ? { backgroundColor: "var(--color-primary)" }
                  : undefined
              }
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-advance progress bar — thin red line at the very bottom
          that fills over `autoplaySpeed`, restarts on each slide.
          Subtle enough to not distract; reinforces the carousel's
          rhythm. Hidden when autoplay is off or there's only one slide. */}
      {autoplay && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-30">
          <div
            key={`progress-${active}`}
            className="h-full"
            style={{
              backgroundColor: "var(--color-primary)",
              animation: `um1sfProgress ${autoplaySpeed}ms linear forwards`,
            }}
          />
          <style>{`
            @keyframes um1sfProgress {
              from { width: 0%;   }
              to   { width: 100%; }
            }
          `}</style>
        </div>
      )}
    </section>
  );
}

function Slide({
  slide,
  language,
  isActive,
}: {
  slide: CarouselSlideData;
  language: "en" | "mm";
  isActive: boolean;
}) {
  const title = getLocalizedText(slide.title, language);
  const subtitle = getLocalizedText(slide.subtitle, language);
  const description = getLocalizedText(slide.description, language);
  const buttons = slide.buttons ?? [];
  const textAlignment = slide.textAlignment ?? "center";
  const contentStyle = slide.contentStyle ?? "flat";

  const alignClass =
    textAlignment === "left"
      ? "text-left items-start"
      : textAlignment === "right"
        ? "text-right items-end"
        : "text-center items-center";

  // Horizontal placement of the content box ITSELF (left / center /
  // right within the slide). Cross-axis on a flex-col is horizontal,
  // so this is `items-*` on the middle wrapper. Without this the
  // box sat at the left edge regardless of textAlignment because
  // the wrapper's default was `items-stretch` capped at max-w-3xl.
  const wrapperItemsClass =
    textAlignment === "left"
      ? "items-start"
      : textAlignment === "right"
        ? "items-end"
        : "items-center";

  const justifyClass =
    textAlignment === "left"
      ? "justify-start"
      : textAlignment === "right"
        ? "justify-end"
        : "justify-center";

  // Per-slide title size. Boxed slides (rector card, "Our History"
  // plate) live INSIDE a `max-w-3xl` translucent box and need a
  // calmer scale; flat slides (the welcome banner) keep the full
  // hero treatment.
  const titleSizeClass =
    contentStyle === "boxed"
      ? "text-xl md:text-2xl lg:text-3xl"
      : "text-3xl md:text-5xl lg:text-6xl";

  // `boxed` slides wrap the entire content stack in a translucent
  // dark plate; `flat` slides only wrap the subtitle chip below.
  // Plate kept at ~35% so the photo behind it still reads through.
  const contentBoxClass =
    contentStyle === "boxed"
      ? "bg-black/35 backdrop-blur-sm rounded-lg p-6 md:p-8"
      : "";

  const buttonClass = (style?: "primary" | "secondary" | "outline") => {
    if (style === "secondary") {
      return "bg-white/95 text-foreground hover:bg-white";
    }
    if (style === "outline") {
      return "border border-white text-white hover:bg-white hover:text-foreground";
    }
    // primary — cardinal red, theme-driven so it tracks the palette.
    return "text-white hover:opacity-90";
  };

  return (
    <div className="absolute inset-0">
      {/* Background — video wins when both are set. The active slide's
          image gets a slow-zoom (Ken Burns) treatment for a more
          cinematic feel; inactive slides stay still to avoid wasting
          CPU on hidden content. */}
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
          className={`absolute inset-0 bg-cover bg-center will-change-transform ${
            isActive ? "um1sf-carousel-active-bg" : ""
          }`}
          style={{ backgroundImage: `url(${slide.backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}

      {/* Background readability layer.
          - If the author enabled a custom overlay, use that exactly.
          - Otherwise apply a sensible default so titles stay legible
            on bright photos without making authors think about it.
            Flat slides (text directly on the photo) get a stronger
            ~50% black wash; boxed slides already have a plate over
            the content, so a lighter ~25% top-to-bottom gradient is
            enough to soften the edges. */}
      {slide.overlay?.enabled ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: slide.overlay.color || "#000000",
            opacity: slide.overlay.opacity ?? 0.4,
          }}
        />
      ) : contentStyle === "flat" ? (
        <div className="absolute inset-0 bg-black/50" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-black/10" />
      )}

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex">
        <div
          className={`w-full flex flex-col gap-5 ${wrapperItemsClass} my-auto`}
        >
          <div
            className={`flex flex-col gap-4 max-w-3xl ${alignClass} ${contentBoxClass}`}
          >
            {/*
              Foreground image — only rendered for `boxed` slides that
              actually carry a photo (e.g., the rector portrait).
              Treatment: rounded portrait frame with a cardinal-red
              accent ring + soft outer shadow, sitting at the top of
              the plate. Centered within the plate even when the
              surrounding text alignment is left.
            */}
            {contentStyle === "boxed" && slide.image && (
              <div className="self-center relative">
                <div
                  className="absolute -inset-1 rounded-full opacity-40 blur-md"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image}
                  alt=""
                  className="relative h-32 md:h-40 w-32 md:w-40 object-cover rounded-full ring-4 ring-white/80 shadow-2xl"
                />
              </div>
            )}

            {/*
              Subtitle — two presentations:
              - `flat`  → translucent chip with a small cardinal-red
                          leading dot, evoking the editorial "kicker"
                          treatment used by Stanford / NYT.
              - `boxed` → plain uppercase tracked text. The surrounding
                          dark plate already provides the backdrop, so
                          a second chip would feel redundant.
            */}
            {subtitle && contentStyle === "flat" && (
              <span
                className={
                  "inline-flex items-center gap-2 bg-black/50 backdrop-blur-md text-white text-xs sm:text-sm uppercase tracking-[0.22em] px-4 py-2 rounded-full w-fit ring-1 ring-white/15 " +
                  (textAlignment === "center"
                    ? "self-center"
                    : textAlignment === "right"
                      ? "self-end"
                      : "self-start")
                }
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                  aria-hidden
                />
                {subtitle}
              </span>
            )}

            {title && (
              <h2
                className={`${titleSizeClass} font-bold text-white leading-[1.05] tracking-tight`}
                style={{
                  fontFamily: "var(--font-serif)",
                  // Soft text-shadow on flat slides keeps the title
                  // crisp on busy photography. Boxed slides already
                  // sit on a dark plate so they don't need it.
                  textShadow:
                    contentStyle === "flat"
                      ? "0 2px 18px rgba(0,0,0,0.45)"
                      : undefined,
                }}
              >
                {title}
              </h2>
            )}

            {/* Boxed-slide subtitle (after the title). For the rector
                card this is the degrees line. No backdrop chip — the
                box itself already provides the dark plate. */}
            {subtitle && contentStyle === "boxed" && (
              <p
                className="text-xs md:text-sm text-white/80 leading-snug italic"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {subtitle}
              </p>
            )}

            {/* Cardinal accent rule — under the title (or the rector
                degrees on boxed slides). Refined: a 2px line with a
                subtle gradient fade so it reads less like a bar. */}
            {title && (
              <div
                className={
                  "h-[3px] w-20 rounded-full " +
                  (textAlignment === "center"
                    ? "self-center"
                    : textAlignment === "right"
                      ? "self-end"
                      : "self-start")
                }
                style={{
                  background: `linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary) 60%, transparent 100%)`,
                }}
              />
            )}

            {description && (
              <p
                className="text-base md:text-lg text-white/90 leading-relaxed max-w-2xl"
                style={{
                  fontFamily: "var(--font-sans)",
                  textShadow:
                    contentStyle === "flat"
                      ? "0 1px 8px rgba(0,0,0,0.35)"
                      : undefined,
                }}
              >
                {description}
              </p>
            )}

            {buttons.length > 0 && (
              <div className={`flex flex-wrap gap-3 pt-3 ${justifyClass}`}>
                {buttons.map((b, i) => (
                  <Link
                    key={i}
                    href={b.url || "#"}
                    target={b.openInNewTab ? "_blank" : undefined}
                    rel={b.openInNewTab ? "noopener noreferrer" : undefined}
                    className={`px-7 py-3 rounded-md text-sm md:text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${buttonClass(
                      b.style,
                    )}`}
                    style={
                      (b.style ?? "primary") === "primary"
                        ? { backgroundColor: "var(--color-primary)" }
                        : undefined
                    }
                  >
                    {getLocalizedText(b.text, language) || "Button"}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarouselSection;
