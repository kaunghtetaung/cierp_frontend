"use client";

import * as React from "react";
import Link from "next/link";
import { IconComponent } from "@repo/ui/components/icons";
import { NavigationItem } from "./types";
import { getTitle, generateHref, getLinkTarget, getLinkRel } from "./utils";

interface MegaMenuProps {
  item: NavigationItem;
  visibleChildren: NavigationItem[];
  currentLanguage: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ColumnGroup {
  title: string;
  items: NavigationItem[];
}

/**
 * Distributes navigation items into columns
 * Max 16 items per column
 * Returns array of column groups with titles
 */
function distributeIntoColumns(
  groups: NavigationItem[],
  currentLanguage: string
): ColumnGroup[] {
  const MAX_ITEMS_PER_COLUMN = 16;
  const columns: ColumnGroup[] = [];

  groups.forEach((group) => {
    const groupTitle = getTitle(group, currentLanguage);
    const groupItems = group.children || [];
    const itemCount = groupItems.length;

    if (itemCount <= MAX_ITEMS_PER_COLUMN) {
      // Group fits in one column
      columns.push({
        title: groupTitle,
        items: groupItems,
      });
    } else {
      // Split group across multiple columns
      const columnsNeeded = Math.ceil(itemCount / MAX_ITEMS_PER_COLUMN);
      for (let i = 0; i < columnsNeeded; i++) {
        const start = i * MAX_ITEMS_PER_COLUMN;
        const end = start + MAX_ITEMS_PER_COLUMN;
        const columnItems = groupItems.slice(start, end);

        columns.push({
          title: i === 0 ? groupTitle : `${groupTitle} (cont.)`,
          items: columnItems,
        });
      }
    }
  });

  return columns;
}

/**
 * MegaMenu Component
 * Full-width multi-column dropdown menu for items with nested groups
 */
export function MegaMenu({
  item,
  visibleChildren,
  currentLanguage,
  isOpen,
  onClose,
}: MegaMenuProps) {
  // Check if children have their own children (nested groups)
  const hasNestedGroups = visibleChildren.some(
    (child) => child.children && child.children.length > 0
  );

  if (!hasNestedGroups) {
    return null; // Not a mega menu item
  }

  // Distribute groups into columns
  const columns = distributeIntoColumns(visibleChildren, currentLanguage);

  return (
    <div
      className="fixed left-0 right-0 z-50"
      style={{
        top: 'var(--mega-menu-top, auto)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="mega-menu-pattern-bg border-0 rounded-b-lg rounded-t-none shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="px-6 py-6">
            <div className="grid grid-cols-4 gap-6">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="space-y-3">
                  {/* Column Header */}
                  <h3 className="text-sm font-semibold border-b border-white/20 pb-2 !text-[#FF6855]">
                    {column.title}
                  </h3>

                  {/* Column Items */}
                  <div className="space-y-0.5">
                    {column.items.map((child) => (
                      <Link
                        key={child.id}
                        href={generateHref(child)}
                        target={getLinkTarget(child)}
                        rel={getLinkRel(child)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-white/10 rounded-md transition-colors leading-tight"
                        onClick={onClose}
                      >
                        {child.icon && (
                          <IconComponent name={child.icon} size={14} className="flex-shrink-0" />
                        )}
                        {getTitle(child, currentLanguage)}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MegaMenu;
