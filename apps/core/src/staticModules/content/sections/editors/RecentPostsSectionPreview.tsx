'use client';

import React from 'react';
import { Newspaper } from 'lucide-react';
import { IconComponent } from '@repo/ui';
import type { RecentPostsSectionFormData } from './recent-posts-types';

interface RecentPostsSectionPreviewProps {
  data: RecentPostsSectionFormData;
  language?: 'en' | 'mm';
}

/**
 * Preview for the "Recent Posts" dynamic section. The real renderer
 * fetches actual posts at request time on the public site; here we
 * show placeholder cards that respect the layout / column / "show X"
 * toggles so authors can see how the section will lay out.
 */
export function RecentPostsSectionPreview({
  data,
  language = 'en',
}: RecentPostsSectionPreviewProps) {
  const headline = data.headline?.[language] || data.headline?.en;
  const subheadline = data.subheadline?.[language] || data.subheadline?.en;
  const viewAllLabel =
    data.viewAllLabel?.[language] || data.viewAllLabel?.en;

  const limit = Math.min(data.query?.limit ?? 6, 12);
  const layout = data.layout ?? 'grid';
  const columns = data.columns ?? 3;

  const placeholderPosts = Array.from({ length: limit }, (_, i) => ({
    id: `placeholder-${i}`,
    title: `Sample post ${i + 1}`,
    excerpt:
      'This is a sample excerpt that will be replaced with the real post excerpt at render time on the public site.',
    date: new Date(Date.now() - i * 86_400_000).toLocaleDateString(),
    category: i % 2 === 0 ? 'News' : 'Announcement',
    author: 'Author name',
  }));

  const colsClass: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6',
  };

  return (
    <div className="bg-background rounded shadow-lg border p-6">
      {/* Heading row */}
      {(headline || subheadline || (viewAllLabel && data.viewAllUrl)) && (
        <div className="flex items-end justify-between gap-3 mb-6 pb-3 border-b">
          <div className="min-w-0">
            {headline && (
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                {data.headlineIcon && (
                  <IconComponent
                    name={data.headlineIcon}
                    size={22}
                    className="text-primary shrink-0"
                  />
                )}
                <span className="truncate">{headline}</span>
              </h2>
            )}
            {subheadline && (
              <p className="text-sm text-muted-foreground mt-1">
                {subheadline}
              </p>
            )}
          </div>
          {viewAllLabel && data.viewAllUrl && (
            <span className="text-xs underline text-primary shrink-0">
              {viewAllLabel} →
            </span>
          )}
        </div>
      )}

      {/* Cards */}
      {layout === 'grid' && (
        <div className={`grid gap-4 ${colsClass[columns] ?? colsClass[3]}`}>
          {placeholderPosts.map((p) => (
            <article
              key={p.id}
              className="rounded-md border bg-card overflow-hidden flex flex-col"
            >
              {data.showImage && (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Newspaper className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-3 flex flex-col gap-2">
                {data.showCategory && (
                  <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
                    {p.category}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                  {p.title}
                </h3>
                {data.showExcerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.excerpt}
                  </p>
                )}
                {(data.showDate || data.showAuthor) && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                    {data.showAuthor && <span>{p.author}</span>}
                    {data.showAuthor && data.showDate && <span>·</span>}
                    {data.showDate && <span>{p.date}</span>}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {layout === 'list' && (
        <div className="space-y-3">
          {placeholderPosts.map((p) => (
            <article
              key={p.id}
              className="flex gap-3 rounded-md border bg-card p-3"
            >
              {data.showImage && (
                <div className="w-32 h-20 shrink-0 bg-muted rounded flex items-center justify-center">
                  <Newspaper className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {data.showCategory && (
                  <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
                    {p.category}
                  </span>
                )}
                <h3 className="text-sm font-semibold truncate">{p.title}</h3>
                {data.showExcerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.excerpt}
                  </p>
                )}
                {(data.showDate || data.showAuthor) && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                    {data.showAuthor && <span>{p.author}</span>}
                    {data.showAuthor && data.showDate && <span>·</span>}
                    {data.showDate && <span>{p.date}</span>}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {layout === 'overlay' && (
        <div className={`grid gap-3 ${colsClass[columns] ?? colsClass[3]}`}>
          {placeholderPosts.map((p) => (
            <article
              key={p.id}
              className="group relative aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-xl bg-muted"
            >
              {/* Placeholder image — gradient + newspaper icon so the
                   author can see where the real image will sit. */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)',
                }}
              >
                <Newspaper className="h-10 w-10 text-muted-foreground/40" />
              </div>

              {/* Gradient veil for title legibility */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
              />

              {/* Top row: category + date overlays */}
              <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
                {data.showCategory ? (
                  <span className="inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded bg-primary text-primary-foreground shadow-sm">
                    {p.category}
                  </span>
                ) : (
                  <span />
                )}
                {data.showDate && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/85 text-foreground shadow-sm">
                    {p.date}
                  </span>
                )}
              </div>

              {/* Bottom content */}
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <h3 className="text-sm font-bold leading-snug line-clamp-2 drop-shadow-sm">
                  {p.title}
                </h3>
                {data.showExcerpt && (
                  <p className="text-[11px] leading-relaxed mt-1.5 line-clamp-2 opacity-90">
                    {p.excerpt}
                  </p>
                )}
                {data.showAuthor && (
                  <p className="text-[10px] opacity-80 mt-1">{p.author}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {layout === 'mosaic' && (
        <div className="space-y-4">
          {/* Row 1: big-left + 2 stacked-right (uses first 3 posts) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {placeholderPosts[0] && (
              <article className="md:col-span-8 relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)',
                  }}
                >
                  <Newspaper className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                />
                {data.showCategory && (
                  <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded bg-primary text-primary-foreground shadow-sm">
                    {placeholderPosts[0].category}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="font-bold text-base md:text-lg leading-snug line-clamp-3 drop-shadow-sm">
                    {placeholderPosts[0].title}
                  </h3>
                  {data.showExcerpt && (
                    <p className="text-xs mt-1.5 line-clamp-2 opacity-90">
                      {placeholderPosts[0].excerpt}
                    </p>
                  )}
                </div>
              </article>
            )}
            {(placeholderPosts[1] || placeholderPosts[2]) && (
              <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                {[placeholderPosts[1], placeholderPosts[2]]
                  .filter(Boolean)
                  .map((p, i) => (
                    <article
                      key={i}
                      className="flex flex-col overflow-hidden rounded-xl border bg-card"
                      style={{ borderColor: '#eef0f3' }}
                    >
                      <div
                        className="aspect-[16/10] flex items-center justify-center bg-muted"
                        style={{
                          backgroundImage:
                            'linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)',
                        }}
                      >
                        <Newspaper className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <div className="p-3 flex flex-col gap-1">
                        {data.showCategory && (
                          <span className="text-[9px] uppercase tracking-wider font-bold text-primary">
                            {p!.category}
                          </span>
                        )}
                        <h3 className="font-semibold text-xs leading-snug line-clamp-2">
                          {p!.title}
                        </h3>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </div>
          {/* Row 2: full-width banner */}
          {placeholderPosts[3] && (
            <article
              className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-xl border bg-card"
              style={{ borderColor: '#eef0f3' }}
            >
              <div
                className="aspect-[16/10] md:aspect-auto md:h-full flex items-center justify-center bg-muted"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)',
                }}
              >
                <Newspaper className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="p-5 flex flex-col gap-2 justify-center">
                {data.showCategory && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                    {placeholderPosts[3].category}
                  </span>
                )}
                <h3 className="font-bold text-base md:text-lg leading-snug line-clamp-3">
                  {placeholderPosts[3].title}
                </h3>
                {data.showExcerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {placeholderPosts[3].excerpt}
                  </p>
                )}
                {data.showDate && (
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {placeholderPosts[3].date}
                  </p>
                )}
              </div>
            </article>
          )}
          {placeholderPosts.length > 4 && (
            <p className="text-[10px] text-muted-foreground italic text-center mt-2">
              Mosaic layout uses the first 4 posts; the rest of your{' '}
              {placeholderPosts.length} results are skipped. Reduce limit to 4
              if you want a clean fit.
            </p>
          )}
        </div>
      )}

      {layout === 'duo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stanford-style duo preview — eyebrow + title only, no
               excerpt / date. Heroes overlay text on the image;
               small cards use white-panel-below pattern. */}
          {[
            { idx: 0, kind: 'hero' as const },
            { idx: 1, kind: 'pair' as const, pairB: 2 },
            { idx: 3, kind: 'pair' as const, pairB: 4 },
            { idx: 5, kind: 'hero' as const },
          ].map((cell, ci) => {
            if (cell.kind === 'hero') {
              const p = placeholderPosts[cell.idx];
              if (!p) return null;
              return (
                <article
                  key={ci}
                  className="relative aspect-[3/2] overflow-hidden rounded-md bg-muted"
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)',
                    }}
                  >
                    <Newspaper className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                  />
                  {/* Top-left calendar badge in preview */}
                  {data.showDate && (
                    <div
                      className="absolute top-2 left-2 inline-flex flex-col items-center px-1.5 py-0.5 rounded-md bg-white/90 shadow-sm"
                      style={{ minWidth: '36px' }}
                    >
                      <span className="text-[8px] uppercase tracking-wider font-bold leading-none text-primary">
                        {p.date.split('/')[0] /* month-ish, preview only */}
                      </span>
                      <span className="text-sm font-bold leading-tight text-foreground">
                        {p.date.split('/')[1] ?? '1'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    {data.showCategory && (
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-1.5 opacity-95">
                        {p.category}
                      </p>
                    )}
                    <h3 className="text-base leading-snug line-clamp-3 drop-shadow-sm">
                      {p.title}
                    </h3>
                  </div>
                </article>
              );
            }
            return (
              <div key={ci} className="grid grid-cols-2 gap-4">
                {[cell.idx, cell.pairB!].map((idx) => {
                  const p = placeholderPosts[idx];
                  if (!p) return null;
                  return (
                    <article
                      key={idx}
                      className="flex flex-col overflow-hidden rounded-md bg-card shadow-sm h-full"
                    >
                      <div
                        className="relative aspect-[4/3] flex items-center justify-center bg-muted"
                        style={{
                          backgroundImage:
                            'linear-gradient(135deg, var(--color-muted, #f3f4f6) 0%, var(--color-border, #e5e7eb) 100%)',
                        }}
                      >
                        <Newspaper className="h-5 w-5 text-muted-foreground/40" />
                        {data.showDate && (
                          <div
                            className="absolute top-1.5 left-1.5 inline-flex flex-col items-center px-1 py-0.5 rounded bg-white/90 shadow-sm"
                            style={{ minWidth: '30px' }}
                          >
                            <span className="text-[7px] uppercase tracking-wider font-bold leading-none text-primary">
                              {p.date.split('/')[0]}
                            </span>
                            <span className="text-xs font-bold leading-tight text-foreground">
                              {p.date.split('/')[1] ?? '1'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col gap-1.5">
                        {data.showCategory && (
                          <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-primary">
                            {p.category}
                          </p>
                        )}
                        <h3 className="text-xs leading-snug line-clamp-3 text-foreground">
                          {p.title}
                        </h3>
                      </div>
                    </article>
                  );
                })}
              </div>
            );
          })}
          {placeholderPosts.length > 6 && (
            <p className="md:col-span-2 text-[10px] text-muted-foreground italic text-center mt-2">
              Duo layout uses the first 6 posts. Set limit to 6 for a clean
              fit; extras are ignored.
            </p>
          )}
        </div>
      )}

      {layout === 'compact' && (
        <ul className="divide-y divide-border">
          {placeholderPosts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="text-sm truncate">{p.title}</span>
              {data.showDate && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {p.date}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.enablePaging && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled
            className="px-3 py-1.5 rounded border text-xs text-muted-foreground bg-muted/40"
          >
            ← Prev
          </button>
          <span className="text-xs text-muted-foreground px-2">Page 1</span>
          <button
            type="button"
            disabled
            className="px-3 py-1.5 rounded border text-xs text-muted-foreground bg-muted/40"
          >
            Next →
          </button>
        </div>
      )}

      <div className="mt-4 pt-3 border-t text-[10px] text-muted-foreground italic">
        {data.enablePaging
          ? `Preview shows ${limit} placeholder posts (one page). The public site paginates real posts at render time.`
          : `Preview shows ${limit} placeholder posts. The public site fetches the real ones based on your query at render time.`}
      </div>
    </div>
  );
}
