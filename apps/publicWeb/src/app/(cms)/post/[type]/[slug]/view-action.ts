"use server";

/**
 * Server action invoked by `<PostViewTracker>` after the visitor's
 * browser has passed the engagement gates (visible + dwell + cookie
 * dedupe). Hits the anonymous `POST /content/post/slug/:slug/views`
 * endpoint which `$inc`s `viewCount` on the post.
 *
 * Fire-and-forget by design — the route returns 204 with no body and
 * we treat any error as "best-effort, don't bother the visitor". The
 * client side already deduped, so a network blip just means one
 * uncounted view, not a stuck retry loop.
 */
import { getApiDomain } from "@repo/utils/server";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { createHttpClient } from "@repo/api/client";

export async function bumpPostView(slug: string): Promise<{ ok: boolean }> {
  if (!slug) return { ok: false };
  let tenantId: string | undefined;
  try {
    const middleware = await getMiddlewareDataFromHeaders();
    tenantId = middleware.tenantId ?? undefined;
  } catch {
    return { ok: false };
  }
  if (!tenantId) return { ok: false };
  try {
    const apiDomain = await getApiDomain();
    const httpClient = createHttpClient({
      baseURL: apiDomain,
      enableAuth: false,
      timeout: 5_000,
    });
    await httpClient.request(
      `/content/post/slug/${encodeURIComponent(slug)}/views`,
      {
        method: "POST",
        tenantId,
        withAuth: false,
      },
    );
    return { ok: true };
  } catch {
    // Silent — view tracking is intentionally non-load-bearing.
    return { ok: false };
  }
}
