'use client';

import React from 'react';
import { Badge } from '@repo/ui';
import { Calendar as CalendarIcon, MapPin } from 'lucide-react';
import {
  DefaultPostListView,
  statusBadgeFor,
  type PostListColumnDef,
} from '../_shared/DefaultPostListView';

interface PageProps {
  appId: string;
}

function formatDateTime(value: any, isAllDay?: boolean): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return isAllDay
      ? d.toLocaleDateString()
      : d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
  } catch {
    return '—';
  }
}

const EVENTS_COLUMNS: PostListColumnDef[] = [
  {
    key: 'startAt',
    header: 'Starts',
    width: 'w-[200px]',
    render: (post) => {
      const ev = (post as any).eventContext;
      const startAt = ev?.startAt;
      const isAllDay = ev?.isAllDay;
      const past =
        startAt && new Date(startAt).getTime() < Date.now();
      return (
        <span
          className={`text-sm flex items-center gap-1.5 ${
            past ? 'text-muted-foreground line-through' : ''
          }`}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          {formatDateTime(startAt, isAllDay)}
        </span>
      );
    },
  },
  {
    key: 'location',
    header: 'Location',
    width: 'w-[200px]',
    render: (post) => {
      const loc = (post as any).eventContext?.location;
      return loc ? (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {loc}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    key: 'isAllDay',
    header: 'All-day',
    width: 'w-[90px]',
    align: 'center',
    render: (post) =>
      (post as any).eventContext?.isAllDay ? (
        <Badge variant="outline" className="text-[10px]">
          All-day
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 'w-[110px]',
    render: (post) => statusBadgeFor(post.status),
  },
];

export default function EventsListPage({ appId }: PageProps) {
  return (
    <DefaultPostListView
      postTypeSlug="events"
      title="Events"
      appId={appId}
      columns={EVENTS_COLUMNS}
    />
  );
}
