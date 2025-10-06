import { Metadata } from "next";
import { Briefcase, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Staff Profile Registration - Coming Soon",
  description: "Staff profile registration will be available soon",
};

export default function StaffProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50"></div>
              <div className="relative bg-green-600 text-white p-6 rounded-full">
                <Briefcase className="h-16 w-16" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Staff Profile Registration
          </h1>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full mb-6">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Coming Soon</span>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            We're currently developing the staff profile registration system.
            This feature will be available soon and will allow staff members to
            complete their profiles with professional information and credentials.
          </p>

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-lg p-6 text-left">
            <h2 className="font-semibold text-gray-900 mb-3">
              What to expect:
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Professional profile information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Credentials and qualifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Department and role assignment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>Employment details</span>
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Return to Home
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-sm text-gray-500">
          Thank you for your patience. We'll notify you when this feature becomes available.
        </p>
      </div>
    </div>
  );
}
