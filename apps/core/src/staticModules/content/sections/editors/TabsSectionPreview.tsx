'use client';

import React, { useState } from 'react';
import { cn } from '@repo/ui';
import type { TabsSectionFormData } from './tabs-types';

/**
 * Live preview for the Tabs section editor — mirrors what the
 * public renderer (`themes/default/templates/section/tabs/
 * TabsSection.tsx`) paints, but scaled down for the admin
 * preview pane. Reads the form's watched state so it updates as
 * authors type / change orientation / add tabs.
 *
 * Per-tab content rendering:
 *   - Prefers `contentHtml` (rich HTML — lists / tables / images)
 *     and injects via `dangerouslySetInnerHTML` inside a
 *     `data-rich-html` container so the global typography rules
 *     style it the same way the public site does.
 *   - Falls back to `content` (plain text) when no HTML is set.
 *   - Empty panel shows a muted placeholder.
 */

interface TabsSectionPreviewProps {
  data: TabsSectionFormData;
  language?: 'en' | 'mm';
}

function getSpacingValue(value?: string): string | undefined {
  if (!value) return undefined;
  const map: Record<string, string> = {
    none: '0',
    sm: '1rem',
    md: '2rem',
    lg: '4rem',
    xl: '6rem',
  };
  return map[value] || value;
}

export function TabsSectionPreview({
  data,
  language = 'en',
}: TabsSectionPreviewProps) {
  const items = Array.isArray(data.items) ? data.items : [];

  // Clamp the active index — if the author removes a tab the
  // previously-active index can land past the end of `items`.
  const initialIdx = Math.min(
    Math.max(0, Number(data.defaultIndex) || 0),
    Math.max(0, items.length - 1),
  );
  const [active, setActive] = useState<number>(initialIdx);
  // Keep `active` in range as items change (mirrors PM-React's
  // useEffect guard but cheaper here since we re-derive on render).
  const safeActive = Math.min(active, Math.max(0, items.length - 1));

  const orientation: 'horizontal' | 'vertical' =
    data.orientation === 'vertical' ? 'vertical' : 'horizontal';

  const showHeadline = data.showHeadline !== false;
  const showDescription = data.showDescription !== false;
  const headline = data.headline?.[language] || data.headline?.en || '';
  const description =
    data.description?.[language] || data.description?.en || '';

  // Container spacing (mirrors FaqSectionPreview's pattern).
  const spacingStyles: React.CSSProperties = {
    paddingTop: getSpacingValue(data.spacing?.paddingTop),
    paddingBottom: getSpacingValue(data.spacing?.paddingBottom),
    paddingLeft: getSpacingValue(data.spacing?.paddingLeft),
    paddingRight: getSpacingValue(data.spacing?.paddingRight),
    marginTop: getSpacingValue(data.spacing?.marginTop),
    marginBottom: getSpacingValue(data.spacing?.marginBottom),
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

  const activeItem = items[safeActive];
  const activeHtml =
    activeItem?.contentHtml?.[language] ||
    activeItem?.contentHtml?.en ||
    '';
  const activePlain =
    activeItem?.content?.[language] || activeItem?.content?.en || '';

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
      {((showHeadline && headline) || (showDescription && description)) && (
        <div className="mb-5">
          {showHeadline && headline && (
            <h2 className="text-xl md:text-2xl font-bold mb-1">{headline}</h2>
          )}
          {showDescription && description && (
            // Description authored via Tiptap — render as HTML inside
            // a `data-rich-html` container so the preview matches the
            // public-site styling for marks / links / lists.
            <div
              data-rich-html
              className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            No tabs added yet. Click "Add Tab" in the editor to see a
            preview here.
          </p>
        </div>
      ) : orientation === 'vertical' ? (
        // ── Vertical: left rail of labels + right panel
        <div className="flex flex-col md:flex-row gap-4">
          <div
            role="tablist"
            aria-orientation="vertical"
            className="md:w-1/3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible border-b md:border-b-0 md:border-r pb-2 md:pb-0 md:pr-2"
          >
            {items.map((it, i) => {
              const label = it.label?.[language] || it.label?.en || '';
              const isActive = i === safeActive;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={cn(
                    'text-left px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap md:whitespace-normal transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary border-l-2 md:border-l-4 border-primary'
                      : 'text-foreground hover:bg-muted/60 border-l-2 md:border-l-4 border-transparent',
                  )}
                >
                  {label || `Tab ${i + 1}`}
                </button>
              );
            })}
          </div>
          <div className="flex-1 min-w-0">
            <Panel html={activeHtml} plain={activePlain} />
          </div>
        </div>
      ) : (
        // ── Horizontal: top labels + single panel
        <div>
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="flex flex-wrap gap-1 border-b mb-4"
          >
            {items.map((it, i) => {
              const label = it.label?.[language] || it.label?.en || '';
              const isActive = i === safeActive;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  )}
                >
                  {label || `Tab ${i + 1}`}
                </button>
              );
            })}
          </div>
          <Panel html={activeHtml} plain={activePlain} />
        </div>
      )}
    </div>
  );
}

function Panel({ html, plain }: { html?: string; plain?: string }) {
  if (html && html.trim()) {
    return (
      <div
        data-rich-html
        className="bg-muted/20 border rounded-md p-4 text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  if (plain && plain.trim()) {
    return (
      <div className="bg-muted/20 border rounded-md p-4 text-sm leading-relaxed whitespace-pre-line">
        {plain}
      </div>
    );
  }
  return (
    <div className="bg-muted/20 border rounded-md p-4 text-sm text-muted-foreground">
      Empty tab — add plain or rich content to populate this panel.
    </div>
  );
}

export default TabsSectionPreview;
