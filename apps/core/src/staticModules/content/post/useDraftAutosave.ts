'use client';

import { useEffect, useRef, useState } from 'react';
import { updatePost } from '../common/actions';
import type { CreatePostFormData } from '../common/schemas';

export type AutosaveStatus =
  | { state: 'idle' }
  | { state: 'pending' } // user typed; debounce timer running
  | { state: 'saving' }
  | { state: 'saved'; at: Date }
  | { state: 'error'; message: string };

interface UseDraftAutosaveArgs {
  /** Post id — autosave only runs in edit mode. */
  postId?: string;
  /** Current form data (the watched form values). */
  data: CreatePostFormData;
  /** Whether the form is currently dirty (RHF flag). */
  isDirty: boolean;
  /** Whether autosave should be enabled at all (e.g. status === 'Draft'). */
  enabled: boolean;
  /** Debounce delay in ms; default 5000. */
  debounceMs?: number;
}

/**
 * Debounced background autosave for Draft posts.
 *
 * Behaviour:
 * - Skips entirely when `!enabled`, when there's no `postId` (create mode),
 *   or when the form isn't dirty.
 * - Snapshots `data` on each change; restarts the timer.
 * - On fire, sends `updatePost(postId, data)` quietly (no toast). The next
 *   manual save will happen normally.
 * - Surfaces a status object so the caller can render a "Saving… / Saved 3s
 *   ago" indicator near the action buttons.
 *
 * Limitations:
 * - Doesn't bypass server-side validation. If the form is invalid, the
 *   autosave fails and surfaces the error. The user's manual save flow
 *   still runs the same code path.
 * - No conflict detection beyond the optimistic-locking version field
 *   already in CreatePostFormData.
 */
export function useDraftAutosave({
  postId,
  data,
  isDirty,
  enabled,
  debounceMs = 5000,
}: UseDraftAutosaveArgs): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>({ state: 'idle' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const latestDataRef = useRef<CreatePostFormData>(data);

  // Always remember the freshest data; the timer reads from this ref.
  latestDataRef.current = data;

  useEffect(() => {
    if (!enabled || !postId || !isDirty) {
      // Cancel any pending save when conditions stop being met.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Don't overwrite a "saved" badge with idle — it's nicer for the user
      // to keep seeing "Saved 30s ago" until they edit again.
      return;
    }

    setStatus({ state: 'pending' });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (inFlightRef.current) return; // already saving; skip this tick
      inFlightRef.current = true;
      setStatus({ state: 'saving' });
      try {
        const r = await updatePost(postId, latestDataRef.current as any);
        if (r.success) {
          setStatus({ state: 'saved', at: new Date() });
        } else {
          setStatus({
            state: 'error',
            message: r.error ?? 'Autosave failed',
          });
        }
      } catch (err) {
        setStatus({
          state: 'error',
          message: err instanceof Error ? err.message : 'Autosave failed',
        });
      } finally {
        inFlightRef.current = false;
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // We depend on the `data` reference directly. RHF's `watch()` returns a
    // stable reference when no watched field changed, so the timer is only
    // restarted on real edits. The previous implementation used
    // JSON.stringify(data) in the dep array which serialized the entire form
    // (ProseMirror doc, gallery arrays) on every render — measurable keystroke
    // lag on large posts. The fired callback reads from `latestDataRef` so we
    // still pick up the freshest snapshot at save time.
  }, [enabled, postId, isDirty, debounceMs, data]);

  return status;
}

/** Format an autosave status for display. */
export function formatAutosaveStatus(status: AutosaveStatus): string {
  switch (status.state) {
    case 'idle':
      return '';
    case 'pending':
      return 'Unsaved changes…';
    case 'saving':
      return 'Saving…';
    case 'saved': {
      const sec = Math.max(1, Math.round((Date.now() - status.at.getTime()) / 1000));
      if (sec < 60) return `Saved ${sec}s ago`;
      const min = Math.round(sec / 60);
      return `Saved ${min}m ago`;
    }
    case 'error':
      return `Autosave failed: ${status.message}`;
  }
}
