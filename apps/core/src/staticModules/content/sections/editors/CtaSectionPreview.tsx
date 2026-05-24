'use client';

import React from 'react';
import { cn } from '@repo/ui';
import type { CtaSectionFormData } from './cta-types';

interface CtaSectionPreviewProps {
  data: CtaSectionFormData;
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

function buttonStyleClass(style: string, fallbackTextColor?: string): string {
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

export function CtaSectionPreview({
  data,
  language = 'en',
}: CtaSectionPreviewProps) {
  const headline =
    data.headline?.[language] || data.headline?.en || 'Your headline here';
  const description =
    data.description?.[language] || data.description?.en || '';

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
    'relative overflow-hidden rounded-lg shadow-lg',
    data.containerSettings?.width === 'fullWidth' ? 'w-full' : '',
    data.containerSettings?.width === 'contained' ? 'max-w-6xl mx-auto' : '',
  );

  const responsiveClasses = cn(
    data.responsiveSettings?.hideOnMobile ? 'hidden md:block' : '',
    data.responsiveSettings?.hideOnTablet ? 'md:hidden lg:block' : '',
    data.responsiveSettings?.hideOnDesktop ? 'lg:hidden' : '',
  );

  const alignClass =
    data.alignment === 'left'
      ? 'text-left items-start'
      : data.alignment === 'right'
        ? 'text-right items-end'
        : 'text-center items-center';

  const innerStyle: React.CSSProperties = {
    backgroundImage: data.backgroundImage
      ? `url(${data.backgroundImage})`
      : undefined,
    backgroundColor: data.backgroundColor || undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: data.textColor || undefined,
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
      <div
        className="relative px-6 py-12 md:px-12 md:py-20"
        style={innerStyle}
      >
        {/* Auto overlay when there's a background image — improves headline
            legibility without the author having to set it manually. */}
        {data.backgroundImage && (
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        )}

        <div
          className={cn(
            'relative max-w-3xl mx-auto flex flex-col gap-4',
            alignClass,
          )}
        >
          <h2
            className="text-2xl md:text-4xl font-bold leading-tight"
            style={{
              color:
                data.textColors?.headline ||
                (data.backgroundImage ? '#ffffff' : data.textColor),
              fontSize: data.headlineSize ? `${data.headlineSize}px` : undefined,
            }}
          >
            {headline}
          </h2>
          {description && (
            <p
              className="text-sm md:text-base opacity-90 leading-relaxed"
              style={{
                color:
                  data.textColors?.description ||
                  (data.backgroundImage
                    ? 'rgba(255,255,255,0.85)'
                    : undefined),
                fontSize: data.descriptionSize
                  ? `${data.descriptionSize}px`
                  : undefined,
              }}
            >
              {description}
            </p>
          )}

          {data.buttons && data.buttons.length > 0 && (
            <div
              className={cn(
                'flex flex-wrap gap-3 mt-2',
                data.alignment === 'center' && 'justify-center',
                data.alignment === 'right' && 'justify-end',
              )}
            >
              {data.buttons.map((btn, idx) => {
                const text = btn.text?.[language] || btn.text?.en || `Button ${idx + 1}`;
                return (
                  <a
                    key={idx}
                    href={btn.url || '#'}
                    target={btn.openInNewTab ? '_blank' : undefined}
                    rel={btn.openInNewTab ? 'noopener noreferrer' : undefined}
                    className={cn(
                      'inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors',
                      buttonStyleClass(btn.style, data.textColors?.button),
                    )}
                    style={{
                      color: data.textColors?.button || undefined,
                    }}
                  >
                    {text}
                  </a>
                );
              })}
            </div>
          )}

          {(!data.buttons || data.buttons.length === 0) && (
            <div className="text-xs italic opacity-70">
              Add at least one button in the editor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
