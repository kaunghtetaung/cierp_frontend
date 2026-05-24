'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Input,
  Badge,
  FormLabel,
  FormDescription,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@repo/ui';
import {
  Megaphone,
  Pin,
  Clock,
  CheckCircle2,
  Bell,
  Layers,
  ChevronDown,
  X,
  AlertTriangle,
  Info,
  Flame,
  Circle,
} from 'lucide-react';
import { toastError } from '@repo/utils';
import { getModuleReferenceAction } from '@repo/app-modules/server-actions';
import type {
  AnnouncementContext,
  AnnouncementPriority,
  NotifyChannel,
} from '../common/types';

interface AnnouncementDetailsCardProps {
  /** Drives the batch picker — only batches teaching subjects in this
   *  department are listed. The post's existing publishing-department
   *  field flows in here. */
  departmentId?: string;
  value?: AnnouncementContext;
  onChange: (next: AnnouncementContext) => void;
}

interface BatchRefItem {
  id: string;
  label: string;
  meta?: string;
}

const EMPTY: AnnouncementContext = {
  priority: 'normal',
  pinned: false,
  expiresAt: undefined,
  requiresAcknowledgment: false,
  notifyChannels: ['inapp'],
  targetBatchIds: [],
};

const PRIORITY_META: Record<
  AnnouncementPriority,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  low: {
    label: 'Low',
    icon: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
    tone: 'text-muted-foreground',
  },
  normal: {
    label: 'Normal',
    icon: <Info className="h-3.5 w-3.5 text-blue-600" />,
    tone: 'text-blue-700',
  },
  high: {
    label: 'High',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />,
    tone: 'text-amber-700',
  },
  urgent: {
    label: 'Urgent',
    icon: <Flame className="h-3.5 w-3.5 text-rose-600" />,
    tone: 'text-rose-700',
  },
};

const CHANNEL_LABEL: Record<NotifyChannel, string> = {
  inapp: 'In-app',
  email: 'Email',
  push: 'Push',
};
const ALL_CHANNELS: NotifyChannel[] = ['inapp', 'email', 'push'];

/**
 * Convert ISO ↔ `<input type="date">` value (YYYY-MM-DD).
 */
function toDateInput(iso: string | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}
function fromDateInput(raw: string): string | undefined {
  if (!raw) return undefined;
  return new Date(raw).toISOString();
}

/**
 * Fetch active batches in a department via `/cpms/batches/ref?departmentId=`.
 * Routes through the standard reference action so the request goes via the
 * gateway with auth/tenant context (raw browser fetch wouldn't reach it).
 */
async function fetchBatchesInDepartment(
  departmentId: string,
): Promise<BatchRefItem[]> {
  const result = await getModuleReferenceAction<any>(
    'batches',
    { departmentId, limit: '100' },
    'cpms',
  );
  if (!result.success || !Array.isArray(result.data)) return [];
  return result.data.map((b: any) => ({
    id: b.id ?? b._id ?? b.value,
    label: b.label ?? b.name ?? b.code ?? b.id,
    meta: b.code,
  }));
}

export function AnnouncementDetailsCard({
  departmentId,
  value,
  onChange,
}: AnnouncementDetailsCardProps) {
  const ctx: AnnouncementContext = value ?? EMPTY;
  const targetBatchIds = ctx.targetBatchIds ?? [];
  const channels = ctx.notifyChannels ?? ['inapp'];

  // Batch picker state
  const [batches, setBatches] = useState<BatchRefItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');
  const [batchOpen, setBatchOpen] = useState(false);
  const [labelMap, setLabelMap] = useState<Map<string, string>>(new Map());

  // Refresh batch list whenever the post's department changes
  useEffect(() => {
    let cancelled = false;
    if (!departmentId) {
      setBatches([]);
      return;
    }
    setLoadingBatches(true);
    fetchBatchesInDepartment(departmentId)
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
        if (!cancelled)
          toastError(`Failed to load batches: ${String(err)}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingBatches(false);
      });
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  // ───── Field setters
  const setPriority = (priority: AnnouncementPriority) => {
    onChange({ ...ctx, priority });
  };
  const togglePinned = (pinned: boolean) => {
    onChange({ ...ctx, pinned });
  };
  const setExpiresAt = (raw: string) => {
    onChange({ ...ctx, expiresAt: fromDateInput(raw) });
  };
  const toggleAck = (requiresAcknowledgment: boolean) => {
    onChange({ ...ctx, requiresAcknowledgment });
  };
  const toggleChannel = (channel: NotifyChannel, on: boolean) => {
    const set = new Set(channels);
    if (on) set.add(channel);
    else set.delete(channel);
    onChange({ ...ctx, notifyChannels: Array.from(set) as NotifyChannel[] });
  };
  const addBatch = (id: string) => {
    if (targetBatchIds.includes(id)) return;
    onChange({ ...ctx, targetBatchIds: [...targetBatchIds, id] });
    setBatchSearch('');
  };
  const removeBatch = (id: string) => {
    onChange({
      ...ctx,
      targetBatchIds: targetBatchIds.filter((x) => x !== id),
    });
  };

  // ───── Batch dropdown filter
  const batchFiltered = useMemo(() => {
    const q = batchSearch.trim().toLowerCase();
    const visible = batches.filter((b) => !targetBatchIds.includes(b.id));
    if (!q) return visible;
    return visible.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        (b.meta ?? '').toLowerCase().includes(q),
    );
  }, [batchSearch, batches, targetBatchIds]);

  // ───── Render
  const expired =
    ctx.expiresAt && new Date(ctx.expiresAt) < new Date();
  const priority = ctx.priority ?? 'normal';

  return (
    <div className="space-y-4">
      {/* Priority + Pin + Acknowledge — top row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Priority */}
        <div className="space-y-1">
          <FormLabel className="flex items-center gap-1.5 text-sm">
            <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
            Priority
          </FormLabel>
          <Select value={priority} onValueChange={(v) => setPriority(v as AnnouncementPriority)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                <SelectItem key={p} value={p}>
                  <span className="flex items-center gap-2">
                    {PRIORITY_META[p].icon}
                    <span className={PRIORITY_META[p].tone}>
                      {PRIORITY_META[p].label}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pin to top */}
        <div className="rounded-md border px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Pin to top</div>
              <div className="text-[11px] text-muted-foreground">
                Show first in feed listings.
              </div>
            </div>
          </div>
          <Switch checked={!!ctx.pinned} onCheckedChange={togglePinned} />
        </div>

        {/* Require acknowledgment */}
        <div className="rounded-md border px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Require ack</div>
              <div className="text-[11px] text-muted-foreground">
                Reader must click "I've read this".
              </div>
            </div>
          </div>
          <Switch
            checked={!!ctx.requiresAcknowledgment}
            onCheckedChange={toggleAck}
          />
        </div>
      </div>

      {/* Expiry + Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <FormLabel className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Expires on
          </FormLabel>
          <Input
            type="date"
            value={toDateInput(ctx.expiresAt)}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <FormDescription className="text-[11px]">
            {expired
              ? 'Already expired — currently hidden from the feed.'
              : 'Optional. Auto-archives in feed listings after this date.'}
          </FormDescription>
        </div>

        <div className="space-y-1">
          <FormLabel className="flex items-center gap-1.5 text-sm">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            Notify via
          </FormLabel>
          <div className="flex flex-wrap gap-3 rounded-md border px-3 py-2 min-h-9">
            {ALL_CHANNELS.map((ch) => (
              <label
                key={ch}
                className="flex items-center gap-1.5 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={channels.includes(ch)}
                  onCheckedChange={(v) => toggleChannel(ch, v === true)}
                />
                {CHANNEL_LABEL[ch]}
              </label>
            ))}
          </div>
          <FormDescription className="text-[11px]">
            Routing hint for the notification fanout (phase 2).
          </FormDescription>
        </div>
      </div>

      {/* Target batches — multi-select */}
      <div className="space-y-1">
        <FormLabel className="flex items-center gap-1.5 text-sm">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          Target batches
          <span className="ml-2 text-[11px] font-normal text-muted-foreground tabular-nums">
            {targetBatchIds.length === 0
              ? '(visibility scope only)'
              : `(${targetBatchIds.length} selected)`}
          </span>
        </FormLabel>

        {targetBatchIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {targetBatchIds.map((id) => (
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
              !departmentId
                ? 'Pick a department first…'
                : loadingBatches
                  ? 'Loading batches…'
                  : batches.length === 0
                    ? 'No active batches in this department'
                    : 'Search and pick batches (or leave empty)'
            }
            disabled={!departmentId || loadingBatches || batches.length === 0}
            className="pr-8"
          />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

          {batchOpen && departmentId && batches.length > 0 && (
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
          {targetBatchIds.length === 0 ? (
            <span>
              <strong>Audience:</strong> whatever the post's visibility
              setting allows (Public / Protected groups / Department). Leave
              empty if you want the announcement to follow the visibility
              rules without batch narrowing.
            </span>
          ) : (
            <span>
              <strong>Audience:</strong> intersected with members of the{' '}
              {targetBatchIds.length} selected batch
              {targetBatchIds.length === 1 ? '' : 'es'}.
            </span>
          )}
        </FormDescription>
      </div>
    </div>
  );
}
