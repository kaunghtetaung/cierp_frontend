'use client';

import React from 'react';
import { Input, Textarea, FormLabel, Button } from '@repo/ui';
import { Trash2 } from 'lucide-react';
import {
  previewMetaTitle,
  previewMetaDescription,
} from './post-utils';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { MediaFile } from '@repo/media';

interface FeaturedImageRefLike {
  mediaId?: string;
  url: string;
  alt?: { en?: string; mm?: string };
  caption?: { en?: string; mm?: string };
}

interface SeoEditorProps {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  /** Open Graph image — used in social-card preview and as ogImage on save. */
  ogImage?: FeaturedImageRefLike;
  /** Featured image — used as fallback for the OG image preview. */
  featuredImage?: FeaturedImageRefLike;
  canonicalUrl?: string;
  /** Used as fallback for the preview when metaTitle is empty. */
  fallbackTitleEn?: string;
  fallbackExcerptEn?: string;
  /** Plain-text from body — used as last-resort description fallback. */
  fallbackBodyText?: string;
  /** Tenant URL slug for the search-result preview path. */
  siteHost?: string;
  postSlug?: string;
  onChange: (next: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: FeaturedImageRefLike;
    canonicalUrl?: string;
  }) => void;
}

/**
 * SEO meta editor with a live "what it looks like in Google search" preview.
 * The preview applies the same fallback rules a backend renderer should
 * apply (title → metaTitle ?? title.en, description → metaDescription ??
 * excerpt.en ?? body snippet).
 */
export function SeoEditor({
  metaTitle,
  metaDescription,
  metaKeywords,
  ogImage,
  featuredImage,
  canonicalUrl,
  fallbackTitleEn,
  fallbackExcerptEn,
  fallbackBodyText,
  siteHost = 'example.com',
  postSlug = '',
  onChange,
}: SeoEditorProps) {
  const previewTitle = previewMetaTitle({ metaTitle, titleEn: fallbackTitleEn });
  const previewDesc = previewMetaDescription({
    metaDescription,
    excerptEn: fallbackExcerptEn,
    bodyText: fallbackBodyText,
  });

  const titleLen = (metaTitle ?? '').length;
  const descLen = (metaDescription ?? '').length;
  const titleOver = titleLen > 60;
  const descOver = descLen > 160;

  const keywordsString = (metaKeywords ?? []).join(', ');

  // Helper: emit the full SeoEditor change payload, only patching the named field
  const emit = (patch: Partial<{
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: FeaturedImageRefLike;
    canonicalUrl?: string;
  }>) => {
    onChange({
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      canonicalUrl,
      ...patch,
    });
  };

  // OG image preview falls back to featured image so the social-card preview
  // is meaningful even when the user hasn't picked a separate OG image yet.
  const previewOgImage = ogImage?.url || featuredImage?.url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* ───────── LEFT — Meta data + Google preview ───────── */}
    <div className="space-y-4">
      <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground">
        Meta data
      </FormLabel>

      {/* Live Google-style preview */}
      <div className="rounded-md bg-background border p-3">
        <p className="text-xs text-muted-foreground truncate">
          {siteHost}
          {postSlug ? `/posts/${postSlug}` : ''}
        </p>
        <p className="text-base text-blue-600 truncate">{previewTitle}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {previewDesc || (
            <span className="italic">
              No description — write an excerpt or add Meta Description below
            </span>
          )}
        </p>
      </div>

      {/* Meta Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <FormLabel className="text-xs">Meta Title</FormLabel>
          <span
            className={`text-[10px] tabular-nums ${
              titleOver ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {titleLen}/60
          </span>
        </div>
        <Input
          value={metaTitle ?? ''}
          onChange={(e) =>
            emit({ metaTitle: e.target.value || undefined })
          }
          placeholder={fallbackTitleEn ?? 'Custom search-result title'}
        />
      </div>

      {/* Meta Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <FormLabel className="text-xs">Meta Description</FormLabel>
          <span
            className={`text-[10px] tabular-nums ${
              descOver ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {descLen}/160
          </span>
        </div>
        <Textarea
          rows={3}
          value={metaDescription ?? ''}
          onChange={(e) =>
            emit({ metaDescription: e.target.value || undefined })
          }
          placeholder={fallbackExcerptEn ?? 'Custom search-result snippet'}
        />
      </div>

      {/* Meta Keywords */}
      <div className="space-y-1">
        <FormLabel className="text-xs">Meta Keywords</FormLabel>
        <Input
          value={keywordsString}
          onChange={(e) => {
            const arr = e.target.value
              .split(',')
              .map((k) => k.trim())
              .filter((k) => k.length > 0);
            emit({ metaKeywords: arr.length > 0 ? arr : undefined });
          }}
          placeholder="comma, separated, keywords"
        />
        <p className="text-[10px] text-muted-foreground">
          Less weighted by modern search engines but useful for internal
          search and tag suggestions.
        </p>
      </div>

      {/* Canonical URL — kept on the meta side because it's a search-engine
          concern, not a social-media one. */}
      <div className="space-y-1 pt-2 border-t">
        <FormLabel className="text-xs">Canonical URL</FormLabel>
        <Input
          value={canonicalUrl ?? ''}
          onChange={(e) =>
            emit({ canonicalUrl: e.target.value || undefined })
          }
          placeholder="https://other-site.com/original-post"
          type="url"
        />
        <p className="text-[10px] text-muted-foreground">
          Set only if this post is republished from another URL — tells search
          engines which copy is authoritative. Leave blank for original content.
        </p>
      </div>
    </div>

    {/* ───────── RIGHT — Social card (Open Graph) ───────── */}
    <div className="space-y-3">
      <FormLabel className="text-xs uppercase tracking-wide text-muted-foreground">
        Social card (Open Graph)
      </FormLabel>
      <div className="space-y-2">
        {/* Social-card preview */}
        <div className="rounded-md bg-background border overflow-hidden">
          {previewOgImage ? (
            <div className="aspect-[1200/630] bg-muted">
              <img
                src={previewOgImage}
                alt={ogImage?.alt?.en ?? featuredImage?.alt?.en ?? ''}
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            </div>
          ) : (
            <div className="aspect-[1200/630] flex items-center justify-center bg-muted text-muted-foreground text-xs">
              No image — Twitter/Facebook will show a blank card
            </div>
          )}
          <div className="p-2 space-y-1">
            <p className="text-xs text-muted-foreground truncate">{siteHost}</p>
            <p className="text-sm font-medium line-clamp-2">{previewTitle}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{previewDesc}</p>
          </div>
        </div>
        {ogImage?.url ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1 truncate">
              Custom OG image set
              {ogImage.alt?.en ? ` — alt: "${ogImage.alt.en}"` : ''}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => emit({ ogImage: undefined })}
              title="Remove OG image (use featured)"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <MediaBrowserButton
              label="Replace"
              variant="outline"
              size="sm"
              config={{ allowedTypes: ['image/*'], selectionMode: 'single' }}
              onSelectMedia={(media: MediaFile[]) => {
                const m = media[0];
                emit({
                  ogImage: {
                    mediaId: m.id,
                    url: m.url,
                    alt: m.alt,
                    caption: m.caption,
                  },
                });
              }}
            />
          </div>
        ) : (
          <MediaBrowserButton
            label={
              featuredImage?.url
                ? 'Override OG image (default: featured)'
                : 'Choose social-card image'
            }
            variant="outline"
            size="sm"
            config={{ allowedTypes: ['image/*'], selectionMode: 'single' }}
            onSelectMedia={(media: MediaFile[]) => {
              const m = media[0];
              emit({
                ogImage: {
                  mediaId: m.id,
                  url: m.url,
                  alt: m.alt,
                  caption: m.caption,
                },
              });
            }}
          />
        )}
        <p className="text-[10px] text-muted-foreground">
          Recommended size 1200×630. Falls back to the featured image if not set.
        </p>
      </div>
    </div>
    </div>
  );
}
