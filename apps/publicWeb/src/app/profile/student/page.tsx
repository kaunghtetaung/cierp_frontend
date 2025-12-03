import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";
import { getCurrentTenant } from "@repo/tenant/server";
import { getLocalizedText } from "@repo/utils";
import { StudentProfileView } from "./StudentProfileView";
import { AccessDenied } from "../components/AccessDenied";
import { getMyProfile } from "./actions";

export const metadata: Metadata = {
  title: "Student Profile | My Registration",
  description: "View and print your student registration profile",
};

// Helper to extract role name from role object or string
function getRoleName(role: any): string {
  if (typeof role === 'string') return role.toLowerCase();
  if (role && typeof role === 'object' && role.Role) return role.Role.toLowerCase();
  return '';
}

// Check if user has the required role
function hasRole(user: any, requiredRole: string): boolean {
  if (!user?.roles || !Array.isArray(user.roles)) return false;
  return user.roles.some((role: any) => getRoleName(role) === requiredRole.toLowerCase());
}

// Get primary role display name
function getPrimaryRole(user: any): string {
  if (!user?.roles || !Array.isArray(user.roles) || user.roles.length === 0) return 'unknown';
  return getRoleName(user.roles[0]) || 'unknown';
}

export default async function StudentProfilePage() {
  try {
    console.log(`📄 [STUDENT PROFILE] Page loading`);

    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Check user roles
    const isStudent = hasRole(user, 'student');
    const isGuest = hasRole(user, 'guest');

    console.log('👤 [STUDENT PROFILE] User role check:', {
      userId: user.id,
      isStudent,
      isGuest,
      roles: user.roles,
    });

    // If user is neither student nor guest, deny access
    if (!isStudent && !isGuest) {
      console.log('⛔ [STUDENT PROFILE] Access denied - user is neither student nor guest:', {
        userId: user.id,
        roles: user.roles,
      });
      return <AccessDenied requiredRole="student" currentRole={getPrimaryRole(user)} />;
    }

    // For guest users, check if they have a profile
    // Guest users can only view this page if they have submitted a profile
    if (isGuest) {
      const profileResult = await getMyProfile();

      if (!profileResult.success || !profileResult.data) {
        // Guest user without profile - redirect to profile setup
        console.log('📝 [STUDENT PROFILE] Guest user without profile, redirecting to setup');
        redirect("/profileSetup/student");
      }

      const status = profileResult.data.registrationStatus;
      console.log('📋 [STUDENT PROFILE] Guest user profile status:', status);

      // Guest users can access if status is pending or complete
      // If rejected, they might need to re-apply (handle as needed)
      if (!['pending', 'complete', 'incomplete'].includes(status)) {
        console.log('⛔ [STUDENT PROFILE] Guest user profile status not allowed:', status);
        return <AccessDenied requiredRole="student" currentRole={`guest (${status})`} />;
      }
    }

    console.log('👤 [STUDENT PROFILE] User info:', {
      userId: user.id,
      tenantId: user.tenantId,
    });

    // Get tenant information from redis-cached tenant settings
    let tenant = await getCurrentTenant();

    // If getCurrentTenant fails, try to get from cache directly using user's tenantId
    if (!tenant && user.tenantId) {
      console.log('⚠️ [STUDENT PROFILE] getCurrentTenant returned null, trying cache directly...');
      try {
        const { getCacheInstance, CacheKeys } = await import('@repo/cache');
        const cache = getCacheInstance();
        const cachedTenant = await cache.get(CacheKeys.tenantSettings(user.tenantId));
        if (cachedTenant && typeof cachedTenant === 'object') {
          tenant = cachedTenant as any;
          console.log('✅ [STUDENT PROFILE] Retrieved tenant from cache:', {
            slug: tenant?.slug,
            rootDomain: tenant?.rootDomain,
          });
        }
      } catch (cacheError) {
        console.error('❌ [STUDENT PROFILE] Failed to get tenant from cache:', cacheError);
      }
    }

    const tenantName = tenant
      ? getLocalizedText(tenant.displayName)
      : "University";

    console.log('🏛️ [STUDENT PROFILE] Tenant info:', {
      tenantExists: !!tenant,
      slug: tenant?.slug,
      rootDomain: tenant?.rootDomain,
      displayName: tenant?.displayName,
      extractedName: tenantName
    });

    return (
      <StudentProfileView
        user={user}
        tenantName={tenantName}
        tenantSlug={tenant?.slug || ''}
        tenantRootDomain={tenant?.rootDomain || ''}
        tenantLogo={tenant?.brandInfo?.logoUrl}
        tenantDisplayName={tenant ? getLocalizedText(tenant.displayName) : undefined}
        tenantDisplayShortName={tenant?.displayShortName ? getLocalizedText(tenant.displayShortName) : undefined}
      />
    );
  } catch (error) {
    console.error("❌ [STUDENT PROFILE] Authentication error:", error);
    redirect("/login?error=session_expired");
  }
}
