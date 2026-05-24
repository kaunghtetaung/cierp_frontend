"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, Lock, Mail, Shield, Calendar, CheckCircle, LogOut, Home } from "lucide-react";
import type { User as UserType } from "@repo/types";
import { ChangePasswordForm } from "./ChangePasswordForm";
import Link from "next/link";

interface UserProfileViewProps {
  user: UserType;
}

export function UserProfileView({ user }: UserProfileViewProps) {
  const searchParams = useSearchParams();
  const [showChangePassword, setShowChangePassword] = useState(
    searchParams?.get("action") === "change-password",
  );

  // Open the password form when the user navigates here from the
  // header dropdown's "Change password" item (`?action=change-password`).
  // Run on every searchParams change so back/forward navigation works.
  useEffect(() => {
    if (searchParams?.get("action") === "change-password") {
      setShowChangePassword(true);
    }
  }, [searchParams]);

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Format role
  const formatRole = (role: any) => {
    // Handle role object with Role property or plain string
    const roleStr = typeof role === "string" ? role : role?.Role || role?.role || String(role);
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-[#4C67E1] to-[#6B85FF] flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{user.name}</h1>
                <p className="text-gray-600 text-sm sm:text-base truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href="/"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link
                href="/logout"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[#4C67E1]" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 text-gray-900">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{user.email}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">
                Account Status
              </label>
              <div className="flex items-center gap-2">
                <CheckCircle
                  className={`h-4 w-4 ${user.isActive ? "text-green-500" : "text-red-500"}`}
                />
                <span className={user.isActive ? "text-green-600" : "text-red-600"}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">
                Last Login
              </label>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{formatDate(user.lastLoginAt)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">
                Member Since
              </label>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{formatDate(user.createdAt)}</span>
              </div>
            </div>

            {user.profileState && (
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Profile State
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="text-sm capitalize">
                    {user.profileState.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role & Permissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#4C67E1]" />
            Role & Permissions
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Assigned Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#4C67E1] text-white"
                    >
                      {formatRole(role)}
                    </span>
                  ))
                ) : user.role ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#4C67E1] text-white">
                    {formatRole(user.role)}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">No roles assigned</span>
                )}
              </div>
            </div>

            {user.permissions && user.permissions.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">
                  Permissions
                </label>
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {permission.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#4C67E1]" />
            Security
          </h2>

          {!showChangePassword ? (
            <div>
              <p className="text-gray-600 mb-4">
                Keep your account secure by using a strong password.
              </p>
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-4 py-2 bg-[#4C67E1] text-white rounded-md hover:bg-[#3D52C7] transition-colors"
              >
                Change Password
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                ← Back
              </button>
              <ChangePasswordForm onSuccess={() => setShowChangePassword(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
