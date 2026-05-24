'use client';

import React from 'react';
import { Badge } from '@repo/ui';
import { Star } from 'lucide-react';
import {
  DefaultPostListView,
  statusBadgeFor,
  formatDate,
  type PostListColumnDef,
} from '../_shared/DefaultPostListView';

interface PageProps {
  appId: string;
}

const NEWS_COLUMNS: PostListColumnDef[] = [
  {
    key: 'category',
    header: 'Category',
    width: 'w-[160px]',
    render: (post) => {
      const cats = (post as any).categoryIds as any[] | undefined;
      const first = Array.isArray(cats) ? cats[0] : null;
      const label =
        typeof first === 'string'
          ? '—'
          : first?.name?.en || first?.name?.mm || first?.slug || '—';
      return (
        <span className="text-sm text-muted-foreground truncate">
          {label}
        </span>
      );
    },
  },
  {
    key: 'publishedAt',
    header: 'Published',
    width: 'w-[140px]',
    render: (post) => (
      <span className="text-sm text-muted-foreground">
        {formatDate((post as any).publishedAt || post.createdAt)}
      </span>
    ),
  },
  {
    key: 'isFeatured',
    header: 'Featured',
    width: 'w-[100px]',
    align: 'center',
    render: (post) =>
      post.isFeatured ? (
        <Badge variant="secondary" className="gap-1">
          <Star className="h-3 w-3 fill-current" />
          Featured
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 'w-[120px]',
    render: (post) => statusBadgeFor(post.status),
  },
];

export default function NewsListPage({ appId }: PageProps) {
  return (
    <DefaultPostListView
      postTypeSlug="news"
      title="News"
      appId={appId}
      columns={NEWS_COLUMNS}
    />
  );
}
