'use client';

import React from 'react';
import { Button, Input, FormLabel, FormDescription } from '@repo/ui';
import { FileType2, Presentation, X } from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { SlidesBlock } from '../common/types';

interface SlidesBlockFieldProps {
  value?: SlidesBlock;
  onChange: (next: SlidesBlock) => void;
}

const EMPTY: SlidesBlock = {
  pdfMediaId: undefined,
  pdfUrl: undefined,
  pdfFilename: undefined,
  pptxMediaId: undefined,
  pptxUrl: undefined,
  pptxFilename: undefined,
  title: undefined,
};

const PDF_TYPES = ['application/pdf'];
const PPTX_TYPES = [
  // .pptx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // .ppt (legacy)
  'application/vnd.ms-powerpoint',
];

/**
 * Strip the path prefix off a Media URL to get a display filename. Falls
 * back to the URL itself if no path separator. Used for the chips that
 * show what's currently uploaded.
 */
function fileLabel(url?: string, fallback?: string): string {
  if (fallback) return fallback;
  if (!url) return '';
  try {
    const u = new URL(url, window.location.origin);
    const last = u.pathname.split('/').pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}

/**
 * Slide-deck editor — paired media pickers. Author uploads a PDF (web
 * preview, required) and optionally the original PPTX (download). No
 * server-side conversion happens; the two assets are stored side-by-side.
 */
export function SlidesBlockField({ value, onChange }: SlidesBlockFieldProps) {
  const ctx: SlidesBlock = value ?? EMPTY;

  const setPdf = (
    files: Array<{ id?: string; _id?: string; url: string; name?: string }>,
  ) => {
    if (files.length === 0) return;
    const f = files[0];
    onChange({
      ...ctx,
      pdfMediaId: f.id ?? f._id,
      pdfUrl: f.url,
      pdfFilename: f.name,
    });
  };
  const clearPdf = () => {
    onChange({
      ...ctx,
      pdfMediaId: undefined,
      pdfUrl: undefined,
      pdfFilename: undefined,
    });
  };

  const setPptx = (
    files: Array<{ id?: string; _id?: string; url: string; name?: string }>,
  ) => {
    if (files.length === 0) return;
    const f = files[0];
    onChange({
      ...ctx,
      pptxMediaId: f.id ?? f._id,
      pptxUrl: f.url,
      pptxFilename: f.name,
    });
  };
  const clearPptx = () => {
    onChange({
      ...ctx,
      pptxMediaId: undefined,
      pptxUrl: undefined,
      pptxFilename: undefined,
    });
  };

  const setTitleEn = (raw: string) => {
    onChange({
      ...ctx,
      title: { ...(ctx.title || {}), en: raw || undefined },
    });
  };
  const setTitleMm = (raw: string) => {
    onChange({
      ...ctx,
      title: { ...(ctx.title || {}), mm: raw || undefined },
    });
  };

  return (
    <div className="space-y-4">
      {/* PDF + PPTX side by side (col-6 each on lg+) — preview and
           download asset travel together so authors don't have to
           scroll between them. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* PDF — required, web preview asset */}
      <div className="space-y-1.5">
        <FormLabel className="flex items-center gap-1.5 text-sm">
          <FileType2 className="h-3.5 w-3.5 text-muted-foreground" />
          PDF preview <span className="text-destructive">*</span>
        </FormLabel>
        {ctx.pdfUrl ? (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="truncate">
              {fileLabel(ctx.pdfUrl, ctx.pdfFilename)}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={ctx.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline text-muted-foreground hover:text-foreground"
              >
                Open
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearPdf}
                className="h-6 w-6 p-0"
                aria-label="Remove PDF"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <MediaBrowserButton
            label="Browse PDF"
            onSelectMedia={setPdf as any}
            config={{
              selectionMode: 'single',
              allowedTypes: PDF_TYPES,
              maxFileSize: 50 * 1024 * 1024, // 50MB
              returnFormat: 'url',
            }}
          />
        )}
        <FormDescription className="text-[11px]">
          Required. Embedded in the post view via the existing PDF viewer.
        </FormDescription>
      </div>

      {/* PPTX — optional, download asset */}
      <div className="space-y-1.5">
        <FormLabel className="flex items-center gap-1.5 text-sm">
          <Presentation className="h-3.5 w-3.5 text-muted-foreground" />
          PowerPoint download
        </FormLabel>
        {ctx.pptxUrl ? (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="truncate">
              {fileLabel(ctx.pptxUrl, ctx.pptxFilename)}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={ctx.pptxUrl}
                download={ctx.pptxFilename}
                className="text-xs underline text-muted-foreground hover:text-foreground"
              >
                Download
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearPptx}
                className="h-6 w-6 p-0"
                aria-label="Remove PPTX"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <MediaBrowserButton
            label="Browse PowerPoint"
            onSelectMedia={setPptx as any}
            config={{
              selectionMode: 'single',
              allowedTypes: PPTX_TYPES,
              maxFileSize: 100 * 1024 * 1024, // 100MB — pptx can be heavy
              returnFormat: 'url',
            }}
          />
        )}
        <FormDescription className="text-[11px]">
          Optional. Offered as "Download original" next to the PDF preview.
        </FormDescription>
      </div>
      </div>

      {/* Title (multilingual, optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <FormLabel className="text-sm">Slide title (EN)</FormLabel>
          <Input
            value={ctx.title?.en ?? ''}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="e.g., Lecture 3 — Cell Division"
            maxLength={120}
          />
        </div>
        <div className="space-y-1">
          <FormLabel className="text-sm">Slide title (MM)</FormLabel>
          <Input
            value={ctx.title?.mm ?? ''}
            onChange={(e) => setTitleMm(e.target.value)}
            placeholder="ဆလိုက်ခေါင်းစဥ်"
            maxLength={120}
          />
        </div>
      </div>
    </div>
  );
}
