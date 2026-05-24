'use client';

import React from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import type { CategoryListSectionFormData } from './category-list-types';

interface Props {
  data: CategoryListSectionFormData;
  language?: 'en' | 'mm';
}

/**
 * Mock items used to illustrate each display mode in the editor —
 * the public renderer fetches the real Category list at render time;
 * here we just want to show the SHAPE so the author can see what the
 * "list" / "tree" / "badge" toggle does.
 */
const MOCK_ITEMS = [
  { id: 'a', name: 'Admission', count: 21, indent: 0 },
  { id: 'b', name: 'Postgraduate', count: 21, indent: 0 },
  { id: 'c', name: '— PhD Programs', count: 8, indent: 1 },
  { id: 'd', name: 'Events & Seminars', count: 20, indent: 0 },
  { id: 'e', name: 'General Updates', count: 10, indent: 0 },
];

export function CategoryListSectionPreview({
  data,
  language = 'en',
}: Props) {
  const headline = data.headline?.[language] || data.headline?.en || '';
  const viewAllLabel =
    data.viewAllLabel?.[language] || data.viewAllLabel?.en || '';
  const showCount = data.showCount !== false;

  return (
    <div className="bg-background rounded shadow-lg border overflow-hidden max-w-sm">
      <div className="px-4 py-6">
        {(headline || viewAllLabel) && (
          <header className="flex items-end justify-between gap-3 mb-4 pb-2 border-b">
            {headline && (
              <h3 className="text-base font-bold flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary shrink-0" />
                <span>{headline}</span>
              </h3>
            )}
            {viewAllLabel && (
              <span className="text-xs text-primary">{viewAllLabel} →</span>
            )}
          </header>
        )}

        {data.displayMode === 'badge' ? (
          <div className="flex flex-wrap gap-1.5">
            {MOCK_ITEMS.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border bg-card text-xs"
              >
                <span>{c.name}</span>
                {showCount && (
                  <span className="text-muted-foreground">{c.count}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {MOCK_ITEMS.map((c) => (
              <li key={c.id}>
                <span
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
                  style={
                    data.displayMode === 'tree'
                      ? { paddingLeft: `${0.5 + c.indent * 1}rem` }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{c.name}</span>
                  </span>
                  {showCount && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({c.count})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="px-4 py-2 border-t bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
        Preview · {data.displayMode} mode · mock data
      </div>
    </div>
  );
}

export default CategoryListSectionPreview;
