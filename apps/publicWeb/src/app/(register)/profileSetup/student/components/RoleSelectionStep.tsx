"use client";

import React from "react";
import { Card } from "@repo/ui";
import { UserCircle, GraduationCap, Briefcase } from "lucide-react";
import { cn } from "@repo/utils";
import type { UserRole } from "@/lib/form-cache";

interface RoleSelectionStepProps {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
}

export function RoleSelectionStep({ selectedRole, onRoleSelect }: RoleSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-[#4C67E1] bg-opacity-10 rounded-full">
            <UserCircle className="h-12 w-12 text-[#4C67E1]" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Select Your Role</h2>
        <p className="text-gray-600">Please select your role to continue with the registration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Student Role */}
        <Card
          className={cn(
            "p-6 cursor-pointer transition-all duration-200 border-2",
            "hover:shadow-lg hover:scale-105",
            selectedRole === "student"
              ? "border-[#4C67E1] bg-[#4C67E1] bg-opacity-5 shadow-md"
              : "border-gray-200 hover:border-[#4C67E1]"
          )}
          onClick={() => onRoleSelect("student")}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div
                className={cn(
                  "p-4 rounded-full transition-colors",
                  selectedRole === "student"
                    ? "bg-[#4C67E1] text-white"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <GraduationCap className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Student</h3>
              <p className="text-sm text-gray-600 mt-2">
                Register as a student to enroll in courses and access learning materials
              </p>
            </div>
            {selectedRole === "student" && (
              <div className="flex items-center justify-center text-[#4C67E1] text-sm font-medium">
                <svg
                  className="h-5 w-5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Selected
              </div>
            )}
          </div>
        </Card>

        {/* Staff Role */}
        <Card
          className={cn(
            "p-6 cursor-pointer transition-all duration-200 border-2",
            "hover:shadow-lg hover:scale-105",
            selectedRole === "staff"
              ? "border-[#4C67E1] bg-[#4C67E1] bg-opacity-5 shadow-md"
              : "border-gray-200 hover:border-[#4C67E1]"
          )}
          onClick={() => onRoleSelect("staff")}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div
                className={cn(
                  "p-4 rounded-full transition-colors",
                  selectedRole === "staff"
                    ? "bg-[#4C67E1] text-white"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                <Briefcase className="h-10 w-10" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Staff</h3>
              <p className="text-sm text-gray-600 mt-2">
                Register as a staff member to manage courses and students
              </p>
            </div>
            {selectedRole === "staff" && (
              <div className="flex items-center justify-center text-[#4C67E1] text-sm font-medium">
                <svg
                  className="h-5 w-5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Selected
              </div>
            )}
          </div>
        </Card>
      </div>

      {selectedRole && (
        <div className="text-center text-sm text-gray-600 mt-4">
          <p>
            You can change your role selection at any time during the registration process
          </p>
        </div>
      )}
    </div>
  );
}
