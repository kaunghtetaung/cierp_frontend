/**
 * Wire-format types for the content dashboard payload — mirrors the
 * backend `apps/core/src/content/dashboard/dashboard.types.ts`. Keep
 * the two in sync; if the API evolves, update both.
 */

export type ContentStatus = "Draft" | "Published" | "Scheduled" | "Archived";

export type ViewerScopeKind =
  | "systemAdmin"
  | "organizationAdmin"
  | "departmentAdmin"
  | "author";

export interface ViewerScope {
  kind: ViewerScopeKind;
  label: string;
  isFullTenant: boolean;
}

export interface StatusCounts {
  Draft: number;
  Published: number;
  Scheduled: number;
  Archived: number;
}

export interface DashboardActor {
  _id: string;
  name?: string;
  email?: string;
}

export interface RecentActivityItem {
  type: "post" | "page";
  _id: string;
  slug?: string;
  title: { en?: string; mm?: string };
  status: ContentStatus;
  at: string;
  actor?: DashboardActor;
  postTypeSlug?: string;
}

export interface UpcomingScheduledItem {
  type: "post" | "page";
  _id: string;
  slug?: string;
  title: { en?: string; mm?: string };
  scheduledAt: string;
  postTypeSlug?: string;
}

export interface DraftItem {
  type: "post" | "page";
  _id: string;
  slug?: string;
  title: { en?: string; mm?: string };
  updatedAt: string;
  postTypeSlug?: string;
  departmentName?: string;
}

export interface TopViewedItem {
  type: "post" | "page";
  _id: string;
  slug?: string;
  title: { en?: string; mm?: string };
  viewCount: number;
  postTypeSlug?: string;
  publishedAt?: string;
}

export interface ContentDashboardPayload {
  viewerScope: ViewerScope;
  postCounts: StatusCounts;
  pageCounts: StatusCounts;
  recentActivity: RecentActivityItem[];
  upcomingScheduled: UpcomingScheduledItem[];
  draftsInScope: DraftItem[];
  topPosts: TopViewedItem[];
  topPages: TopViewedItem[];
  generatedAt: string;
}

export interface ContentDashboardActionResponse {
  success: boolean;
  data?: ContentDashboardPayload;
  error?: string;
}
