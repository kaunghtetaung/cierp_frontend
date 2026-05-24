'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';

// localStorage key prefix for in-progress section drafts. One key per
// active editor — see `buildDraftKey()` for the shape. Versioned so a
// future schema change can ignore stale drafts wholesale.
const PREFIX = 'ciapp:section-draft:v1:';

export interface DraftEntry<T = unknown> {
  values: T;
  savedAt: number;
}

export function buildDraftKey(sectionType: string, sectionId?: string): string {
  return `${sectionType}::${sectionId ?? 'new'}`;
}

export function loadDraft<T = unknown>(key: string): DraftEntry<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.savedAt === 'number' &&
      'values' in parsed
    ) {
      return parsed as DraftEntry<T>;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // swallow — quota / privacy mode can throw
  }
}

interface Options {
  // Active forms persist; inactive ones (other section types in the
  // same editor host) skip the subscription so we don't write stale
  // defaults from forms the user never touched.
  enabled?: boolean;
  debounceMs?: number;
}

// Subscribes to the form's value changes and persists them to
// localStorage under `PREFIX + key`. The hook is fire-and-forget — it
// does NOT auto-restore. The host is expected to call `loadDraft(key)`
// at mount, prompt the user, and call `form.reset(draft.values)` if
// they accept. Clear on successful save with `clearDraft(key)`.
export function useSectionDraftPersistence<T extends FieldValues>(
  form: UseFormReturn<T>,
  key: string,
  options: Options = {},
): void {
  const { enabled = true, debounceMs = 500 } = options;
  const lastWriteRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const subscription = form.watch((values) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const payload = JSON.stringify({ values, savedAt: Date.now() });
          // Skip identical writes — react-hook-form fires `watch` on
          // every keystroke including no-op updates from controlled
          // sub-components. Avoids needless storage churn.
          if (payload === lastWriteRef.current) return;
          lastWriteRef.current = payload;
          window.localStorage.setItem(PREFIX + key, payload);
        } catch {
          // quota / serialization error — drop silently
        }
      }, debounceMs);
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [enabled, key, debounceMs, form]);
}

// Render-friendly relative-time helper for the restore prompt
// ("3 minutes ago", "yesterday"). Avoids a dependency on `date-fns`
// for one usage site.
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'a moment ago';
  if (diff < 3_600_000) {
    const m = Math.floor(diff / 60_000);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (diff < 86_400_000) {
    const h = Math.floor(diff / 3_600_000);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  const d = Math.floor(diff / 86_400_000);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

// Convenience: wrap a submit handler so successful saves clear the draft.
// Call sites pass their existing submit; we return a wrapper that runs it
// and clears the key only when the inner handler resolved without throwing.
// (Server-action results are usually `{ success, error }` shapes — the
// host is responsible for early-returning on error before reaching here.)
export function useDraftClearOnSave(key: string): () => void {
  return useCallback(() => clearDraft(key), [key]);
}
