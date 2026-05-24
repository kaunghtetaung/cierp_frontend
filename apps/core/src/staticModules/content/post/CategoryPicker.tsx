'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Button, Badge } from '@repo/ui';
import { ChevronDown, Plus, X, Loader2 } from 'lucide-react';
import { toastError, toastSuccess } from '@repo/utils';
import { createCategory, getCategoryReference } from '../common/actions';

interface RefItem {
  id: string;
  label: string;
  value: string;
}

interface CategoryPickerProps {
  /** Currently selected category IDs (multi-select). */
  value: string[];
  onChange: (next: string[]) => void;
}

/**
 * Multi-select category picker — backed by
 * `GET /content/categories/ref?search=&limit=` via a server action.
 *
 * Mirrors TagPicker's UX:
 * - Input on top (search / inline-create).
 * - Selected categories appear as removable chips below the input only
 *   when at least one is picked, so this widget aligns vertically with
 *   the empty TagPicker when sitting side by side.
 * - On a search miss, a `+ Create "X"` button appears at the bottom and
 *   creates the category with that name, then auto-selects it.
 */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<RefItem[]>([]);
  const [labelMap, setLabelMap] = useState<Map<string, string>>(new Map());
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRef = async (query?: string): Promise<RefItem[]> => {
    const r = await getCategoryReference({ search: query, limit: 50 });
    if (r.success && Array.isArray(r.data)) return r.data as RefItem[];
    if (!r.success) toastError(r.error || 'Failed to load categories');
    return [];
  };

  // Initial load on dropdown open.
  useEffect(() => {
    if (!open || results.length > 0 || search.trim()) return;
    setLoading(true);
    fetchRef().then((items) => {
      setResults(items);
      setLabelMap((prev) => {
        const next = new Map(prev);
        items.forEach((it) => next.set(it.id, it.label));
        return next;
      });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open) return;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const items = await fetchRef(search.trim() || undefined);
      setResults(items);
      setLabelMap((prev) => {
        const next = new Map(prev);
        items.forEach((it) => next.set(it.id, it.label));
        return next;
      });
      setLoading(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open]);

  // Hydrate labels for already-selected ids we don't have yet.
  useEffect(() => {
    const missing = value.filter((id) => !labelMap.has(id));
    if (missing.length === 0) return;
    fetchRef().then((items) => {
      setLabelMap((prev) => {
        const next = new Map(prev);
        items.forEach((it) => next.set(it.id, it.label));
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const trimmed = search.trim();
  const lower = trimmed.toLowerCase();
  const exactMatch =
    !!trimmed && results.some((r) => r.label.toLowerCase() === lower);

  // Hide already-selected entries from the dropdown — chips below show them.
  const visible = useMemo(
    () => results.filter((r) => !value.includes(r.id)),
    [results, value],
  );

  const add = (id: string) => {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setSearch('');
  };
  const remove = (id: string) => onChange(value.filter((x) => x !== id));

  const onCreate = async () => {
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const r = await createCategory({ name: trimmed } as any);
      if (r.success && r.data) {
        const created = r.data as { _id: string; name: any };
        const n = created.name;
        const label =
          typeof n === 'string'
            ? n
            : (n?.en || n?.mm) ?? trimmed;
        const newItem: RefItem = {
          id: created._id,
          label,
          value: created._id,
        };
        setResults((prev) => [newItem, ...prev]);
        setLabelMap((prev) => new Map(prev).set(newItem.id, newItem.label));
        add(newItem.id);
        toastSuccess(`Category "${trimmed}" created`);
      } else {
        toastError(r.error || 'Failed to create category');
      }
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : 'Failed to create category',
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Search input with dropdown — top so this picker aligns vertically
          with TagPicker when they sit side by side. */}
      <div className="relative">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Search or create categories…"
          className="pr-8"
        />
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
            {loading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading…
              </div>
            ) : visible.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {trimmed
                  ? 'No match. Use the Create button below.'
                  : value.length > 0
                    ? 'All matching categories are already selected.'
                    : 'No categories yet.'}
              </div>
            ) : (
              <div className="py-1">
                {visible.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(c.id)}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted truncate"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {trimmed && !exactMatch && (
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3 mr-2" />
                  )}
                  Create &quot;{trimmed}&quot;
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected chips — appear below the input only when at least one
          category is selected. */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1 pr-1">
              {labelMap.get(id) || id}
              <button
                type="button"
                onClick={() => remove(id)}
                className="hover:bg-muted-foreground/20 rounded p-0.5"
                aria-label="Remove category"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
