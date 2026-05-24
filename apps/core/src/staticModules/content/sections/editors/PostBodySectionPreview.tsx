'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import type { PostBodySectionFormData } from './post-body-types';

interface Props {
  data: PostBodySectionFormData;
  language?: 'en' | 'mm';
}

/**
 * Static placeholder card — the section has no content of its own,
 * so the preview just demonstrates where in the layout the post's
 * Tiptap body will be injected at render time.
 */
export function PostBodySectionPreview({ data }: Props) {
  return (
    <div className="bg-background rounded shadow-lg border overflow-hidden">
      <div className="px-6 py-8 border-l-4 border-primary bg-muted/30">
        <div className="flex items-center gap-2 mb-3 text-primary">
          <FileText className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider font-semibold">
            Post Body Placeholder
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-3">
          [Article title from post]
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          The post's Tiptap body content renders here at request time.
          Use this section inside the main column of a template; the
          template's surrounding rows / columns drive the page chrome
          (sidebar widgets, hero, footer, etc.).
        </p>
        <p className="text-sm text-muted-foreground italic">
          (Section name: <code className="px-1 bg-background rounded">{data.name || '(unnamed)'}</code>)
        </p>
      </div>
    </div>
  );
}

export default PostBodySectionPreview;
