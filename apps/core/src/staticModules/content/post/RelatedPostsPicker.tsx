'use client';

import React, { useEffect, useState } from 'react';
import { Button, FormLabel, Input } from '@repo/ui';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { getPosts, getRelatedPosts } from '../common/actions';
import type { Post } from '../common/types';

interface RelatedPostsPickerProps {
  /** Post being edited (undefined when creating). Used to fetch auto-suggestions. */
  postId?: string;
  value: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Related posts UI — three sub-sections:
 *
 *  1. Selected (manually curated) — chips with remove buttons; saves as
 *     `relatedPostIds`.
 *  2. Suggestions — pulled from `GET /post/:id/related` when editing an
 *     existing post; click to add.
 *  3. Search — debounced post search to add arbitrary posts by title.
 *
 * Manual curation wins on save: the backend treats a populated
 * `relatedPostIds` array as override, and only auto-suggests when empty.
 */
export function RelatedPostsPicker({
  postId,
  value,
  onChange,
}: RelatedPostsPickerProps) {
  const [selectedDetails, setSelectedDetails] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searching, setSearching] = useState(false);

  // Hydrate display details for the curated value list
  useEffect(() => {
    if (value.length === 0) {
      setSelectedDetails([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await getPosts({ limit: value.length });
        if (cancelled) return;
        const all = (r.success && (r.data as any)?.data) || [];
        const byId = new Map<string, Post>(
          all.map((p: Post) => [p._id, p]),
        );
        setSelectedDetails(value.map((id) => byId.get(id)).filter(Boolean) as Post[]);
      } catch {
        // best-effort — IDs still saved correctly even if titles can't render
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Pull auto-suggestions once per `postId`. `value` is intentionally
  // NOT a dependency: filtering already-selected posts out of the
  // suggestion list is a *render-time* concern (see `displayedSuggestions`
  // below). Including it caused the effect to refire on every parent
  // re-render — during a save, the form re-renders 4-5 times, which
  // produced a burst of `GET /post/:id/related` calls that both
  // slowed the save down and amplified any backend error from this
  // endpoint into a multi-line error loop in the server logs.
  useEffect(() => {
    if (!postId) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await getRelatedPosts({ postId, limit: 5 });
        if (cancelled) return;
        const list = (r.success && Array.isArray(r.data) ? r.data : []) as Post[];
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // Filter already-selected suggestions at render time so we don't
  // need to refetch when the user adds/removes a related post.
  const displayedSuggestions = suggestions.filter(
    (p) => !value.includes(p._id),
  );

  // Debounced search
  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const r = await getPosts({ search: search.trim(), limit: 10 });
        const list = (r.success && (r.data as any)?.data) || [];
        // Drop self + already-selected
        setSearchResults(
          (list as Post[]).filter(
            (p) => p._id !== postId && !value.includes(p._id),
          ),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [search, postId, value]);

  const add = (p: Post) => onChange([...value, p._id]);
  const remove = (id: string) => onChange(value.filter((x) => x !== id));

  const titleOf = (p: Post): string =>
    p.title?.en || p.title?.mm || `Post ${p._id.slice(-6)}`;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs">Related Posts</FormLabel>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {value.length}/20
        </span>
      </div>

      {/* Selected */}
      {selectedDetails.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selectedDetails.map((p) => (
            <span
              key={p._id}
              className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs"
            >
              <span className="max-w-[180px] truncate">{titleOf(p)}</span>
              <button
                type="button"
                onClick={() => remove(p._id)}
                className="text-muted-foreground hover:text-destructive"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {postId
            ? 'No manual selections — backend auto-suggests by tag/category overlap.'
            : 'Save the post first, then pick related posts. Auto-suggestions appear after save.'}
        </p>
      )}

      {/* Suggestions */}
      {displayedSuggestions.length > 0 && (
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Auto-suggestions
          </p>
          <div className="flex flex-wrap gap-1">
            {displayedSuggestions.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => add(p)}
                disabled={value.length >= 20}
                className="inline-flex items-center gap-1 rounded-md border border-dashed bg-background px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                title="Add to related posts"
              >
                <Plus className="h-3 w-3" />
                <span className="max-w-[180px] truncate">{titleOf(p)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual search */}
      <div className="space-y-1">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts to add manually…"
          className="h-8 text-xs"
        />
        {searching && (
          <p className="text-[10px] text-muted-foreground">Searching…</p>
        )}
        {searchResults.length > 0 && (
          <div className="rounded-md border bg-background max-h-40 overflow-y-auto">
            {searchResults.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => {
                  add(p);
                  setSearch('');
                  setSearchResults([]);
                }}
                disabled={value.length >= 20}
                className="block w-full text-left px-2 py-1 text-xs hover:bg-muted disabled:opacity-50 truncate"
              >
                {titleOf(p)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
