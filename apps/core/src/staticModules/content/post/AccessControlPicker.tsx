'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input, FormLabel } from '@repo/ui';
import { Trash2 } from 'lucide-react';

interface RefItem {
  id: string;
  label: string | { en?: string; mm?: string };
  value: string;
}

interface AccessControlPickerProps {
  /** Display label above the picker. */
  label: string;
  /** ref endpoint relative to the current site, e.g. `/core/roles/ref`. */
  endpoint: string;
  /** Currently-selected IDs (from form). */
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  /** Defaults to 20 — protects the dropdown UI. */
  maxSelection?: number;
  /** Small description shown below the picker. */
  description?: string;
}

/**
 * Generic multi-select picker for `/<service>/<entity>/ref`-style endpoints.
 * Used for allowedRoles / allowedUsers / allowedGroups on the Post form
 * when visibility is Private or Protected.
 *
 * - Debounced search (350ms, ≥2 chars).
 * - Selected items rendered as chips with remove button.
 * - Hydrates labels for already-selected ids by fetching the same ref
 *   endpoint with `?ids=` (best-effort; falls back to id slice if name
 *   resolution fails).
 */
export function AccessControlPicker({
  label,
  endpoint,
  value,
  onChange,
  placeholder = 'Search…',
  maxSelection = 50,
  description,
}: AccessControlPickerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<RefItem[]>([]);
  const [labelMap, setLabelMap] = useState<Map<string, string>>(new Map());
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Fetch ref endpoint with optional search query. */
  const fetchRef = async (query?: string): Promise<RefItem[]> => {
    const url = new URL(endpoint, window.location.origin);
    if (query) url.searchParams.set('search', query);
    url.searchParams.set('limit', '20');
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json();
    const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return arr.map((item: any) => ({
      id: item.id ?? item._id ?? item.value,
      label: item.label ?? item.name ?? item.username ?? item.displayName ?? item.id,
      value: item.value ?? item.id ?? item._id,
    }));
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open) return;
    if (search.trim().length < 2 && results.length > 0) {
      // First open with no query — load default list once
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const items = await fetchRef(search.trim() || undefined);
      setResults(items.filter((it) => !value.includes(it.id)));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, value, endpoint]);

  // Initial load when popover opens
  useEffect(() => {
    if (!open || results.length > 0) return;
    fetchRef().then((items) =>
      setResults(items.filter((it) => !value.includes(it.id))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Hydrate labels for already-selected IDs (best-effort)
  useEffect(() => {
    if (value.length === 0) return;
    const missing = value.filter((id) => !labelMap.has(id));
    if (missing.length === 0) return;
    fetchRef().then((items) => {
      setLabelMap((prev) => {
        const next = new Map(prev);
        for (const it of items) {
          if (value.includes(it.id)) {
            next.set(it.id, displayLabel(it));
          }
        }
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const displayLabel = (it: RefItem): string => {
    const l = it.label;
    if (typeof l === 'string') return l;
    return l?.en || l?.mm || it.id.slice(-6);
  };

  const add = (it: RefItem) => {
    if (value.length >= maxSelection) return;
    onChange([...value, it.id]);
    setLabelMap((prev) => new Map(prev).set(it.id, displayLabel(it)));
    setSearch('');
    setResults((prev) => prev.filter((r) => r.id !== it.id));
  };

  const remove = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs">{label}</FormLabel>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {value.length}/{maxSelection}
        </span>
      </div>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs"
            >
              <span className="max-w-[160px] truncate">
                {labelMap.get(id) ?? id.slice(-6)}
              </span>
              <button
                type="button"
                onClick={() => remove(id)}
                className="text-muted-foreground hover:text-destructive"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + results */}
      <div className="relative">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Allow click on result before closing
            setTimeout(() => setOpen(false), 150);
          }}
          placeholder={placeholder}
          className="h-8 text-xs"
        />
        {open && results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover shadow">
            {results.map((it) => (
              <button
                type="button"
                key={it.id}
                onClick={() => add(it)}
                disabled={value.length >= maxSelection}
                className="block w-full text-left px-2 py-1 text-xs hover:bg-muted disabled:opacity-50 truncate"
              >
                {displayLabel(it)}
              </button>
            ))}
          </div>
        )}
      </div>

      {description && (
        <p className="text-[10px] text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

