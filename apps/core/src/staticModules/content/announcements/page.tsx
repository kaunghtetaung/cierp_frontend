'use client';

import React from 'react';
import { Badge } from '@repo/ui';
import { Pin, Flame, AlertTriangle, Info, Circle, Layers } from 'lucide-react';
import {
  DefaultPostListView,
  statusBadgeFor,
  formatDate,
  type PostListColumnDef,
} from '../_shared/DefaultPostListView';

interface PageProps {
  appId: string;
}

function priorityBadge(priority: string | undefined) {
  switch (priority) {
    case 'urgent':
      return (
        <Badge variant="destructive" className="gap-1 text-[10px]">
          <Flame className="h-3 w-3" />
          Urgent
        </Badge>
      );
    case 'high':
      return (
        <Badge className="gap-1 text-[10px] bg-amber-500 hover:bg-amber-600">
          <AlertTriangle className="h-3 w-3" />
          High
        </Badge>
      );
    case 'normal':
      return (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <Info className="h-3 w-3" />
          Normal
        </Badge>
      );
    case 'low':
      return (
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Circle className="h-3 w-3" />
          Low
        </Badge>
      );
    default:
      return (
        <span className="text-xs text-muted-foreground">—</span>
      );
  }
}

const ANNOUNCEMENT_COLUMNS: PostListColumnDef[] = [
  {
    key: 'priority',
    header: 'Priority',
    width: 'w-[110px]',
    align: 'center',
    render: (post) =>
      priorityBadge((post as any).announcementContext?.priority),
  },
  {
    key: 'pinned',
    header: 'Pinned',
    width: 'w-[80px]',
    align: 'center',
    render: (post) =>
      (post as any).announcementContext?.pinned ? (
        <span title="Pinned">
          <Pin className="h-3.5 w-3.5 text-amber-600" />
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    key: 'expires',
    header: 'Expires',
    width: 'w-[140px]',
    render: (post) => {
      const exp = (post as any).announcementContext?.expiresAt;
      if (!exp) {
        return <span className="text-xs text-muted-foreground">Never</span>;
      }
      const past = new Date(exp).getTime() < Date.now();
      return (
        <span
          className={`text-xs ${
            past ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {formatDate(exp)}
          {past && ' (expired)'}
        </span>
      );
    },
  },
  {
    key: 'targets',
    header: 'Batches',
    width: 'w-[100px]',
    align: 'center',
    render: (post) => {
      const ctx = (post as any).announcementContext;
      const n = ctx?.targetBatchIds?.length ?? 0;
      return n > 0 ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Layers className="h-3 w-3" />
          {n}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">All</span>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    width: 'w-[110px]',
    render: (post) => statusBadgeFor(post.status),
  },
];

export default function AnnouncementsListPage({ appId }: PageProps) {
  return (
    <DefaultPostListView
      postTypeSlug="announcements"
      title="Announcements"
      appId={appId}
      columns={ANNOUNCEMENT_COLUMNS}
    />
  );
}
