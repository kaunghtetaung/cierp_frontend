'use client';

import React from 'react';
import {
  FileText,
  FileType2,
  Table2,
  Images,
  Video,
  Presentation,
} from 'lucide-react';
import type { PostContentType } from '../common/types';

interface ContentTypeSelectorProps {
  value: PostContentType;
  onChange: (next: PostContentType) => void;
}

const TYPES: Array<{
  value: PostContentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'article',
    label: 'Article',
    description: 'Rich text body with images and links.',
    icon: FileText,
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'One or more downloadable PDF files.',
    icon: FileType2,
  },
  {
    value: 'table',
    label: 'Table',
    description: 'Tabular data with sortable columns.',
    icon: Table2,
  },
  {
    value: 'gallery',
    label: 'Gallery',
    description: 'Photo / image collection.',
    icon: Images,
  },
  {
    value: 'video',
    label: 'Video',
    description: 'Uploaded clips or YouTube / Vimeo embeds.',
    icon: Video,
  },
  {
    value: 'slides',
    label: 'Slides',
    description: 'PDF preview + downloadable PowerPoint.',
    icon: Presentation,
  },
];

/**
 * Segmented selector for the post's `contentType`. Renders 4 cards in a
 * row; the selected one gets a primary border. Switching only changes the
 * field — the other content blocks stay in form state so the user can
 * flip back without losing what they typed.
 */
export function ContentTypeSelector({
  value,
  onChange,
}: ContentTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {TYPES.map(({ value: t, label, description, icon: Icon }) => {
        const active = value === t;
        return (
          <button
            type="button"
            key={t}
            onClick={() => onChange(t)}
            className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-background hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                className={`h-4 w-4 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-[11px] text-muted-foreground leading-tight">
              {description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
