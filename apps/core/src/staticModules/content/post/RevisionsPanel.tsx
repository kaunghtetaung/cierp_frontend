'use client';

import React, { useEffect, useState } from 'react';
import { Button, FormLabel } from '@repo/ui';
import { History, Undo2 } from 'lucide-react';
import { toastSuccess, toastError } from '@repo/utils';
import {
  getPostRevisions,
  restorePostRevision,
} from '../common/actions';

interface RevisionsPanelProps {
  postId?: string;
  /** Called after a successful restore so the parent can reload the post. */
  onRestored?: () => void;
}

interface RevisionRow {
  _id: string;
  revisionNumber: number;
  isCurrent?: boolean;
  changeNote?: string;
  changedBy?: string;
  changedByName?: string;
  createdAt?: string;
}

/**
 * Revisions panel — shown only when editing an existing post (postId set).
 * Displays the history newest-first; per-row "Restore" action confirms,
 * calls the backend restore endpoint, and triggers a reload via
 * `onRestored`. Restore lands as Draft so the editor can review before
 * republishing.
 */
export function RevisionsPanel({ postId, onRestored }: RevisionsPanelProps) {
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);

  const reload = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const r = await getPostRevisions(postId);
      const list = (r.success && Array.isArray(r.data)
        ? r.data
        : []) as unknown as RevisionRow[];
      setRevisions(list);
    } catch {
      setRevisions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  if (!postId) {
    return (
      <div className="rounded-lg border bg-muted/20 p-3">
        <FormLabel className="text-xs flex items-center gap-1">
          <History className="h-3 w-3" />
          Revisions
        </FormLabel>
        <p className="text-[11px] text-muted-foreground mt-1">
          Save the post first to start tracking revisions.
        </p>
      </div>
    );
  }

  const onRestore = async (revisionNumber: number) => {
    if (
      !window.confirm(
        `Restore to revision #${revisionNumber}? The current version will be saved as the next revision, and the post will be set to Draft.`,
      )
    ) {
      return;
    }
    setRestoring(revisionNumber);
    try {
      const r = await restorePostRevision(postId, String(revisionNumber));
      if (r.success) {
        toastSuccess(`Restored to revision #${revisionNumber} (saved as Draft)`);
        onRestored?.();
        await reload();
      } else {
        toastError(r.error || 'Restore failed');
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs flex items-center gap-1">
          <History className="h-3 w-3" />
          Revisions
        </FormLabel>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {revisions.length}
        </span>
      </div>

      {loading ? (
        <p className="text-[11px] text-muted-foreground">Loading…</p>
      ) : revisions.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          No history yet. Edits will appear here as numbered revisions.
        </p>
      ) : (
        <ul className="divide-y border rounded-md bg-background max-h-64 overflow-y-auto">
          {revisions.map((r) => (
            <li
              key={r._id}
              className="flex items-center gap-2 px-2 py-1.5 text-xs"
            >
              <span className="font-mono tabular-nums text-muted-foreground w-10">
                #{r.revisionNumber}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate">
                  {r.changeNote || (r.isCurrent ? 'Current version' : 'Edit')}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleString()
                    : '—'}
                  {r.changedByName ? ` · ${r.changedByName}` : ''}
                </span>
              </span>
              {!r.isCurrent && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={restoring !== null}
                  onClick={() => onRestore(r.revisionNumber)}
                  className="h-7"
                  title="Restore this version"
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  {restoring === r.revisionNumber ? 'Restoring…' : 'Restore'}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
