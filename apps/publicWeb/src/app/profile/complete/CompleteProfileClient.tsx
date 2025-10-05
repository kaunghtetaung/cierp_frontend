"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Briefcase, GraduationCap } from "lucide-react";
import type { User } from "@repo/types";
import { StudentSelfRegistrationForm } from "./components/StudentSelfRegistrationForm";

interface CompleteProfileClientProps {
  user: User;
}

type UserRole = "student" | "staff" | null;

export function CompleteProfileClient({ user }: CompleteProfileClientProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <UserIcon className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Complete Your Profile</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Welcome {user.name}! Please select your role to continue with profile completion.
              </p>
            </div>

            {/* Role Selection */}
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                I am a...
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Student Card */}
                <button
                  onClick={() => handleRoleSelect("student")}
                  className="group relative p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Student
                    </h3>
                    <p className="text-gray-600">
                      Register as a student to enroll in courses and access academic resources
                    </p>
                    <div className="pt-4">
                      <span className="text-blue-600 font-medium group-hover:underline">
                        Select Student →
                      </span>
                    </div>
                  </div>
                </button>

                {/* Staff Card */}
                <button
                  onClick={() => handleRoleSelect("staff")}
                  className="group relative p-8 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Staff
                    </h3>
                    <p className="text-gray-600">
                      Register as staff member to access administrative and teaching tools
                    </p>
                    <div className="pt-4">
                      <span className="text-indigo-600 font-medium group-hover:underline">
                        Select Staff →
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Skip Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => router.push("/")}
                  className="text-gray-600 hover:text-gray-900 underline"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show appropriate form based on selected role
  if (selectedRole === "student") {
    return <StudentSelfRegistrationForm user={user} onBack={handleBack} />;
  }

  if (selectedRole === "staff") {
    // TODO: Create StaffSelfRegistrationForm
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Staff Registration
          </h2>
          <p className="text-gray-600 mb-6">
            Staff registration form is coming soon.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
