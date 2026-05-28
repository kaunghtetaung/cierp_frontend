"use server";

import { headers } from "next/headers";
// `@repo/api/server-only` resolves at runtime via workspace package
// exports but tsc misses it in this app's path config — the same
// caveat exists in `actions/content/dashboard.actions.ts`. Suppress
// just the import; the rest is type-checked.
// @ts-expect-error workspace export not in tsconfig paths
import { getCachedServerHttpClient } from "@repo/api/server-only";
import { getCurrentUser, getCurrentSession } from "@repo/auth/server-api";
import { getApiDomain } from "@repo/utils/server";

/**
 * HR-side server actions for the staff approval queue. Mirrors the
 * student approve/reject pattern but uses dedicated POST endpoints
 * we added in `apps/core/src/cpms/staff/staff.controller.ts`
 * (`/cpms/staffs/:id/approve` + `/reject`).
 *
 * Auth/tenant plumbing matches `actions/content/dashboard.actions.ts`:
 * `getCachedServerHttpClient(apiUrl)` + `getCurrentUser` +
 * `getCurrentSession` so calls reuse a single request-scoped HTTP
 * client and the auto-refresh token strategy.
 */
async function withHttpContext<T>(
  fn: (ctx: {
    httpClient: any;
    userId: string;
    userSessionId: string;
    tenantId: string;
  }) => Promise<T>,
): Promise<T | { success: false; error: string }> {
  const headerStore = await headers();
  const [user, session] = await Promise.all([
    getCurrentUser(headerStore),
    getCurrentSession(headerStore),
  ]);
  if (!user || !session) {
    return { success: false as const, error: "Not authenticated" };
  }
  const tenantId =
    headerStore.get("x-tenant-id") ||
    (user as any).tenantId ||
    (session as any).tenantId;
  if (!tenantId) {
    return { success: false as const, error: "Tenant context required" };
  }
  const apiUrl = await getApiDomain();
  const httpClient = getCachedServerHttpClient(apiUrl);
  return fn({
    httpClient,
    userId: (user as any).userId || user.id,
    userSessionId: (session as any).id,
    tenantId,
  });
}

export interface StaffListFilters {
  registrationStatus?: "pending" | "approved" | "rejected" | "incomplete";
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Fetch staff records, optionally filtered by registrationStatus.
 * Returns the standard `{ data, meta }` pagination envelope so the
 * caller can render tabs with row counts.
 */
export async function listStaff(filters: StaffListFilters = {}) {
  try {
    return await withHttpContext(async ({ httpClient, userId, userSessionId, tenantId }) => {
      const params = new URLSearchParams();
      if (filters.registrationStatus)
        params.set("registrationStatus", filters.registrationStatus);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.search) params.set("search", filters.search);

      const qs = params.toString();
      const result: any = await httpClient.request(
        `/cpms/staffs${qs ? `?${qs}` : ""}`,
        {
          method: "GET",
          tenantId,
          userSessionId,
          userId,
          withAuth: true,
          tokenStrategy: "auto",
        },
      );

      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Failed to load staff records",
        };
      }

      const items = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      const meta = result.data?.meta || {
        total: items.length,
        page: 1,
        limit: items.length,
        totalPages: 1,
      };
      return { success: true as const, data: items, meta };
    });
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}

/**
 * Approve a pending staff record. Admin can optionally pass
 * placement / identity fields HR controls; backend flips
 * `registrationStatus` to `approved` regardless.
 */
export async function approveStaff(
  id: string,
  patch: {
    staffId?: string;
    code?: string;
    primaryAppointmentId?: string;
    primaryDepartmentId?: string;
    appointmentDate?: string;
    appointmentOrderNumber?: string;
    appointmentOrderDate?: string;
    remark?: string;
  } = {},
) {
  try {
    return await withHttpContext(async ({ httpClient, userId, userSessionId, tenantId }) => {
      const result: any = await httpClient.request(
        `/cpms/staffs/${encodeURIComponent(id)}/approve`,
        {
          method: "POST",
          body: patch,
          tenantId,
          userSessionId,
          userId,
          withAuth: true,
          tokenStrategy: "auto",
        },
      );
      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Approval failed",
        };
      }
      return { success: true as const, data: result.data };
    });
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}

export async function rejectStaff(id: string, reason: string) {
  try {
    if (!reason || !reason.trim()) {
      return {
        success: false as const,
        error: "Rejection reason is required",
      };
    }
    return await withHttpContext(async ({ httpClient, userId, userSessionId, tenantId }) => {
      const result: any = await httpClient.request(
        `/cpms/staffs/${encodeURIComponent(id)}/reject`,
        {
          method: "POST",
          body: { reason: reason.trim() },
          tenantId,
          userSessionId,
          userId,
          withAuth: true,
          tokenStrategy: "auto",
        },
      );
      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Rejection failed",
        };
      }
      return { success: true as const, data: result.data };
    });
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}
