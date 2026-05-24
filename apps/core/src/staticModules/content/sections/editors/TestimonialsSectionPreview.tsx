'use client';

import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@repo/ui';
import type { TestimonialsSectionFormData } from './testimonials-types';

interface TestimonialsSectionPreviewProps {
  data: TestimonialsSectionFormData;
  language?: 'en' | 'mm';
}

function getSpacingValue(value: string): string {
  const map: Record<string, string> = {
    none: '0',
    sm: '1rem',
    md: '2rem',
    lg: '4rem',
    xl: '6rem',
  };
  return map[value] || value;
}

export function TestimonialsSectionPreview({
  data,
  language = 'en',
}: TestimonialsSectionPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset index when items change so we don't point at a deleted entry.
  useEffect(() => {
    setActiveIndex(0);
  }, [data.testimonials?.length]);

  // Carousel autoplay — pure setInterval; no external deps.
  useEffect(() => {
    if (data.layout !== 'carousel' || !data.autoplay) return;
    if (!data.testimonials?.length) return;
    const speed = data.autoplaySpeed ?? 5000;
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % data.testimonials.length);
    }, speed);
    return () => clearInterval(t);
  }, [data.layout, data.autoplay, data.autoplaySpeed, data.testimonials?.length]);

  const spacingStyles: React.CSSProperties = {
    paddingTop: data.spacing?.paddingTop
      ? getSpacingValue(data.spacing.paddingTop)
      : undefined,
    paddingBottom: data.spacing?.paddingBottom
      ? getSpacingValue(data.spacing.paddingBottom)
      : undefined,
    paddingLeft: data.spacing?.paddingLeft
      ? getSpacingValue(data.spacing.paddingLeft)
      : undefined,
    paddingRight: data.spacing?.paddingRight
      ? getSpacingValue(data.spacing.paddingRight)
      : undefined,
    marginTop: data.spacing?.marginTop
      ? getSpacingValue(data.spacing.marginTop)
      : undefined,
    marginBottom: data.spacing?.marginBottom
      ? getSpacingValue(data.spacing.marginBottom)
      : undefined,
  };

  const containerClasses = cn(
    'bg-background rounded shadow-lg p-6 md:p-10',
    data.containerSettings?.width === 'fullWidth' ? 'w-full' : '',
    data.containerSettings?.width === 'contained' ? 'max-w-6xl mx-auto' : '',
  );

  const responsiveClasses = cn(
    data.responsiveSettings?.hideOnMobile ? 'hidden md:block' : '',
    data.responsiveSettings?.hideOnTablet ? 'md:hidden lg:block' : '',
    data.responsiveSettings?.hideOnDesktop ? 'lg:hidden' : '',
  );

  const items = data.testimonials || [];

  const renderCard = (
    item: (typeof items)[number],
    idx: number,
    extraClass = '',
  ) => {
    const quote = item.quote?.[language] || item.quote?.en || '';
    const a = item.author;
    // Author `name` and `title` are MultiLanguageText. Pick the active
    // language with EN fallback so missing MM data doesn't render blank.
    const authorName =
      (a?.name as any)?.[language] || (a?.name as any)?.en || '';
    const authorTitle =
      (a?.title as any)?.[language] || (a?.title as any)?.en || '';
    return (
      <div
        key={idx}
        className={cn(
          'rounded-lg border bg-muted/30 p-5 flex flex-col gap-4',
          extraClass,
        )}
      >
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: data.textColors?.quote || undefined }}
        >
          “{quote || 'Add a testimonial quote in the editor.'}”
        </p>
        {data.showRatings && item.rating && (
          <div className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < (item.rating ?? 0) ? 'fill-current' : 'text-muted'
                }`}
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-auto">
          {data.showAvatars && (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {a?.avatar ? (
                <img
                  src={a.avatar}
                  alt={authorName || 'Author'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: data.textColors?.author || undefined }}
            >
              {authorName || 'Author name'}
            </div>
            {(authorTitle || a?.company) && (
              <div className="text-[11px] text-muted-foreground truncate">
                {authorTitle}
                {authorTitle && a?.company ? ' · ' : ''}
                {a?.company}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(containerClasses, responsiveClasses)}
      style={{
        ...spacingStyles,
        maxWidth:
          data.containerSettings?.width === 'custom'
            ? data.containerSettings.maxWidth
            : undefined,
      }}
    >
      {/* Header */}
      {(data.headline?.[language] ||
        data.headline?.en ||
        data.description?.[language] ||
        data.description?.en) && (
        <div className="text-center mb-8">
          {(data.headline?.[language] || data.headline?.en) && (
            <h2
              className="text-xl md:text-3xl font-bold mb-2"
              style={{
                color: data.textColors?.headline || undefined,
                fontSize: data.headlineSize
                  ? `${data.headlineSize}px`
                  : undefined,
              }}
            >
              {data.headline?.[language] || data.headline?.en}
            </h2>
          )}
          {(data.description?.[language] || data.description?.en) && (
            <p
              className="text-sm text-muted-foreground max-w-2xl mx-auto"
              style={{
                color: data.textColors?.description || undefined,
                fontSize: data.descriptionSize
                  ? `${data.descriptionSize}px`
                  : undefined,
              }}
            >
              {data.description?.[language] || data.description?.en}
            </p>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            No testimonials yet. Add some in the editor.
          </p>
        </div>
      ) : data.layout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => renderCard(item, idx))}
        </div>
      ) : data.layout === 'single' ? (
        <div className="max-w-2xl mx-auto">
          {renderCard(items[0], 0)}
        </div>
      ) : (
        // Carousel
        <div className="relative">
          <div className="max-w-2xl mx-auto">
            {renderCard(items[activeIndex] || items[0], activeIndex)}
          </div>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((i) => (i - 1 + items.length) % items.length)
              }
              className="h-8 w-8 rounded-full border bg-background hover:bg-muted flex items-center justify-center"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex
                      ? 'w-6 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex((i) => (i + 1) % items.length)}
              className="h-8 w-8 rounded-full border bg-background hover:bg-muted flex items-center justify-center"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
