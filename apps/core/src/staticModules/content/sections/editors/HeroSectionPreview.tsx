'use client';

import React from 'react';
import { cn } from '@repo/ui';
import type { HeroSectionFormData } from './hero-types';

interface HeroSectionPreviewProps {
  data: HeroSectionFormData;
  language?: 'en' | 'mm';
}

const heightLabels = {
  small: '250px',
  medium: '400px',
  large: '550px',
  fullscreen: '100vh',
};

function getSpacingValue(value: string): string {
  const map: Record<string, string> = {
    'none': '0',
    'sm': '1rem',
    'md': '2rem',
    'lg': '4rem',
    'xl': '6rem',
  };
  return map[value] || value;
}

export function HeroSectionPreview({ data, language = 'en' }: HeroSectionPreviewProps) {
  const buttonStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    outline: 'border border-foreground text-foreground hover:bg-foreground hover:text-background',
  };

  // Build spacing styles
  const spacingStyles: React.CSSProperties = {
    paddingTop: data.spacing?.paddingTop ? getSpacingValue(data.spacing.paddingTop) : undefined,
    paddingBottom: data.spacing?.paddingBottom ? getSpacingValue(data.spacing.paddingBottom) : undefined,
    paddingLeft: data.spacing?.paddingLeft ? getSpacingValue(data.spacing.paddingLeft) : undefined,
    paddingRight: data.spacing?.paddingRight ? getSpacingValue(data.spacing.paddingRight) : undefined,
    marginTop: data.spacing?.marginTop ? getSpacingValue(data.spacing.marginTop) : undefined,
    marginBottom: data.spacing?.marginBottom ? getSpacingValue(data.spacing.marginBottom) : undefined,
  };

  // Build container classes
  const containerClasses = cn(
    data.containerSettings?.width === 'fullWidth' ? 'w-full' : '',
    data.containerSettings?.width === 'contained' ? 'max-w-6xl mx-auto' : '',
    data.containerSettings?.width === 'custom' ? '' : ''
  );

  // Build responsive classes
  const responsiveClasses = cn(
    data.responsiveSettings?.hideOnMobile ? 'hidden md:block' : '',
    data.responsiveSettings?.hideOnTablet ? 'md:hidden lg:block' : '',
    data.responsiveSettings?.hideOnDesktop ? 'lg:hidden' : ''
  );

  return (
    <div
      className={cn('relative overflow-hidden rounded shadow-lg', containerClasses, responsiveClasses)}
      style={{
        ...spacingStyles,
        height: heightLabels[data.height || 'medium'],
        backgroundImage: data.backgroundImage
          ? `url(${data.backgroundImage})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        maxWidth: data.containerSettings?.width === 'custom' ? data.containerSettings.maxWidth : undefined,
      }}
    >
      {/* Overlay */}
      {data.overlay?.enabled && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: data.overlay.color || '#000000',
            opacity: data.overlay.opacity || 0.5,
          }}
        />
      )}

      {/* Content */}
      <div className="relative h-full flex items-center justify-center px-4 py-4">
        <div
          className="max-w-3xl w-full space-y-3"
          style={{ textAlign: data.textAlignment || 'center' }}
        >
          {/* Headline */}
          {data.headline?.[language] && (
            <h1
              className="text-2xl md:text-4xl font-bold text-white leading-tight"
              style={{
                color: data.textColors?.headline || undefined,
                fontSize: data.headlineSize ? `${data.headlineSize}px` : undefined,
              }}
            >
              {data.headline[language]}
            </h1>
          )}

          {/* Subheadline */}
          {data.subheadline?.[language] && (
            <p
              className="text-sm md:text-base text-white/90 leading-snug"
              style={{
                color: data.textColors?.subheadline || undefined,
                fontSize: data.subheadlineSize ? `${data.subheadlineSize}px` : undefined,
              }}
            >
              {data.subheadline[language]}
            </p>
          )}

          {/* Buttons */}
          {data.buttons && data.buttons.length > 0 && (
            <div
              className="flex flex-wrap gap-2 pt-2"
              style={{
                justifyContent:
                  data.textAlignment === 'left'
                    ? 'flex-start'
                    : data.textAlignment === 'right'
                    ? 'flex-end'
                    : 'center',
              }}
            >
              {data.buttons.map((button, index) => {
                const buttonText = button.text?.[language] || button.text?.en || 'Button';
                return (
                  <a
                    key={index}
                    href={button.url || '#'}
                    target={button.openInNewTab ? '_blank' : undefined}
                    rel={button.openInNewTab ? 'noopener noreferrer' : undefined}
                    className={`
                      px-4 py-2 rounded text-sm font-medium
                      transition-colors duration-200
                      ${buttonStyles[button.style || 'primary']}
                    `}
                    style={{
                      color: data.textColors?.buttons || undefined,
                    }}
                  >
                    {buttonText}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
