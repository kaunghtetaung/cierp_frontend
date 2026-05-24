'use client';

import React from 'react';
import {
  DefaultPostListView,
  statusBadgeFor,
  formatDate,
  type PostListColumnDef,
} from '../_shared/DefaultPostListView';

interface PageProps {
  appId: string;
}

function getCustomField(post: any, name: string): string | undefined {
  const fields = post?.customFields as any[] | undefined;
  const found = fields?.find((f) => f?.fieldName === name);
  return typeof found?.value === 'string' || typeof found?.value === 'number'
    ? String(found.value)
    : undefined;
}

const ARTICLE_COLUMNS: PostListColumnDef[] = [
  {
    key: 'author',
    header: 'Author',
    width: 'w-[160px]',
    render: (post) => {
      const author = getCustomField(post, 'author');
      return (
        <span className="text-sm text-muted-foreground truncate">
          {author || '—'}
        </span>
      );
    },
  },
  {
    key: 'readTime',
    header: 'Read time',
    width: 'w-[100px]',
    align: 'center',
    render: (post) => {
      const minutes = getCustomField(post, 'readTime');
      return minutes ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          {minutes} min
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    key: 'category',
    header: 'Category',
    width: 'w-[140px]',
    render: (post) => {
      const cat = getCustomField(post, 'category');
      return (
        <span className="text-sm text-muted-foreground truncate">
          {cat || '—'}
        </span>
      );
    },
  },
  {
    key: 'createdAt',
    header: 'Created',
    width: 'w-[140px]',
    render: (post) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(post.createdAt)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 'w-[110px]',
    render: (post) => statusBadgeFor(post.status),
  },
];

export default function ArticleListPage({ appId }: PageProps) {
  return (
    <DefaultPostListView
      postTypeSlug="article"
      title="Articles"
      appId={appId}
      columns={ARTICLE_COLUMNS}
    />
  );
}
