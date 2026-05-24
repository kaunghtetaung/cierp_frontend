'use client';

import React from 'react';
import { cn, IconComponent } from '@repo/ui';
import type { StatsSectionFormData } from './stats-types';

interface StatsSectionPreviewProps {
  data: StatsSectionFormData;
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

export function StatsSectionPreview({
  data,
  language = 'en',
}: StatsSectionPreviewProps) {
  const headline = data.headline?.[language] || data.headline?.en || '';
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
    'bg-background rounded shadow-lg p-6 md:p-10',
    data.containerSettings?.width === 'fullWidth' ? 'w-full' : '',
    data.containerSettings?.width === 'contained' ? 'max-w-6xl mx-auto' : '',
  );

  const responsiveClasses = cn(
    data.responsiveSettings?.hideOnMobile ? 'hidden md:block' : '',
    data.responsiveSettings?.hideOnTablet ? 'md:hidden lg:block' : '',
    data.responsiveSettings?.hideOnDesktop ? 'lg:hidden' : '',
  );

  const counters = data.counters || [];
  const layout = data.layout || 'grid';
  const cols = data.columns || 4;

  // Grid: rows of `cols` cards. Row layout: horizontal scroll-friendly
  // single row (still wraps on narrow viewports for sanity).
  const containerLayoutClass =
    layout === 'row'
      ? 'flex flex-wrap gap-4'
      : cn(
          'grid gap-4',
          cols === 1 && 'grid-cols-1',
          cols === 2 && 'grid-cols-1 sm:grid-cols-2',
          cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          cols === 4 && 'grid-cols-2 lg:grid-cols-4',
        );

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
      {(headline || description) && (
        <div className="text-center mb-8 md:mb-10">
          {headline && (
            <h2
              className="text-2xl md:text-4xl font-bold leading-tight"
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
          {description && (
            <p
              className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto"
              style={{
                color: data.textColors?.description || undefined,
                fontSize: data.descriptionSize
                  ? `${data.descriptionSize}px`
                  : undefined,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {counters.length === 0 ? (
        <div className="text-sm italic text-muted-foreground text-center py-8">
          Add at least one counter in the editor.
        </div>
      ) : (
        <div className={containerLayoutClass}>
          {counters.map((c, idx) => {
            const title = c.title?.[language] || c.title?.en || '';
            const desc =
              c.description?.[language] || c.description?.en || '';
            return (
              <div
                key={idx}
                className={cn(
                  'rounded-lg p-5 md:p-6 flex flex-col gap-2 transition-shadow shadow-sm hover:shadow-md',
                  layout === 'row' && 'flex-1 min-w-[180px]',
                )}
                style={{
                  backgroundColor: c.bgColor,
                  color: c.textColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center justify-center h-10 w-10 rounded-md"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <IconComponent
                      name={c.icon}
                      size={20}
                      color={c.iconColor || c.textColor}
                    />
                  </div>
                  <span
                    className="text-2xl md:text-3xl font-bold tabular-nums"
                    style={{ color: c.textColor }}
                  >
                    {c.count || '0'}
                  </span>
                </div>
                <div>
                  <h3
                    className="text-sm md:text-base font-semibold"
                    style={{ color: c.textColor }}
                  >
                    {title || `Counter ${idx + 1}`}
                  </h3>
                  {desc && (
                    <p
                      className="text-xs md:text-sm mt-0.5 opacity-80"
                      style={{ color: c.textColor }}
                    >
                      {desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
