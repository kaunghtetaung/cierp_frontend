import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@repo/auth/server-api";
import { CompleteProfileClient } from "./CompleteProfileClient";
import { getMyProfile } from "@/app/profile/student/actions";

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Complete your profile information to access all features",
};

export default async function CompleteProfilePage() {
  try {
    console.log(`📄 [PAGE LOAD] Profile setup page loading`);

    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Check if user has guest role
    const isGuestUser =
      user.roles?.some((roleObj: any) => roleObj.Role === "guest") ?? false;

    console.log('🔑 [PROFILE SETUP] User role check:', {
      isGuestUser,
      roles: user.roles?.map((r: any) => r.Role).join(', '),
      allRoles: user.roles
    });

    // Try to fetch existing profile to check status
    let mode: 'create' | 'edit' = 'create';
    let existingProfile = null;

    // ALWAYS try to fetch profile first (for any authenticated user)
    console.log('👤 [PROFILE SETUP] Attempting to fetch profile...');
    const profileResult = await getMyProfile();

    console.log('📋 [PROFILE SETUP] Profile fetch result:', {
      success: profileResult.success,
      hasData: !!profileResult.data,
      error: profileResult.error,
    });

    if (profileResult.success && profileResult.data) {
      // Profile exists - check status
      const status = profileResult.data.registrationStatus;
      console.log('📋 [PROFILE SETUP] Profile found with status:', status);
      console.log('📋 [PROFILE SETUP] Profile data keys:', Object.keys(profileResult.data));

      // Allow edit if status is pending or incomplete
      const canEdit = ['pending', 'incomplete'].includes(status);

      if (canEdit) {
        mode = 'edit';
        existingProfile = profileResult.data;
        console.log('✏️ [PROFILE SETUP] Edit mode enabled for status:', status);
      } else {
        // Profile exists but status is approved/rejected - redirect to profile view
        console.log('🔒 [PROFILE SETUP] Profile locked (status: ' + status + '), redirecting to view');
        redirect("/profile/student");
      }
    } else {
      // No profile found - check if user is guest
      console.log('📭 [PROFILE SETUP] No profile found');

      if (!isGuestUser) {
        // Non-guest user without profile - shouldn't happen normally
        // Could be a student whose profile was deleted, redirect to home
        console.log('⚠️ [PROFILE SETUP] Non-guest user without profile, redirecting to home');
        redirect("/");
      }

      // Guest user without profile - allow registration (create mode)
      console.log('✅ [PROFILE SETUP] Guest user, create mode enabled');
      mode = 'create';
    }

    console.log('🎯 [PROFILE SETUP] Mode:', mode, 'Has existing data:', !!existingProfile);

    return (
      <CompleteProfileClient
        user={user}
        mode={mode}
        existingProfile={existingProfile}
      />
    );
  } catch (error) {
    // Handle token expiration or authentication errors
    console.error("❌ [PAGE LOAD] Authentication error:", error);
    redirect("/login?error=session_expired");
  }
}
