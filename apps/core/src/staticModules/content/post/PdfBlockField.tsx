'use client';

import React from 'react';
import { Input, Button, FormLabel, FormDescription } from '@repo/ui';
import { ArrowDown, ArrowUp, Trash2, FileType2 } from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { MediaFile } from '@repo/media';
import type { PdfBlock } from '../common/types';

interface PdfBlockFieldProps {
  value?: PdfBlock;
  onChange: (next: PdfBlock | undefined) => void;
}

const EMPTY: PdfBlock = { files: [], display: 'list' };

/**
 * Multi-PDF picker — appears when contentType === 'pdf'. Wraps
 * MediaBrowserButton with `allowedTypes=['application/pdf']` and
 * `selectionMode='multiple'`. Each selected file gets:
 *   - a per-language title (en/mm) — optional
 *   - reorder ▲▼ buttons
 *   - remove button
 *
 * The `display` mode controls the public renderer:
 *   - 'list' shows every PDF as a download card
 *   - 'embed-first' embeds the first PDF inline and lists the rest
 */
export function PdfBlockField({ value, onChange }: PdfBlockFieldProps) {
  const block: PdfBlock = value ?? EMPTY;
  const files = block.files;

  const update = (next: Partial<PdfBlock>) => {
    onChange({ ...block, ...next });
  };

  const addMany = (media: MediaFile[]) => {
    const additions = media.map((m) => ({
      mediaId: m.id,
      url: m.url,
      title: { en: m.alt?.en || m.fileName || '', mm: m.alt?.mm || '' },
    }));
    update({
      files: [...files, ...additions],
    });
  };

  const removeAt = (idx: number) => {
    update({ files: files.filter((_, i) => i !== idx) });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...files];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update({ files: next });
  };

  const setTitle = (
    idx: number,
    lang: 'en' | 'mm',
    text: string,
  ) => {
    const next = [...files];
    next[idx] = {
      ...next[idx],
      title: { ...(next[idx].title || {}), [lang]: text },
    };
    update({ files: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-sm">PDF documents</FormLabel>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {files.length} file{files.length === 1 ? '' : 's'}
        </span>
      </div>

      {files.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center">
          <FileType2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No PDFs added yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((f, idx) => (
            <li
              key={`${f.url}-${idx}`}
              className="rounded-md border bg-background p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <FileType2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline truncate flex-1"
                  title={f.url}
                >
                  {f.url.split('/').pop() || f.url}
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
                  disabled={idx === files.length - 1}
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
                  value={f.title?.en || ''}
                  onChange={(e) => setTitle(idx, 'en', e.target.value)}
                  placeholder="Title (English)"
                  className="h-8 text-xs"
                />
                <Input
                  value={f.title?.mm || ''}
                  onChange={(e) => setTitle(idx, 'mm', e.target.value)}
                  placeholder="Title (မြန်မာ)"
                  className="h-8 text-xs"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <MediaBrowserButton
          label={files.length === 0 ? 'Add PDFs' : 'Add more PDFs'}
          variant="outline"
          size="sm"
          config={{
            allowedTypes: ['application/pdf'],
            selectionMode: 'multiple',
            maxFiles: 20,
          }}
          onSelectMedia={addMany}
        />
      </div>

      <div className="space-y-1 pt-2 border-t">
        <FormLabel className="text-xs">Display mode</FormLabel>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="radio"
              name="pdf-display"
              value="list"
              checked={block.display === 'list'}
              onChange={() => update({ display: 'list' })}
            />
            <span>List (download links)</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="radio"
              name="pdf-display"
              value="embed-first"
              checked={block.display === 'embed-first'}
              onChange={() => update({ display: 'embed-first' })}
            />
            <span>Embed first PDF</span>
          </label>
        </div>
        <FormDescription className="text-[11px]">
          The public site uses this to choose between an inline embed and a
          plain list of download cards.
        </FormDescription>
      </div>
    </div>
  );
}
