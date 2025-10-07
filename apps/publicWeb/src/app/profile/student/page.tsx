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

    // Get tenant information from redis-cached tenant settings
    const tenant = await getCurrentTenant();
    const tenantName = tenant
      ? getLocalizedText(tenant.displayName)
      : "University";

    console.log('🏛️ [STUDENT PROFILE] Tenant info:', {
      tenantExists: !!tenant,
      displayName: tenant?.displayName,
      extractedName: tenantName
    });

    return <StudentProfileView user={user} tenantName={tenantName} />;
  } catch (error) {
    console.error("❌ [STUDENT PROFILE] Authentication error:", error);
    redirect("/login?error=session_expired");
  }
}
