'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui';

export interface RowPreset {
  id: string;
  label: string;
  /** Column widths summing to 12 (Bootstrap-style grid). */
  columns: number[];
}

const PRESETS: RowPreset[] = [
  { id: 'col-12', label: '1 column · full width', columns: [12] },
  { id: 'col-6-6', label: '2 columns · 6 + 6', columns: [6, 6] },
  { id: 'col-8-4', label: '2 columns · 8 + 4 (content + sidebar)', columns: [8, 4] },
  { id: 'col-4-8', label: '2 columns · 4 + 8 (sidebar + content)', columns: [4, 8] },
  { id: 'col-3-9', label: '2 columns · 3 + 9 (narrow sidebar + content)', columns: [3, 9] },
  { id: 'col-9-3', label: '2 columns · 9 + 3 (content + narrow sidebar)', columns: [9, 3] },
  { id: 'col-4-4-4', label: '3 columns · 4 + 4 + 4', columns: [4, 4, 4] },
  { id: 'col-3-6-3', label: '3 columns · 3 + 6 + 3', columns: [3, 6, 3] },
  { id: 'col-3-3-3-3', label: '4 columns · 3 + 3 + 3 + 3', columns: [3, 3, 3, 3] },
];

interface LayoutPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (preset: RowPreset) => void;
}

export function LayoutPickerModal({ open, onClose, onPick }: LayoutPickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pick a row layout</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPick(preset)}
              className="rounded-md border bg-background hover:border-primary hover:bg-primary/5 transition-colors p-3 text-left"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-medium">{preset.label}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                {preset.columns.map((width, i) => (
                  <div
                    key={i}
                    className={`h-8 rounded-sm bg-muted border border-border col-span-${width}`}
                    style={{ gridColumn: `span ${width} / span ${width}` }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
