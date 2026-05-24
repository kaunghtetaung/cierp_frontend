'use client';

import React from 'react';
import { cn } from '@repo/ui';
import { IconComponent } from '@repo/ui/components/icons/IconComponent';
import type {
  FeatureListSectionFormData,
  FeatureItemFormData,
} from './feature-list-types';

interface FeatureListSectionPreviewProps {
  data: FeatureListSectionFormData;
  language?: 'en' | 'mm';
}

// Map string spacing tokens (none / sm / md / lg / xl) to CSS rem values.
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

// Per-feature background → CSSProperties. `none` falls through to {}.
function buildBackgroundStyle(background?: {
  type: string;
  image?: string;
  solid?: string;
  gradient?: any;
}): React.CSSProperties {
  if (!background || background.type === 'none') return {};
  if (background.type === 'image' && background.image) {
    return {
      backgroundImage: `url(${background.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  if (background.type === 'solid' && background.solid) {
    return { backgroundColor: background.solid };
  }
  if (background.type === 'gradient' && background.gradient) {
    const { type: gradType, angle = 0, stops = [] } = background.gradient;
    if (stops.length > 0) {
      const colorStops = stops
        .map((stop: any) => `${stop.color} ${stop.position}%`)
        .join(', ');
      if (gradType === 'linear') {
        return {
          backgroundImage: `linear-gradient(${angle}deg, ${colorStops})`,
        };
      }
      if (gradType === 'radial') {
        return {
          backgroundImage: `radial-gradient(circle, ${colorStops})`,
        };
      }
    }
  }
  return {};
}

// Tailwind alignment lookups — kept top-level so the per-card and
// per-section header components can share them.
const TEXT_ALIGN: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};
const FLEX_ALIGN: Record<'left' | 'center' | 'right', string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

// ──────────────────────────────────────────────────────────────────────
// FeatureCard — single source of truth for grid / list / carousel.
// `variant` only controls media positioning + outer card shape; all
// other knobs (icon, text alignment, size overrides, background) flow
// through identically. Without this, three near-identical render
// blocks drift over time as new fields land.
// ──────────────────────────────────────────────────────────────────────
function FeatureCard({
  feature,
  index,
  language,
  showIcons,
  showImages,
  variant,
}: {
  feature: FeatureItemFormData;
  index: number;
  language: 'en' | 'mm';
  showIcons: boolean;
  showImages: boolean;
  variant: 'grid' | 'list' | 'carousel';
}) {
  const title = feature.title?.[language] || feature.title?.en || '';
  const description =
    feature.description?.[language] || feature.description?.en || '';
  const linkText =
    feature.link?.text?.[language] || feature.link?.text?.en || '';

  const bgStyle = buildBackgroundStyle(feature.background);
  const textColor = feature.textColor;
  const iconColor = (feature as any).iconColor;
  const iconSize = (feature as any).iconSize || 24;
  const iconAlign: 'left' | 'center' | 'right' =
    (feature as any).iconAlign || 'left';
  const titleSize = (feature as any).titleSize;
  const titleAlign: 'left' | 'center' | 'right' =
    (feature as any).titleAlign || 'left';
  const descriptionSize = (feature as any).descriptionSize;
  const descriptionAlign: 'left' | 'center' | 'right' =
    (feature as any).descriptionAlign || 'left';

  // List variant lays icon/image to the left and content to the right.
  if (variant === 'list') {
    return (
      <div
        className="border rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow"
        style={bgStyle}
      >
        <div className="flex-shrink-0">
          {showImages && feature.image ? (
            <div className="h-16 w-16 bg-muted rounded overflow-hidden">
              <img
                src={feature.image}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : showIcons && feature.icon ? (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <IconComponent
                name={feature.icon}
                size={iconSize}
                color={iconColor || textColor || undefined}
              />
            </div>
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={cn('font-semibold text-base mb-1', TEXT_ALIGN[titleAlign])}
            style={{
              color: textColor || undefined,
              fontSize: titleSize ? `${titleSize}px` : undefined,
            }}
          >
            {title || `Feature ${index + 1}`}
          </h3>
          <p
            className={cn(
              'text-muted-foreground text-sm leading-relaxed mb-2',
              TEXT_ALIGN[descriptionAlign],
            )}
            style={{
              color: textColor || undefined,
              fontSize: descriptionSize ? `${descriptionSize}px` : undefined,
            }}
          >
            {description || 'No description provided yet.'}
          </p>
          <FeatureLink
            url={feature.link?.url}
            label={linkText}
            openInNewTab={feature.link?.openInNewTab}
            color={textColor}
          />
        </div>
      </div>
    );
  }

  // Grid + carousel share the stacked-card layout. Carousel adds a
  // fixed width + snap-start; grid stretches to its column.
  return (
    <div
      className={cn(
        'border rounded-lg p-4 hover:shadow-md transition-shadow',
        variant === 'carousel' && 'flex-shrink-0 w-72 snap-start',
      )}
      style={bgStyle}
    >
      {showImages && feature.image && (
        <div className="mb-3 aspect-video bg-muted rounded overflow-hidden">
          <img
            src={feature.image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {showIcons && feature.icon && (
        <div className={cn('mb-3 flex', FLEX_ALIGN[iconAlign])}>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <IconComponent
              name={feature.icon}
              size={iconSize}
              color={iconColor || textColor || undefined}
            />
          </div>
        </div>
      )}

      <h3
        className={cn('font-semibold text-base mb-2', TEXT_ALIGN[titleAlign])}
        style={{
          color: textColor || undefined,
          fontSize: titleSize ? `${titleSize}px` : undefined,
        }}
      >
        {title || `Feature ${index + 1}`}
      </h3>

      <p
        className={cn(
          'text-muted-foreground text-sm leading-relaxed mb-3',
          TEXT_ALIGN[descriptionAlign],
        )}
        style={{
          color: textColor || undefined,
          fontSize: descriptionSize ? `${descriptionSize}px` : undefined,
        }}
      >
        {description || 'No description provided yet.'}
      </p>

      <FeatureLink
        url={feature.link?.url}
        label={linkText}
        openInNewTab={feature.link?.openInNewTab}
        color={textColor}
      />
    </div>
  );
}

// Small "→" CTA link rendered identically in every variant. Returns
// null when there's nothing to render so callers don't have to gate.
function FeatureLink({
  url,
  label,
  openInNewTab,
  color,
}: {
  url?: string;
  label?: string;
  openInNewTab?: boolean;
  color?: string;
}) {
  if (!url || !label) return null;
  return (
    <a
      href={url}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className="text-primary text-sm font-medium hover:underline inline-flex items-center"
      style={{ color: color || undefined }}
    >
      {label}
      <svg
        className="ml-1 h-3 w-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </a>
  );
}

// ──────────────────────────────────────────────────────────────────────
// SectionHeader — renders headline icon (Lucide), headline text, and
// description with section-level alignment + colour + size overrides.
// ──────────────────────────────────────────────────────────────────────
function SectionHeader({
  headline,
  description,
  icon,
  iconColor,
  iconSize,
  align,
  textColors,
  headlineSize,
  descriptionSize,
}: {
  headline?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  iconSize?: number;
  align: 'left' | 'center' | 'right';
  textColors?: { headline?: string; description?: string };
  headlineSize?: number;
  descriptionSize?: number;
}) {
  if (!headline && !description && !icon) return null;

  const flexAlign = FLEX_ALIGN[align];

  return (
    <div className={cn('mb-8', TEXT_ALIGN[align])}>
      {icon && (
        <div className={cn('mb-3 flex', flexAlign)}>
          <IconComponent
            name={icon}
            size={iconSize ?? 32}
            color={iconColor || undefined}
          />
        </div>
      )}
      {headline && (
        <h2
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{
            color: textColors?.headline || undefined,
            fontSize: headlineSize ? `${headlineSize}px` : undefined,
          }}
        >
          {headline}
        </h2>
      )}
      {description && (
        <p
          className={cn(
            'text-muted-foreground text-sm md:text-base max-w-2xl',
            align === 'center' && 'mx-auto',
            align === 'right' && 'ml-auto',
          )}
          style={{
            color: textColors?.description || undefined,
            fontSize: descriptionSize ? `${descriptionSize}px` : undefined,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Top-level preview
// ──────────────────────────────────────────────────────────────────────
export function FeatureListSectionPreview({
  data,
  language = 'en',
}: FeatureListSectionPreviewProps) {
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

  // Default padding gives the preview section the visual weight of a
  // real public-site section (py-12 ≈ 3rem) instead of a tight admin
  // card. `data.spacing.*` inline overrides still win when set.
  const containerClasses = cn(
    'bg-background rounded shadow-lg py-8 px-4 md:py-12 md:px-6',
    data.containerSettings?.width === 'fullWidth' && 'w-full',
    data.containerSettings?.width === 'contained' && 'max-w-6xl mx-auto',
  );

  const responsiveClasses = cn(
    data.responsiveSettings?.hideOnMobile && 'hidden md:block',
    data.responsiveSettings?.hideOnTablet && 'md:hidden lg:block',
    data.responsiveSettings?.hideOnDesktop && 'lg:hidden',
  );

  const getGridColumnsClass = () => {
    const colsMap: Record<string, string> = {
      '1': 'grid-cols-1',
      '2': 'md:grid-cols-2',
      '3': 'md:grid-cols-2 lg:grid-cols-3',
      '4': 'md:grid-cols-2 lg:grid-cols-4',
    };
    return colsMap[data.columns || '3'];
  };

  const features = data.features ?? [];
  const headlineAlign: 'left' | 'center' | 'right' =
    (data as any).headlineAlign || 'center';
  const sharedCardProps = {
    language,
    showIcons: !!data.showIcons,
    showImages: !!data.showImages,
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
      <SectionHeader
        headline={data.headline?.[language] || data.headline?.en}
        description={data.description?.[language] || data.description?.en}
        icon={(data as any).headlineIcon}
        iconColor={(data as any).headlineIconColor}
        iconSize={(data as any).headlineIconSize}
        align={headlineAlign}
        textColors={(data as any).textColors}
        headlineSize={(data as any).headlineSize}
        descriptionSize={(data as any).descriptionSize}
      />

      {features.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded">
          <p className="text-sm">
            No features added yet. Add some features in the editor to see them
            here.
          </p>
        </div>
      ) : data.layout === 'list' ? (
        <div className="space-y-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              variant="list"
              {...sharedCardProps}
            />
          ))}
        </div>
      ) : data.layout === 'carousel' ? (
        <div className="relative overflow-hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                index={index}
                variant="carousel"
                {...sharedCardProps}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={cn('grid gap-4', getGridColumnsClass())}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              variant="grid"
              {...sharedCardProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
