'use client';

import React, { useState } from 'react';
import {
  Input,
  Button,
  FormLabel,
  FormDescription,
} from '@repo/ui';
import { ArrowDown, ArrowUp, Trash2, Video, Link as LinkIcon, Plus } from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { MediaFile } from '@repo/media';
import type { VideoBlock, VideoItem, VideoSource } from '../common/types';

interface VideoBlockFieldProps {
  value?: VideoBlock;
  onChange: (next: VideoBlock | undefined) => void;
}

const EMPTY: VideoBlock = { items: [], display: 'list' };

/**
 * Detect the video source from a URL and normalize for embedding when
 * possible. YouTube short-links (`youtu.be/<id>`) and full URLs
 * (`youtube.com/watch?v=<id>`) are normalized to the embed form. Vimeo
 * URLs are kept as-is — the public renderer can resolve to the player URL.
 */
function detectSource(url: string): VideoSource {
  const u = url.trim().toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('vimeo.com')) return 'vimeo';
  if (u.startsWith('http')) return 'external';
  return 'upload';
}

/**
 * Multi-video picker — appears when contentType === 'video'. Two ways
 * to add an item:
 *   1. Pick from the media library (`source: 'upload'`).
 *   2. Paste an external URL (auto-detected as YouTube / Vimeo / direct).
 *
 * Each item gets a per-language title, reorder ▲▼, and remove. The
 * display mode mirrors PdfBlock: list-of-cards or embed-the-first.
 */
export function VideoBlockField({ value, onChange }: VideoBlockFieldProps) {
  const block: VideoBlock = value ?? EMPTY;
  const items = block.items;
  const [externalUrl, setExternalUrl] = useState('');

  const update = (next: Partial<VideoBlock>) => {
    onChange({ ...block, ...next });
  };

  const addUploaded = (media: MediaFile[]) => {
    const additions: VideoItem[] = media.map((m) => ({
      mediaId: m.id,
      url: m.url,
      source: 'upload',
      title: { en: m.alt?.en || m.fileName || '', mm: m.alt?.mm || '' },
    }));
    update({ items: [...items, ...additions] });
  };

  const addExternal = () => {
    const trimmed = externalUrl.trim();
    if (!trimmed) return;
    const item: VideoItem = {
      url: trimmed,
      source: detectSource(trimmed),
      title: { en: '', mm: '' },
    };
    update({ items: [...items, item] });
    setExternalUrl('');
  };

  const removeAt = (idx: number) => {
    update({ items: items.filter((_, i) => i !== idx) });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update({ items: next });
  };

  const setTitle = (idx: number, lang: 'en' | 'mm', text: string) => {
    const next = [...items];
    next[idx] = {
      ...next[idx],
      title: { ...(next[idx].title || {}), [lang]: text },
    };
    update({ items: next });
  };

  const sourceBadge = (s: VideoSource) =>
    s === 'youtube'
      ? 'YouTube'
      : s === 'vimeo'
        ? 'Vimeo'
        : s === 'external'
          ? 'External'
          : 'Upload';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-sm">Videos</FormLabel>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center">
          <Video className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No videos yet — upload from the media library or paste a URL.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((v, idx) => (
            <li
              key={`${v.url}-${idx}`}
              className="rounded-md border bg-background p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                  {sourceBadge(v.source)}
                </span>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline truncate flex-1"
                  title={v.url}
                >
                  {v.url}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                  title="Move up"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  disabled={idx === items.length - 1}
                  onClick={() => move(idx, 1)}
                  title="Move down"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive"
                  onClick={() => removeAt(idx)}
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={v.title?.en || ''}
                  onChange={(e) => setTitle(idx, 'en', e.target.value)}
                  placeholder="Title (English)"
                  className="h-8 text-xs"
                />
                <Input
                  value={v.title?.mm || ''}
                  onChange={(e) => setTitle(idx, 'mm', e.target.value)}
                  placeholder="Title (မြန်မာ)"
                  className="h-8 text-xs"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <MediaBrowserButton
          label={items.length === 0 ? 'Upload videos' : 'Add more videos'}
          variant="outline"
          size="sm"
          config={{
            allowedTypes: ['video/*'],
            selectionMode: 'multiple',
            maxFiles: 20,
          }}
          onSelectMedia={addUploaded}
        />

        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addExternal();
                }
              }}
              placeholder="Paste YouTube / Vimeo / video URL"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExternal}
            disabled={!externalUrl.trim()}
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Display mode */}
      <div className="space-y-1 pt-2 border-t">
        <FormLabel className="text-xs">Display mode</FormLabel>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="radio"
              name="video-display"
              value="list"
              checked={block.display === 'list'}
              onChange={() => update({ display: 'list' })}
            />
            <span>List (cards with play link)</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="radio"
              name="video-display"
              value="embed-first"
              checked={block.display === 'embed-first'}
              onChange={() => update({ display: 'embed-first' })}
            />
            <span>Embed first video</span>
          </label>
        </div>
        <FormDescription className="text-[11px]">
          Public site uses this to choose between an inline player and a
          plain list of video cards.
        </FormDescription>
      </div>
    </div>
  );
}
