import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";

/**
 * Page layout shape — kept loose / `unknown`-leaning so this helper
 * stays decoupled from the admin types. The renderer
 * (`PageLayoutRenderer`) walks whatever shape lands in here.
 */
export interface PageLayoutLike {
  containers?: Array<{
    id?: string;
    settings?: unknown;
    rows?: unknown[];
  }>;
}

/**
 * Effective page layout for the publicWeb renderer.
 *
 * Order of precedence:
 *   1. `page.layout`   — the page's own authored tree (if non-empty).
 *   2. `template.layout` — the layout from the assigned authored
 *      Template (if `page.templateId` is set and the template
 *      resolves to an Active doc).
 *   3. `null` — caller falls back to flat sectionRefs / empty body.
 *
 * Server-only — uses tenant context from request headers and the
 * gateway URL. Failures (no tenant, network error, missing template)
 * degrade to `null` rather than blocking the page render.
 */
export async function resolvePageLayout(
  page: { layout?: PageLayoutLike | null; templateId?: string | null } | null,
): Promise<PageLayoutLike | null> {
  if (!page) return null;
  if (hasContent(page.layout)) return page.layout!;
  if (!page.templateId) return null;

  const template = await fetchTemplateById(page.templateId);
  if (template && hasContent(template.layout)) {
    return template.layout!;
  }
  return null;
}

function hasContent(layout: PageLayoutLike | null | undefined): boolean {
  if (!layout) return false;
  const containers = layout.containers ?? [];
  if (containers.length === 0) return false;
  return containers.some((c) => Array.isArray(c.rows) && c.rows.length > 0);
}

interface FetchedTemplate {
  _id: string;
  layout?: PageLayoutLike | null;
  status?: string;
}

/**
 * Fetch a template doc by id from the content gateway. Tenant scope
 * is read from request headers — the gateway re-validates org match
 * on its end. Returns `null` on any failure so callers can keep
 * rendering.
 */
export async function fetchTemplateById(
  id: string,
): Promise<FetchedTemplate | null> {
  try {
    const middleware = await getMiddlewareDataFromHeaders();
    const tenantId = middleware.tenantId;
    if (!tenantId) return null;

    const apiDomain = await getApiDomain();
    const url = `${apiDomain}/content/templates/${id}`;
    const res = await fetch(url, {
      headers: {
        "x-tenant-id": tenantId,
        accept: "application/json",
      },
      // Templates change rarely; cache aggressively at the edge.
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.warn(`Template fetch: gateway responded ${res.status} for ${url}`);
      return null;
    }
    const json = await res.json();
    const template = json?.data ?? null;
    if (!template) return null;
    if (template.status && template.status !== "Active") return null;
    return template as FetchedTemplate;
  } catch (err) {
    console.warn("Template fetch failed", err);
    return null;
  }
}
