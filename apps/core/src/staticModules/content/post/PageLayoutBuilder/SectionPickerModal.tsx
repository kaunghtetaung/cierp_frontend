'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from '@repo/ui';
import { Loader2, Search } from 'lucide-react';
import { getSections } from '../../common/actions';
import type { PageLayoutColumnRef } from '../../common/types';

interface SectionPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (ref: PageLayoutColumnRef) => void;
  tenantId?: string;
}

interface SectionRow {
  _id: string;
  name: string;
  type: string;
  title?: { en?: string; mm?: string };
}

/**
 * Picks an existing reusable Section to drop into a layout column.
 * Lists `Section` docs from the content service (filtered by the
 * current tenant via the standard auth context). Search filters by
 * name + section type. Future: "+ Create new section" inline entry
 * point that opens the section editor without leaving this modal.
 */
export function SectionPickerModal({
  open,
  onClose,
  onPick,
}: SectionPickerModalProps) {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await getSections({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
        if (cancelled) return;
        if (r.success && r.data) {
          const list = Array.isArray(r.data)
            ? r.data
            : (r.data as any)?.data ?? [];
          setSections(list as SectionRow[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = sections.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      (s.title?.en ?? '').toLowerCase().includes(q) ||
      (s.title?.mm ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pick a section</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, title, or type…"
              className="pl-9"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto -mx-1 px-1">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                No sections match.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() =>
                      onPick({
                        sectionId: s._id,
                        sectionData: null,
                        order: 0,
                        isVisible: true,
                      })
                    }
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {s.title?.en || s.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {s.name}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        {s.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
