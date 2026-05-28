"use server";

import { getCurrentUser } from "@repo/auth/server-api";
import { createHttpClient } from "@repo/api";
import { TokenManager } from "@repo/auth/token-manager";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getApiDomain } from "@repo/utils/server";
import { withServerActionErrorHandler } from "@repo/utils/server";

// `createHttpClient()` defaults baseURL to `"/api"` which fails
// `new URL()` server-side (Invalid URL — needs an absolute base).
// In dev we need to resolve the gateway domain from the tenant
// config service; the wrapper below memoizes the lookup per server
// action invocation. Matches the pattern in
// /workspace-frontend/apps/publicWeb/src/app/profile/staff/actions.ts.
async function buildHttpClient() {
  const apiUrl = await getApiDomain();
  return createHttpClient({ baseURL: apiUrl });
}

/**
 * Shape sent to `POST /cpms/staffs/self-register` and
 * `PATCH /cpms/staffs/me`. Every field that isn't marked here as
 * `?: undefined` is optional on the backend DTO; mirroring the
 * `SelfRegisterStaffDto` lets the same payload type cover both Mini
 * and Full submissions.
 */
export interface StaffSelfRegistrationData {
  // Identity (Mini-required)
  nameEnglish: string;
  nameMyanmar: string;
  nrcNumber: string;
  dateOfBirth: string;

  // Mini-collected (optional at the wire level so admin tools / Full
  // form can reuse this shape)
  phoneNumber?: string;
  email?: string;
  currentAddress?: string;
  placeOfBirth?: string;
  father?: { nameEnglish?: string; nameMyanmar?: string };

  // Cascading appointment picker
  primaryAppointmentId?: string;
  primaryDepartmentId?: string;
  appointmentDate?: string;
  firstJoinDate?: string;

  educationHistory?: Array<{
    type?: string; // 'degree' | 'foreign_service_training' | 'refresher' | …
    degree?: string; // Title — also covers training course names
    major?: string;
    institution?: string;
    year?: number;
    startDate?: string;
    endDate?: string;
    grade?: string;
    certificateUrl?: string;
  }>;

  profilePhoto?: string;
  publicProfile?: {
    bio?: { en?: string; mm?: string };
    publicPhoto?: string;
  };

  // Full-form-only extras
  gender?: string;
  nationality?: string;
  religion?: string;
  race?: string;
  bloodType?: string;
  maritalStatus?: string;
  height?: number;
  weight?: number;
  permanentAddress?: string;
  stateRegionName?: string;
  districtName?: string;
  townshipName?: string;
  townName?: string;
  wardVillageName?: string;
  mother?: { nameEnglish?: string; nameMyanmar?: string; nrcNumber?: string; occupation?: string };
  emergencyContact?: { name?: string; relationship?: string; phoneNumber?: string; address?: string };
  familyMembers?: any[];
  attachedAppointments?: any[];
  previousAppointments?: Array<{
    organizationId?: string;
    organizationName?: string;
    departmentName?: string;
    ministry?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    wasUnderMOH?: boolean;
    reasonForLeaving?: string;
  }>;
  foreignTravels?: Array<{
    country?: string;
    purpose?: string;
    fromDate?: string;
    toDate?: string;
    sponsorOrganization?: string;
    remark?: string;
  }>;
}

interface RoleObject {
  Organization?: string;
  Department?: string;
  Role?: string;
}

function hasGuestRole(roles: any): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some(
    (r: any) =>
      (typeof r === "string" && r.toLowerCase() === "guest") ||
      (r as RoleObject)?.Role === "guest" ||
      (r as any)?.role === "guest",
  );
}

/**
 * Submit a self-registration payload. Used by BOTH the Mini and Full
 * forms — they just send different subsets of fields. Backend stamps
 * `registrationStatus: 'pending'` and links the new Staff record to
 * the calling user.
 */
export async function submitStaffSelfRegistration(data: StaffSelfRegistrationData) {
  return withServerActionErrorHandler(
    async () => {
      const user = await getCurrentUser();
      if (!user) {
        return { success: false as const, error: "Not authenticated" };
      }
      if (!hasGuestRole(user.roles)) {
        return {
          success: false as const,
          error: "Only guest users can self-register as staff",
        };
      }

      const { tenantId } = await getMiddlewareDataFromHeaders();
      if (!tenantId) {
        return { success: false as const, error: "Tenant context not found" };
      }

      const httpClient = await buildHttpClient();
      const result = await httpClient.request<any>(
        `/cpms/staffs/self-register`,
        {
          method: "POST",
          body: data,
          withAuth: true,
          userId: user.id,
          tokenStrategy: "auto",
        },
      );

      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Registration failed",
        };
      }

      // Refresh token so the new profileState / roles propagate to the
      // browser session — header dropdown stops showing the "Complete
      // your profile" prompt once the record exists.
      try {
        const tm = TokenManager.getInstance();
        await tm.refreshUserAccessToken(tenantId, user.id);
      } catch {
        /* non-critical */
      }

      const staffId = result.data?._id || result.data?.staffId;
      return { success: true as const, staffId, data: result.data };
    },
    {
      operation: "submit-staff-self-registration",
      component: "staff-actions",
    },
  );
}

/**
 * Patch the calling user's own staff record (Full form on top of
 * Mini, or later inline edits from /profile/staff). Backend never
 * touches `registrationStatus`, `staffId`, `code`, `slug`.
 *
 * URL is `/cpms/staffs/:id/me` rather than `/cpms/staffs/me` so the
 * access-policy resource-level check (which looks for an ObjectId in
 * the URL) passes. Caller passes the record's own `_id` — backend
 * still scopes the patch to `req.user.userId`, the `:id` is just to
 * satisfy the URL-pattern guard. Mirrors student `:id/my-profile`.
 *
 * If `staffId` is omitted we fetch the record first to retrieve it,
 * so callers that don't already have the staff record on hand don't
 * have to thread it through.
 */
export async function updateMyStaffProfile(
  data: Partial<StaffSelfRegistrationData>,
  staffId?: string,
) {
  return withServerActionErrorHandler(
    async () => {
      const user = await getCurrentUser();
      if (!user) return { success: false as const, error: "Not authenticated" };

      const { tenantId } = await getMiddlewareDataFromHeaders();
      if (!tenantId) {
        return { success: false as const, error: "Tenant context not found" };
      }

      const httpClient = await buildHttpClient();

      // Resolve staffId if caller didn't provide it.
      let resolvedId = staffId;
      if (!resolvedId) {
        const me = await httpClient.request<any>(`/cpms/staffs/me`, {
          method: "GET",
          withAuth: true,
          userId: user.id,
          tokenStrategy: "auto",
        });
        if (!me.success || !me.data?._id) {
          return {
            success: false as const,
            error: me.error || "Could not load your staff record",
          };
        }
        resolvedId = me.data._id;
      }

      const result = await httpClient.request<any>(
        `/cpms/staffs/${resolvedId}/me`,
        {
          method: "PATCH",
          body: data,
          withAuth: true,
          userId: user.id,
          tokenStrategy: "auto",
        },
      );

      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Update failed",
        };
      }
      return { success: true as const, data: result.data };
    },
    {
      operation: "update-staff-self-profile",
      component: "staff-actions",
    },
  );
}

/**
 * Fetch the calling user's staff record. Returns `null` if they
 * haven't self-registered yet.
 */
export async function getMyStaffProfile() {
  return withServerActionErrorHandler(
    async () => {
      const user = await getCurrentUser();
      if (!user) return { success: false as const, error: "Not authenticated" };

      const httpClient = await buildHttpClient();
      const result = await httpClient.request<any>(`/cpms/staffs/me`, {
        method: "GET",
        withAuth: true,
        userId: user.id,
        tokenStrategy: "auto",
      });

      if (!result.success) {
        // 404 → no record yet; treat as success+null for caller ergonomics
        return { success: true as const, data: null };
      }
      return { success: true as const, data: result.data ?? null };
    },
    {
      operation: "get-my-staff-profile",
      component: "staff-actions",
    },
  );
}

/**
 * Get profile-completion %. Used by the header "Profile X% complete"
 * indicator and the /profile/staff progress bar.
 */
export async function getMyStaffCompletion() {
  return withServerActionErrorHandler(
    async () => {
      const user = await getCurrentUser();
      if (!user) return { success: false as const, error: "Not authenticated" };

      const httpClient = await buildHttpClient();
      const result = await httpClient.request<any>(
        `/cpms/staffs/me/completion`,
        {
          method: "GET",
          withAuth: true,
          userId: user.id,
          tokenStrategy: "auto",
        },
      );

      if (!result.success) {
        return {
          success: true as const,
          data: { percentage: 0, filledCount: 0, totalCount: 0 },
        };
      }
      return { success: true as const, data: result.data };
    },
    {
      operation: "get-my-staff-completion",
      component: "staff-actions",
    },
  );
}

/**
 * List AppointmentTypes for the cascading dropdown (Step 1 in the
 * Mini/Full form's position picker).
 */
export async function listAppointmentTypes() {
  return withServerActionErrorHandler(
    async () => {
      const user = await getCurrentUser();
      if (!user) return { success: false as const, error: "Not authenticated" };

      const httpClient = await buildHttpClient();
      const result = await httpClient.request<any>(
        `/cpms/appointment-types?limit=100`,
        {
          method: "GET",
          withAuth: true,
          userId: user.id,
          tokenStrategy: "auto",
        },
      );

      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Failed to load appointment types",
        };
      }
      // Normalize: backend may return { data, meta } or array
      const items = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      return { success: true as const, data: items };
    },
    {
      operation: "list-appointment-types",
      component: "staff-actions",
    },
  );
}

/**
 * List Appointments filtered by AppointmentType (Step 2 in the
 * cascading picker). Returns only positions whose appointmentTypeId
 * matches the one the user picked in Step 1.
 */
export async function listAppointmentsByType(appointmentTypeId: string) {
  return withServerActionErrorHandler(
    async () => {
      const user = await getCurrentUser();
      if (!user) return { success: false as const, error: "Not authenticated" };
      if (!appointmentTypeId) {
        return { success: true as const, data: [] };
      }

      const httpClient = await buildHttpClient();
      const result = await httpClient.request<any>(
        `/cpms/appointments?appointmentTypeId=${encodeURIComponent(appointmentTypeId)}&limit=100`,
        {
          method: "GET",
          withAuth: true,
          userId: user.id,
          tokenStrategy: "auto",
        },
      );

      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Failed to load appointments",
        };
      }
      const items = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      return { success: true as const, data: items };
    },
    {
      operation: "list-appointments-by-type",
      component: "staff-actions",
    },
  );
}

/**
 * Cross-tenant Organization list used by the "Previous Appointments"
 * typeahead. Backend route is `@Public()` so guest applicants can call
 * it without an explicit per-module access policy entry. Returns the
 * minimal `{_id, fullName, shortName, displayName, displayShortName,
 * slug, rootDomain}` projection — never sensitive tenant fields.
 */
export async function listPublicOrganizations() {
  return withServerActionErrorHandler(
    async () => {
      const user = await getCurrentUser();
      if (!user) return { success: false as const, error: "Not authenticated" };

      const httpClient = await buildHttpClient();
      const result = await httpClient.request<any>(
        `/core/organizations/public-list`,
        {
          method: "GET",
          withAuth: true,
          userId: user.id,
          tokenStrategy: "auto",
        },
      );

      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Failed to load organizations",
        };
      }
      const items = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      return { success: true as const, data: items };
    },
    {
      operation: "list-public-organizations",
      component: "staff-actions",
    },
  );
}

/**
 * Departments for the form's department dropdown.
 */
export async function listDepartments() {
  return withServerActionErrorHandler(
    async () => {
      const user = await getCurrentUser();
      if (!user) return { success: false as const, error: "Not authenticated" };

      const httpClient = await buildHttpClient();
      const result = await httpClient.request<any>(`/core/departments?limit=200`, {
        method: "GET",
        withAuth: true,
        userId: user.id,
        tokenStrategy: "auto",
      });

      if (!result.success) {
        return {
          success: false as const,
          error: result.error || "Failed to load departments",
        };
      }
      const items = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      return { success: true as const, data: items };
    },
    {
      operation: "list-departments",
      component: "staff-actions",
    },
  );
}
