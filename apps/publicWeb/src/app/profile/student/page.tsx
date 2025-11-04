import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";
import { getCurrentTenant } from "@repo/tenant/server";
import { getLocalizedText } from "@repo/utils";
import { StudentProfileView } from "./StudentProfileView";

export const metadata: Metadata = {
  title: "Student Profile | My Registration",
  description: "View and print your student registration profile",
};

export default async function StudentProfilePage() {
  try {
    console.log(`📄 [STUDENT PROFILE] Page loading`);

    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
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
      />
    );
  } catch (error) {
    console.error("❌ [STUDENT PROFILE] Authentication error:", error);
    redirect("/login?error=session_expired");
  }
}
