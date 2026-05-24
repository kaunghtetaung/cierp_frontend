'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { cn } from '@repo/ui';
import type { GallerySectionFormData } from './gallery-types';

interface GallerySectionPreviewProps {
  data: GallerySectionFormData;
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

function aspectClass(ratio: string): string {
  switch (ratio) {
    case 'square':
      return 'aspect-square';
    case 'landscape':
      return 'aspect-video';
    case 'portrait':
      return 'aspect-[3/4]';
    default:
      return '';
  }
}

function colsClass(n: number): string {
  switch (n) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-1 sm:grid-cols-2';
    case 3:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    case 4:
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    case 5:
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
    default:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }
}

export function GallerySectionPreview({
  data,
  language = 'en',
}: GallerySectionPreviewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Reset indices when items change.
  useEffect(() => {
    if (
      lightboxIndex !== null &&
      lightboxIndex >= (data.images?.length || 0)
    ) {
      setLightboxIndex(null);
    }
    if (carouselIndex >= (data.images?.length || 0)) {
      setCarouselIndex(0);
    }
  }, [data.images?.length, lightboxIndex, carouselIndex]);

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
    'bg-background rounded shadow-lg p-4 md:p-6',
    data.containerSettings?.width === 'fullWidth' ? 'w-full' : '',
    data.containerSettings?.width === 'contained' ? 'max-w-6xl mx-auto' : '',
  );

  const responsiveClasses = cn(
    data.responsiveSettings?.hideOnMobile ? 'hidden md:block' : '',
    data.responsiveSettings?.hideOnTablet ? 'md:hidden lg:block' : '',
    data.responsiveSettings?.hideOnDesktop ? 'lg:hidden' : '',
  );

  const images = data.images || [];

  const renderImage = (
    img: (typeof images)[number],
    idx: number,
    extra: { masonry?: boolean } = {},
  ) => {
    const url = img.url;
    const alt = img.alt?.[language] || img.alt?.en || '';
    const caption = img.caption?.[language] || img.caption?.en || '';
    const Wrapper: any = img.link ? 'a' : 'div';
    const wrapperProps: any = img.link
      ? {
          href: img.link,
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      : {};
    return (
      <figure
        key={idx}
        className={cn(
          'overflow-hidden rounded-md bg-muted relative group',
          extra.masonry ? 'mb-3 break-inside-avoid' : '',
        )}
      >
        <Wrapper
          {...wrapperProps}
          onClick={(e: React.MouseEvent) => {
            if (!img.link && data.lightbox) {
              e.preventDefault();
              setLightboxIndex(idx);
            }
          }}
          className={cn(
            'block relative cursor-pointer',
            !extra.masonry && aspectClass(data.aspectRatio || 'auto'),
          )}
        >
          {url ? (
            <img
              src={url}
              alt={alt}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Images className="h-8 w-8" />
            </div>
          )}
        </Wrapper>
        {data.showCaptions && caption && (
          <figcaption
            className="px-2 py-1.5 text-xs text-muted-foreground"
            style={{ color: data.textColors?.caption || undefined }}
          >
            {caption}
          </figcaption>
        )}
      </figure>
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
      {(data.headline?.[language] ||
        data.headline?.en ||
        data.description?.[language] ||
        data.description?.en) && (
        <div className="text-center mb-6">
          {(data.headline?.[language] || data.headline?.en) && (
            <h2
              className="text-xl md:text-2xl font-bold mb-2"
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
              className="text-sm text-muted-foreground"
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

      {images.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Images className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            No images yet. Add some via the editor.
          </p>
        </div>
      ) : data.layout === 'grid' ? (
        <div
          className={cn(
            'grid gap-3',
            colsClass(data.columns ?? 3),
          )}
        >
          {images.map((img, idx) => renderImage(img, idx))}
        </div>
      ) : data.layout === 'masonry' ? (
        <div
          className="columns-2 md:columns-3 lg:columns-4 gap-3"
          style={{ columnCount: data.columns }}
        >
          {images.map((img, idx) => renderImage(img, idx, { masonry: true }))}
        </div>
      ) : (
        // Carousel
        <div className="relative max-w-3xl mx-auto">
          <div
            className={cn(
              'rounded-lg overflow-hidden bg-muted',
              aspectClass(data.aspectRatio || 'landscape'),
            )}
          >
            {images[carouselIndex]?.url && (
              <img
                src={images[carouselIndex].url}
                alt={
                  images[carouselIndex].alt?.[language] ||
                  images[carouselIndex].alt?.en ||
                  ''
                }
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
          {data.showCaptions &&
            (images[carouselIndex]?.caption?.[language] ||
              images[carouselIndex]?.caption?.en) && (
              <p
                className="text-center mt-2 text-sm text-muted-foreground"
                style={{ color: data.textColors?.caption || undefined }}
              >
                {images[carouselIndex].caption?.[language] ||
                  images[carouselIndex].caption?.en}
              </p>
            )}
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              type="button"
              onClick={() =>
                setCarouselIndex(
                  (i) => (i - 1 + images.length) % images.length,
                )
              }
              className="h-8 w-8 rounded-full border bg-background hover:bg-muted flex items-center justify-center"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {carouselIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() =>
                setCarouselIndex((i) => (i + 1) % images.length)
              }
              className="h-8 w-8 rounded-full border bg-background hover:bg-muted flex items-center justify-center"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox — minimal modal-style overlay; no portal needed since the
          preview itself is already mounted inside a dialog. */}
      {data.lightbox && lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>
          {lightboxIndex > 0 && (
            <button
              type="button"
              className="absolute left-4 text-white hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) =>
                  i !== null ? Math.max(0, i - 1) : 0,
                );
              }}
              aria-label="Previous"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          <div
            className="max-w-5xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].url}
              alt={
                images[lightboxIndex].alt?.[language] ||
                images[lightboxIndex].alt?.en ||
                ''
              }
              className="max-w-full max-h-[85vh] object-contain"
            />
            {data.showCaptions &&
              (images[lightboxIndex].caption?.[language] ||
                images[lightboxIndex].caption?.en) && (
                <p className="text-center text-white text-sm mt-2">
                  {images[lightboxIndex].caption?.[language] ||
                    images[lightboxIndex].caption?.en}
                </p>
              )}
          </div>
          {lightboxIndex < images.length - 1 && (
            <button
              type="button"
              className="absolute right-4 text-white hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) =>
                  i !== null ? Math.min(images.length - 1, i + 1) : 0,
                );
              }}
              aria-label="Next"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
