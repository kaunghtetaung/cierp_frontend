'use client';

import React from 'react';
import { Badge } from '@repo/ui';
import { Home, Eye, EyeOff, Layout, FileText, Layers } from 'lucide-react';
import {
  DefaultPostListView,
  statusBadgeFor,
  type PostListColumnDef,
} from '../_shared/DefaultPostListView';

interface PageProps {
  appId: string;
}

const PAGE_COLUMNS: PostListColumnDef[] = [
  {
    key: 'parent',
    header: 'Parent',
    width: 'w-[150px]',
    render: (post) => {
      const parent = (post as any).parentId;
      // Parent isn't populated on list — show truncated id or "—".
      return parent ? (
        <span className="text-xs text-muted-foreground font-mono truncate">
          …{String(parent).slice(-8)}
        </span>
      ) : (
        <Badge variant="outline" className="text-[10px]">
          Root
        </Badge>
      );
    },
  },
  {
    key: 'template',
    header: 'Template',
    width: 'w-[130px]',
    render: (post) => {
      const tpl = (post as any).template || 'default';
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Layout className="h-3.5 w-3.5 shrink-0" />
          {tpl}
        </span>
      );
    },
  },
  {
    key: 'layoutMode',
    header: 'Body',
    width: 'w-[110px]',
    align: 'center',
    render: (post) => {
      const mode = (post as any).layoutMode || 'tiptap';
      return mode === 'sections' ? (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <Layers className="h-3 w-3" />
          Sections
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-[10px]">
          <FileText className="h-3 w-3" />
          Tiptap
        </Badge>
      );
    },
  },
  {
    key: 'flags',
    header: 'Flags',
    width: 'w-[120px]',
    align: 'center',
    render: (post) => {
      const isHome = (post as any).isHomePage;
      const inNav = (post as any).showInNavigation;
      return (
        <div className="flex items-center justify-center gap-1">
          {isHome && (
            <Badge className="gap-1 text-[10px]">
              <Home className="h-3 w-3" />
              Home
            </Badge>
          )}
          {inNav ? (
            <span title="In navigation">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          ) : (
            <span title="Hidden from navigation">
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
            </span>
          )}
        </div>
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

/**
 * Pages list — backed by Posts collection (PostType.slug='page'). The
 * legacy `pages` collection + `staticModules/content/pages/` (plural)
 * remain kept as backward-compat reads but the canonical CRUD path is
 * now this view. See project_deferred_work.md item #8.
 */
export default function PageListPage({ appId }: PageProps) {
  return (
    <DefaultPostListView
      postTypeSlug="page"
      title="Pages"
      appId={appId}
      columns={PAGE_COLUMNS}
    />
  );
}
