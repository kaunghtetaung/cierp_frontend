'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import type { TagListSectionFormData } from './tag-list-types';

interface Props {
  data: TagListSectionFormData;
  language?: 'en' | 'mm';
}

/**
 * Mock tag set with varying usage counts so authors can see how the
 * `cloud` mode scales pill sizes vs. the flat `list` / `badge` modes.
 * The public renderer fetches real tags at render time.
 */
const MOCK = [
  { id: 1, name: 'medical-education', usage: 87 },
  { id: 2, name: 'research', usage: 54 },
  { id: 3, name: 'students', usage: 32 },
  { id: 4, name: 'admission', usage: 26 },
  { id: 5, name: 'workshop', usage: 12 },
  { id: 6, name: 'covid', usage: 8 },
  { id: 7, name: 'graduates', usage: 5 },
  { id: 8, name: 'health', usage: 3 },
];

const CLOUD_TIERS = [
  { floor: 50, size: 'text-lg' },
  { floor: 20, size: 'text-base' },
  { floor: 10, size: 'text-sm' },
  { floor: 0, size: 'text-xs' },
];
function tierFor(u: number): string {
  for (const t of CLOUD_TIERS) if (u >= t.floor) return t.size;
  return 'text-xs';
}

export function TagListSectionPreview({ data, language = 'en' }: Props) {
  const headline = data.headline?.[language] || data.headline?.en || '';
  const viewAllLabel =
    data.viewAllLabel?.[language] || data.viewAllLabel?.en || '';
  const showCount = data.showCount !== false;
  const items =
    data.sort === 'alphabetical'
      ? [...MOCK].sort((a, b) => a.name.localeCompare(b.name))
      : [...MOCK].sort((a, b) => b.usage - a.usage);

  return (
    <div className="bg-background rounded shadow-lg border overflow-hidden max-w-sm">
      <div className="px-4 py-6">
        {(headline || viewAllLabel) && (
          <header className="flex items-end justify-between gap-3 mb-4 pb-2 border-b">
            {headline && (
              <h3 className="text-base font-bold flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary shrink-0" />
                <span>{headline}</span>
              </h3>
            )}
            {viewAllLabel && (
              <span className="text-xs text-primary">{viewAllLabel} →</span>
            )}
          </header>
        )}

        {data.displayMode === 'list' ? (
          <ul className="space-y-1.5 text-sm">
            {items.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5"
              >
                <span className="truncate">#{t.name}</span>
                {showCount && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {t.usage}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : data.displayMode === 'badge' ? (
          <div className="flex flex-wrap gap-1.5">
            {items.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border bg-card text-xs"
              >
                <span>#{t.name}</span>
                {showCount && (
                  <span className="text-muted-foreground">{t.usage}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-2 gap-y-1.5 leading-loose">
            {items.map((t) => (
              <span
                key={t.id}
                className={`${tierFor(t.usage)}`}
                title={
                  showCount ? `${t.name} · ${t.usage}` : t.name
                }
              >
                #{t.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-2 border-t bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
        Preview · {data.displayMode} mode · mock data
      </div>
    </div>
  );
}

export default TagListSectionPreview;
