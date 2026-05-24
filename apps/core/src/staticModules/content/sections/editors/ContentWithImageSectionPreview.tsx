'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@repo/ui';
import type { ContentWithImageSectionFormData } from './content-with-image-types';

interface ContentWithImageSectionPreviewProps {
  data: ContentWithImageSectionFormData;
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
    case 'portrait':
      return 'aspect-[3/4]';
    case 'landscape':
    default:
      return 'aspect-video';
  }
}

function buttonClass(style: string): string {
  switch (style) {
    case 'primary':
      return 'bg-primary text-primary-foreground hover:bg-primary/90';
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    case 'outline':
      return 'border border-current bg-transparent hover:bg-foreground/10';
    default:
      return 'bg-primary text-primary-foreground';
  }
}

export function ContentWithImageSectionPreview({
  data,
  language = 'en',
}: ContentWithImageSectionPreviewProps) {
  const headline = data.headline?.[language] || data.headline?.en || '';
  const content = data.content?.[language] || data.content?.en || '';
  const imageAlt =
    data.imageAlt?.[language] || data.imageAlt?.en || '';
  const buttonText =
    data.button?.text?.[language] || data.button?.text?.en || '';

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

  const imageOnLeft = data.imagePosition === 'left';
  const alignmentClass =
    data.contentAlignment === 'center'
      ? 'text-center items-center'
      : data.contentAlignment === 'right'
        ? 'text-right items-end'
        : 'text-left items-start';

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
      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center',
        )}
      >
        {/* Image */}
        <div
          className={cn(
            'rounded-lg overflow-hidden bg-muted relative',
            aspectClass(data.imageRatio),
            imageOnLeft ? 'md:order-1' : 'md:order-2',
          )}
        >
          {data.image ? (
            <img
              src={data.image}
              alt={imageAlt}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            'flex flex-col gap-3',
            alignmentClass,
            imageOnLeft ? 'md:order-2' : 'md:order-1',
          )}
        >
          {headline && (
            <h2
              className="text-xl md:text-3xl font-bold leading-tight"
              style={{
                color: data.textColors?.headline || undefined,
                fontSize: data.headlineSize
                  ? `${data.headlineSize}px`
                  : undefined,
              }}
            >
              {headline}
            </h2>
          )}
          {content ? (
            <p
              className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line"
              style={{
                color: data.textColors?.content || undefined,
                fontSize: data.contentSize
                  ? `${data.contentSize}px`
                  : undefined,
              }}
            >
              {content}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Body content goes here.
            </p>
          )}
          {data.button && buttonText && (
            <a
              href={data.button.url || '#'}
              target={data.button.openInNewTab ? '_blank' : undefined}
              rel={
                data.button.openInNewTab ? 'noopener noreferrer' : undefined
              }
              className={cn(
                'inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-md text-sm font-medium transition-colors mt-2',
                buttonClass(data.button.style),
                data.contentAlignment === 'center' && 'self-center',
                data.contentAlignment === 'right' && 'self-end',
              )}
              style={{
                color: data.textColors?.button || undefined,
              }}
            >
              {buttonText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
