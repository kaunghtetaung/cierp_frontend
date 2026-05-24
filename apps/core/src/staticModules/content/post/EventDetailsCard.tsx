'use client';

import React, { useMemo } from 'react';
import {
  Input,
  FormLabel,
  FormDescription,
  Switch,
} from '@repo/ui';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { EventContext } from '../common/types';

interface EventDetailsCardProps {
  value?: EventContext;
  onChange: (next: EventContext) => void;
}

const EMPTY: EventContext = {
  startAt: undefined,
  endAt: undefined,
  location: undefined,
  isAllDay: false,
};

/**
 * `<input type="datetime-local">` and `<input type="date">` need values
 * formatted as `YYYY-MM-DDTHH:MM` (or `YYYY-MM-DD` for date-only). The
 * EventContext stores ISO strings, so we trim to the shape the input
 * expects. Returning '' for undefined keeps the input controlled.
 */
function toInputValue(iso: string | undefined, allDay: boolean): string {
  if (!iso) return '';
  // Strip seconds + timezone for the local input. Browsers parse the
  // resulting string in local time when the user submits it.
  const trimmed = allDay ? iso.slice(0, 10) : iso.slice(0, 16);
  return trimmed;
}

/**
 * Convert a local input value back to an ISO string. For all-day events we
 * normalise to the start-of-day UTC instant so the calendar treats it as a
 * 24-hour block regardless of viewer timezone.
 */
function fromInputValue(raw: string, allDay: boolean): string | undefined {
  if (!raw) return undefined;
  if (allDay) {
    // raw is `YYYY-MM-DD`; Date(`YYYY-MM-DD`) parses as UTC midnight.
    return new Date(raw).toISOString();
  }
  // raw is `YYYY-MM-DDTHH:MM`; Date() parses as local time → toISOString
  // converts to UTC for storage.
  return new Date(raw).toISOString();
}

export function EventDetailsCard({ value, onChange }: EventDetailsCardProps) {
  const ctx: EventContext = value ?? EMPTY;
  const isAllDay = ctx.isAllDay ?? false;

  const startInput = useMemo(
    () => toInputValue(ctx.startAt, isAllDay),
    [ctx.startAt, isAllDay],
  );
  const endInput = useMemo(
    () => toInputValue(ctx.endAt, isAllDay),
    [ctx.endAt, isAllDay],
  );

  const setStart = (raw: string) => {
    onChange({ ...ctx, startAt: fromInputValue(raw, isAllDay) });
  };
  const setEnd = (raw: string) => {
    onChange({ ...ctx, endAt: fromInputValue(raw, isAllDay) });
  };
  const setLocation = (raw: string) => {
    onChange({ ...ctx, location: raw.trim() ? raw : undefined });
  };
  const toggleAllDay = (next: boolean) => {
    onChange({ ...ctx, isAllDay: next });
  };

  // Cross-field hint shown under the inputs — Zod doesn't catch this since
  // the rule lives across two sibling fields.
  const endBeforeStart =
    ctx.startAt && ctx.endAt && new Date(ctx.endAt) < new Date(ctx.startAt);

  return (
    <div className="space-y-4">
      {/* All-day toggle */}
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">All-day event</div>
            <div className="text-[11px] text-muted-foreground">
              Hides the time pickers; the calendar shows a 24-hour block.
            </div>
          </div>
        </div>
        <Switch checked={isAllDay} onCheckedChange={toggleAllDay} />
      </div>

      {/* Start / end */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <FormLabel className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Starts <span className="text-destructive">*</span>
          </FormLabel>
          <Input
            type={isAllDay ? 'date' : 'datetime-local'}
            value={startInput}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <FormLabel className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Ends
          </FormLabel>
          <Input
            type={isAllDay ? 'date' : 'datetime-local'}
            value={endInput}
            onChange={(e) => setEnd(e.target.value)}
            min={startInput || undefined}
          />
          <FormDescription className="text-[11px]">
            Optional. Defaults to a 1-hour block on the calendar.
          </FormDescription>
        </div>
      </div>

      {endBeforeStart && (
        <div className="text-xs text-destructive">
          End time is before start time — please adjust.
        </div>
      )}

      {/* Location */}
      <div className="space-y-1">
        <FormLabel className="flex items-center gap-1.5 text-sm">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          Location
        </FormLabel>
        <Input
          value={ctx.location ?? ''}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Lecture Hall A · Zoom: link · Online"
          maxLength={200}
        />
        <FormDescription className="text-[11px]">
          Free text. Shown next to the event title on the calendar.
        </FormDescription>
      </div>
    </div>
  );
}
