"use client";

import { ShieldX, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

interface AccessDeniedProps {
  requiredRole: string;
  currentRole?: string;
  message?: string;
}

export function AccessDenied({ requiredRole, currentRole, message }: AccessDeniedProps) {
  const defaultMessage = `You are not a ${requiredRole}. This area is restricted to ${requiredRole} users only.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>

        <p className="text-gray-600 mb-6">
          {message || defaultMessage}
        </p>

        {currentRole && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">
              Your current role: <span className="font-medium text-gray-700 capitalize">{currentRole}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Required role: <span className="font-medium text-red-600 capitalize">{requiredRole}</span>
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/profile"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
