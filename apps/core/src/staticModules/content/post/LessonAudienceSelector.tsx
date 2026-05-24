'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Button, Badge, FormLabel, FormDescription } from '@repo/ui';
import {
  ChevronDown,
  X,
  Loader2,
  Users,
  BookOpen,
  Layers,
  ListOrdered,
  GitBranch,
  Hash,
} from 'lucide-react';
import { toastError } from '@repo/utils';
import { getModuleReferenceAction } from '@repo/app-modules/server-actions';
import type { LessonContext } from '../common/types';

interface RefItem {
  id: string;
  label: string;
  /**
   * Optional secondary label (e.g. subject code, batch code) shown next to
   * the primary one in the dropdown for disambiguation.
   */
  meta?: string;
}

interface LessonAudienceSelectorProps {
  /** Required — drives subject filtering. The CPMS subject `/ref` endpoint
   *  honours `departmentId` to scope subjects to the chosen department. */
  departmentId?: string;
  /** ObjectId of the Lesson PostType — passed to `/post/ref` so the
   *  prerequisite picker only returns Lesson-type posts. Resolved by the
   *  parent form from its cached postType list. */
  lessonPostTypeId?: string;
  /** When editing an existing post, exclude it from the prerequisite
   *  picker so a lesson can't depend on itself. */
  editingPostId?: string;
  value?: LessonContext;
  onChange: (next: LessonContext) => void;
}

const EMPTY: LessonContext = {
  subjectId: undefined,
  batchIds: [],
  unitName: undefined,
  order: undefined,
  prerequisiteLessonIds: [],
};

/**
 * Call a CPMS `/ref` endpoint via the standard server action. Goes through
 * the API gateway with auth + tenant context already injected — that's
 * critical because the browser cannot reach `app-dev.um1ygn.edu.mm/cpms/...`
 * directly (Next.js has no rewrite for `/cpms/*`, so a raw browser fetch
 * lands on the Next.js 404 HTML page).
 */
async function fetchCpmsRef(
  module: 'subjects' | 'batches',
  query: Record<string, string | undefined> = {},
): Promise<RefItem[]> {
  const params: Record<string, string> = { limit: '100' };
  for (const [k, v] of Object.entries(query)) {
    if (v) params[k] = v;
  }
  const result = await getModuleReferenceAction<any>(module, params, 'cpms');
  if (!result.success || !Array.isArray(result.data)) return [];
  return result.data.map((item: any) => ({
    id: item.id ?? item._id ?? item.value,
    label:
      item.label ??
      item.name ??
      item.nameEnglish ??
      item.code ??
      item.id ??
      '',
    meta: item.code ?? undefined,
  }));
}

/**
 * Fetch candidate prerequisite lessons from the content service. Routes
 * via `getModuleReferenceAction('post', …, 'content')` which hits the
 * `/content/post/ref` endpoint. Filters server-side by subject and
 * `lessonPostTypeId`, and excludes the post being edited.
 */
async function fetchLessonPrereqs(
  query: Record<string, string | undefined>,
): Promise<RefItem[]> {
  const params: Record<string, string> = { limit: '100' };
  for (const [k, v] of Object.entries(query)) {
    if (v) params[k] = v;
  }
  const result = await getModuleReferenceAction<any>('post', params, 'content');
  if (!result.success || !Array.isArray(result.data)) return [];
  return result.data.map((item: any) => {
    const id = item.id ?? item._id ?? item.value;
    const unit = item.unitName as string | undefined;
    const order =
      typeof item.order === 'number' ? `#${item.order} ` : '';
    return {
      id,
      label: item.label ?? item.title?.en ?? item.slug ?? id,
      meta: unit ? `${order}${unit}` : order || undefined,
    };
  });
}

/**
 * Audience selector for Lesson posts. Two-step cascade:
 *   1. Subject — single-select, filtered to the current Department.
 *   2. Batches — multi-select, listing every batch teaching that
 *      subject (subject-based or module-based). LEAVE EMPTY to mean
 *      "all batches teaching this subject (now + future)".
 */
export function LessonAudienceSelector({
  departmentId,
  lessonPostTypeId,
  editingPostId,
  value,
  onChange,
}: LessonAudienceSelectorProps) {
  const ctx: LessonContext = value ?? EMPTY;

  // Subject state
  const [subjects, setSubjects] = useState<RefItem[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectOpen, setSubjectOpen] = useState(false);

  // Batch state
  const [batches, setBatches] = useState<RefItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');

  // Prerequisite state
  const [prereqs, setPrereqs] = useState<RefItem[]>([]);
  const [loadingPrereqs, setLoadingPrereqs] = useState(false);
  const [prereqSearch, setPrereqSearch] = useState('');
  const [prereqOpen, setPrereqOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  // Hydrated label cache so chips can render even without a fresh fetch.
  const [labelMap, setLabelMap] = useState<Map<string, string>>(new Map());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load subjects whenever the department changes
  useEffect(() => {
    let cancelled = false;
    if (!departmentId) {
      setSubjects([]);
      return;
    }
    setLoadingSubjects(true);
    fetchCpmsRef('subjects', { departmentId })
      .then((items) => {
        if (cancelled) return;
        setSubjects(items);
        setLabelMap((prev) => {
          const next = new Map(prev);
          items.forEach((it) => next.set(it.id, it.label));
          return next;
        });
      })
      .catch((err) => {
        if (!cancelled) toastError(`Failed to load subjects: ${String(err)}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubjects(false);
      });
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  // ─── Load batches when the subject changes
  useEffect(() => {
    let cancelled = false;
    if (!ctx.subjectId) {
      setBatches([]);
      return;
    }
    setLoadingBatches(true);
    fetchCpmsRef('batches', { subjectId: ctx.subjectId })
      .then((items) => {
        if (cancelled) return;
        setBatches(items);
        setLabelMap((prev) => {
          const next = new Map(prev);
          items.forEach((it) => next.set(it.id, it.label));
          return next;
        });
      })
      .catch((err) => {
        if (!cancelled) toastError(`Failed to load batches: ${String(err)}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingBatches(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx.subjectId]);

  // ─── Load prerequisite lesson candidates when subject changes
  useEffect(() => {
    let cancelled = false;
    if (!ctx.subjectId) {
      setPrereqs([]);
      return;
    }
    setLoadingPrereqs(true);
    fetchLessonPrereqs({
      subjectId: ctx.subjectId,
      lessonPostTypeId,
      excludeId: editingPostId,
    })
      .then((items) => {
        if (cancelled) return;
        setPrereqs(items);
        setLabelMap((prev) => {
          const next = new Map(prev);
          items.forEach((it) => next.set(it.id, it.label));
          return next;
        });
      })
      .catch((err) => {
        if (!cancelled)
          toastError(`Failed to load prerequisite lessons: ${String(err)}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingPrereqs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx.subjectId, lessonPostTypeId, editingPostId]);

  // ─── Subject helpers
  const subjectFiltered = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.meta ?? '').toLowerCase().includes(q),
    );
  }, [subjectSearch, subjects]);

  const setSubject = (id: string | undefined) => {
    onChange({
      ...ctx,
      subjectId: id,
      // Reset batch selection when subject changes — old batchIds may not
      // belong to the new subject. Same logic for prerequisites: those
      // candidates are filtered by subject, so old picks become invalid.
      batchIds: [],
      prerequisiteLessonIds: [],
    });
    setSubjectSearch('');
    setSubjectOpen(false);
  };

  const selectedSubjectLabel = ctx.subjectId
    ? labelMap.get(ctx.subjectId)
    : undefined;

  // ─── Batch helpers
  const batchFiltered = useMemo(() => {
    const q = batchSearch.trim().toLowerCase();
    const visible = batches.filter((b) => !ctx.batchIds.includes(b.id));
    if (!q) return visible;
    return visible.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        (b.meta ?? '').toLowerCase().includes(q),
    );
  }, [batchSearch, batches, ctx.batchIds]);

  const addBatch = (id: string) => {
    if (ctx.batchIds.includes(id)) return;
    onChange({ ...ctx, batchIds: [...ctx.batchIds, id] });
    setBatchSearch('');
  };
  const removeBatch = (id: string) => {
    onChange({ ...ctx, batchIds: ctx.batchIds.filter((x) => x !== id) });
  };

  // ─── Prerequisite helpers
  const selectedPrereqIds = ctx.prerequisiteLessonIds ?? [];
  const prereqFiltered = useMemo(() => {
    const q = prereqSearch.trim().toLowerCase();
    const visible = prereqs.filter((p) => !selectedPrereqIds.includes(p.id));
    if (!q) return visible;
    return visible.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.meta ?? '').toLowerCase().includes(q),
    );
  }, [prereqSearch, prereqs, selectedPrereqIds]);

  const addPrereq = (id: string) => {
    if (selectedPrereqIds.includes(id)) return;
    onChange({
      ...ctx,
      prerequisiteLessonIds: [...selectedPrereqIds, id],
    });
    setPrereqSearch('');
  };
  const removePrereq = (id: string) => {
    onChange({
      ...ctx,
      prerequisiteLessonIds: selectedPrereqIds.filter((x) => x !== id),
    });
  };

  // ─── Sequencing field helpers
  const setUnitName = (next: string) => {
    onChange({ ...ctx, unitName: next.trim() ? next : undefined });
  };
  const setOrder = (raw: string) => {
    if (!raw.trim()) {
      onChange({ ...ctx, order: undefined });
      return;
    }
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) {
      onChange({ ...ctx, order: Math.floor(n) });
    }
  };

  // ─── Render
  return (
    <div className="space-y-4">
      {!departmentId && (
        <p className="text-xs text-muted-foreground italic">
          Pick a Department in the Publishing card above to choose a subject.
        </p>
      )}

      {/* Subject — single-select */}
      <div className="space-y-1">
        <FormLabel className="flex items-center gap-1.5 text-sm">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          Subject <span className="text-destructive">*</span>
        </FormLabel>
        <div className="relative">
          <Input
            value={
              subjectOpen
                ? subjectSearch
                : selectedSubjectLabel ?? ''
            }
            onChange={(e) => {
              setSubjectSearch(e.target.value);
              if (!subjectOpen) setSubjectOpen(true);
            }}
            onFocus={() => {
              setSubjectOpen(true);
              setSubjectSearch('');
            }}
            onBlur={() => {
              setTimeout(() => setSubjectOpen(false), 150);
            }}
            placeholder={
              !departmentId
                ? 'Pick a department first…'
                : loadingSubjects
                  ? 'Loading subjects…'
                  : subjects.length === 0
                    ? 'No subjects in this department'
                    : 'Search subject…'
            }
            disabled={!departmentId || loadingSubjects || subjects.length === 0}
            className="pr-16"
          />
          {ctx.subjectId && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSubject(undefined)}
              className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
              title="Clear subject"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

          {subjectOpen && departmentId && subjects.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
              {subjectFiltered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No match.
                </div>
              ) : (
                <div className="py-1">
                  {subjectFiltered.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setSubject(s.id)}
                      className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-muted truncate ${
                        ctx.subjectId === s.id ? 'bg-muted/50 font-medium' : ''
                      }`}
                    >
                      {s.label}
                      {s.meta && (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          {s.meta}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batches — multi-select. Empty = "all batches teaching this subject". */}
      <div className="space-y-1">
        <FormLabel className="flex items-center gap-1.5 text-sm">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          Batches
          <span className="ml-2 text-[10px] text-muted-foreground tabular-nums">
            {ctx.batchIds.length === 0
              ? '(all teaching batches)'
              : `(${ctx.batchIds.length} selected)`}
          </span>
        </FormLabel>

        {ctx.batchIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {ctx.batchIds.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {labelMap.get(id) || id}
                <button
                  type="button"
                  onClick={() => removeBatch(id)}
                  className="hover:bg-muted-foreground/20 rounded p-0.5"
                  aria-label="Remove batch"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="relative">
          <Input
            value={batchSearch}
            onChange={(e) => setBatchSearch(e.target.value)}
            onFocus={() => setBatchOpen(true)}
            onBlur={() => {
              setTimeout(() => setBatchOpen(false), 150);
            }}
            placeholder={
              !ctx.subjectId
                ? 'Pick a subject first…'
                : loadingBatches
                  ? 'Loading batches…'
                  : batches.length === 0
                    ? 'No batches teach this subject yet'
                    : 'Search and pick batches (or leave empty)'
            }
            disabled={!ctx.subjectId || loadingBatches || batches.length === 0}
            className="pr-8"
          />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

          {batchOpen && ctx.subjectId && batches.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
              {batchFiltered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {batchSearch.trim()
                    ? 'No match.'
                    : 'All batches already selected.'}
                </div>
              ) : (
                <div className="py-1">
                  {batchFiltered.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addBatch(b.id)}
                      className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted truncate"
                    >
                      {b.label}
                      {b.meta && (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          {b.meta}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <FormDescription className="text-[11px]">
          {ctx.subjectId && ctx.batchIds.length === 0 ? (
            <span>
              <strong>Reach:</strong> all current and future batches that
              teach this subject. Pick specific batches above to limit.
            </span>
          ) : ctx.subjectId && ctx.batchIds.length > 0 ? (
            <span>
              <strong>Reach:</strong> only the {ctx.batchIds.length} batch
              {ctx.batchIds.length === 1 ? '' : 'es'} you selected.
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              The lesson will be visible to all students in the matching
              batches.
            </span>
          )}
        </FormDescription>
      </div>

      {/* ───────── Sequencing — curriculum unit, order, prerequisites */}
      <div className="border-t pt-4 space-y-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
            Sequencing
          </div>
          <p className="text-[11px] text-muted-foreground">
            Optional — drives lesson ordering &amp; prerequisite gating.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Unit name — display grouping */}
          <div className="space-y-1 sm:col-span-2">
            <FormLabel className="flex items-center gap-1.5 text-sm">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              Unit
            </FormLabel>
            <Input
              value={ctx.unitName ?? ''}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g., Unit 1 — Cell Biology"
              maxLength={80}
            />
            <FormDescription className="text-[11px]">
              Display-only group within the subject. Leave blank if the
              subject has no sub-units.
            </FormDescription>
          </div>

          {/* Order — numeric sort */}
          <div className="space-y-1">
            <FormLabel className="flex items-center gap-1.5 text-sm">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              Order
            </FormLabel>
            <Input
              type="number"
              min={0}
              step={1}
              value={ctx.order ?? ''}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0"
            />
            <FormDescription className="text-[11px]">
              Lower = earlier. Sort within (subject, unit).
            </FormDescription>
          </div>
        </div>

        {/* Prerequisites — multi-select chips */}
        <div className="space-y-1">
          <FormLabel className="flex items-center gap-1.5 text-sm">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            Prerequisites
            <span className="ml-2 text-[11px] font-normal text-muted-foreground tabular-nums">
              {selectedPrereqIds.length === 0
                ? '(none)'
                : `(${selectedPrereqIds.length} selected)`}
            </span>
          </FormLabel>

          {selectedPrereqIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {selectedPrereqIds.map((id) => (
                <Badge key={id} variant="secondary" className="gap-1 pr-1">
                  {labelMap.get(id) || id}
                  <button
                    type="button"
                    onClick={() => removePrereq(id)}
                    className="hover:bg-muted-foreground/20 rounded p-0.5"
                    aria-label="Remove prerequisite"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="relative">
            <Input
              value={prereqSearch}
              onChange={(e) => setPrereqSearch(e.target.value)}
              onFocus={() => setPrereqOpen(true)}
              onBlur={() => {
                setTimeout(() => setPrereqOpen(false), 150);
              }}
              placeholder={
                !ctx.subjectId
                  ? 'Pick a subject first…'
                  : loadingPrereqs
                    ? 'Loading lessons…'
                    : prereqs.length === 0
                      ? 'No other lessons in this subject yet'
                      : 'Search and pick prerequisite lessons'
              }
              disabled={
                !ctx.subjectId || loadingPrereqs || prereqs.length === 0
              }
              className="pr-8"
            />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

            {prereqOpen && ctx.subjectId && prereqs.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
                {prereqFiltered.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    {prereqSearch.trim()
                      ? 'No match.'
                      : 'All candidates already selected.'}
                  </div>
                ) : (
                  <div className="py-1">
                    {prereqFiltered.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addPrereq(p.id)}
                        className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted truncate"
                      >
                        {p.label}
                        {p.meta && (
                          <span className="ml-2 text-[10px] text-muted-foreground">
                            {p.meta}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <FormDescription className="text-[11px]">
            Students must complete all selected lessons before this one
            unlocks. Only lessons in the same subject are listed.
          </FormDescription>
        </div>
      </div>

      {loadingSubjects && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading…
        </div>
      )}
    </div>
  );
}
