import React from "react";
import { Users } from "lucide-react";
import { getApiDomain } from "@repo/utils/server/domain";

interface VisitorStatsProps {
  tenantId: string | null | undefined;
  language: "en" | "mm";
}

interface RegionBucket {
  region: string;
  count: number;
  today: number;
}

interface HitSummary {
  total: number;
  today: number;
  byRegion: RegionBucket[];
}

const REGION_LABEL: Record<string, { en: string; mm: string }> = {
  Myanmar: { en: "Myanmar", mm: "မြန်မာ" },
  "Southeast Asia": { en: "SE Asia", mm: "အရှေ့တောင်အာရှ" },
  Asia: { en: "Asia", mm: "အာရှ" },
  World: { en: "World", mm: "ကမ္ဘာ့နိုင်ငံများ" },
  Unknown: { en: "Unknown", mm: "မသိ" },
};

const fmt = new Intl.NumberFormat("en-US");

/**
 * Compact, single-line visitor counter rendered in the footer's
 * bottom strip (alongside copyright + social icons). Designed to
 * read like a chip — no card chrome, no headings — so it sits next
 * to the legal text without dominating it.
 *
 * The per-region breakdown is preserved as a `title` attribute so
 * it surfaces on hover without taking up horizontal space.
 *
 * Always renders when the parent has gated us in via
 * `footer.showVisitorCount`. Earlier we bailed at total=0 to avoid
 * a "0 visitors" eyesore — but the same code path also hid the
 * widget during initial bring-up, masking proxy / module-mount /
 * geoip failures behind a no-op render. Render-always is the
 * correct default; the visitor will always see "1" within a single
 * navigation, and admins debugging the widget aren't left guessing.
 */
export async function VisitorStats({ tenantId, language }: VisitorStatsProps) {
  const summary = await fetchSummary(tenantId);

  const visitorsLabel = language === "mm" ? "ခရီးသည်" : "Visitors";
  const todayLabel = language === "mm" ? "ယနေ့" : "Today";

  // Regional breakdown collapsed into a single tooltip-friendly
  // string. Falls back gracefully when no regions are set.
  const breakdown = summary.byRegion
    .map(
      (b) =>
        `${REGION_LABEL[b.region]?.[language] ?? b.region}: ${fmt.format(
          b.count,
        )}`,
    )
    .join(" · ");

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs"
      title={breakdown || undefined}
      aria-label={`${visitorsLabel} ${fmt.format(summary.total)}`}
      style={{ color: "var(--color-footer-link)" }}
    >
      <Users className="h-3.5 w-3.5 flex-shrink-0 opacity-80" />
      <span className="font-semibold" style={{ color: "var(--color-footer-heading)" }}>
        {fmt.format(summary.total)}
      </span>
      <span>{visitorsLabel}</span>
      <span className="opacity-50">·</span>
      <span>
        {todayLabel}: {fmt.format(summary.today)}
      </span>
    </span>
  );
}

async function fetchSummary(
  tenantId: string | null | undefined,
): Promise<HitSummary> {
  const empty: HitSummary = { total: 0, today: 0, byRegion: [] };
  if (!tenantId) return empty;
  try {
    const apiDomain = await getApiDomain();
    const url = `${apiDomain.replace(/\/$/, "")}/content/public/hits/summary`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "x-tenant-id": tenantId },
      // No cache: the counter would otherwise lag by up to a full
      // revalidation window, which makes "did the recorder fire?"
      // impossible to verify by reload. The endpoint is cheap (one
      // aggregation lookup against a tiny per-tenant collection) so
      // direct fetches on every footer render are fine for now —
      // re-add caching once the read traffic is measured.
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(
        `[VisitorStats] hit-summary returned ${res.status} from ${url}`,
      );
      return empty;
    }
    const json = await res.json();
    const data = json?.data ?? json;
    return {
      total: Number(data?.total) || 0,
      today: Number(data?.today) || 0,
      byRegion: Array.isArray(data?.byRegion) ? data.byRegion : [],
    };
  } catch (err) {
    console.warn(
      `[VisitorStats] hit-summary fetch failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return empty;
  }
}

export default VisitorStats;
