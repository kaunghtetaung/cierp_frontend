import React from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { createHttpClient } from "@repo/api/client";
import { TagListSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

interface TagItem {
  _id: string;
  slug: string;
  name?: string | { en?: string; mm?: string };
  usageCount?: number;
  color?: string;
}

const CLOUD_TIERS: Array<{ floor: number; size: string }> = [
  { floor: 50, size: "text-lg" },
  { floor: 20, size: "text-base" },
  { floor: 10, size: "text-sm" },
  { floor: 0, size: "text-xs" },
];

function tierFor(usage: number): string {
  for (const t of CLOUD_TIERS) {
    if (usage >= t.floor) return t.size;
  }
  return "text-xs";
}

export async function TagListSection({
  section,
  currentLanguage = "en",
}: SectionProps<TagListSectionData>) {
  const items = await fetchTags(section);
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
      data-section-type="tagList"
    >
      <div className="px-4 py-6 md:py-8">
        {(headline || viewAllLabel) && (
          <header className="flex items-end justify-between gap-3 mb-4 pb-2 border-b border-border">
            {headline && (
              <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary shrink-0" />
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

        {section.displayMode === "list" ? (
          <FlatList items={items} language={currentLanguage} showCount={section.showCount} />
        ) : section.displayMode === "badge" ? (
          <BadgeList items={items} language={currentLanguage} showCount={section.showCount} />
        ) : (
          <Cloud items={items} language={currentLanguage} showCount={section.showCount} />
        )}
      </div>
    </section>
  );
}

export default TagListSection;

// ── Layouts ──────────────────────────────────────────────────────

function FlatList({
  items,
  language,
  showCount,
}: {
  items: TagItem[];
  language: "en" | "mm";
  showCount?: boolean;
}) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((t) => (
        <li key={t._id}>
          <Link
            href={tagHref(t)}
            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/60 transition-colors"
          >
            <span className="text-foreground hover:text-primary truncate">
              #{pickName(t, language)}
            </span>
            {showCount !== false && typeof t.usageCount === "number" && (
              <span className="text-xs text-muted-foreground shrink-0">
                {t.usageCount}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BadgeList({
  items,
  language,
  showCount,
}: {
  items: TagItem[];
  language: "en" | "mm";
  showCount?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <Link
          key={t._id}
          href={tagHref(t)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-card text-xs text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <span>#{pickName(t, language)}</span>
          {showCount !== false && typeof t.usageCount === "number" && (
            <span className="text-muted-foreground">{t.usageCount}</span>
          )}
        </Link>
      ))}
    </div>
  );
}

function Cloud({
  items,
  language,
  showCount,
}: {
  items: TagItem[];
  language: "en" | "mm";
  showCount?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1.5 leading-loose">
      {items.map((t) => {
        const usage = typeof t.usageCount === "number" ? t.usageCount : 0;
        const sizeClass = tierFor(usage);
        return (
          <Link
            key={t._id}
            href={tagHref(t)}
            className={`${sizeClass} text-foreground hover:text-primary hover:underline transition-colors`}
            title={
              showCount !== false && t.usageCount != null
                ? `${pickName(t, language)} · ${t.usageCount}`
                : pickName(t, language)
            }
          >
            #{pickName(t, language)}
          </Link>
        );
      })}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function pickName(t: TagItem, language: "en" | "mm"): string {
  if (typeof t.name === "string") return t.name;
  return t.name?.[language] || t.name?.en || t.slug;
}

function tagHref(t: TagItem): string {
  return `/tag/${t.slug}`;
}

async function fetchTags(section: TagListSectionData): Promise<TagItem[]> {
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
    params.set("limit", String(section.limit && section.limit > 0 ? section.limit : 30));
    // /tags/public pins status: 'Active' on the backend.
    if (section.sort === "alphabetical") {
      params.set("sortBy", "name");
      params.set("sortOrder", "asc");
    } else {
      params.set("sortBy", "usageCount");
      params.set("sortOrder", "desc");
    }

    const response: any = await httpClient.request(
      `/content/tags/public?${params.toString()}`,
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

    let filtered = data as TagItem[];
    if (section.tagIds && section.tagIds.length > 0) {
      const set = new Set(section.tagIds.map(String));
      filtered = filtered.filter((t) => set.has(String(t._id)));
    }
    if (section.limit && section.limit > 0) {
      filtered = filtered.slice(0, section.limit);
    }
    return filtered;
  } catch (err) {
    console.warn(
      `[TagListSection] fetch failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return [];
  }
}
