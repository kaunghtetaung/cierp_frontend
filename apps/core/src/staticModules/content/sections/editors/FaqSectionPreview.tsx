'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@repo/ui';
import type { FaqSectionFormData } from './faq-types';

interface FaqSectionPreviewProps {
  data: FaqSectionFormData;
  language?: 'en' | 'mm';
}

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

export function FaqSectionPreview({ data, language = 'en' }: FaqSectionPreviewProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]));

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (data.allowMultipleOpen) {
        // Allow multiple open
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
      } else {
        // Only one open at a time
        if (newSet.has(index)) {
          newSet.clear();
        } else {
          newSet.clear();
          newSet.add(index);
        }
      }
      return newSet;
    });
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
    'bg-background rounded shadow-lg p-4 md:p-6',
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
      className={cn(containerClasses, responsiveClasses)}
      style={{
        ...spacingStyles,
        maxWidth: data.containerSettings?.width === 'custom' ? data.containerSettings.maxWidth : undefined,
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {data.headline?.[language] && (
            <h2
              className="text-xl md:text-2xl font-bold mb-2"
              style={{
                color: data.textColors?.headline || undefined,
                fontSize: data.headlineSize ? `${data.headlineSize}px` : undefined,
              }}
            >
              {data.headline[language]}
            </h2>
          )}
          {data.description?.[language] && (
            <p
              className="text-sm text-muted-foreground"
              style={{
                color: data.textColors?.description || undefined,
                fontSize: data.descriptionSize ? `${data.descriptionSize}px` : undefined,
              }}
            >
              {data.description[language]}
            </p>
          )}
        </div>

        {/* FAQ Items */}
        {data.faqs && data.faqs.length > 0 ? (
          <div className="space-y-2">
            {data.layout === 'accordion' ? (
              // Accordion Layout
              data.faqs.map((item, index) => {
                const isOpen = openItems.has(index);
                const question = item.question?.[language] || item.question?.en || '';
                const answer = item.answer?.[language] || item.answer?.en || '';

                return (
                  <div
                    key={index}
                    className="border rounded overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleItem(index)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span
                        className="font-medium text-sm pr-3"
                        style={{
                          color: data.textColors?.question || undefined,
                          fontSize: data.questionSize ? `${data.questionSize}px` : undefined,
                        }}
                      >
                        {question || `Question ${index + 1}`}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 flex-shrink-0 transition-transform ${
                          isOpen ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-background border-t">
                        <p
                          className="text-muted-foreground text-sm leading-relaxed"
                          style={{
                            color: data.textColors?.answer || undefined,
                            fontSize: data.answerSize ? `${data.answerSize}px` : undefined,
                          }}
                        >
                          {answer || 'No answer provided yet.'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // List Layout
              <div className="space-y-4">
                {data.faqs.map((item, index) => {
                  const question = item.question?.[language] || item.question?.en || '';
                  const answer = item.answer?.[language] || item.answer?.en || '';

                  return (
                    <div key={index} className="border-l-2 border-primary pl-4 py-1">
                      <h3
                        className="font-semibold text-sm mb-2"
                        style={{
                          color: data.textColors?.question || undefined,
                          fontSize: data.questionSize ? `${data.questionSize}px` : undefined,
                        }}
                      >
                        {question || `Question ${index + 1}`}
                      </h3>
                      <p
                        className="text-muted-foreground text-sm leading-relaxed"
                        style={{
                          color: data.textColors?.answer || undefined,
                          fontSize: data.answerSize ? `${data.answerSize}px` : undefined,
                        }}
                      >
                        {answer || 'No answer provided yet.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No FAQ items added yet. Add some items in the editor to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
