/**
 * Server-side fetch helpers for the dept route.
 *
 * The dept page resolves the URL slug (e.g. `um1-anat`) to a
 * department doc, then looks for that department's home page. A
 * single helper file keeps the route component thin and the fetch
 * shape easy to reuse across `/dept/[dept]/*` sub-routes that may
 * want the same data later.
 *
 * Patterns mirror the existing `libs/page/page-service.ts` approach:
 * use the shared HTTP client + middleware headers, swallow network
 * errors and return `null`/`[]` so the caller can render a friendly
 * fallback instead of 500-ing the whole route.
 */

import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { createHttpClient } from "@repo/api/client";

export interface Department {
  _id: string;
  slug: string;
  // The dept doc actually uses `displayName` (multi-lang) plus
  // `fullName` (plain string). `name` doesn't exist on real docs —
  // kept here purely as a forward-compat fallback in case another
  // tenant model writes that field.
  name?: { en?: string; mm?: string } | string;
  displayName?: { en?: string; mm?: string };
  fullName?: string;
  shortName?: string;
  displayShortName?: { en?: string; mm?: string };
  organizationId?: string;
}

export interface DeptHomePage {
  _id: string;
  slug: string;
  title?: { en?: string; mm?: string };
  body?: unknown;
  bodyTiptap?: unknown;
  contentFormat?: string;
  layout?: unknown;
  templateId?: string | null;
  sectionRefs?: unknown[];
  postTypeSlug?: string;
  departmentId?: string;
  isHomePage?: boolean;
  status?: string;
  showTitle?: boolean;
  showBreadcrumbs?: boolean;
  showFeaturedImage?: boolean;
  featuredImage?: { url?: string };
  excerpt?: { en?: string; mm?: string };
  [k: string]: unknown;
}

async function client(tenantId: string | undefined) {
  if (!tenantId) return null;
  const apiDomain = await getApiDomain();
  return createHttpClient({
    baseURL: apiDomain,
    enableAuth: true,
    timeout: 10000,
  });
}

/**
 * Resolve a dept by URL slug. Returns `null` if the dept doesn't
 * exist OR if the API can't be reached (caller renders a "Coming
 * Soon" / 404 in either case).
 */
export async function getDepartmentBySlug(
  slug: string,
): Promise<Department | null> {
  if (!slug) return null;
  try {
    const middleware = await getMiddlewareDataFromHeaders().catch(
      () => ({}) as any,
    );
    const tenantId: string | undefined = (middleware as any)?.tenantId;
    const c = await client(tenantId);
    if (!c || !tenantId) return null;
    // Backend controller path is `@Controller('departments')` —
    // plural. Earlier code used the singular path which always 404'd
    // → fetch returned null → dept label fell back to the URL slug.
    const resp: any = await c.request(
      `/core/departments/slug/${encodeURIComponent(slug)}`,
      { method: "GET", tenantId, withAuth: true },
    );
    // Response shape can be either the raw doc or wrapped `{data}`.
    const doc =
      resp?.data && (resp.data as any)._id
        ? resp.data
        : resp && (resp as any)._id
          ? resp
          : null;
    return (doc as Department) ?? null;
  } catch (err) {
    console.warn(
      `getDepartmentBySlug('${slug}') failed:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Find the dept's home page — a Post with
 * `postTypeSlug = 'page'`, `departmentId = <dept._id>`,
 * `isHomePage = true`, and `status = 'Published'`.
 *
 * The post API doesn't currently support an `isHomePage` query
 * param (PostQueryDto only filters by departmentId/postTypeSlug),
 * so we fetch up to 25 published page-posts for the dept and pick
 * the one flagged as the home. Departments rarely have more than a
 * handful of pages, so the over-fetch is cheap and avoids a
 * backend change.
 */
export async function getDeptHomePage(
  departmentId: string,
): Promise<DeptHomePage | null> {
  if (!departmentId) return null;
  try {
    const middleware = await getMiddlewareDataFromHeaders().catch(
      () => ({}) as any,
    );
    const tenantId: string | undefined = (middleware as any)?.tenantId;
    const c = await client(tenantId);
    if (!c || !tenantId) return null;
    // Anonymous list — /content/post/public bypasses CoreGuard and
    // pins status: Published + visibility: Public server-side.
    const resp: any = await c.request(
      `/content/post/public?departmentId=${encodeURIComponent(departmentId)}&postTypeSlug=page&limit=25`,
      { method: "GET", tenantId, withAuth: false },
    );
    // List response shape: `{ data: [...], meta: {...} }`.
    const list =
      resp?.data && Array.isArray((resp.data as any).data)
        ? (resp.data as any).data
        : Array.isArray(resp?.data)
          ? resp.data
          : [];
    const home = (list as DeptHomePage[]).find(
      (p) => p?.isHomePage === true,
    );
    return home ?? null;
  } catch (err) {
    console.warn(
      `getDeptHomePage('${departmentId}') failed:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
