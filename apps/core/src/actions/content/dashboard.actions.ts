"use server";

/**
 * Server action wrapping the `/content/dashboard` summary fetch. Same
 * cookie + tenant + token plumbing as the library dashboard wrapper —
 * see `lib/library-api-wrapper.ts` for the canonical pattern.
 */
import { cache } from "react";
import { headers } from "next/headers";
// `@repo/api/server-only` resolves at runtime via the workspace's
// package exports but tsc misses it in this app's resolution config —
// same caveat applies to `libs/library-api-wrapper.ts` which compiles
// with the same warning. Suppressing only the import line keeps the
// rest of this file type-checked.
// @ts-expect-error workspace export not in tsconfig paths
import { getCachedServerHttpClient } from "@repo/api/server-only";
import { getCurrentUser, getCurrentSession } from "@repo/auth/server-api";
import { getApiDomain } from "@repo/utils/server";
import type {
  ContentDashboardActionResponse,
  ContentDashboardPayload,
} from "@/types/content-dashboard";

/**
 * Fetcher — request-level cached via React.cache so multiple components
 * in the same render share a single HTTP roundtrip.
 */
const fetchContentDashboard = cache(
  async (): Promise<ContentDashboardPayload> => {
    const headerStore = await headers();
    const [user, session] = await Promise.all([
      getCurrentUser(headerStore),
      getCurrentSession(headerStore),
    ]);
    if (!user || !session) {
      throw new Error("Authentication required");
    }
    const tenantId =
      headerStore.get("x-tenant-id") || user.tenantId || session.tenantId;
    if (!tenantId) {
      throw new Error("Tenant context required");
    }
    const apiUrl = await getApiDomain();
    const httpClient = getCachedServerHttpClient(apiUrl);
    const response = await httpClient.request<ContentDashboardPayload>(
      "/content/dashboard",
      {
        method: "GET",
        tenantId,
        userSessionId: session.id,
        // Cast — the runtime User has both `userId` and `id` (different
        // generations of the auth lib) but the TS type only declares
        // one of them. Same workaround as `library-api-wrapper.ts`.
        userId: (user as any).userId || user.id,
        withAuth: true,
        tokenStrategy: "auto",
      },
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch content dashboard");
    }
    return response.data;
  },
);

export async function getContentDashboardSummary(): Promise<ContentDashboardActionResponse> {
  try {
    const data = await fetchContentDashboard();
    return { success: true, data };
  } catch (error) {
    console.error("[CONTENT_DASHBOARD] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch content dashboard",
    };
  }
}
