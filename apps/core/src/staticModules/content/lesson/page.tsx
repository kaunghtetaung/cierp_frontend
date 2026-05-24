'use client';

import React from 'react';
import { Badge } from '@repo/ui';
import { BookOpen, Layers } from 'lucide-react';
import {
  DefaultPostListView,
  statusBadgeFor,
  type PostListColumnDef,
} from '../_shared/DefaultPostListView';

interface PageProps {
  appId: string;
}

const LESSON_COLUMNS: PostListColumnDef[] = [
  {
    key: 'subject',
    header: 'Subject',
    width: 'w-[220px]',
    render: (post) => {
      const ctx = (post as any).lessonContext;
      // The post has subjectId only (an ObjectId). Server doesn't populate
      // CPMS Subject docs into the post listing today, so show the unit
      // name (free-text from the author) when available, otherwise the
      // truncated ID as a fallback. Phase 2: server-side populate.
      const unit = ctx?.unitName as string | undefined;
      const subjectId = ctx?.subjectId as string | undefined;
      if (unit) {
        return (
          <span className="text-sm flex items-center gap-1.5 truncate">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {unit}
          </span>
        );
      }
      return (
        <span className="text-xs text-muted-foreground font-mono truncate">
          {subjectId ? subjectId.slice(-8) : '—'}
        </span>
      );
    },
  },
  {
    key: 'batches',
    header: 'Batches',
    width: 'w-[120px]',
    align: 'center',
    render: (post) => {
      const ctx = (post as any).lessonContext;
      const count = ctx?.batchIds?.length ?? 0;
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Layers className="h-3 w-3" />
          {count === 0 ? 'all teaching' : count}
        </span>
      );
    },
  },
  {
    key: 'order',
    header: 'Order',
    width: 'w-[80px]',
    align: 'center',
    render: (post) => {
      const order = (post as any).lessonContext?.order;
      return typeof order === 'number' ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          #{order}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    key: 'prereqCount',
    header: 'Prereqs',
    width: 'w-[100px]',
    align: 'center',
    render: (post) => {
      const n =
        (post as any).lessonContext?.prerequisiteLessonIds?.length ?? 0;
      return n > 0 ? (
        <Badge variant="outline" className="text-[10px]">
          {n}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
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

export default function LessonListPage({ appId }: PageProps) {
  return (
    <DefaultPostListView
      postTypeSlug="lesson"
      title="Lessons"
      appId={appId}
      columns={LESSON_COLUMNS}
    />
  );
}
