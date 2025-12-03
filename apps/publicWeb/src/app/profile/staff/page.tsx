import { redirect } from "next/navigation";
import { getAuthenticationStatus } from "@repo/auth/server";
import { Check } from "lucide-react";
import { AccessDenied } from "../components/AccessDenied";
import { getMyStaffProfile } from "./actions";

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

export default async function StaffProfilePage() {
  const authStatus = await getAuthenticationStatus();

  if (!authStatus.isAuthenticated || !authStatus.user) {
    redirect("/login?callbackUrl=/profile/staff");
  }

  const user = authStatus.user;

  // Check user roles
  const isStaff = hasRole(user, 'staff');
  const isGuest = hasRole(user, 'guest');

  console.log('👤 [STAFF PROFILE] User role check:', {
    userId: user.id,
    isStaff,
    isGuest,
    roles: user.roles,
  });

  // If user is neither staff nor guest, deny access
  if (!isStaff && !isGuest) {
    console.log('⛔ [STAFF PROFILE] Access denied - user is neither staff nor guest:', {
      userId: user.id,
      roles: user.roles,
    });
    return <AccessDenied requiredRole="staff" currentRole={getPrimaryRole(user)} />;
  }

  // For guest users, check if they have a profile
  // Guest users can only view this page if they have submitted a profile
  if (isGuest) {
    const profileResult = await getMyStaffProfile();

    if (!profileResult.success || !profileResult.data) {
      // Guest user without profile - redirect to profile setup
      console.log('📝 [STAFF PROFILE] Guest user without profile, redirecting to setup');
      redirect("/profileSetup/staff");
    }

    const status = profileResult.data.registrationStatus;
    console.log('📋 [STAFF PROFILE] Guest user profile status:', status);

    // Guest users can access if status is pending or complete
    if (!['pending', 'complete', 'incomplete'].includes(status)) {
      console.log('⛔ [STAFF PROFILE] Guest user profile status not allowed:', status);
      return <AccessDenied requiredRole="staff" currentRole={`guest (${status})`} />;
    }
  }

  console.log('👤 [STAFF PROFILE] User info:', {
    userId: user.id,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Staff Profile Complete!
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Your staff profile has been successfully registered.
        </p>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{user.name || "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{user.email || "Not provided"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <a href="/" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium">
            Go to Home
          </a>
          <a href="/profile" className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium">
            View Profile
          </a>
        </div>
      </div>
    </div>
  );
}
