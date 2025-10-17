import { redirect } from "next/navigation";
import { getAuthenticationStatus } from "@repo/auth/server";
import { Check } from "lucide-react";

export default async function StaffProfilePage() {
  const authStatus = await getAuthenticationStatus();

  if (!authStatus.isAuthenticated || !authStatus.user) {
    redirect("/login?callbackUrl=/profile/staff");
  }

  const user = authStatus.user;

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
