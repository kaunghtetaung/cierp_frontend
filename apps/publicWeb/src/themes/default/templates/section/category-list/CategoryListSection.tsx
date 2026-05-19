import React from "react";
import Link from "next/link";
import { ChevronRight, Folder } from "lucide-react";
import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { createHttpClient } from "@repo/api/client";
import { CategoryListSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

interface CategoryItem {
  _id: string;
  slug: string;
  name?: { en?: string; mm?: string } | string;
  description?: { en?: string; mm?: string };
  parentId?: string | null;
  postCount?: number;
  color?: string;
}

/**
 * Sidebar widget — categories rendered in `list`, `tree`, or
 * `badge` mode. Server component: fetches once at render time and
 * renders directly (categories change rarely so a cache miss every
 * render is fine for now). Auth-attaching httpClient so the
 * gateway's `/content/categories` endpoint accepts the request — bare
 * fetch returns 401 there same as the post list.
 */
export async function CategoryListSection({
  section,
  currentLanguage = "en",
}: SectionProps<CategoryListSectionData>) {
  const items = await fetchCategories(section);

  if (items.length === 0) {
    return null;
  }

  const headline = getLocalizedText(section.headline, currentLanguage);
  const viewAllLabel = getLocalizedText(
    section.viewAllLabel,
    currentLanguage,
  );

  return (
    <section
      className="w-full"
      data-section-id={section._id}
      data-section-type="categoryList"
    >
      <div className="px-4 py-6 md:py-8">
        {(headline || viewAllLabel) && (
          <header className="flex items-end justify-between gap-3 mb-4 pb-2 border-b border-border">
            {headline && (
              <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary shrink-0" />
                <span>{headline}</span>
              </h3>
            )}
            {viewAllLabel && section.viewAllUrl && (
              <Link
                href={section.viewAllUrl}
                className="text-xs text-primary hover:underline shrink-0"
              >
                {viewAllLabel} →
              </Link>
            )}
          </header>
        )}

        {section.displayMode === "badge" ? (
          <BadgeList items={items} language={currentLanguage} showCount={section.showCount} />
        ) : section.displayMode === "tree" ? (
          <TreeList items={items} language={currentLanguage} showCount={section.showCount} />
        ) : (
          <FlatList items={items} language={currentLanguage} showCount={section.showCount} />
        )}
      </div>
    </section>
  );
}

export default CategoryListSection;

// ── Layout primitives ─────────────────────────────────────────────

function FlatList({
  items,
  language,
  showCount,
}: {
  items: CategoryItem[];
  language: "en" | "mm";
  showCount?: boolean;
}) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((c) => (
        <li key={c._id}>
          <Link
            href={categoryHref(c)}
            className="group flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/60 transition-colors"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span className="truncate text-foreground group-hover:text-primary">
                {pickName(c, language)}
              </span>
            </span>
            {showCount !== false && typeof c.postCount === "number" && (
              <span className="text-xs text-muted-foreground shrink-0">
                ({c.postCount})
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TreeList({
  items,
  language,
  showCount,
}: {
  items: CategoryItem[];
  language: "en" | "mm";
  showCount?: boolean;
}) {
  // Build a parent → children map. Roots = items with no `parentId`
  // OR whose parent isn't in the visible set (orphans render as
  // top-level so nothing disappears).
  const byId = new Map(items.map((c) => [c._id, c]));
  const childrenByParent = new Map<string, CategoryItem[]>();
  const roots: CategoryItem[] = [];
  for (const c of items) {
    const pid = c.parentId ? String(c.parentId) : null;
    if (pid && byId.has(pid)) {
      const arr = childrenByParent.get(pid) ?? [];
      arr.push(c);
      childrenByParent.set(pid, arr);
    } else {
      roots.push(c);
    }
  }

  // If everything ended up as a root (no real hierarchy in this
  // tenant), the tree degrades to a flat list — same UX, no
  // confusing single-level indents.
  const hasHierarchy = roots.length < items.length;
  if (!hasHierarchy) {
    return (
      <FlatList items={items} language={language} showCount={showCount} />
    );
  }

  const renderNode = (node: CategoryItem, depth: number): React.ReactNode => {
    const kids = childrenByParent.get(node._id) ?? [];
    return (
      <li key={node._id}>
        <Link
          href={categoryHref(node)}
          className="group flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/60 transition-colors"
          style={{ paddingLeft: `${0.5 + depth * 1}rem` }}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate text-foreground group-hover:text-primary">
              {pickName(node, language)}
            </span>
          </span>
          {showCount !== false && typeof node.postCount === "number" && (
            <span className="text-xs text-muted-foreground shrink-0">
              ({node.postCount})
            </span>
          )}
        </Link>
        {kids.length > 0 && (
          <ul className="space-y-1.5 text-sm mt-1">
            {kids.map((k) => renderNode(k, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul className="space-y-1.5 text-sm">
      {roots.map((r) => renderNode(r, 0))}
    </ul>
  );
}

function BadgeList({
  items,
  language,
  showCount,
}: {
  items: CategoryItem[];
  language: "en" | "mm";
  showCount?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c) => (
        <Link
          key={c._id}
          href={categoryHref(c)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-card text-xs text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
          style={
            c.color
              ? {
                  borderColor: c.color,
                  // Allow color to leak through via CSS var so
                  // `:hover` can flip background without inline-overriding.
                  // @ts-expect-error CSS var
                  "--cat-tint": c.color,
                }
              : undefined
          }
        >
          <span>{pickName(c, language)}</span>
          {showCount !== false && typeof c.postCount === "number" && (
            <span className="text-muted-foreground">{c.postCount}</span>
          )}
        </Link>
      ))}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function pickName(c: CategoryItem, language: "en" | "mm"): string {
  if (typeof c.name === "string") return c.name;
  return c.name?.[language] || c.name?.en || c.slug;
}

function categoryHref(c: CategoryItem): string {
  return `/category/${c.slug}`;
}

async function fetchCategories(
  section: CategoryListSectionData,
): Promise<CategoryItem[]> {
  try {
    const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
    const tenantId = middleware?.tenantId;
    if (!tenantId) return [];

    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: true,
      timeout: 10_000,
    });

    const params = new URLSearchParams();
    params.set("limit", String(section.limit && section.limit > 0 ? section.limit : 100));
    // /categories/public pins status: 'Active' on the backend.
    if (section.categoryIds && section.categoryIds.length > 0) {
      params.set("ids", section.categoryIds.join(","));
    }

    const response: any = await httpClient.request(
      `/content/categories/public?${params.toString()}`,
      {
        method: "GET",
        tenantId,
        withAuth: false,
      },
    );
    if (!response?.success) return [];
    let data: any = response.data;
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      "data" in data
    ) {
      data = data.data;
    }
    if (!Array.isArray(data)) return [];

    // Server-side filter when `categoryIds` was provided (the
    // backend `ids` query param isn't standardised across
    // category-list endpoints — defensive client-side trim).
    let filtered = data as CategoryItem[];
    if (section.categoryIds && section.categoryIds.length > 0) {
      const set = new Set(section.categoryIds.map(String));
      filtered = filtered.filter((c) => set.has(String(c._id)));
    }
    if (section.limit && section.limit > 0) {
      filtered = filtered.slice(0, section.limit);
    }
    return filtered;
  } catch (err) {
    console.warn(
      `[CategoryListSection] fetch failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return [];
  }
}
