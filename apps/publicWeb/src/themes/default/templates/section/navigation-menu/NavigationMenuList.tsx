'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

/**
 * Interactive sidebar nav list rendered client-side so it can
 * expand / collapse branches, highlight the active item, and
 * auto-open the branch that contains the current page.
 *
 * The data fetch lives in the server-component sibling
 * (`NavigationMenuSection.tsx`); this component takes the already-
 * resolved tree as a prop so the markup stays SSR-friendly — the
 * initial open / active state is computed in `useMemo` from the
 * current pathname, no waterfall to determine the initial render.
 */

export interface MenuNode {
  _id: string;
  title?: { en?: string; mm?: string };
  url?: string;
  slug?: string;
  icon?: string;
  openInNewTab?: boolean;
  children?: MenuNode[];
}

interface Props {
  tree: MenuNode[];
  showIcons: boolean;
  currentLanguage: 'en' | 'mm';
}

function resolveHref(node: MenuNode): string {
  return node.url || (node.slug ? `/${node.slug}` : '#');
}

/**
 * Walk the tree looking for the active leaf. Returns the set of
 * ancestor IDs that need to be expanded so the active item is
 * visible without the user clicking through.
 */
function findActiveAncestors(
  nodes: MenuNode[],
  pathname: string,
  ancestors: string[] = [],
): { activeId: string | null; openIds: Set<string> } {
  for (const node of nodes) {
    const href = resolveHref(node);
    if (href && href !== '#' && pathname === href) {
      return { activeId: node._id, openIds: new Set(ancestors) };
    }
    if (node.children && node.children.length > 0) {
      const next = findActiveAncestors(
        node.children,
        pathname,
        [...ancestors, node._id],
      );
      if (next.activeId) return next;
    }
  }
  return { activeId: null, openIds: new Set() };
}

export function NavigationMenuList({
  tree,
  showIcons,
  currentLanguage,
}: Props) {
  const pathname = usePathname() || '/';

  // Compute the active leaf + which branches need to open. Memoised
  // on pathname so route changes inside a Link click recompute.
  const { activeId, openIds: initialOpen } = useMemo(
    () => findActiveAncestors(tree, pathname),
    [tree, pathname],
  );

  // User-toggled state seeded from the auto-opened branches. Each
  // toggle adds / removes one branch id; we never collapse on route
  // change so the user's manual interactions stick.
  const [openIds, setOpenIds] = useState<Set<string>>(initialOpen);

  // If the active branch changes (navigation to a different section)
  // make sure its branch is open. We UNION with the existing state
  // instead of replacing so a branch the user opened manually doesn't
  // collapse just because the active page moved out of it.
  useEffect(() => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      for (const id of initialOpen) next.add(id);
      return next;
    });
  }, [initialOpen]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ul className="space-y-px">
      {tree.map((node) => (
        <MenuItem
          key={node._id}
          node={node}
          level={0}
          showIcons={showIcons}
          currentLanguage={currentLanguage}
          activeId={activeId}
          openIds={openIds}
          onToggle={toggle}
        />
      ))}
    </ul>
  );
}

function MenuItem({
  node,
  level,
  showIcons,
  currentLanguage,
  activeId,
  openIds,
  onToggle,
}: {
  node: MenuNode;
  level: number;
  showIcons: boolean;
  currentLanguage: 'en' | 'mm';
  activeId: string | null;
  openIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const label =
    node.title?.[currentLanguage] || node.title?.en || node.title?.mm || '';
  const href = resolveHref(node);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isActive = activeId === node._id;
  const isOpen = openIds.has(node._id);

  // Visual hierarchy: indent each level by ~14px on top of the base
  // padding. Top-level rows get bold font; children get the regular
  // weight + smaller text so the eye can scan the hierarchy.
  const indentPx = level * 14;
  const textWeight = level === 0 ? 'font-medium' : 'font-normal';
  const textSize = level === 0 ? 'text-[15px]' : 'text-sm';

  // A small chevron-button next to (or instead of) the link when the
  // node has children. Clicking it toggles the branch without
  // navigating. The link itself still navigates so users who want to
  // visit the parent page can.
  const TogglerIcon = hasChildren ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(node._id);
      }}
      aria-expanded={isOpen}
      aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
      className="p-1 -mr-1 rounded hover:bg-black/5 transition-colors shrink-0"
    >
      <ChevronDown
        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
          isOpen ? 'rotate-0' : '-rotate-90'
        }`}
      />
    </button>
  ) : null;

  return (
    <li className="relative">
      {/* Row: link + optional toggle. Active item gets a primary-tint
          background and a 3px primary border accent on the left. */}
      <div
        className={`group relative flex items-center gap-2 rounded-md transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-foreground hover:bg-muted/60'
        }`}
        style={{ paddingLeft: `${12 + indentPx}px`, paddingRight: '8px' }}
      >
        {/* Left border accent for the active item — drawn as a
            pseudo-via-real div so it doesn't shift the row padding. */}
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary"
          />
        )}
        <a
          href={href}
          target={node.openInNewTab ? '_blank' : undefined}
          rel={node.openInNewTab ? 'noopener noreferrer' : undefined}
          className={`flex-1 min-w-0 flex items-center gap-2 py-2 ${textSize} ${textWeight} truncate`}
        >
          {showIcons && node.icon && (
            <span className="text-base shrink-0" aria-hidden="true">
              {node.icon}
            </span>
          )}
          <span className="truncate">{label}</span>
        </a>
        {TogglerIcon}
      </div>

      {/* Nested children — rendered when this branch is open. The
          children's left padding (via `level + 1`) plus the dashed
          guide line at the parent's indent give a clear visual
          hierarchy without aggressive indentation. */}
      {hasChildren && (
        <div
          className={`overflow-hidden transition-[max-height] duration-200 ease-out ${
            isOpen ? 'max-h-[2000px]' : 'max-h-0'
          }`}
          aria-hidden={!isOpen}
        >
          <div className="relative mt-px ml-3">
            {/* Vertical guide line — subtle indicator that visually
                groups child items under the parent. */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 bottom-1 w-px bg-border"
              style={{ marginLeft: `${indentPx}px` }}
            />
            <ul className="space-y-px">
              {node.children!.map((child) => (
                <MenuItem
                  key={child._id}
                  node={child}
                  level={level + 1}
                  showIcons={showIcons}
                  currentLanguage={currentLanguage}
                  activeId={activeId}
                  openIds={openIds}
                  onToggle={onToggle}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

export default NavigationMenuList;
