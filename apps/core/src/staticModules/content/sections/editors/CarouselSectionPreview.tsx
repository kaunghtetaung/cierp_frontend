'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@repo/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  CarouselSectionFormData,
  CarouselSlideFormData,
} from './carousel-types';

interface CarouselSectionPreviewProps {
  data: CarouselSectionFormData;
  language?: 'en' | 'mm';
}

const heightMap: Record<string, string> = {
  small: '320px',
  medium: '480px',
  large: '600px',
  fullscreen: '720px',
};

export function CarouselSectionPreview({
  data,
  language = 'en',
}: CarouselSectionPreviewProps) {
  const slides = data.slides || [];
  const [active, setActive] = useState(0);

  // Reset to first slide when slide count changes (e.g. user adds/removes).
  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [slides.length, active]);

  if (slides.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/50 rounded shadow-lg border"
        style={{ height: heightMap[data.height || 'large'] }}
      >
        <p className="text-sm text-muted-foreground">
          Add a slide to preview the carousel
        </p>
      </div>
    );
  }

  const slide = slides[active];

  return (
    <div
      className="relative rounded shadow-lg border overflow-hidden"
      style={{ height: heightMap[data.height || 'large'] }}
    >
      <SlideRender slide={slide} language={language} />

      {/* Arrows */}
      {(data.showArrows ?? true) && slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setActive((p) => (p - 1 + slides.length) % slides.length)
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 hover:bg-black/50 text-white p-2 transition"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setActive((p) => (p + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 hover:bg-black/50 text-white p-2 transition"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {(data.showDots ?? true) && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === active ? 'bg-white w-6' : 'bg-white/50 w-2',
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SlideRenderProps {
  slide: CarouselSlideFormData;
  language: 'en' | 'mm';
}

function SlideRender({ slide, language }: SlideRenderProps) {
  const buttonStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    outline:
      'border border-foreground text-foreground hover:bg-foreground hover:text-background',
  };

  const title = slide.title?.[language] || slide.title?.en;
  const subtitle = slide.subtitle?.[language] || slide.subtitle?.en;
  const description = slide.description?.[language] || slide.description?.en;
  const buttons = slide.buttons || [];

  // Background — video wins over image when both set.
  const hasVideo = !!slide.backgroundVideo;
  const hasImage = !!slide.backgroundImage;

  // Layout decides flex direction + image position. `flat` skips the
  // foreground image entirely.
  const layout = slide.layout || 'centered';
  const showForegroundImage = layout !== 'flat' && !!slide.image;

  const contentBoxClasses = cn(
    slide.contentStyle === 'boxed'
      ? 'bg-black/40 backdrop-blur-sm rounded-lg p-6'
      : '',
  );

  const textAlignClass =
    slide.textAlignment === 'left'
      ? 'text-left items-start'
      : slide.textAlignment === 'right'
      ? 'text-right items-end'
      : 'text-center items-center';

  const renderContent = () => (
    <div
      className={cn(
        'relative z-10 flex flex-col gap-3 max-w-3xl',
        textAlignClass,
        contentBoxClasses,
      )}
    >
      {showForegroundImage && layout === 'centered' && (
        <img
          src={slide.image}
          alt=""
          className="h-20 w-auto object-contain"
        />
      )}
      {subtitle && (
        <p className="text-sm uppercase tracking-widest text-white/85">
          {subtitle}
        </p>
      )}
      {title && (
        <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-sm md:text-base text-white/90 leading-snug">
          {description}
        </p>
      )}
      {buttons.length > 0 && (
        <div
          className={cn(
            'flex flex-wrap gap-2 pt-2',
            slide.textAlignment === 'left'
              ? 'justify-start'
              : slide.textAlignment === 'right'
              ? 'justify-end'
              : 'justify-center',
          )}
        >
          {buttons.map((b, i) => (
            <a
              key={i}
              href={b.url || '#'}
              className={cn(
                'px-4 py-2 rounded text-sm font-medium transition-colors',
                buttonStyles[b.style] || buttonStyles.primary,
              )}
            >
              {b.text?.[language] || b.text?.en || 'Button'}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  // Split layouts use a 2-column grid, centered/flat use a single column.
  const isSplit = layout === 'split-left' || layout === 'split-right';

  return (
    <div className="absolute inset-0">
      {/* Background */}
      {hasVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={slide.backgroundVideo} />
        </video>
      ) : hasImage ? (
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
            backgroundColor: slide.overlay.color || '#000000',
            opacity: slide.overlay.opacity ?? 0.4,
          }}
        />
      )}

      {/* Foreground content */}
      <div className="relative z-10 h-full px-6 md:px-12 py-8 md:py-16 flex items-center">
        {isSplit ? (
          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full',
              layout === 'split-right' ? 'md:[&>*:first-child]:order-2' : '',
            )}
          >
            <div className="flex justify-center md:justify-start">
              {showForegroundImage && (
                <img
                  src={slide.image}
                  alt=""
                  className="max-h-72 w-auto object-contain rounded shadow-xl"
                />
              )}
            </div>
            <div>{renderContent()}</div>
          </div>
        ) : (
          <div
            className={cn(
              'w-full flex',
              slide.textAlignment === 'left'
                ? 'justify-start'
                : slide.textAlignment === 'right'
                ? 'justify-end'
                : 'justify-center',
            )}
          >
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}
