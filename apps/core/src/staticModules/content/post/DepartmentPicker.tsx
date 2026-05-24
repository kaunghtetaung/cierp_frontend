'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@repo/ui';
import { ChevronDown, Loader2, X } from 'lucide-react';
import { toastError } from '@repo/utils';
import { getPublishableDepartments } from '../common/actions';

interface RefItem {
  id: string;
  label: string;
  value: string;
}

interface DepartmentPickerProps {
  value?: string;
  onChange: (id: string | undefined) => void;
  /**
   * Reports the loaded list back to the parent so it can disable the form
   * when the list is empty (i.e. user has no publish rights).
   */
  onLoaded?: (items: RefItem[]) => void;
  /**
   * Reports whether the current user is allowed to author org-level
   * (departmentless) posts. True when the requester is systemAdmin or
   * organizationAdmin. The post form uses this to show / hide the
   * "Organization-level (no department)" toggle.
   */
  onCanPublishOrgLevel?: (canPublishOrgLevel: boolean) => void;
  /** Module the publish-permission check is scoped to. Defaults to `post`. */
  moduleName?: string;
}

/**
 * Searchable single-select for departments — backed by
 * `GET /core/departments/publishable?module=post`. One input field acts as
 * both display and search. Click to open, type to filter, click row to
 * pick, X to clear.
 */
export function DepartmentPicker({
  value,
  onChange,
  onLoaded,
  onCanPublishOrgLevel,
  moduleName = 'post',
}: DepartmentPickerProps) {
  const [items, setItems] = useState<RefItem[]>([]);
  const [labelMap, setLabelMap] = useState<Map<string, string>>(new Map());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // One-shot load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await getPublishableDepartments({ module: moduleName });
        if (cancelled) return;
        if (r.success && r.data) {
          const list = r.data.items as RefItem[];
          setItems(list);
          const map = new Map<string, string>();
          list.forEach((it) => map.set(it.id, it.label));
          setLabelMap(map);
          onLoaded?.(list);
          onCanPublishOrgLevel?.(Boolean(r.data.canPublishOrgLevel));
        } else if (!r.success) {
          toastError(r.error || 'Failed to load departments');
          onLoaded?.([]);
          onCanPublishOrgLevel?.(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleName]);

  const selectedLabel = value ? labelMap.get(value) || '' : '';

  // The input shows the search query while open, the selected label while
  // closed. This keeps the field readable and lets the user start typing
  // immediately on focus.
  const displayValue = open ? search : selectedLabel;

  const filtered = (() => {
    const q = search.trim().toLowerCase();
    if (!open || !q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q));
  })();

  const select = (id: string) => {
    onChange(id);
    setSearch('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const clear = () => {
    onChange(undefined);
    setSearch('');
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setSearch('');
          }}
          onBlur={() => {
            // Delay close so a click on a row fires first.
            setTimeout(() => setOpen(false), 150);
          }}
          placeholder={
            loading
              ? 'Loading departments…'
              : items.length === 0
                ? 'No publishable departments'
                : 'Search department…'
          }
          disabled={loading || items.length === 0}
          className="pr-16"
        />

        {/* Clear button (only when something selected) */}
        {value && !loading && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

        {open && !loading && items.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No match.
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(d.id)}
                    className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-muted truncate ${
                      value === d.id ? 'bg-muted/50 font-medium' : ''
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!loading && items.length === 0 && (
        <p className="text-xs text-destructive">
          You don&apos;t have publish rights in any department.
        </p>
      )}
    </div>
  );
}
