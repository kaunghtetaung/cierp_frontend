"use client";

/**
 * Content dashboard, role-scoped on the server.
 *
 * The backend `/content/dashboard` endpoint computes which org / dept
 * / authored docs the viewer is allowed to see and bakes it into
 * `viewerScope`. The UI just renders the payload — there's no
 * per-role branching here other than the header label and which
 * widgets are non-empty in practice.
 *
 * Cadence: 5-min stale (matches the library dashboard) so navigating
 * back from an admin page doesn't re-fetch every time.
 */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, Button } from "@repo/ui";
import { getContentDashboardSummary } from "@/actions/content/dashboard.actions";
import type {
  ContentDashboardPayload,
  DraftItem,
  RecentActivityItem,
  StatusCounts,
  TopViewedItem,
  UpcomingScheduledItem,
  ViewerScope,
} from "@/types/content-dashboard";

const STATUS_ORDER: Array<keyof StatusCounts> = [
  "Published",
  "Draft",
  "Scheduled",
  "Archived",
];

const STATUS_LABEL: Record<keyof StatusCounts, string> = {
  Published: "Published",
  Draft: "Draft",
  Scheduled: "Scheduled",
  Archived: "Archived",
};

const STATUS_TONE: Record<keyof StatusCounts, string> = {
  Published: "text-emerald-700 dark:text-emerald-300",
  Draft: "text-amber-700 dark:text-amber-300",
  Scheduled: "text-sky-700 dark:text-sky-300",
  Archived: "text-zinc-600 dark:text-zinc-400",
};

function pickTitle(
  t: { en?: string; mm?: string } | undefined,
  fallback: string,
): string {
  if (!t) return fallback;
  return t.en || t.mm || fallback;
}

function postEditHref(item: { _id: string }): string {
  return `/content/post/${item._id}`;
}

function pageEditHref(item: { _id: string }): string {
  return `/content/page/${item._id}`;
}

function itemHref(item: { type: "post" | "page"; _id: string }): string {
  return item.type === "post" ? postEditHref(item) : pageEditHref(item);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.round((Date.now() - then) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return `${diffSec >= 0 ? "" : "in "}${abs}s`;
  if (abs < 3600) return `${diffSec >= 0 ? "" : "in "}${Math.round(abs / 60)}m`;
  if (abs < 86_400)
    return `${diffSec >= 0 ? "" : "in "}${Math.round(abs / 3600)}h`;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusCard({
  title,
  counts,
}: {
  title: string;
  counts: StatusCounts;
}) {
  const total =
    counts.Published + counts.Draft + counts.Scheduled + counts.Archived;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3">
          {STATUS_ORDER.map((key) => (
            <div key={key} className="flex items-baseline justify-between">
              <dt className="text-sm text-muted-foreground">
                {STATUS_LABEL[key]}
              </dt>
              <dd
                className={`text-base font-semibold tabular-nums ${STATUS_TONE[key]}`}
              >
                {counts[key]}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function ScopeBadge({ scope }: { scope: ViewerScope }) {
  const tone =
    scope.kind === "systemAdmin"
      ? "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300"
      : scope.kind === "organizationAdmin"
        ? "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300"
        : scope.kind === "departmentAdmin"
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-current"
      />
      {scope.label}
    </span>
  );
}

function RecentActivityWidget({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold">Recent activity</h3>
        <p className="text-sm text-muted-foreground">
          Most recent edits and new content in your scope.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={`${item.type}-${item._id}`}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={itemHref(item)}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {pickTitle(item.title, item.slug ?? item._id)}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-medium uppercase tracking-wide">
                      {item.type}
                    </span>
                    {" · "}
                    <span className={STATUS_TONE[item.status as keyof StatusCounts] ?? ""}>
                      {item.status}
                    </span>
                    {item.actor?.name ? ` · ${item.actor.name}` : ""}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs text-muted-foreground tabular-nums"
                  dateTime={item.at}
                  title={new Date(item.at).toLocaleString()}
                >
                  {relativeTime(item.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingScheduledWidget({
  items,
}: {
  items: UpcomingScheduledItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold">Scheduled — next 7 days</h3>
        <p className="text-sm text-muted-foreground">
          BullMQ will publish these automatically at their scheduled time.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing scheduled in the next week.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={`${item.type}-${item._id}`}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={itemHref(item)}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {pickTitle(item.title, item.slug ?? item._id)}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground uppercase tracking-wide">
                    {item.type}
                    {item.postTypeSlug ? ` · ${item.postTypeSlug}` : ""}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs text-sky-700 dark:text-sky-300 tabular-nums"
                  dateTime={item.scheduledAt}
                  title={new Date(item.scheduledAt).toLocaleString()}
                >
                  {new Date(item.scheduledAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function formatViewCount(n: number): string {
  // Compact for big numbers: 1.2k, 23k, 1.4M. Falls back to the raw
  // value below 1k so authors of brand-new posts see their actual 7.
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function TopViewedWidget({
  title,
  hint,
  items,
  emptyMessage,
}: {
  title: string;
  hint: string;
  items: TopViewedItem[];
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, idx) => (
              <li
                key={`${item.type}-${item._id}`}
                className="flex items-center gap-3"
              >
                <span className="w-6 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                  {idx + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={itemHref(item)}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {pickTitle(item.title, item.slug ?? item._id)}
                  </Link>
                  {item.postTypeSlug && (
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                      {item.postTypeSlug}
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200"
                  title={`${item.viewCount.toLocaleString()} views`}
                >
                  {formatViewCount(item.viewCount)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function DraftsWidget({
  items,
  showDept,
}: {
  items: DraftItem[];
  showDept: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold">Drafts in your scope</h3>
        <p className="text-sm text-muted-foreground">
          Unpublished content you have edit access to.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No drafts.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={`${item.type}-${item._id}`}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={itemHref(item)}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {pickTitle(item.title, item.slug ?? item._id)}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground uppercase tracking-wide">
                    <span>{item.type}</span>
                    {item.postTypeSlug && <span>· {item.postTypeSlug}</span>}
                    {showDept && item.departmentName && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200">
                        {item.departmentName}
                      </span>
                    )}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs text-muted-foreground tabular-nums"
                  dateTime={item.updatedAt}
                  title={new Date(item.updatedAt).toLocaleString()}
                >
                  {relativeTime(item.updatedAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ContentDashboardClient() {
  const { data, isLoading, error, refetch, isFetching } =
    useQuery<ContentDashboardPayload>({
      queryKey: ["content-dashboard-summary"],
      queryFn: async () => {
        const response = await getContentDashboardSummary();
        if (!response.success || !response.data) {
          throw new Error(
            response.error || "Failed to fetch content dashboard",
          );
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Content dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {data?.viewerScope ? (
              <ScopeBadge scope={data.viewerScope} />
            ) : (
              "Posts and pages overview, scoped to your role."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.generatedAt && (
            <span className="text-xs text-muted-foreground">
              As of {new Date(data.generatedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <span aria-hidden>⚠️</span>
              <div>
                <p className="font-medium">Failed to load dashboard</p>
                <p className="text-sm">
                  {error instanceof Error ? error.message : String(error)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && !data && <DashboardSkeleton />}

      {data && (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <StatusCard title="Posts" counts={data.postCounts} />
            <StatusCard title="Pages" counts={data.pageCounts} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentActivityWidget items={data.recentActivity} />
            <UpcomingScheduledWidget items={data.upcomingScheduled} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TopViewedWidget
              title="Top posts"
              hint="Most-viewed published posts in your scope."
              items={data.topPosts}
              emptyMessage="No views yet — tracking starts as visitors land."
            />
            <TopViewedWidget
              title="Top pages"
              hint="Most-viewed published pages in your scope."
              items={data.topPages}
              emptyMessage="No views yet."
            />
          </div>

          <DraftsWidget
            items={data.draftsInScope}
            // Department chips are only useful when the viewer sees
            // multiple departments — dept-admins see their own dept on
            // every row, so suppress to reduce noise.
            showDept={
              data.viewerScope.kind === "systemAdmin" ||
              data.viewerScope.kind === "organizationAdmin"
            }
          />
        </>
      )}
    </div>
  );
}

export default ContentDashboardClient;
